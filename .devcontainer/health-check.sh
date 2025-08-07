#!/bin/bash

echo "🏥 Running comprehensive health check..."

# Check Node.js version
echo "📍 Node.js version: $(node --version)"

# Check npm version  
echo "📍 npm version: $(npm --version)"

# Check wrangler installation
if command -v wrangler >/dev/null 2>&1; then
    echo "✅ Wrangler installed: $(wrangler --version)"
else
    echo "❌ Wrangler not found"
fi

# Check project dependencies
echo "📦 Checking project dependencies..."
npm list --depth=0 2>/dev/null | head -10

# Check port availability
echo "🔌 Checking port availability..."
for port in 8787 8788 8789 3000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is in use"
    else
        echo "✅ Port $port is available"
    fi
done

# Test basic functionality
echo "🧪 Testing basic project functionality..."
if npm run validate >/dev/null 2>&1; then
    echo "✅ Project validation passed"
else
    echo "❌ Project validation failed"
fi

echo "🎉 Health check completed!"
