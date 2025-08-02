#!/bin/bash

# Signal Q - Simple Deploy Script
set -e

echo "🚀 Deploying Signal Q to Cloudflare Workers..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

wrangler deploy

echo "✅ Deploy complete!"

if [[ -n "$API_BASE_URL" && -n "$USER_TOKEN" ]]; then
  echo "🧪 Testing deployment..."
  curl -s -H "Authorization: Bearer $USER_TOKEN" "$API_BASE_URL/system/health" | jq .overall
  echo "API base: $API_BASE_URL"
else
  echo "ℹ️  Set API_BASE_URL and USER_TOKEN to run a post-deploy health check"
fi
