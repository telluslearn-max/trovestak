#!/bin/bash
# Deploy Service to Cloud Run
# Usage: ./deploy-service.sh <service-name> "<env-vars>"

SERVICE_NAME=$1
ENV_VARS=$2

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: ./deploy-service.sh <service-name> \"<env-vars>\""
    exit 1
fi

PROJECT_ID="trovestak"
REGION="us-central1"
REPO_NAME="trovestak-repo"
IMAGE_TAG="latest"

echo "🚀 Building $SERVICE_NAME..."

# Determine source path
SERVICE_PATH="apps/$SERVICE_NAME"
if [ "$SERVICE_NAME" == "shared" ]; then
    SERVICE_PATH="packages/shared"
fi

# 1. Build and Submit to Cloud Build
# We run from root to ensure monorepo context is available
gcloud builds submit . \
    --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$IMAGE_TAG" \
    --dockerfile "$SERVICE_PATH/Dockerfile"

# 2. Deploy to Cloud Run
echo "🌍 Deploying to Cloud Run..."
if [ -n "$ENV_VARS" ]; then
    gcloud run deploy "$SERVICE_NAME" \
        --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$IMAGE_TAG" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --set-env-vars "$ENV_VARS"
else
    gcloud run deploy "$SERVICE_NAME" \
        --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$IMAGE_TAG" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated
fi

echo "✅ $SERVICE_NAME is live!"
