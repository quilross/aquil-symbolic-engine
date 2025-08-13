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
