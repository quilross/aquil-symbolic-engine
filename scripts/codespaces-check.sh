#!/bin/bash

# Codespaces compatibility checker
# Validates that the environment is properly configured for GitHub Codespaces

echo "🔍 GitHub Codespaces Compatibility Checker"
echo "============================================"

# Check if we're in Codespaces
if [ -n "$CODESPACES" ] || [ -n "$CODESPACES_ENV" ]; then
    echo "✅ Running in GitHub Codespaces environment"
    CODESPACES_DETECTED=true
else
    echo "ℹ️  Not in Codespaces (testing compatibility)"
    CODESPACES_DETECTED=false
fi

# Check devcontainer configuration
echo ""
echo "📋 Checking devcontainer configuration..."

if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo "❌ devcontainer.json not found"
    exit 1
fi

# Validate JSON and check for required fields
python3 -c "
import json
import sys

try:
    with open('.devcontainer/devcontainer.json') as f:
        config = json.load(f)
    
    # Check required fields
    required_fields = ['name', 'image', 'forwardPorts']
    missing = [field for field in required_fields if field not in config]
    
    if missing:
        print(f'❌ Missing required fields: {missing}')
        sys.exit(1)
    
    # Check ports
    ports = config.get('forwardPorts', [])
    required_ports = [8787, 8788]
    missing_ports = [port for port in required_ports if port not in ports]
    
    if missing_ports:
        print(f'❌ Missing required ports: {missing_ports}')
        sys.exit(1)
    
    print('✅ devcontainer.json configuration is valid')
    print(f'   - Forwarded ports: {ports}')
    print(f'   - Image: {config[\"image\"]}')
    
except Exception as e:
    print(f'❌ Error validating devcontainer.json: {e}')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    exit 1
fi

# Check test runner Codespaces support
echo ""
echo "🧪 Checking test runner Codespaces support..."

if ! grep -q "CODESPACES" test-runner.sh; then
    echo "❌ test-runner.sh missing Codespaces detection"
    exit 1
fi

if ! grep -q "GitHub Codespaces environment detected" test-runner.sh; then
    echo "❌ test-runner.sh missing Codespaces messaging"
    exit 1
fi

echo "✅ test-runner.sh has Codespaces support"

# Check port availability
echo ""
echo "🔌 Checking port availability..."

for port in 8787 8788 8789; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
    else
        echo "✅ Port $port is available"
    fi
done

# Network connectivity test (only if not in Codespaces)
if [ "$CODESPACES_DETECTED" = false ]; then
    echo ""
    echo "🌐 Testing network connectivity..."
    
    # Test Cloudflare connectivity
    if curl -s --connect-timeout 5 https://workers.cloudflare.com >/dev/null; then
        echo "✅ Cloudflare Workers connectivity OK"
    else
        echo "⚠️  Cloudflare Workers connectivity issue (may be firewall-related)"
    fi
fi

echo ""
echo "🎉 Codespaces compatibility check completed!"

if [ "$CODESPACES_DETECTED" = true ]; then
    echo ""
    echo "📋 Codespaces Quick Start:"
    echo "   1. Run 'npm test' to validate the setup"
    echo "   2. Run 'npm run dev' to start development server"
    echo "   3. Check PORTS tab for auto-forwarded URLs"
    echo "   4. See README.md for firewall troubleshooting if needed"
fi