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
