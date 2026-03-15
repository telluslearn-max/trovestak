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
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$IMAGE_TAG"

gcloud builds submit . \
    --config=cloudbuild.yaml \
    --substitutions="_IMAGE=$IMAGE_NAME,_DOCKERFILE=$SERVICE_PATH/Dockerfile" \
    --build-arg "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-arg "NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL"

if [ $? -ne 0 ]; then
    echo "❌ Build failed for $SERVICE_NAME"
    exit 1
fi

# 2. Deploy to Cloud Run
echo "🌍 Deploying to Cloud Run..."
if [ -n "$ENV_VARS" ]; then
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --set-env-vars "$ENV_VARS"
else
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated
fi

if [ $? -eq 0 ]; then
    echo "✅ $SERVICE_NAME is live!"
else
    echo "❌ Deployment failed for $SERVICE_NAME"
    exit 1
fi
