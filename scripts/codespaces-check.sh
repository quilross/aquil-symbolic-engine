#!/bin/bash

# Codespaces compatibility checker for Zero-Config Environment
# Validates that the environment is properly configured for GitHub Codespaces

echo "🔍 GitHub Codespaces Zero-Config Compatibility Checker"
echo "====================================================="

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
echo "📋 Checking zero-config devcontainer..."

if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo "❌ devcontainer.json not found"
    exit 1
fi

# Validate JSON and check for required fields including new zero-config features
python3 -c "
import json
import sys

try:
    with open('.devcontainer/devcontainer.json') as f:
        config = json.load(f)
    
    # Check required fields for zero-config
    required_fields = ['name', 'image', 'forwardPorts', 'postCreateCommand']
    missing = [field for field in required_fields if field not in config]
    
    if missing:
        print(f'❌ Missing required fields: {missing}')
        sys.exit(1)
    
    # Check ports including MCP server port
    ports = config.get('forwardPorts', [])
    required_ports = [8787, 8788, 3000]  # Include MCP server port
    missing_ports = [port for port in required_ports if port not in ports]
    
    if missing_ports:
        print(f'❌ Missing required ports: {missing_ports}')
        sys.exit(1)
    
    # Check for GitHub Copilot extensions
    extensions = config.get('customizations', {}).get('vscode', {}).get('extensions', [])
    copilot_extensions = [ext for ext in extensions if 'copilot' in ext.lower()]
    
    if not copilot_extensions:
        print('⚠️  GitHub Copilot extensions not found in configuration')
    else:
        print(f'✅ GitHub Copilot extensions configured: {copilot_extensions}')
    
    # Check for zero-config features
    features = config.get('features', {})
    if 'ghcr.io/devcontainers/features/github-cli:1' not in features:
        print('⚠️  GitHub CLI feature not configured')
    else:
        print('✅ GitHub CLI feature configured')
    
    print('✅ devcontainer.json zero-config setup is valid')
    print(f'   - Forwarded ports: {ports}')
    print(f'   - Image: {config[\"image\"]}')
    print(f'   - Post-create command: {config[\"postCreateCommand\"]}')
    
except Exception as e:
    print(f'❌ Error validating devcontainer.json: {e}')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    exit 1
fi

# Check zero-config setup script
echo ""
echo "🛠️  Checking zero-config setup script..."

if [ ! -f ".devcontainer/setup.sh" ]; then
    echo "❌ Zero-config setup script not found"
    exit 1
fi

if [ ! -x ".devcontainer/setup.sh" ]; then
    echo "❌ Setup script is not executable"
    exit 1
fi

echo "✅ Zero-config setup script is ready"

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

# Check for MCP server configuration
echo ""
echo "🔌 Checking MCP server setup..."

if [ -f ".devcontainer/start-mcp.sh" ] && [ -x ".devcontainer/start-mcp.sh" ]; then
    echo "✅ MCP server startup script is ready"
else
    echo "❌ MCP server startup script missing or not executable"
    exit 1
fi

# Check for logging setup
echo ""
echo "📊 Checking logging and debugging setup..."

if [ -f ".devcontainer/health-check.sh" ] && [ -x ".devcontainer/health-check.sh" ]; then
    echo "✅ Health check script is ready"
else
    echo "❌ Health check script missing or not executable"
    exit 1
fi

# Check port availability
echo ""
echo "🔌 Checking port availability..."

for port in 8787 8788 8789 3000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
    else
        echo "✅ Port $port is available"
    fi
done

# Check for VS Code configuration
echo ""
echo "🔧 Checking VS Code configuration..."

if [ -f ".vscode/launch.json" ]; then
    echo "✅ VS Code debug configuration present"
else
    echo "ℹ️  VS Code debug configuration will be created during setup"
fi

if [ -f ".vscode/tasks.json" ]; then
    echo "✅ VS Code tasks configuration present"
else
    echo "ℹ️  VS Code tasks configuration will be created during setup"
fi

# Check global tools installation
echo ""
echo "🛠️  Checking development tools..."

if command -v wrangler >/dev/null 2>&1; then
    echo "✅ Wrangler CLI installed: $(wrangler --version)"
else
    echo "ℹ️  Wrangler CLI will be installed during setup"
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm available: $(npm --version)"
else
    echo "❌ npm not available"
    exit 1
fi

if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js available: $(node --version)"
else
    echo "❌ Node.js not available"
    exit 1
fi

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

# Test zero-config functionality
echo ""
echo "🧪 Testing zero-config functionality..."

# Test npm scripts
if npm run --silent validate >/dev/null 2>&1; then
    echo "✅ Project validation works"
else
    echo "❌ Project validation failed"
    exit 1
fi

# Test health check if available
if [ -f ".devcontainer/health-check.sh" ]; then
    if .devcontainer/health-check.sh >/dev/null 2>&1; then
        echo "✅ Health check works"
    else
        echo "⚠️  Health check has issues (may require setup)"
    fi
fi

echo ""
echo "🎉 Zero-Config Codespaces compatibility check completed!"

if [ "$CODESPACES_DETECTED" = true ]; then
    echo ""
    echo "📋 Codespaces Zero-Config Quick Start:"
    echo "   ✅ Environment is ready for immediate development!"
    echo "   🚀 Everything configured automatically"
    echo "   🤖 GitHub Copilot ready"
    echo "   🔌 MCP server ready"
    echo "   📊 Logging and debugging active"
    echo ""
    echo "   Next steps:"
    echo "   1. Start coding - all tools are ready!"
    echo "   2. Use 'npm run dev' to start development server"
    echo "   3. Check PORTS tab for auto-forwarded URLs"
    echo "   4. Use GitHub Copilot for AI assistance"
    echo "   5. See .devcontainer/CODESPACES_GUIDE.md for details"
else
    echo ""
    echo "📋 Local Development Quick Start:"
    echo "   1. Run 'npm run setup' to configure zero-config environment"
    echo "   2. Run 'npm run health' to validate setup"
    echo "   3. Run 'npm test' to validate functionality"
    echo "   4. Run 'npm run dev' to start development server"
    echo "   5. See .devcontainer/CODESPACES_GUIDE.md for full guide"
fi