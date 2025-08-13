#!/bin/bash

# Zero-Config Codespaces Setup Script
# Automatically configures the development environment for immediate use

set -e

echo "🚀 Starting Zero-Config Codespaces Setup"
echo "========================================"

# Check if we're in Codespaces
if [ -n "$CODESPACES" ] || [ -n "$CODESPACES_ENV" ]; then
    echo "✅ Running in GitHub Codespaces environment"
    ENVIRONMENT="codespaces"
else
    echo "✅ Running in local development environment"
    ENVIRONMENT="local"
fi

# Install dependencies
echo ""
echo "📦 Installing project dependencies..."
npm ci

# Install global tools
echo ""
echo "🛠️  Installing global development tools..."

# Install wrangler globally for easier access
npm install -g wrangler@latest

# Install additional debugging tools
npm install -g @cloudflare/workers-types

# Install MCP tools if available
if command -v npm >/dev/null 2>&1; then
    echo "🔌 Setting up Model Context Protocol (MCP) server..."
    
    # Create MCP configuration directory
    mkdir -p ~/.mcp/servers
    
    # Create basic MCP server configuration
    cat > ~/.mcp/servers/signal-q.json << 'EOF'
{
  "name": "signal-q-mcp",
  "description": "Signal Q API MCP Server for enhanced development",
  "version": "1.0.0",
  "endpoint": "http://localhost:3000",
  "capabilities": [
    "logging",
    "tracing", 
    "debugging",
    "api-testing"
  ],
  "autoStart": true
}
EOF

    echo "✅ MCP server configuration created"
fi

# Set up logging and debugging
echo ""
echo "📊 Configuring logging and tracing..."

# Create logs directory
mkdir -p logs
touch logs/signal-q.log
touch logs/debug.log
touch logs/api-requests.log

# Create debugging configuration
mkdir -p .vscode
cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Wrangler Dev",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/node_modules/.bin/wrangler",
            "args": ["dev", "worker/src/index.js", "--local", "--port", "8787"],
            "cwd": "${workspaceFolder}",
            "env": {
                "WRANGLER_LOG": "debug",
                "DEBUG": "signal-q:*"
            },
            "console": "integratedTerminal",
            "outputCapture": "std"
        },
        {
            "name": "Debug Tests",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/worker/health-test.js",
            "env": {
                "TEST_BASE_URL": "http://localhost:8787",
                "DEBUG": "signal-q:*"
            },
            "console": "integratedTerminal"
        }
    ]
}
EOF

# Create VS Code tasks for common operations
mkdir -p .vscode
cat > .vscode/tasks.json << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Development Server",
            "type": "shell",
            "command": "npm run dev",
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            },
            "problemMatcher": []
        },
        {
            "label": "Run Tests",
            "type": "shell",
            "command": "npm test",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            }
        },
        {
            "label": "Deploy to Production",
            "type": "shell",
            "command": "npm run deploy",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": true,
                "panel": "new"
            }
        },
        {
            "label": "Start MCP Server",
            "type": "shell",
            "command": ".devcontainer/start-mcp.sh",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "silent",
                "focus": false,
                "panel": "new"
            }
        }
    ]
}
EOF

# Create VS Code settings for enhanced development
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
    "github.copilot.enable": {
        "*": true,
        "yaml": true,
        "plaintext": true,
        "markdown": true,
        "javascript": true,
        "typescript": true,
        "json": true
    },
    "editor.inlineSuggest.enabled": true,
    "editor.suggest.preview": true,
    "files.associations": {
        "*.toml": "toml",
        "wrangler.toml": "toml"
    },
    "emmet.includeLanguages": {
        "javascript": "javascriptreact"
    },
    "terminal.integrated.env.linux": {
        "WRANGLER_LOG": "info",
        "DEBUG": "signal-q:*",
        "NODE_ENV": "development"
    }
}
EOF

# Create debugging scripts
echo ""
echo "🔧 Creating debugging and utility scripts..."

# Create a comprehensive health check script
cat > .devcontainer/health-check.sh << 'EOF'
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
EOF

chmod +x .devcontainer/health-check.sh

# Create post-start script for services
cat > .devcontainer/post-start.sh << 'EOF'
#!/bin/bash

echo "🌟 Post-start initialization..."

# Start MCP server in background if enabled
if [ "$MCP_SERVER_ENABLED" = "true" ]; then
    echo "🔌 Starting MCP server..."
    .devcontainer/start-mcp.sh &
fi

# Create helpful aliases
echo "🔗 Setting up helpful aliases..."
echo 'alias wdev="cd worker && wrangler dev src/index.js --local"' >> ~/.bashrc
echo 'alias wdeploy="cd worker && wrangler deploy"' >> ~/.bashrc
echo 'alias logs="tail -f logs/*.log"' >> ~/.bashrc
echo 'alias health="npm run validate && .devcontainer/health-check.sh"' >> ~/.bashrc

# Display helpful information
echo ""
echo "🎯 Zero-Config Environment Ready!"
echo "=================================="
echo "• GitHub Copilot: ✅ Enabled"
echo "• Wrangler CLI: ✅ Installed globally"
echo "• Debugging Tools: ✅ Configured" 
echo "• MCP Server: ✅ Configured"
echo "• Logging: ✅ Active"
echo ""
echo "📚 Quick Commands:"
echo "  npm run dev      - Start development server"
echo "  npm test         - Run tests"
echo "  npm run deploy   - Deploy to production"
echo "  health           - Run health check"
echo "  wdev             - Quick wrangler dev"
echo ""
echo "🔗 Open the Command Palette (Ctrl+Shift+P) and try:"
echo "  'GitHub Copilot: Generate Tests'"
echo "  'Tasks: Run Task' to see available tasks"
EOF

chmod +x .devcontainer/post-start.sh

# Create MCP server startup script
cat > .devcontainer/start-mcp.sh << 'EOF'
#!/bin/bash

echo "🔌 Starting MCP Server for Signal Q API..."

# Simple MCP server implementation
cat > /tmp/mcp-server.js << 'MCPEOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const MCP_PORT = 3000;
const LOG_FILE = path.join(process.cwd(), 'logs', 'mcp-server.log');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry);
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    log(`${req.method} ${req.url} - ${req.headers['user-agent'] || 'Unknown'}`);

    if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Signal Q MCP Server'
        }));
        return;
    }

    if (req.url === '/logs') {
        try {
            const logs = fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-50);
            res.writeHead(200);
            res.end(JSON.stringify({ logs }));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Unable to read logs' }));
        }
        return;
    }

    // Default response
    res.writeHead(200);
    res.end(JSON.stringify({
        message: 'Signal Q MCP Server',
        endpoints: ['/health', '/logs'],
        timestamp: new Date().toISOString()
    }));
});

server.listen(MCP_PORT, () => {
    log(`MCP Server listening on port ${MCP_PORT}`);
});

process.on('SIGTERM', () => {
    log('MCP Server shutting down...');
    server.close();
});
MCPEOF

# Start the MCP server
nohup node /tmp/mcp-server.js > /dev/null 2>&1 &
echo $! > /tmp/mcp-server.pid

echo "✅ MCP Server started on port 3000"
EOF

chmod +x .devcontainer/start-mcp.sh

# Validate installation
echo ""
echo "✅ Running validation checks..."
npm run validate

# Run health check
.devcontainer/health-check.sh

echo ""
echo "🎉 Zero-Config Codespaces Setup Complete!"
echo "========================================="
echo ""
echo "🌟 Your development environment is ready!"
echo "• All dependencies installed"
echo "• Development tools configured"  
echo "• Debugging capabilities enabled"
echo "• MCP server ready"
echo "• GitHub Copilot activated"
echo ""
echo "🚀 Start developing with: npm run dev"