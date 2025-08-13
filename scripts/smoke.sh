#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:8787}"
TOKEN="${TOKEN:-signalhaven-demo-token}"

say() { echo "[smoke] $*"; }

say "GET /version"
curl -fsS "$BASE_URL/version" | jq . >/dev/null 2>&1 || true

say "POST /actions/echo"
curl -fsS -X POST "$BASE_URL/actions/echo" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"message":"ping"}' >/dev/null

say "POST /actions/system_health"
curl -fsS -X POST "$BASE_URL/actions/system_health" \
  -H "authorization: Bearer $TOKEN" >/dev/null

say "POST /actions/log_memory"
curl -fsS -X POST "$BASE_URL/actions/log_memory" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"payload":{"note":"hello"}}' >/dev/null

say "OK"
