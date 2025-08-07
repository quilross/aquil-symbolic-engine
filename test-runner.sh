#!/bin/bash

# Test runner for Signal Q Worker
# Starts local dev server, runs tests, then cleans up
# Supports both local development and GitHub Codespaces

echo "🚀 Starting Signal Q Worker Test Suite"

# Detect environment
if [ -n "$CODESPACES" ] || [ -n "$CODESPACES_ENV" ]; then
    echo "🌐 GitHub Codespaces environment detected"
    ENVIRONMENT="codespaces"
else
    echo "💻 Local development environment detected"
    ENVIRONMENT="local"
fi

# Kill any existing wrangler processes
pkill -f wrangler 2>/dev/null || true
sleep 2

# Find an available port
TEST_PORT=8788
while lsof -Pi :$TEST_PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    TEST_PORT=$((TEST_PORT + 1))
done

echo "📡 Using port $TEST_PORT for development server..."

# Codespaces-specific setup
if [ "$ENVIRONMENT" = "codespaces" ]; then
    echo "🔧 Applying Codespaces configuration..."
    # Set environment variable for Codespaces compatibility
    export WRANGLER_LOG=info
    export CLOUDFLARE_API_TOKEN_REQUIRED=false
fi

# Start wrangler dev in background
cd worker
npx wrangler dev src/index.js --local --port $TEST_PORT > wrangler.log 2>&1 &
DEV_PID=$!

# Wait for server to start and check logs
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if grep -q "Ready on http://localhost:$TEST_PORT" wrangler.log 2>/dev/null; then
        if [ "$ENVIRONMENT" = "codespaces" ]; then
            echo "✅ Development server running on http://localhost:$TEST_PORT"
            echo "🌐 In Codespaces, the port should be auto-forwarded"
            echo "🔗 Check the PORTS tab in VS Code for the forwarded URL"
        else
            echo "✅ Development server running on http://localhost:$TEST_PORT"
        fi
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Failed to start development server within 30 seconds"
        echo "📄 Server logs:"
        cat wrangler.log 2>/dev/null
        if [ "$ENVIRONMENT" = "codespaces" ]; then
            echo ""
            echo "🔧 Codespaces Troubleshooting:"
            echo "   • Check if port $TEST_PORT is being forwarded in the PORTS tab"
            echo "   • Ensure firewall allows access to *.workers.dev domains"
            echo "   • Try running 'npm run dev:fallback' manually for firewall-safe development"
        fi
        kill $DEV_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Run tests
echo "🧪 Running tests..."
TEST_BASE_URL=http://localhost:$TEST_PORT node health-test.js
TEST_RESULT=$?

# Cleanup
echo "🧹 Cleaning up..."
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
rm -f wrangler.log

if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi