#!/usr/bin/env bash
# ============================================================
# TROVESTAK — GCP Pub/Sub setup script
# Run once per environment: bash infra/setup-pubsub.sh
#
# Requirements: gcloud CLI authenticated, project set
# ============================================================

set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-trovestak}"
gcloud config set project "$PROJECT"

echo "==> Creating Pub/Sub topics..."
TOPICS=(
    "order.created"
    "order.updated"
    "order.dispatched"
    "payment.initiate"
    "payment.confirmed"
    "payment.failed"
    "stock.low"
    "stock.updated"
    "agent.intent"
    "recommendation.ready"
    "product.import"
)

for topic in "${TOPICS[@]}"; do
    gcloud pubsub topics create "$topic" --project="$PROJECT" 2>/dev/null && echo "  created: $topic" || echo "  already exists: $topic"
done

echo ""
echo "==> Creating subscriptions..."

# notif-service
for sub_topic in "order.created:notif-order-created" "payment.confirmed:notif-payment-confirmed" "stock.low:notif-stock-low" "order.dispatched:notif-order-dispatched"; do
    topic="${sub_topic%%:*}"
    sub="${sub_topic##*:}"
    gcloud pubsub subscriptions create "$sub" \
        --topic="$topic" \
        --ack-deadline=60 \
        --project="$PROJECT" 2>/dev/null && echo "  created: $sub" || echo "  already exists: $sub"
done

# mpesa-service
gcloud pubsub subscriptions create "mpesa-payment-initiate" \
    --topic="payment.initiate" \
    --ack-deadline=120 \
    --project="$PROJECT" 2>/dev/null && echo "  created: mpesa-payment-initiate" || echo "  already exists: mpesa-payment-initiate"

# ml-service
for sub_topic in "agent.intent:ml-agent-intent" "product.import:ml-product-import"; do
    topic="${sub_topic%%:*}"
    sub="${sub_topic##*:}"
    gcloud pubsub subscriptions create "$sub" \
        --topic="$topic" \
        --ack-deadline=30 \
        --project="$PROJECT" 2>/dev/null && echo "  created: $sub" || echo "  already exists: $sub"
done

echo ""
echo "==> All topics and subscriptions provisioned for project: $PROJECT"
