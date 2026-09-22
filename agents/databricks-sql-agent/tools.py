"""
tools.py — Strumenti dell'agente Databricks SQL

Implementa tre tool che l'agente può invocare:
  1. list_available_tables  → elenca le tabelle autorizzate con schema e descrizione
  2. describe_table         → restituisce i metadati (colonne, tipi, commenti) di una tabella
  3. execute_sql_query      → esegue una SELECT su Databricks SQL Warehouse
                              con whitelist e limite righe come protezioni di sicurezza
"""

from __future__ import annotations

import re
from typing import Annotated

from databricks import sql as dbsql
from langchain_core.tools import tool

from databricks_config import (
    DATABRICKS_HOST,
    DATABRICKS_TOKEN,
    DATABRICKS_WAREHOUSE_ID,
    MAX_ROWS_DEFAULT,
    TABLE_WHITELIST,
)


# ---------------------------------------------------------------------------
# Helper: connessione al Databricks SQL Warehouse
# ---------------------------------------------------------------------------

def _get_connection():
    """
    Restituisce una connessione al Databricks SQL Warehouse.
    All'interno di un cluster Databricks le credenziali vengono
    risolte automaticamente dal contesto del cluster (dbutils / token interno).
    """
    kwargs: dict = {"server_hostname": DATABRICKS_HOST or _detect_host()}

    if DATABRICKS_TOKEN:
        kwargs["access_token"] = DATABRICKS_TOKEN
    else:
        # Dentro Databricks: usa il token del cluster corrente (nessuna chiave necessaria)
        import subprocess, json  # noqa: E401
        try:
            token = subprocess.check_output(
                ["databricks", "auth", "token", "--output", "json"]
            )
            kwargs["access_token"] = json.loads(token)["access_token"]
        except Exception:
            # Fallback: l'SDK Databricks risolve automaticamente le credenziali
            pass

    kwargs["http_path"] = f"/sql/1.0/warehouses/{DATABRICKS_WAREHOUSE_ID}"
    return dbsql.connect(**kwargs)


def _detect_host() -> str:
    """Tenta di rilevare automaticamente l'host dal contesto del cluster."""
    try:
        import subprocess
        result = subprocess.check_output(
            ["bash", "-c", "echo $DATABRICKS_HOST"], text=True
        ).strip()
        if result:
            return result
    except Exception:
        pass
    raise EnvironmentError(
        "DATABRICKS_HOST non rilevato. Imposta la variabile d'ambiente DATABRICKS_HOST."
    )


def _whitelist_set() -> set[str]:
    """Restituisce la whitelist normalizzata (lowercase) per confronti case-insensitive."""
    return {t.lower() for t in TABLE_WHITELIST}


def _is_safe_identifier(name: str) -> bool:
    """
    Verifica che un nome (tabella, colonna, schema) contenga solo caratteri
    alfanumerici, underscore e punti — niente che possa causare SQL injection.
    """
    return bool(re.fullmatch(r"[a-zA-Z0-9_.]+", name))


# ---------------------------------------------------------------------------
# TOOL 1 — Elenca le tabelle disponibili
# ---------------------------------------------------------------------------

@tool
def list_available_tables() -> str:
    """
    Restituisce l'elenco delle tabelle disponibili autorizzate per la consultazione,
    con nome completo (catalog.schema.table) e descrizione.
    Chiama questo tool SEMPRE come primo passo prima di costruire una query SQL.
    """
    if not TABLE_WHITELIST:
        return "Nessuna tabella configurata nella whitelist."

    conn = _get_connection()
    parts: list[str] = []

    try:
        with conn.cursor() as cursor:
            for full_table in TABLE_WHITELIST:
                segments = full_table.split(".")
                if len(segments) == 3:
                    catalog, schema, table = segments
                    try:
                        cursor.execute(f"DESCRIBE TABLE {full_table}")
                        cols = cursor.fetchall()
                        col_names = ", ".join(r[0] for r in cols if r[0] and not r[0].startswith("#"))
                        parts.append(f"- **{full_table}**\n  Colonne: {col_names}")
                    except Exception as exc:
                        parts.append(f"- **{full_table}** (errore lettura schema: {exc})")
                else:
                    parts.append(f"- **{full_table}** (formato non valido)")
    finally:
        conn.close()

    return "### Tabelle disponibili\n\n" + "\n".join(parts)


# ---------------------------------------------------------------------------
# TOOL 2 — Descrivi una tabella specifica
# ---------------------------------------------------------------------------

@tool
def describe_table(
    table_name: Annotated[str, "Nome completo della tabella nel formato catalog.schema.table"],
) -> str:
    """
    Restituisce lo schema dettagliato di una tabella (nome colonne, tipo dati, commenti/descrizioni).
    Usa questo tool per conoscere i nomi esatti delle colonne prima di scrivere la query SQL.
    La tabella deve essere presente nella whitelist autorizzata.
    """
    if not _is_safe_identifier(table_name):
        return f"Errore di sicurezza: nome tabella non valido → '{table_name}'"

    if table_name.lower() not in _whitelist_set():
        return (
            f"Accesso negato: la tabella '{table_name}' non è nella whitelist autorizzata.\n"
            f"Tabelle disponibili: {', '.join(TABLE_WHITELIST)}"
        )

    conn = _get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"DESCRIBE TABLE EXTENDED {table_name}")
            rows = cursor.fetchall()

        lines = ["| Colonna | Tipo | Commento |", "|---------|------|----------|"]
        for row in rows:
            col, dtype, comment = (row[0] or ""), (row[1] or ""), (row[2] or "")
            if col.startswith("#") or not col.strip():
                continue
            lines.append(f"| {col} | {dtype} | {comment} |")

        return f"### Schema di `{table_name}`\n\n" + "\n".join(lines)
    except Exception as exc:
        return f"Errore durante la lettura dello schema di '{table_name}': {exc}"
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# TOOL 3 — Esegui una query SQL
# ---------------------------------------------------------------------------

@tool
def execute_sql_query(
    sql_query: Annotated[
        str,
        "Query SQL SELECT valida in sintassi Spark SQL / ANSI SQL. "
        "Usare solo tabelle presenti nella whitelist autorizzata. "
        "Non includere istruzioni DDL (CREATE, DROP, ALTER) o DML (INSERT, UPDATE, DELETE).",
    ],
    max_rows: Annotated[
        int,
        f"Numero massimo di righe da restituire (default {MAX_ROWS_DEFAULT}, max 500).",
    ] = MAX_ROWS_DEFAULT,
) -> str:
    """
    Esegue una query SQL SELECT su Databricks SQL Warehouse e restituisce i risultati
    in formato tabellare Markdown.

    Protezioni di sicurezza attive:
    - Sono ammesse SOLO istruzioni SELECT
    - Il numero di righe è limitato a max 500
    - Solo le tabelle nella whitelist possono essere referenziate
    """
    # --- Validazione: solo SELECT ---
    stripped = sql_query.strip().upper()
    if not stripped.startswith("SELECT") and not stripped.startswith("WITH"):
        return (
            "Errore di sicurezza: sono consentite solo query SELECT o WITH...SELECT.\n"
            f"Query ricevuta: {sql_query[:200]}"
        )

    # --- Validazione: nessuna tabella fuori whitelist ---
    whitelist = _whitelist_set()
    # Estrae tutti i token che seguono FROM / JOIN come potenziali nomi di tabella
    referenced = re.findall(
        r"(?:FROM|JOIN)\s+([\w.]+)", sql_query, flags=re.IGNORECASE
    )
    for ref in referenced:
        if ref.lower() not in whitelist:
            return (
                f"Accesso negato: la tabella '{ref}' non è nella whitelist autorizzata.\n"
                f"Tabelle autorizzate: {', '.join(TABLE_WHITELIST)}"
            )

    # --- Limite righe ---
    safe_max = min(max(1, max_rows), 500)

    # --- Aggiunge LIMIT se non presente ---
    if "LIMIT" not in stripped:
        sql_query = sql_query.rstrip(";") + f"\nLIMIT {safe_max}"

    conn = _get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql_query)
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description] if cursor.description else []

        if not rows:
            return "La query non ha prodotto risultati."

        # Formattazione Markdown
        header = "| " + " | ".join(columns) + " |"
        separator = "|" + "|".join(["---"] * len(columns)) + "|"
        data_rows = [
            "| " + " | ".join(str(v) if v is not None else "NULL" for v in row) + " |"
            for row in rows
        ]

        result_md = "\n".join([header, separator] + data_rows)
        return (
            f"### Risultati ({len(rows)} righe)\n\n"
            f"```sql\n{sql_query}\n```\n\n"
            f"{result_md}"
        )
    except Exception as exc:
        return f"Errore durante l'esecuzione della query:\n{exc}\n\nQuery: {sql_query}"
    finally:
        conn.close()
