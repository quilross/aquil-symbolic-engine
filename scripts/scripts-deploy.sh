#!/bin/bash

# Aquil Symbolic Engine Deployment Script
# Automates the complete deployment process to Cloudflare

set -e

echo "🌱 Aquil Symbolic Engine - Deployment Script"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Cloudflare is authenticated
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami > /dev/null 2>&1; then
    echo "❌ Error: Not authenticated with Cloudflare."
    echo "Please run one of the following:"
    echo "  wrangler login --browser=false"
    echo "  export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

echo "✅ Cloudflare authentication confirmed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if resources exist, create if needed
echo "🏗️  Checking Cloudflare resources..."

# Check if D1 database exists
if ! wrangler d1 list | grep -q "aquil-wisdom-db"; then
    echo "📊 Creating D1 database..."
    wrangler d1 create aquil-wisdom-db
    echo "⚠️  Please update wrangler.toml with the database_id shown above and re-run this script"
    exit 1
fi

# Check if KV namespace exists
if ! wrangler kv:namespace list | grep -q "AQUIL_MEMORIES"; then
    echo "💾 Creating KV namespace..."
    wrangler kv:namespace create "AQUIL_MEMORIES"
    wrangler kv:namespace create "AQUIL_MEMORIES" --preview
    echo "⚠️  Please update wrangler.toml with the KV namespace IDs shown above and re-run this script"
    exit 1
fi

# Initialize database if not already done
echo "🗄️  Initializing database schema..."
wrangler d1 execute AQUIL_DB --file=schema.sql --env production || echo "⚠️  Database may already be initialized"

# Deploy to Cloudflare
echo "🚀 Deploying to Cloudflare Workers..."
npm run deploy

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "✅ Your Aquil Symbolic Engine is now live at:"
echo "   https://signal-q.me"
echo ""
echo "🧪 Test your deployment:"
echo "   curl https://signal-q.me/api/health"
echo ""
echo "🤖 Next Steps:"
echo "   1. Test all endpoints using: ./scripts/test-endpoints.sh"
echo "   2. Create your ChatGPT GPT using gpt-actions-schema.json"
echo "   3. Start your first session: 'Aquil, let's do a trust check-in'"
echo ""
echo "🌟 Welcome to your personal AI wisdom companion!"
echo ""