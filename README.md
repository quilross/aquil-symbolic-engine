# Signal Q - Live & Ready 🌟

## 🎯 **For CustomGPT**
- **Base URL**: `https://signal_q.catnip-pieces1.workers.dev`
- **Auth**: Bearer `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Schema**: Upload `worker/src/openapi-core.json`

## 🔑 **Your API Tokens**
- **User Token**: `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Admin Token**: `sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1i6o`

## 📁 **Essential Files**
```
/worker/
  ├── src/
  │   ├── index.js           # Your live API (deployed)
  │   └── openapi-core.json  # Upload this to CustomGPT
  └── wrangler.toml          # Cloudflare config
```

**API is live at**: https://signal_q.catnip-pieces1.workers.dev ✨

---

## 🚀 Deployment Automation

This repository includes comprehensive CI/CD automation for reliable deployment:

### Prerequisites
- Node.js 18+
- npm

### 🌟 Zero-Config GitHub Codespaces

This repository provides a **zero-configuration development environment** through GitHub Codespaces. Everything is automatically set up for immediate development with no manual configuration required.

#### 🚀 Instant Setup
1. **Open in Codespaces**: Click the green "Code" button → Codespaces → Create codespace
2. **Automatic Configuration**: The environment sets up automatically (2-3 minutes)
3. **Start Developing**: Everything is ready - begin coding immediately!

#### ✨ Zero-Config Features
- 🤖 **GitHub Copilot Pre-configured** - AI assistance ready out-of-the-box
- 🛠️ **Wrangler CLI Installed** - Cloudflare Workers development tools ready
- 🔌 **MCP Server Integration** - Model Context Protocol server for enhanced development
- 📊 **Active Logging & Tracing** - All API interactions logged for debugging
- 🔧 **VS Code Optimized** - Pre-installed extensions and optimal settings
- 🚀 **Ephemeral Session Support** - Clean initialization every time
- 🎯 **Auto Port Forwarding** - Development ports (8787, 8788, 8789, 3000) ready

#### 🎯 Quick Start Commands
```bash
# Start development immediately
npm run dev

# Run comprehensive tests
npm test

# Validate entire setup
health

# Deploy when ready
npm run deploy
```

#### 📚 Complete Setup Guide
See [📖 Zero-Config Codespaces Guide](.devcontainer/CODESPACES_GUIDE.md) for:
- Detailed feature overview
- Development workflow
- Debugging and monitoring tools
- Troubleshooting guide
- Advanced MCP integration details

#### 🔌 Enhanced Development Tools
- **GitHub Copilot & Chat** - AI-powered development assistance
- **Model Context Protocol Server** - Enhanced AI context on port 3000
- **Comprehensive Logging** - Structured logs in `logs/` directory  
- **Debug Profiles** - Pre-configured VS Code debugging
- **Health Monitoring** - Automated system health checks
- **API Testing Tools** - REST client and automated test runners

#### 🌐 Network & Firewall Considerations
The zero-config environment is designed to work within most corporate firewalls. If you encounter connectivity issues:

**Automatic Workarounds:**
- Local development server mode (bypasses external calls)
- Offline-capable debugging and testing
- Internal MCP server for enhanced development context

**Manual Network Configuration (if needed):**
1. **Domain Allowlist**: Request access to `*.workers.dev` and `*.cloudflare.com`
2. **Local Testing**: Use `npm run dev` for isolated development
3. **VPN/Proxy**: Use approved network tools if organizational policies permit

#### 🛠️ Zero-Config Troubleshooting
Most issues are automatically handled by the zero-config setup. If you encounter problems:

```bash
# Run comprehensive health check
health

# Check setup status
npm run codespaces:check

# View setup logs
cat logs/signal-q.log

# Restart services if needed
.devcontainer/post-start.sh
```

**Common Auto-Fixes:**
- ✅ **Dependency Issues** - Automatically resolved during setup
- ✅ **Port Conflicts** - Automatically detects and uses available ports
- ✅ **Service Startup** - Health checks ensure all services are running
- ✅ **Environment Variables** - Automatically configured for Codespaces

**Manual Intervention Rarely Needed:**
- Check PORTS tab in VS Code if forwarding issues occur
- Reload VS Code window if Copilot needs activation
- Use `health` command to validate all systems

### Quick Start
```bash
# Install dependencies
npm install

# Run validation checks
npm run validate

# Build and validate worker
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

### Available Scripts
- `npm run validate` - Run comprehensive validation checks
- `npm run lint` - Security audit and linting
- `npm run build` - Build validation (dry-run)
- `npm run test` - Run health tests
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run dev` - Start development server
- `npm run codespaces:check` - Check GitHub Codespaces compatibility

### CI/CD Pipeline
The GitHub Actions workflow automatically:
- ✅ Validates npm dependencies and security
- ✅ Checks worker configuration
- ✅ Validates JavaScript syntax
- ✅ Tests deployment configuration
- ✅ Runs OpenAPI sync validation
- ✅ Validates OpenAPI schema for OpenAI custom actions
- ✅ Performs comprehensive project validation

## 🛡️ Security & Validation
- Automated security auditing with `npm audit`
- Wrangler v4 for latest security updates
- Comprehensive deployment validation
- Zero-vulnerability dependency management
