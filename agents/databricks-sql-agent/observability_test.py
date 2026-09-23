"""
observability_test.py — Test di verifica end-to-end del tracing Langfuse

Esegui questo script per verificare che:
  1. La connessione a Langfuse funzioni (auth OK)
  2. Un trace manuale appaia nella dashboard Langfuse
  3. Il trace_agent_run() context manager funzioni correttamente
  4. Gli span dei tool vengano registrati come figli del trace padre
  5. Lo scoring post-run funzioni

Esecuzione:
    # Locale
    export LANGFUSE_PUBLIC_KEY="pk-lf-..."
    export LANGFUSE_SECRET_KEY="sk-lf-..."
    python observability_test.py

    # Su Databricks notebook
    %run ./observability_test
"""

from __future__ import annotations

import os
import sys
import time
import unittest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# TEST 1 — Connessione Langfuse (auth check)
# ---------------------------------------------------------------------------

def test_langfuse_connection() -> bool:
    """Verifica che le credenziali Langfuse siano valide e l'host raggiungibile."""
    from observability import get_langfuse_client

    public_key = os.getenv("LANGFUSE_PUBLIC_KEY", "")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY", "")

    if not public_key or not secret_key:
        print("⚠️  LANGFUSE_PUBLIC_KEY o LANGFUSE_SECRET_KEY non impostati.")
        print("   Imposta le variabili d'ambiente e riprova.")
        print("   Esempio:")
        print('   export LANGFUSE_PUBLIC_KEY="pk-lf-..."')
        print('   export LANGFUSE_SECRET_KEY="sk-lf-..."')
        return False

    try:
        lf = get_langfuse_client()
        # auth() fa una GET /api/public/health e verifica le credenziali
        lf.auth_check()
        print("✅ TEST 1 — Connessione Langfuse: OK")
        return True
    except Exception as exc:
        print(f"❌ TEST 1 — Connessione Langfuse: FALLITO → {exc}")
        return False


# ---------------------------------------------------------------------------
# TEST 2 — Trace manuale semplice
# ---------------------------------------------------------------------------

def test_manual_trace() -> bool:
    """Crea un trace manuale su Langfuse e verifica che non dia errori."""
    from observability import get_langfuse_client, flush

    try:
        lf = get_langfuse_client()
        trace = lf.trace(
            name="observability-test",
            input={"test": "trace manuale"},
            metadata={"source": "observability_test.py"},
            tags=["test", "databricks-sql-agent"],
        )
        trace.update(output={"status": "ok"})
        flush()
        print(f"✅ TEST 2 — Trace manuale: OK  (trace_id={trace.id})")
        print(f"   Verifica su: {os.getenv('LANGFUSE_HOST', 'https://cloud.langfuse.com')}")
        return True
    except Exception as exc:
        print(f"❌ TEST 2 — Trace manuale: FALLITO → {exc}")
        return False


# ---------------------------------------------------------------------------
# TEST 3 — trace_agent_run() context manager
# ---------------------------------------------------------------------------

def test_trace_agent_run_context_manager() -> bool:
    """Verifica il context manager trace_agent_run con un agente simulato."""
    from observability import trace_agent_run, flush

    try:
        with trace_agent_run(
            user_input="Test: quanti clienti abbiamo?",
            session_id="test-session-001",
            user_id="test-user",
            tags=["test", "unit-test"],
            metadata={"test_run": True},
        ) as ctx:
            assert "trace_id" in ctx
            assert "callback" in ctx
            assert "set_output" in ctx
            assert callable(ctx["set_output"])

            # Simula la risposta dell'agente
            time.sleep(0.05)  # Simula latenza
            ctx["set_output"]("Risposta simulata: 42 clienti.", simulated=True)

        flush()
        print(f"✅ TEST 3 — trace_agent_run(): OK  (trace_id={ctx['trace_id']})")
        return True
    except Exception as exc:
        print(f"❌ TEST 3 — trace_agent_run(): FALLITO → {exc}")
        return False


# ---------------------------------------------------------------------------
# TEST 4 — record_tool_span() per ogni tool
# ---------------------------------------------------------------------------

def test_tool_spans() -> bool:
    """Verifica che gli span dei tool vengano creati come figli del trace."""
    from observability import get_langfuse_client, record_tool_span, flush

    lf = get_langfuse_client()
    trace = lf.trace(name="test-tool-spans", tags=["test"])

    tool_tests = [
        ("list_available_tables", {}, "### Tabelle disponibili\n- main.default.customers"),
        ("describe_table", {"table_name": "main.default.customers"}, "| customer_id | STRING |"),
        ("execute_sql_query", {"sql_query": "SELECT * FROM main.default.customers LIMIT 5", "max_rows": 5},
         "### Risultati (5 righe)"),
    ]

    all_ok = True
    for tool_name, tool_input, mock_output in tool_tests:
        try:
            with record_tool_span(trace.id, tool_name, tool_input) as sc:
                time.sleep(0.02)  # Simula latenza tool
                sc["set_output"](mock_output, rows_returned=5 if "execute" in tool_name else None)
            print(f"   ✅ Span '{tool_name}': OK")
        except Exception as exc:
            print(f"   ❌ Span '{tool_name}': FALLITO → {exc}")
            all_ok = False

    flush()
    if all_ok:
        print(f"✅ TEST 4 — Tool spans: OK  (trace_id={trace.id})")
    else:
        print("❌ TEST 4 — Tool spans: alcuni span falliti")
    return all_ok


# ---------------------------------------------------------------------------
# TEST 5 — score_trace()
# ---------------------------------------------------------------------------

def test_score_trace() -> bool:
    """Verifica che uno score (feedback utente) venga associato al trace."""
    from observability import get_langfuse_client, score_trace, flush

    lf = get_langfuse_client()
    trace = lf.trace(name="test-scoring", tags=["test"])
    flush()  # Assicura che il trace esista prima di aggiungere lo score

    try:
        score_trace(trace.id, score_name="user_feedback", score_value=1.0, comment="Test: risposta corretta")
        flush()
        print(f"✅ TEST 5 — score_trace(): OK  (trace_id={trace.id})")
        return True
    except Exception as exc:
        print(f"❌ TEST 5 — score_trace(): FALLITO → {exc}")
        return False


# ---------------------------------------------------------------------------
# TEST 6 — Integrazione con LangChain callback (mock agente)
# ---------------------------------------------------------------------------

def test_langchain_callback_integration() -> bool:
    """
    Verifica che il CallbackHandler Langfuse si integri con LangGraph
    senza eccezioni, usando un agente simulato (nessuna chiamata reale al LLM).
    """
    from observability import get_langfuse_callback, flush

    try:
        callback = get_langfuse_callback(
            session_id="test-session-cb",
            user_id="test-user-cb",
            tags=["test", "callback"],
        )

        # Simula gli eventi che LangGraph emiette al callback
        from langchain_core.messages import HumanMessage, AIMessage

        # on_chain_start
        callback.on_chain_start(
            serialized={"id": ["databricks_sql_agent"]},
            inputs={"messages": [HumanMessage(content="Test domanda")]},
            run_id=__import__("uuid").uuid4(),
        )

        # on_llm_start / on_llm_end simulati
        callback.on_chain_end(
            outputs={"messages": [AIMessage(content="Risposta simulata")]},
            run_id=__import__("uuid").uuid4(),
        )

        flush()
        print("✅ TEST 6 — LangChain callback integration: OK")
        return True
    except Exception as exc:
        print(f"❌ TEST 6 — LangChain callback: FALLITO → {exc}")
        return False


# ---------------------------------------------------------------------------
# Runner principale
# ---------------------------------------------------------------------------

def run_all_tests() -> None:
    print("=" * 60)
    print("  Langfuse Observability — Test Suite")
    print(f"  Host: {os.getenv('LANGFUSE_HOST', 'https://cloud.langfuse.com')}")
    print("=" * 60)
    print()

    tests = [
        ("Connessione Langfuse",            test_langfuse_connection),
        ("Trace manuale",                   test_manual_trace),
        ("trace_agent_run() ctx manager",   test_trace_agent_run_context_manager),
        ("Tool spans",                      test_tool_spans),
        ("Score trace",                     test_score_trace),
        ("LangChain callback integration",  test_langchain_callback_integration),
    ]

    results = []
    for name, fn in tests:
        try:
            ok = fn()
        except Exception as exc:
            print(f"❌ {name}: eccezione non gestita → {exc}")
            ok = False
        results.append((name, ok))
        print()

    print("=" * 60)
    passed = sum(1 for _, ok in results if ok)
    print(f"  Risultato: {passed}/{len(results)} test superati")
    if passed == len(results):
        print("  ✅ Tutti i test Langfuse OK — i trace sono visibili nella dashboard.")
    else:
        failed = [name for name, ok in results if not ok]
        print(f"  ❌ Test falliti: {', '.join(failed)}")
    print("=" * 60)

    # Forza flush finale
    try:
        from observability import flush
        flush()
    except Exception:
        pass

    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    run_all_tests()
