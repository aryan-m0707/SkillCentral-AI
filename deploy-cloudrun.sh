#!/usr/bin/env bash
# ==============================================================================
# SkillCentral — Google Cloud Run Deployment Script
# Automates Google Cloud Build, Artifact Registry, and Cloud Run service creation
# ==============================================================================

set -euo pipefail

# Configuration Defaults (replace or override via environment variables)
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="skillcentral"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "======================================================================"
echo " Deploying SkillCentral to Google Cloud Run"
echo " Project:  ${PROJECT_ID}"
echo " Region:   ${REGION}"
echo " Service:  ${SERVICE_NAME}"
echo "======================================================================"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Error: GOOGLE_CLOUD_PROJECT is not set and no default gcloud project found."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

# Enable required Google Cloud APIs
echo "--> Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  tasks.googleapis.com \
  --project="${PROJECT_ID}"

# Build and Push container image using Google Cloud Build
echo "--> Building container image with Google Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" --project="${PROJECT_ID}"

# Deploy to Google Cloud Run
echo "--> Deploying to Google Cloud Run service..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --platform=managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --project="${PROJECT_ID}"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --format='value(status.url)' --project="${PROJECT_ID}")

echo "======================================================================"
echo " Successfully Deployed SkillCentral!"
echo " Service URL: ${SERVICE_URL}"
echo "======================================================================"
