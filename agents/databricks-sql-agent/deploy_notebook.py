# Databricks Notebook — Deploy dell'agente su Model Serving
# Copia questo file come notebook Databricks (.py) e incollalo in un notebook
# oppure importalo direttamente via Databricks UI o CLI.
#
# Formato: Databricks Python Notebook (celle separate da # COMMAND ----------)

# MAGIC %md
# MAGIC # 🤖 Deploy Databricks SQL Agent
# MAGIC
# MAGIC Questo notebook esegue le seguenti operazioni:
# MAGIC 1. Installa le dipendenze
# MAGIC 2. Configura l'ambiente
# MAGIC 3. Testa l'agente in locale
# MAGIC 4. Logga il modello su MLflow
# MAGIC 5. Registra il modello nel Unity Catalog Model Registry
# MAGIC 6. Esegue il deploy su Databricks Model Serving

# COMMAND ----------

# MAGIC %pip install -r /Workspace/Repos/<tuo-repo>/agents/databricks-sql-agent/requirements.txt
# MAGIC dbutils.library.restartPython()

# COMMAND ----------

import os
import sys

# Aggiungi la directory dell'agente al path
AGENT_DIR = "/Workspace/Repos/<tuo-repo>/agents/databricks-sql-agent"
sys.path.insert(0, AGENT_DIR)
os.chdir(AGENT_DIR)

# Configura le variabili d'ambiente
# Recupera i valori da Databricks Secrets (sicuro) oppure imposta direttamente per test
os.environ["DATABRICKS_WAREHOUSE_ID"] = dbutils.secrets.get("ai-agent", "warehouse_id")  # type: ignore[name-defined]
os.environ["UNITY_CATALOG"] = "main"
os.environ["UNITY_SCHEMA"] = "default"
os.environ["DATABRICKS_LLM_ENDPOINT"] = "databricks-meta-llama-3-3-70b-instruct"

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1. Test locale dell'agente

# COMMAND ----------

from agent import build_agent

agent = build_agent()

# Test con una domanda di esempio
test_question = "Quanti clienti abbiamo nel database? Mostrami anche i 5 clienti con più ordini."
result = agent.invoke({"messages": [{"role": "user", "content": test_question}]})
print("=== RISPOSTA AGENTE ===")
print(result["messages"][-1].content)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2. Log del modello su MLflow

# COMMAND ----------

from agent import log_model_to_mlflow

model_uri = log_model_to_mlflow(
    experiment_name="/Shared/databricks-sql-agent",
    run_name="databricks-sql-agent-v1",
)
print(f"Model URI: {model_uri}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Registrazione nel Unity Catalog Model Registry

# COMMAND ----------

import mlflow
from mlflow import MlflowClient

# Nome del modello nel registry (formato: catalog.schema.model_name)
REGISTERED_MODEL_NAME = "main.default.databricks_sql_agent"

# Registra il modello
registered_model = mlflow.register_model(
    model_uri=model_uri,
    name=REGISTERED_MODEL_NAME,
)

print(f"✅ Modello registrato: {REGISTERED_MODEL_NAME}")
print(f"   Versione: {registered_model.version}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. Deploy su Databricks Model Serving

# COMMAND ----------

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.serving import (
    EndpointCoreConfigInput,
    ServedEntityInput,
)

w = WorkspaceClient()

ENDPOINT_NAME = "databricks-sql-agent-endpoint"
MODEL_VERSION = registered_model.version

# Crea (o aggiorna) l'endpoint di serving
try:
    w.serving_endpoints.create_and_wait(
        name=ENDPOINT_NAME,
        config=EndpointCoreConfigInput(
            served_entities=[
                ServedEntityInput(
                    entity_name=REGISTERED_MODEL_NAME,
                    entity_version=MODEL_VERSION,
                    workload_size="Small",       # Small / Medium / Large
                    scale_to_zero_enabled=True,  # Spegni automaticamente se inutilizzato
                )
            ]
        ),
    )
    print(f"✅ Endpoint creato: {ENDPOINT_NAME}")
except Exception as e:
    if "already exists" in str(e).lower():
        # Aggiorna l'endpoint esistente con la nuova versione
        w.serving_endpoints.update_config_and_wait(
            name=ENDPOINT_NAME,
            served_entities=[
                ServedEntityInput(
                    entity_name=REGISTERED_MODEL_NAME,
                    entity_version=MODEL_VERSION,
                    workload_size="Small",
                    scale_to_zero_enabled=True,
                )
            ],
        )
        print(f"✅ Endpoint aggiornato: {ENDPOINT_NAME}")
    else:
        raise

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5. Test dell'endpoint REST

# COMMAND ----------

import json
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()

# Chiama l'endpoint via API REST
response = w.serving_endpoints.query(
    name=ENDPOINT_NAME,
    dataframe_records=[
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Mostrami i 5 prodotti più venduti nell'ultimo mese"
                }
            ]
        }
    ],
)

print("=== RISPOSTA ENDPOINT ===")
print(response.predictions[0])

# COMMAND ----------

# MAGIC %md
# MAGIC ## ✅ Deploy completato!
# MAGIC
# MAGIC L'agente è ora disponibile come endpoint REST su Databricks Model Serving.
# MAGIC
# MAGIC **URL endpoint:**
# MAGIC ```
# MAGIC https://<your-workspace>.azuredatabricks.net/serving-endpoints/databricks-sql-agent-endpoint/invocations
# MAGIC ```
# MAGIC
# MAGIC **Esempio di chiamata REST (curl):**
# MAGIC ```bash
# MAGIC curl -X POST \
# MAGIC   -H "Authorization: Bearer $DATABRICKS_TOKEN" \
# MAGIC   -H "Content-Type: application/json" \
# MAGIC   -d '{"dataframe_records": [{"messages": [{"role": "user", "content": "Quanti clienti abbiamo?"}]}]}' \
# MAGIC   https://<your-workspace>.azuredatabricks.net/serving-endpoints/databricks-sql-agent-endpoint/invocations
# MAGIC ```
