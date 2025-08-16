#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://signal-q.me}"
TOKEN="${API_TOKEN:-}"

echo "Health"
curl -sSf "$BASE/system/health" | jq .

echo "Version"
curl -sSf "$BASE/version" | jq .

echo "Spec"
curl -sSf "$BASE/openapi.yaml" > /dev/null

echo "Actions list"
curl -sSf -H "Authorization: Bearer $TOKEN" "$BASE/actions/list" | jq .

echo "Chat (protected)"
curl -sSf -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -d '{"user":"aquil","prompt":"ping"}' \
  "$BASE/actions/chat" | jq .
