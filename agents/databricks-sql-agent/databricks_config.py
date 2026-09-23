"""
Configurazione centralizzata per l'agente Databricks.

Tutte le variabili sensibili vengono lette da Databricks Secrets oppure
da variabili d'ambiente — mai hardcodate nel codice.

Utilizzo su Databricks:
    dbutils.secrets.put(scope="ai-agent", key="openai_api_key", string_value="sk-...")
    oppure usa Databricks Model Serving (consigliato) che gestisce le credenziali internamente.
"""

import os


# ---------------------------------------------------------------------------
# LLM — endpoint Databricks Model Serving (Foundation Model API)
# Usa il modello ospitato direttamente su Databricks, zero configurazione chiavi.
# Endpoint disponibili out-of-the-box:
#   - databricks-meta-llama-3-3-70b-instruct  ← consigliato
#   - databricks-dbrx-instruct
#   - databricks-mixtral-8x7b-instruct
# ---------------------------------------------------------------------------
DATABRICKS_LLM_ENDPOINT = os.getenv(
    "DATABRICKS_LLM_ENDPOINT",
    "databricks-meta-llama-3-3-70b-instruct",
)

# ---------------------------------------------------------------------------
# SQL Warehouse — ID del warehouse HTTP da usare per eseguire le query.
# Recuperalo da: Databricks UI → SQL Warehouses → <tuo warehouse> → Connection details
# Es: "aabbccddeeff0011"
# ---------------------------------------------------------------------------
DATABRICKS_WAREHOUSE_ID = os.getenv(
    "DATABRICKS_WAREHOUSE_ID",
    "INSERISCI_WAREHOUSE_ID",
)

# ---------------------------------------------------------------------------
# Unity Catalog — catalogo e schema di default che l'agente può interrogare.
# L'agente legge la lista delle tabelle autorizzate dallo SCHEMA_WHITELIST.
# ---------------------------------------------------------------------------
UNITY_CATALOG_DEFAULT = os.getenv("UNITY_CATALOG", "main")
UNITY_SCHEMA_DEFAULT = os.getenv("UNITY_SCHEMA", "default")

# Whitelist delle tabelle autorizzate — formato: catalog.schema.table
# Aggiungi solo le tabelle che l'agente deve poter interrogare.
TABLE_WHITELIST: list[str] = [
    f"{UNITY_CATALOG_DEFAULT}.{UNITY_SCHEMA_DEFAULT}.customers",
    f"{UNITY_CATALOG_DEFAULT}.{UNITY_SCHEMA_DEFAULT}.orders",
    f"{UNITY_CATALOG_DEFAULT}.{UNITY_SCHEMA_DEFAULT}.products",
    f"{UNITY_CATALOG_DEFAULT}.{UNITY_SCHEMA_DEFAULT}.order_items",
    f"{UNITY_CATALOG_DEFAULT}.{UNITY_SCHEMA_DEFAULT}.sales",
]

# Limite di righe massimo per proteggere le risorse del warehouse
MAX_ROWS_DEFAULT: int = int(os.getenv("AGENT_MAX_ROWS", "50"))

# ---------------------------------------------------------------------------
# Host Databricks — necessario solo se esegui il codice FUORI da Databricks
# (es. sviluppo locale). All'interno del cluster viene rilevato automaticamente.
# ---------------------------------------------------------------------------
DATABRICKS_HOST = os.getenv("DATABRICKS_HOST", "")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN", "")

# ---------------------------------------------------------------------------
# Langfuse — Observability & Tracing
#
# Imposta queste variabili d'ambiente prima di avviare l'agente:
#
#   export LANGFUSE_PUBLIC_KEY="pk-lf-..."
#   export LANGFUSE_SECRET_KEY="sk-lf-..."
#   export LANGFUSE_HOST="https://cloud.langfuse.com"   # default
#
# Oppure su Databricks tramite Secrets:
#   dbutils.secrets.put(scope="ai-agent", key="langfuse_public_key", string_value="pk-lf-...")
#   dbutils.secrets.put(scope="ai-agent", key="langfuse_secret_key", string_value="sk-lf-...")
#
# Self-hosted Langfuse (es. Docker Compose locale o k8s):
#   export LANGFUSE_HOST="http://localhost:3000"
# ---------------------------------------------------------------------------
LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY", "")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY", "")
LANGFUSE_HOST = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

# Tag release per differenziare le versioni nei trace Langfuse (es. "v1.0.0", "staging")
LANGFUSE_RELEASE = os.getenv("LANGFUSE_RELEASE", "")
