#!/usr/bin/env bash
# ============================================================
# TROVESTAK — GCP Cloud Scheduler setup script
# Run once per environment: bash infra/setup-scheduler.sh
#
# Requirements:
#   - gcloud CLI authenticated
#   - NOTIF_SERVICE_URL env var set (Cloud Run URL for notif-service)
#   - GOOGLE_CLOUD_PROJECT env var set
# ============================================================

set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-trovestak}"
NOTIF_URL="${NOTIF_SERVICE_URL:?NOTIF_SERVICE_URL must be set (Cloud Run URL for notif-service)}"
SA="${SCHEDULER_SA:-trovestak-scheduler@${PROJECT}.iam.gserviceaccount.com}"

gcloud config set project "$PROJECT"

echo "==> Creating Cloud Scheduler jobs..."

# 1. Daily stock alert (08:00 EAT)
gcloud scheduler jobs create http trovestak-stock-alert-daily \
    --location=us-central1 \
    --schedule="0 8 * * *" \
    --time-zone="Africa/Nairobi" \
    --uri="${NOTIF_URL}/jobs/stock-alerts" \
    --http-method=POST \
    --oidc-service-account-email="$SA" \
    --description="Scan stock levels and publish stock.low events" \
    --attempt-deadline=5m \
    2>/dev/null && echo "  created: stock-alert-daily" || \
gcloud scheduler jobs update http trovestak-stock-alert-daily \
    --location=us-central1 \
    --schedule="0 8 * * *" \
    --time-zone="Africa/Nairobi" \
    --uri="${NOTIF_URL}/jobs/stock-alerts" \
    --http-method=POST \
    --oidc-service-account-email="$SA" && echo "  updated: stock-alert-daily"

# 2. Daily revenue digest (09:00 EAT)
gcloud scheduler jobs create http trovestak-revenue-digest-daily \
    --location=us-central1 \
    --schedule="0 9 * * *" \
    --time-zone="Africa/Nairobi" \
    --uri="${NOTIF_URL}/jobs/revenue-digest" \
    --http-method=POST \
    --oidc-service-account-email="$SA" \
    --description="Daily revenue digest log for admin" \
    --attempt-deadline=5m \
    2>/dev/null && echo "  created: revenue-digest-daily" || \
gcloud scheduler jobs update http trovestak-revenue-digest-daily \
    --location=us-central1 \
    --schedule="0 9 * * *" \
    --time-zone="Africa/Nairobi" \
    --uri="${NOTIF_URL}/jobs/revenue-digest" \
    --http-method=POST \
    --oidc-service-account-email="$SA" && echo "  updated: revenue-digest-daily"

# 3. Hourly M-Pesa reconciliation
gcloud scheduler jobs create http trovestak-mpesa-reconcile-hourly \
    --location=us-central1 \
    --schedule="0 * * * *" \
    --time-zone="Africa/Nairobi" \
    --uri="${NOTIF_URL}/jobs/mpesa-reconcile" \
    --http-method=POST \
    --oidc-service-account-email="$SA" \
    --description="Hourly M-Pesa payment reconciliation check" \
    --attempt-deadline=3m \
    2>/dev/null && echo "  created: mpesa-reconcile-hourly" || \
gcloud scheduler jobs update http trovestak-mpesa-reconcile-hourly \
    --location=us-central1 \
    --schedule="0 * * * *" \
    --time-zone="Africa/Nairobi" \
    --uri="${NOTIF_URL}/jobs/mpesa-reconcile" \
    --http-method=POST \
    --oidc-service-account-email="$SA" && echo "  updated: mpesa-reconcile-hourly"

# 4. Weekly re-embedding via Pub/Sub
gcloud scheduler jobs create pubsub trovestak-reembed-weekly \
    --location=us-central1 \
    --schedule="0 2 * * 0" \
    --time-zone="UTC" \
    --topic="projects/${PROJECT}/topics/product.import" \
    --message-body='{"trigger":"scheduled_reembed","scope":"modified_7d"}' \
    --description="Weekly Gemini re-embedding for recently modified products" \
    2>/dev/null && echo "  created: reembed-weekly" || \
gcloud scheduler jobs update pubsub trovestak-reembed-weekly \
    --location=us-central1 \
    --schedule="0 2 * * 0" \
    --time-zone="UTC" \
    --topic="projects/${PROJECT}/topics/product.import" \
    --message-body='{"trigger":"scheduled_reembed","scope":"modified_7d"}' && echo "  updated: reembed-weekly"

echo ""
echo "==> All Cloud Scheduler jobs provisioned for project: $PROJECT"
