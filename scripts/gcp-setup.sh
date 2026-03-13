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
    if gcloud pubsub topics describe "$topic" >/dev/null 2>&1; then
        echo "Topic $topic already exists, skipping."
    else
        echo "Creating topic $topic..."
        gcloud pubsub topics create "$topic"
    fi
done

# 4. Cloud Pub/Sub Subscriptions
echo "Creating Subscriptions..."
create_sub() {
    local sub=$1
    local topic=$2
    if gcloud pubsub subscriptions describe "$sub" >/dev/null 2>&1; then
        echo "Subscription $sub already exists, skipping."
    else
        echo "Creating subscription $sub..."
        gcloud pubsub subscriptions create "$sub" --topic="$topic"
    fi
}

create_sub "payment-initiate-mpesa-sub" "payment.initiate"
create_sub "order-created-notif-sub" "order.created"
create_sub "payment-confirmed-notif-sub" "payment.confirmed"
create_sub "stock-low-notif-sub" "stock.low"
create_sub "order-created-ml-sub" "order.created"
create_sub "payment-confirmed-agent-sub" "payment.confirmed"

echo "Infrastructure Setup Complete!"
