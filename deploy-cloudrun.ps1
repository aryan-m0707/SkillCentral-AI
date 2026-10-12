# ==============================================================================
# SkillCentral — Google Cloud Run Deployment Script (PowerShell)
# ==============================================================================

param(
    [string]$ProjectId = $env:GOOGLE_CLOUD_PROJECT,
    [string]$Region = "us-central1",
    [string]$ServiceName = "skillcentral"
)

if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project 2>$null)
}

if (-not $ProjectId) {
    Write-Error "Error: Google Cloud Project ID is not specified. Run 'gcloud config set project <PROJECT_ID>'."
    exit 1
}

$ImageTag = "gcr.io/$ProjectId/${ServiceName}:latest"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Deploying SkillCentral to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Project:  $ProjectId" -ForegroundColor Cyan
Write-Host " Region:   $Region" -ForegroundColor Cyan
Write-Host " Service:  $ServiceName" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Enable APIs
Write-Host "--> Enabling Google Cloud Services APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com firestore.googleapis.com tasks.googleapis.com --project=$ProjectId

# 2. Build Container
Write-Host "--> Submitting Container Build to Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag $ImageTag --project=$ProjectId

# 3. Deploy Cloud Run
Write-Host "--> Deploying service to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image=$ImageTag `
    --platform=managed `
    --region=$Region `
    --allow-unauthenticated `
    --port=8080 `
    --memory=1Gi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=10 `
    --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$ProjectId" `
    --project=$ProjectId

$ServiceUrl = (gcloud run services describe $ServiceName --platform=managed --region=$Region --format="value(status.url)" --project=$ProjectId)

Write-Host "======================================================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " Cloud Run URL: $ServiceUrl" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
