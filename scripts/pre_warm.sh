#!/usr/bin/env bash
# Verify gcloud auth, project config, and deployed resources are in place.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-assessment-mcaleb808}"
REGION="${REGION:-us-central1}"

echo "==> gcloud auth"
gcloud auth list --filter=status:ACTIVE --format="value(account)"

echo "==> gcloud config"
gcloud config get-value project 2>/dev/null
gcloud config get-value compute/region 2>/dev/null || echo "(no default region)"

echo "==> Cloud Run services"
gcloud run services list --region="${REGION}" --project="${PROJECT_ID}" \
  --format="table(metadata.name, status.url, status.latestReadyRevisionName)"

echo "==> Artifact Registry"
gcloud artifacts repositories describe assessment-repo \
  --location="${REGION}" --project="${PROJECT_ID}" \
  --format="value(name, format)" 2>/dev/null || echo "(no repo)"

echo "==> Secrets"
gcloud secrets list --project="${PROJECT_ID}" --format="value(name)"

echo
echo "If any of the above is missing, run:  make tf-plan && make tf-apply"
