# 🤖 Databricks SQL Agent

Agente AI che interpreta domande in **linguaggio naturale** ed estrae dati da un **Databricks Unity Catalog** tramite query SQL generate automaticamente.

Ispirato all'agente SAP ABAP (`Z_AI_SQL_AGENT`) presente in questo workspace, ma implementato completamente su stack Databricks/Python.

---

## Architettura

```
Utente (linguaggio naturale)
        │
        ▼
   LangGraph ReAct Agent
   (Meta LLaMA 3.3 70B via Databricks Foundation Model API)
        │
        ├── Tool: list_available_tables   → legge whitelist + schema Unity Catalog
        ├── Tool: describe_table          → metadati colonne (DESCRIBE TABLE EXTENDED)
        └── Tool: execute_sql_query       → SELECT su Databricks SQL Warehouse
                                              (whitelist + solo SELECT + LIMIT)
        │
        ▼
   Risposta in italiano con risultati in tabella Markdown
        │
        ▼
   MLflow pyfunc → Unity Catalog Model Registry → Databricks Model Serving (REST API)
```

---

## Struttura file

```
agents/databricks-sql-agent/
├── agent.py              # Core agente LangGraph + wrapper MLflow pyfunc
├── tools.py              # 3 tool: list_tables, describe_table, execute_sql
├── databricks_config.py  # Configurazione LLM, warehouse, whitelist tabelle
├── requirements.txt      # Dipendenze Python
├── deploy_notebook.py    # Notebook Databricks per deploy completo
└── README.md             # Questo file
```

---

## Configurazione rapida

### 1. Modifica la whitelist delle tabelle

In [`databricks_config.py`](./databricks_config.py), aggiungi le tabelle che l'agente può interrogare:

```python
TABLE_WHITELIST: list[str] = [
    "main.sales.customers",
    "main.sales.orders",
    "main.inventory.products",
]
```

> **Sicurezza**: l'agente non può accedere a nessuna tabella fuori da questa lista, anche se il LLM la genera nella query.

### 2. Configura il Warehouse ID

```bash
# Tramite variabile d'ambiente
export DATABRICKS_WAREHOUSE_ID="aabbccddeeff0011"

# Oppure tramite Databricks Secrets (consigliato in produzione)
databricks secrets put-secret ai-agent warehouse_id
```

Recupera l'ID dal pannello: **Databricks UI → SQL Warehouses → Connection details → HTTP Path** (es. `/sql/1.0/warehouses/aabbccddeeff0011`).

### 3. Scegli il modello LLM

Il default è `databricks-meta-llama-3-3-70b-instruct` (Foundation Model API, incluso nel piano Databricks senza costi aggiuntivi per il modello). Puoi cambiarlo in `databricks_config.py`:

| Variabile | Valore default | Alternative |
|-----------|---------------|-------------|
| `DATABRICKS_LLM_ENDPOINT` | `databricks-meta-llama-3-3-70b-instruct` | `databricks-dbrx-instruct`, `databricks-mixtral-8x7b-instruct` |

---

## Deploy su Databricks Model Serving

### Metodo A — Notebook (raccomandato)

1. Importa [`deploy_notebook.py`](./deploy_notebook.py) come notebook Databricks
2. Aggiorna il percorso `AGENT_DIR` con il tuo repository
3. Esegui le celle in sequenza

### Metodo B — CLI Databricks

```bash
# Installa la CLI Databricks
pip install databricks-cli

# Autenticati
databricks configure --token

# Carica i file nel workspace
databricks workspace import-dir agents/databricks-sql-agent /Workspace/Repos/my-project/agents/databricks-sql-agent

# Esegui il deploy notebook
databricks runs submit --json '{
  "run_name": "deploy-sql-agent",
  "existing_cluster_id": "<cluster-id>",
  "notebook_task": {
    "notebook_path": "/Workspace/Repos/my-project/agents/databricks-sql-agent/deploy_notebook"
  }
}'
```

### Metodo C — Databricks Asset Bundles (DAB)

```yaml
# databricks.yml (nella root del progetto)
bundle:
  name: sql-agent

resources:
  model_serving_endpoints:
    databricks_sql_agent_endpoint:
      name: databricks-sql-agent-endpoint
      config:
        served_entities:
          - entity_name: main.default.databricks_sql_agent
            workload_size: Small
            scale_to_zero_enabled: true
```

```bash
databricks bundle deploy
databricks bundle run
```

---

## Utilizzo dell'endpoint REST

Una volta deployato, l'agente è raggiungibile via API REST:

```bash
curl -X POST \
  -H "Authorization: Bearer $DATABRICKS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataframe_records": [{
      "messages": [{
        "role": "user",
        "content": "Mostrami i 10 clienti con più ordini nell ultimo trimestre"
      }]
    }]
  }' \
  https://<your-workspace>.azuredatabricks.net/serving-endpoints/databricks-sql-agent-endpoint/invocations
```

### Esempio di risposta

```json
{
  "predictions": [
    "### Risultati (10 righe)\n\n| customer_id | name | order_count |\n|---|---|---|\n| 42 | Acme S.r.l. | 87 |\n..."
  ]
}
```

---

## Protezioni di sicurezza

| Protezione | Implementazione |
|------------|----------------|
| **Whitelist tabelle** | Solo le tabelle in `TABLE_WHITELIST` possono essere referenziate |
| **Solo SELECT** | Qualsiasi query che non inizia con `SELECT` o `WITH` viene bloccata |
| **Limite righe** | Massimo 500 righe per query, default 50 |
| **Identifier sanitization** | Regex `[a-zA-Z0-9_.]+` su tutti i nomi di tabella |
| **SQL Injection** | Nessuna interpolazione diretta di input utente nell'SQL |

---

## Analogia con l'agente SAP ABAP

| Feature | SAP ABAP (`Z_AI_SQL_AGENT`) | Databricks Python |
|---------|---------------------------|-------------------|
| LLM | OpenAI / Azure / watsonx | Databricks Foundation Model API |
| Schema discovery | DDIF_TABL_GET (dizionario dati) | `DESCRIBE TABLE EXTENDED` |
| SQL engine | Open SQL (SAP NetWeaver) | Spark SQL (Databricks) |
| Whitelist | `mt_allowed_tables` HASHED TABLE | `TABLE_WHITELIST` Python list |
| Sicurezza nome tabella | `CL_ABAP_DYN_PRG=>check_table_name_str` | Regex + whitelist check |
| Output | `CL_DEMO_OUTPUT` + ABAP LIST | Markdown table string |
| Deploy | Programma ABAP (transazione SE38) | Databricks Model Serving (REST API) |
