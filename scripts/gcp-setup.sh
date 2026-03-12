#!/bin/bash
PROJECT_ID="trovestak" # Confirmed Project ID
REGION="us-central1"

echo "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# 1. Enable Required APIs
echo "Enabling Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    pubsub.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    aiplatform.googleapis.com \
    bigquery.googleapis.com

# 2. Artifact Registry Repository
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create trovestak-repo \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for TroveStack services"

# 3. Cloud Pub/Sub Topics
echo "Creating Pub/Sub topics..."
topics=(
    "order.created"
    "payment.initiate"
    "payment.confirmed"
    "payment.failed"
    "stock.low"
    "agent.intent"
    "recommendation.ready"
)

for topic in "${topics[@]}"; do
    gcloud pubsub topics create "$topic"
done

# 4. Cloud Pub/Sub Subscriptions
echo "Creating Subscriptions..."
gcloud pubsub subscriptions create payment-initiate-mpesa-sub --topic=payment.initiate
gcloud pubsub subscriptions create order-created-notif-sub --topic=order.created
gcloud pubsub subscriptions create payment-confirmed-notif-sub --topic=payment.confirmed
gcloud pubsub subscriptions create stock-low-notif-sub --topic=stock.low
gcloud pubsub subscriptions create order-created-ml-sub --topic=order.created
gcloud pubsub subscriptions create payment-confirmed-agent-sub --topic=payment.confirmed

echo "Infrastructure Setup Complete!"
