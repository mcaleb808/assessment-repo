#!/usr/bin/env bash
# Smoke-test a deployed API URL against the chat endpoint.
# Usage: bash scripts/smoke.sh https://assessment-api-xxxx.run.app
set -euo pipefail

URL="${1:-${API_URL:-http://localhost:8000}}"
PROMPT="${PROMPT:-Do you have any monitors in stock? Just list a couple.}"

echo "==> GET ${URL}/health"
curl -sSf "${URL}/health" | python3 -m json.tool || true
echo

echo "==> POST ${URL}/agent/chat"
PAYLOAD=$(python3 -c "import json,os;print(json.dumps({'messages':[{'role':'user','content':os.environ['PROMPT']}]}))")
RESPONSE=$(PROMPT="${PROMPT}" curl -sS -o /tmp/smoke-body.json -w "%{http_code}" \
  -H 'content-type: application/json' \
  -d "${PAYLOAD}" \
  "${URL}/agent/chat")
echo "status: ${RESPONSE}"
cat /tmp/smoke-body.json | python3 -m json.tool 2>/dev/null || cat /tmp/smoke-body.json
echo
