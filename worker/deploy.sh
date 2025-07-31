#!/bin/bash

echo "🚀 Deploying Signal Q Transcendence Agent..."
echo "────────────────────────────────────────────"

# Check if wrangler is authenticated
if ! wrangler whoami > /dev/null 2>&1; then
    echo "❌ Not logged into Cloudflare. Run: wrangler login"
    exit 1
fi

# Validate configuration
echo "📋 Validating configuration..."
if ! wrangler deploy --dry-run; then
    echo "❌ Configuration validation failed"
    exit 1
fi

# Deploy
echo "🌐 Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo "🔗 Your API is available at: https://signal_q.workers.dev"
echo ""
echo "🔧 Next steps:"
echo "  1. Update KV namespace ID in wrangler.toml"
echo "  2. Change API tokens from 'changeme' to secure values"
echo "  3. Test endpoints at https://signal_q.workers.dev"
echo ""
