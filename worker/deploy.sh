#!/bin/bash

echo "🚀 Deploying Signal Q Transcendence Agent..."
echo "────────────────────────────────────────────"

# Check if wrangler is authenticated
if ! npx wrangler whoami > /dev/null 2>&1; then
    echo "❌ Not logged into Cloudflare. Run: npx wrangler login"
    exit 1
fi

# Validate configuration
echo "📋 Validating configuration..."
if ! npx wrangler deploy --dry-run; then
    echo "❌ Configuration validation failed"
    exit 1
fi

# Check for KV namespace configuration
echo "🗄️  Checking KV namespace..."
if grep -q "# \[\[kv_namespaces\]\]" wrangler.toml; then
    echo "⚠️  KV namespace is commented out - deployment will use fallback storage"
    echo "   For production, create KV namespace with: npx wrangler kv:namespace create SIGNAL_KV"
    echo "   Then uncomment and update the KV configuration in wrangler.toml"
fi

# Deploy
echo "🌐 Deploying to Cloudflare Workers..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment complete!"
    echo "🔗 Your API is available at: https://signal_q.workers.dev"
    echo ""
    echo "🔧 Next steps:"
    echo "  1. Test the API: curl -H 'Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h' https://signal_q.workers.dev/system/health"
    echo "  2. Upload worker/src/openapi.json to CustomGPT"
    echo "  3. For production: Configure KV namespace in wrangler.toml"
    echo ""
    echo "🧪 Run integration tests:"
    echo "  cd .. && node test-system.js"
else
    echo "❌ Deployment failed"
    exit 1
fi
