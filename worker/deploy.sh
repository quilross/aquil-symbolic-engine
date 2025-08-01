#!/bin/bash

# Signal Q - Simple Deploy Script
echo "🚀 Deploying Signal Q to Cloudflare Workers..."

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
curl -s -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
     https://signal_q.catnip-pieces1.workers.dev/system/health | jq .overall

echo "✅ Deploy complete! Your API is live at:"
echo "   https://signal_q.catnip-pieces1.workers.dev"
