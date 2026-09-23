"""
agent.py — Databricks SQL Agent

Implementa un agente ReAct (Reasoning + Acting) usando LangGraph che:
  1. Riceve una domanda in linguaggio naturale
  2. Chiama i tool per scoprire lo schema delle tabelle disponibili
  3. Ragiona sulla query SQL più appropriata
  4. Esegue la query con protezioni di sicurezza
  5. Restituisce la risposta in italiano

Il modello LLM è ospitato su Databricks Model Serving (Foundation Model API),
senza bisogno di chiavi API esterne.

Per il deploy su Databricks come Model Serving endpoint, l'agente viene
wrappato con MLflow pyfunc (vedi deploy_notebook.py).
"""

from __future__ import annotations

import mlflow
from langchain_community.chat_models import ChatDatabricks
from langgraph.prebuilt import create_react_agent

from databricks_config import DATABRICKS_LLM_ENDPOINT
from observability import flush, get_langfuse_callback, score_trace, trace_agent_run  # noqa: F401
from tools import _current_trace_id, describe_table, execute_sql_query, list_available_tables

# ---------------------------------------------------------------------------
# Istruzioni di sistema dell'agente
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Sei un assistente esperto di dati che lavora su un data lakehouse Databricks.
Il tuo compito è rispondere alle domande degli utenti interrogando le tabelle disponibili
tramite query SQL in linguaggio Spark SQL.

## Flusso di lavoro obbligatorio

1. **Scopri le tabelle disponibili**: chiama SEMPRE `list_available_tables` come primo passo
   per conoscere le tabelle che puoi interrogare e le loro colonne principali.

2. **Analizza lo schema**: se hai bisogno di dettagli su colonne, tipi o descrizioni di una
   tabella specifica, usa `describe_table` con il nome completo (catalog.schema.table).

3. **Costruisci la query**: scrivi una query SELECT valida in Spark SQL usando solo le tabelle
   della whitelist. Usa alias chiari, evita SELECT *, preferisci colonne specifiche.

4. **Esegui la query**: chiama `execute_sql_query` con la query costruita. Se ci sono errori,
   analizza il messaggio, correggi la query e riprova (massimo 2 tentativi).

5. **Presenta i risultati**: spiega i risultati all'utente in italiano in modo chiaro e conciso.
   Indica il numero di righe trovate e qualsiasi insight rilevante.

## Regole di sicurezza
- Usa SOLO le tabelle elencate nella whitelist (visibili con `list_available_tables`).
- Non generare mai query INSERT, UPDATE, DELETE, DROP, CREATE, ALTER.
- Limita sempre i risultati a un numero ragionevole di righe (es. LIMIT 20 per elenchi lunghi).
- Se la domanda non può essere risposta con le tabelle disponibili, dillo chiaramente.

## Formato risposta
- Rispondi sempre in italiano.
- Mostra prima la spiegazione della query, poi i risultati in tabella.
- Aggiungi sempre una breve interpretazione dei dati trovati.
"""

# ---------------------------------------------------------------------------
# Costruzione dell'agente LangGraph
# ---------------------------------------------------------------------------

def build_agent():
    """
    Crea e restituisce l'agente LangGraph ReAct pronto all'uso.

    Il modello ChatDatabricks punta direttamente alla Foundation Model API
    di Databricks — nessuna chiave esterna richiesta.
    """
    llm = ChatDatabricks(
        endpoint=DATABRICKS_LLM_ENDPOINT,
        temperature=0.0,       # Deterministico per query SQL
        max_tokens=4096,
    )

    tools = [list_available_tables, describe_table, execute_sql_query]

    agent = create_react_agent(
        model=llm,
        tools=tools,
        state_modifier=SYSTEM_PROMPT,
    )
    return agent


def invoke_with_tracing(
    agent,
    user_input: str,
    session_id: str | None = None,
    user_id: str | None = None,
    tags: list[str] | None = None,
) -> dict:
    """
    Esegue l'agente avvolgendo l'invocazione con un trace Langfuse completo.

    Restituisce un dict con:
      - "answer"    (str): risposta finale dell'agente
      - "trace_id"  (str): ID trace Langfuse (utile per scoring successivo)
      - "messages"  (list): tutti i messaggi della conversazione

    Esempio:
        agent = build_agent()
        result = invoke_with_tracing(agent, "Quanti ordini abbiamo?", user_id="u42")
        print(result["answer"])
        # Feedback positivo:
        score_trace(result["trace_id"], score_value=1.0, comment="Perfetto!")
    """
    with trace_agent_run(
        user_input=user_input,
        session_id=session_id,
        user_id=user_id,
        tags=tags or ["databricks-sql-agent", "production"],
    ) as ctx:
        # Propaga il trace_id ai tool tramite ContextVar (thread-safe, no globals)
        token = _current_trace_id.set(ctx["trace_id"])
        try:
            result = agent.invoke(
                {"messages": [{"role": "user", "content": user_input}]},
                config={"callbacks": [ctx["callback"]]},
            )
        finally:
            _current_trace_id.reset(token)

        answer = result["messages"][-1].content
        ctx["set_output"](
            answer,
            tool_calls=len([m for m in result["messages"] if hasattr(m, "tool_calls") and m.tool_calls]),
            total_messages=len(result["messages"]),
        )

    return {
        "answer": answer,
        "trace_id": ctx["trace_id"],
        "messages": result["messages"],
    }


# ---------------------------------------------------------------------------
# MLflow pyfunc wrapper — necessario per il deploy su Databricks Model Serving
# ---------------------------------------------------------------------------

class DatabricksSQLAgentModel(mlflow.pyfunc.PythonModel):
    """
    Wrapper MLflow pyfunc che espone l'agente come endpoint REST su
    Databricks Model Serving.

    Input atteso (pd.DataFrame o dict):
        {"messages": [{"role": "user", "content": "Domanda dell'utente"}]}

    Output:
        Stringa con la risposta dell'agente.
    """

    def load_context(self, context):
        """Inizializza l'agente al caricamento del modello."""
        self.agent = build_agent()

    def predict(self, context, model_input, params=None):
        """
        Riceve l'input dall'endpoint REST e restituisce la risposta dell'agente.
        Ogni invocazione genera un trace completo su Langfuse + un run MLflow.

        Supporta due formati di input:
        - dict con chiave 'messages'
        - pd.DataFrame con colonna 'messages'
        """
        import pandas as pd

        # Normalizza input in lista di messaggi
        if isinstance(model_input, pd.DataFrame):
            messages_raw = model_input["messages"].iloc[0]
        elif isinstance(model_input, dict):
            messages_raw = model_input.get("messages", [])
        else:
            messages_raw = [{"role": "user", "content": str(model_input)}]

        # Converti in formato LangGraph
        if isinstance(messages_raw, str):
            user_input = messages_raw
            messages = [{"role": "user", "content": messages_raw}]
        else:
            messages = list(messages_raw)
            user_input = next(
                (m["content"] for m in reversed(messages) if m.get("role") == "user"),
                str(messages),
            )

        # Esecuzione con tracing Langfuse + span MLflow
        with mlflow.start_span(name="databricks_sql_agent") as span:
            span.set_inputs({"messages": messages})

            result = invoke_with_tracing(
                self.agent,
                user_input=user_input,
                tags=["databricks-sql-agent", "model-serving"],
            )
            answer = result["answer"]
            span.set_outputs({"response": answer, "langfuse_trace_id": result["trace_id"]})

        # Flush garantito prima che l'endpoint restituisca la risposta
        flush()
        return answer


# ---------------------------------------------------------------------------
# Registrazione MLflow — usata da deploy_notebook.py
# ---------------------------------------------------------------------------

def log_model_to_mlflow(
    experiment_name: str = "/Shared/databricks-sql-agent",
    run_name: str = "databricks-sql-agent-v1",
):
    """
    Logga il modello su MLflow per poi promuoverlo al Model Registry
    e fare il deploy su Databricks Model Serving.

    Da chiamare nel deploy_notebook.py.
    """
    mlflow.set_experiment(experiment_name)

    with mlflow.start_run(run_name=run_name) as run:
        mlflow.log_param("llm_endpoint", DATABRICKS_LLM_ENDPOINT)
        mlflow.log_param("max_rows", 50)
        mlflow.log_param("tools", "list_available_tables, describe_table, execute_sql_query")

        # Log del modello pyfunc
        mlflow.pyfunc.log_model(
            artifact_path="agent",
            python_model=DatabricksSQLAgentModel(),
            artifacts={},
            pip_requirements=[
                "databricks-sdk>=0.20.0",
                "databricks-sql-connector>=3.0.0",
                "langchain>=0.2.0",
                "langchain-community>=0.2.0",
                "langgraph>=0.1.0",
                "mlflow>=2.14.0",
            ],
            input_example={
                "messages": [
                    {"role": "user", "content": "Mostrami i primi 10 clienti con il maggior numero di ordini"}
                ]
            },
        )

        model_uri = f"runs:/{run.info.run_id}/agent"
        print(f"✅ Modello loggato su MLflow: {model_uri}")
        print(f"   Run ID: {run.info.run_id}")
        return model_uri


# ---------------------------------------------------------------------------
# Esecuzione diretta (test locale / Databricks notebook interattivo)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    agent = build_agent()

    print("=" * 60)
    print("  Databricks SQL Agent — Test interattivo con Langfuse")
    print("  (digita 'exit' per uscire)")
    print("=" * 60)

    while True:
        try:
            user_input = input("\nTu: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nUscita.")
            break

        if user_input.lower() in ("exit", "quit", "esci"):
            break

        if not user_input:
            continue

        result = invoke_with_tracing(agent, user_input, user_id="local-dev")
        print(f"\nAgente: {result['answer']}")
        print(f"[Langfuse trace: {result['trace_id']}]")

    flush()
