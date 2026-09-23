"""
observability.py — Langfuse Observability per Databricks SQL Agent

Fornisce:
  - get_langfuse_callback()   → CallbackHandler LangChain/LangGraph da iniettare nell'agente
  - trace_agent_run()         → context manager per wrappare ogni invocazione con una Trace di alto livello
  - record_tool_span()        → context manager per tracciare ogni singolo tool call come Span figlio
  - flush()                   → forza il flush asincrono del buffer Langfuse (da chiamare a fine request)

Architettura dei trace su Langfuse:
  Trace (1 per domanda utente)
  ├── Span: "agent_run"               ← latenza totale, input utente, risposta finale
  │   ├── Generation: "llm_call"      ← prompt, completion, token usage (via LangChain callback)
  │   ├── Span: "list_available_tables"
  │   ├── Span: "describe_table"
  │   └── Span: "execute_sql_query"   ← query SQL generata, righe restituite, latenza warehouse
  └── Score (opzionale)               ← puoi aggiungere feedback utente in seguito

Configurazione variabili d'ambiente (o Databricks Secrets):
  LANGFUSE_PUBLIC_KEY   → pk-lf-...
  LANGFUSE_SECRET_KEY   → sk-lf-...
  LANGFUSE_HOST         → https://cloud.langfuse.com  (default)
                          oppure URL self-hosted
  LANGFUSE_RELEASE      → tag versione (es. "v1.2.0") — opzionale
  LANGFUSE_DEBUG        → "true" per log verbosi — opzionale
"""

from __future__ import annotations

import os
import time
import uuid
from contextlib import contextmanager
from typing import Any, Generator

from langfuse import Langfuse
from langfuse.callback import CallbackHandler


# ---------------------------------------------------------------------------
# Singleton Langfuse client
# ---------------------------------------------------------------------------

_langfuse_client: Langfuse | None = None


def get_langfuse_client() -> Langfuse:
    """
    Restituisce il client Langfuse (singleton).
    Le credenziali vengono lette automaticamente dalle variabili d'ambiente:
      LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
    """
    global _langfuse_client
    if _langfuse_client is None:
        _langfuse_client = Langfuse(
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
            secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
            host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
            release=os.getenv("LANGFUSE_RELEASE"),
            debug=os.getenv("LANGFUSE_DEBUG", "false").lower() == "true",
        )
    return _langfuse_client


def get_langfuse_callback(
    trace_id: str | None = None,
    session_id: str | None = None,
    user_id: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> CallbackHandler:
    """
    Restituisce un CallbackHandler Langfuse da passare a LangGraph/LangChain
    come callback. Traccia automaticamente:
      - Ogni chiamata LLM (prompt, completion, token usage, latenza)
      - Ogni tool invocation con input/output
      - Chain e agent steps

    Args:
        trace_id:   ID trace da riutilizzare (per collegare span allo stesso trace padre)
        session_id: ID sessione conversazionale (raggruppa più domande dello stesso utente)
        user_id:    ID utente (per analytics per-utente su Langfuse)
        tags:       Lista di tag (es. ["production", "sql-agent"])
        metadata:   Metadati aggiuntivi liberi

    Esempio:
        callback = get_langfuse_callback(user_id="user_42", tags=["production"])
        result = agent.invoke({"messages": [...]}, config={"callbacks": [callback]})
    """
    return CallbackHandler(
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
        trace_id=trace_id,
        session_id=session_id,
        user_id=user_id,
        tags=tags or ["databricks-sql-agent"],
        metadata=metadata or {},
        release=os.getenv("LANGFUSE_RELEASE"),
    )


# ---------------------------------------------------------------------------
# Context manager per la Trace di alto livello (1 per invocazione agente)
# ---------------------------------------------------------------------------

@contextmanager
def trace_agent_run(
    user_input: str,
    session_id: str | None = None,
    user_id: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> Generator[dict[str, Any], None, None]:
    """
    Context manager che crea una Trace Langfuse di alto livello per ogni
    invocazione dell'agente. Misura la latenza totale e cattura input/output.

    Yield:
        ctx dict con chiavi:
          - "trace_id"   (str): ID del trace da passare a get_langfuse_callback()
          - "callback"   (CallbackHandler): callback pronto per LangGraph
          - "set_output" (callable): chiama ctx["set_output"](risposta) per registrare l'output

    Esempio:
        with trace_agent_run(user_input=domanda, user_id="u42") as ctx:
            result = agent.invoke(
                {"messages": [{"role": "user", "content": domanda}]},
                config={"callbacks": [ctx["callback"]]},
            )
            ctx["set_output"](result["messages"][-1].content)
    """
    lf = get_langfuse_client()
    trace_id = str(uuid.uuid4())

    trace = lf.trace(
        id=trace_id,
        name="databricks-sql-agent",
        input={"user_input": user_input},
        session_id=session_id,
        user_id=user_id,
        tags=tags or ["databricks-sql-agent"],
        metadata=metadata or {},
        release=os.getenv("LANGFUSE_RELEASE"),
    )

    output_holder: dict[str, Any] = {}

    def set_output(answer: str, **extra_meta: Any) -> None:
        output_holder["answer"] = answer
        output_holder["extra"] = extra_meta

    callback = get_langfuse_callback(
        trace_id=trace_id,
        session_id=session_id,
        user_id=user_id,
        tags=tags or ["databricks-sql-agent"],
        metadata=metadata or {},
    )

    ctx: dict[str, Any] = {
        "trace_id": trace_id,
        "trace": trace,
        "callback": callback,
        "set_output": set_output,
    }

    t_start = time.perf_counter()
    try:
        yield ctx
    except Exception as exc:
        # Registra l'errore nel trace Langfuse
        trace.update(
            output={"error": str(exc)},
            level="ERROR",
            status_message=str(exc),
        )
        raise
    finally:
        latency_ms = int((time.perf_counter() - t_start) * 1000)
        trace.update(
            output=output_holder.get("answer", ""),
            metadata={
                **(metadata or {}),
                "latency_ms": latency_ms,
                **(output_holder.get("extra", {})),
            },
        )
        # Flush asincrono — non blocca il thread principale
        lf.flush()


# ---------------------------------------------------------------------------
# Context manager per span di singolo tool (tracing granulare)
# ---------------------------------------------------------------------------

@contextmanager
def record_tool_span(
    trace_id: str,
    tool_name: str,
    tool_input: dict[str, Any],
    metadata: dict[str, Any] | None = None,
) -> Generator[dict[str, Any], None, None]:
    """
    Context manager che crea uno Span Langfuse figlio per la singola
    invocazione di un tool (list_available_tables, describe_table, execute_sql_query).

    Traccia: nome tool, input, output, latenza, eventuali errori.

    Args:
        trace_id:   ID del trace padre (da ctx["trace_id"] di trace_agent_run)
        tool_name:  Nome del tool (es. "execute_sql_query")
        tool_input: Dizionario degli argomenti passati al tool
        metadata:   Metadati aggiuntivi (es. {"table": "main.default.orders"})

    Yield:
        span_ctx dict con chiave:
          - "set_output" (callable): registra l'output del tool

    Esempio:
        with record_tool_span(trace_id, "execute_sql_query", {"sql_query": sql}) as sc:
            result = execute_sql_query.invoke(sql)
            sc["set_output"](result)
    """
    lf = get_langfuse_client()

    span = lf.span(
        trace_id=trace_id,
        name=tool_name,
        input=tool_input,
        metadata=metadata or {},
    )

    output_holder: dict[str, Any] = {}

    def set_output(result: Any, **extra: Any) -> None:
        output_holder["result"] = result
        output_holder["extra"] = extra

    t_start = time.perf_counter()
    try:
        yield {"set_output": set_output, "span": span}
    except Exception as exc:
        span.update(
            output={"error": str(exc)},
            level="ERROR",
            status_message=str(exc),
        )
        raise
    finally:
        latency_ms = int((time.perf_counter() - t_start) * 1000)
        span.end(
            output=output_holder.get("result", ""),
            metadata={
                **(metadata or {}),
                "latency_ms": latency_ms,
                **(output_holder.get("extra", {})),
            },
        )


# ---------------------------------------------------------------------------
# Helpers per scoring / feedback (da chiamare dopo la risposta)
# ---------------------------------------------------------------------------

def score_trace(
    trace_id: str,
    score_name: str = "user_feedback",
    score_value: float = 1.0,
    comment: str | None = None,
) -> None:
    """
    Aggiunge un punteggio a un trace Langfuse (es. feedback utente 👍/👎).

    Args:
        trace_id:    ID del trace da valutare
        score_name:  Nome del punteggio (es. "user_feedback", "sql_correctness")
        score_value: Valore numerico (es. 1.0 = positivo, 0.0 = negativo)
        comment:     Commento opzionale

    Esempio:
        score_trace(ctx["trace_id"], score_value=1.0, comment="Query corretta!")
    """
    lf = get_langfuse_client()
    lf.score(
        trace_id=trace_id,
        name=score_name,
        value=score_value,
        comment=comment,
    )


def flush() -> None:
    """
    Forza il flush immediato di tutti gli eventi Langfuse pendenti nel buffer.
    Da chiamare prima dello shutdown del processo (es. fine notebook, SIGTERM).
    """
    if _langfuse_client is not None:
        _langfuse_client.flush()
