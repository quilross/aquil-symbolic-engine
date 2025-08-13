#!/usr/bin/env bash
set -euo pipefail

# Signal Q - Simple Deploy Script

echo "🚀 Deploying Signal Q to Cloudflare Workers..."

# Navigate to worker directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure jq is installed
if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq is required but not installed. Install jq and retry."
  exit 1
fi

# Ensure API token is set
if [[ -z "${SIGNALQ_API_TOKEN:-}" ]]; then
  echo "❌ SIGNALQ_API_TOKEN is not set. Export it before deploying."
  exit 1
fi

# Check if logged in
if ! wrangler whoami >/dev/null 2>&1; then
  echo "🔑 Please login first:"
  wrangler login
fi

# Deploy the worker
echo "📦 Deploying worker..."
wrangler deploy

# Test deployment
echo "🧪 Testing deployment..."
curl -s -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  https://signal-q.me/actions/system_health | jq .status

echo "✅ Deploy complete! Your API is live at:"
echo "   https://signal-q.me"
