#!/usr/bin/env bash
# Smoke-test a deployed API URL.
# Usage: bash scripts/smoke.sh https://assessment-api-xxxx.run.app
set -euo pipefail

URL="${1:-${API_URL:-http://localhost:8000}}"
PROMPT="${PROMPT:-Hello, what tools do you have?}"

echo "==> GET ${URL}/health"
curl -sSf "${URL}/health" | python3 -m json.tool || true
echo

echo "==> POST ${URL}/agent/run"
RESPONSE=$(curl -sS -o /tmp/smoke-body.json -w "%{http_code}" \
  -H 'content-type: application/json' \
  -d "{\"prompt\":\"${PROMPT}\"}" \
  "${URL}/agent/run")
echo "status: ${RESPONSE}"
cat /tmp/smoke-body.json | python3 -m json.tool 2>/dev/null || cat /tmp/smoke-body.json
echo
