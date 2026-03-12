#!/bin/bash
# setup-bigquery.sh
# Automates BigQuery dataset and table creation for ML data ingestion

PROJECT_ID=$(gcloud config get-value project)
DATASET_ID="trovestak_ml"
TABLE_ID="interactions"

echo "Setting up BigQuery in project: $PROJECT_ID"

# 1. Create Dataset
echo "Creating dataset: $DATASET_ID..."
bq mk --dataset --location=US "$DATASET_ID" || true

# 2. Create Schema File
cat << "JSON" > schema.json
[
  { "name": "order_id", "type": "STRING", "mode": "REQUIRED" },
  { "name": "user_id", "type": "STRING", "mode": "NULLABLE" },
  { "name": "product_ids", "type": "RECORD", "mode": "REPEATED", "fields": [
    { "name": "id", "type": "STRING", "mode": "NULLABLE" }
  ]},
  { "name": "total_amount", "type": "INTEGER", "mode": "NULLABLE" },
  { "name": "timestamp", "type": "TIMESTAMP", "mode": "NULLABLE" }
]
JSON

# 3. Create Interactions Table
echo "Creating interactions table..."
bq mk --table \
    --description "Stores product interaction events for ML training" \
    "$PROJECT_ID:$DATASET_ID.$TABLE_ID" \
    ./schema.json

rm schema.json
echo "BigQuery setup complete!"
