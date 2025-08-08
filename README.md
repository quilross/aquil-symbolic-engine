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

**🔥 NEW: Firewall-Safe Automation** - Automatic fallback to local development when Cloudflare endpoints are unreachable. Use `npm run dev:fallback` for zero-config development in restrictive networks.

## 🚀 Codespaces Quickstart

Get Signal Q running in GitHub Codespaces in under 2 minutes:

### Prerequisites
- GitHub Codespaces environment (this is detected automatically)
- Or local machine with Node.js 18+

### Quick Start
```bash
# 1. Install dependencies (automatically done in Codespaces)
npm ci

# 2. Start development server
npx wrangler dev

# Note the printed URL (usually http://127.0.0.1:8787)
# Wrangler will print the actual URL - use that instead of assuming port 8788

# 3. Set up environment variables for testing
export SIGNALQ_API_TOKEN=sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h

# 4. Test the endpoints
curl http://127.0.0.1:8787/version
curl -H "Authorization: Bearer $SIGNALQ_API_TOKEN" http://127.0.0.1:8787/system/health
```

### Production Smoke Test
```bash
# Set production environment
export SIGNALQ_BASE_URL=https://signal_q.catnip-pieces1.workers.dev
export SIGNALQ_API_TOKEN=sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h

# Deploy to production
npx wrangler deploy

# Run smoke tests
./scripts/smoke.sh

# Or use Node.js version
node scripts/smoke.js
```

### Troubleshooting

**If you get 404 errors:**
- Verify the exact route path (`/system/health` vs `/health`)
- Check that the development server URL is correct (use the URL printed by `wrangler dev`)

**If you get 401/403 errors:**
- Ensure you're using the correct Authorization header: `"Authorization: Bearer $SIGNALQ_API_TOKEN"`
- For admin endpoints, use `$SIGNALQ_ADMIN_TOKEN` instead
- Verify your token starts with `sq_live_` (user) or `sq_admin_` (admin)

**If development server fails to start:**
- Don't assume port 8788 - read the actual URL/port printed by Wrangler
- Check for port conflicts or use `--port` flag to specify a different port

**If production deployment errors:**
- Run `npx wrangler tail` in a second terminal for real-time logs
- Check the tail output when retrying your curl commands
- Ensure you have proper Cloudflare credentials configured

---

## 🌐 Firewall/Network Requirements

For full automation, deployment, and CI/Codespaces operation, ensure the following endpoints are reachable through your network/firewall:

### Required Endpoints
- **sparrow.cloudflare.com** - Cloudflare API endpoint
- **workers.cloudflare.com** - Workers platform endpoint  
- **registry.npmjs.org** - npm package registry
- **signal_q.catnip-pieces1.workers.dev** - Production API endpoint

### Network Restrictions & Fallbacks
If these endpoints are blocked, the repository includes intelligent automation:
- **Automatic Detection**: Scripts test connectivity and adapt automatically
- **Local Fallback**: Use `npm run dev:fallback` for zero-config development in restrictive networks
- **Offline Capability**: Full local development server with simulated bindings

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

2. **Port Forwarding**: Ports 8787-8789 are automatically forwarded for development
3. **Environment Ready**: Dependencies are installed via `npm ci` during container setup
4. **Compatibility Check**: Run `npm run codespaces:check` to validate setup

#### Codespaces-Specific Features
- ✅ **Auto Port Forwarding**: Development ports (8787, 8788, 8789) are automatically exposed
- ✅ **Environment Detection**: Test runner automatically detects Codespaces environment
- ✅ **VS Code Extensions**: ESLint, JSON support, and Tailwind CSS extensions pre-installed  
- ✅ **GitHub CLI**: Pre-installed for repository management
- ✅ **Firewall-Safe Automation**: Automatic fallback to local development when Cloudflare endpoints are unreachable

#### Firewall-Safe Development & Automation

The repository includes intelligent firewall-safe automation that automatically detects network restrictions and adapts accordingly:

**🔄 Automatic Fallback Logic**
- **Connectivity Detection**: Automatically tests connectivity to `sparrow.cloudflare.com` and `workers.cloudflare.com`
- **Smart Fallback**: If Cloudflare endpoints are unreachable, automatically switches to local development mode
- **Zero Configuration**: Works out-of-the-box in restrictive network environments

**📡 Development Server Options**
```bash
# Automatic fallback (recommended for Codespaces)
npm run dev:fallback

# Manual cloud development (requires Cloudflare connectivity)
npm run dev

# Force local development 
cd worker && wrangler dev --local --port 8788
```

**🌐 Network Configuration**
See the [Firewall/Network Requirements](#-firewallnetwork-requirements) section above for required endpoint allowlisting.

#### Firewall & Network Considerations
When using Codespaces, you may encounter firewall restrictions that block access to:
- `signal_q.catnip-pieces1.workers.dev`
- `workers.cloudflare.com`
- Other Cloudflare Worker domains

**Automated Solutions:**
1. **Fallback Script**: Use `npm run dev:fallback` - automatically detects connectivity issues and falls back to local mode
2. **Local Development**: Fully functional local development server with simulated bindings
3. **Environment Detection**: Scripts automatically adapt behavior based on network connectivity

**Manual Workaround Options:**
1. **Request Domain Allowlist**: Ask your network administrator to allowlist the domains listed above
2. **VPN/Proxy**: Use a VPN or proxy service if organizational policies permit

#### Codespaces Troubleshooting
- **Port Access**: Check the PORTS tab in VS Code for forwarded URLs
- **Logs**: Run `npm run dev` manually to see detailed wrangler logs
- **Network Issues**: See firewall considerations above

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
1. **Domain Allowlist**: See [Firewall/Network Requirements](#-firewallnetwork-requirements) for required endpoints
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
- `npm run dev` - Start development server (cloud mode)
- `npm run dev:fallback` - Start development server with automatic firewall-safe fallback
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

## 🔧 Automation & Fallback Mechanisms

This repository includes intelligent automation for firewall-safe development:

### Wrangler Fallback Script (`scripts/wrangler-fallback.js`)
- **Connectivity Testing**: Automatically tests access to `sparrow.cloudflare.com` and `workers.cloudflare.com`
- **Intelligent Fallback**: Falls back to local development mode when Cloudflare endpoints are unreachable
- **Zero Configuration**: Works automatically in restrictive network environments
- **Usage**: `npm run dev:fallback` or `node scripts/wrangler-fallback.js dev`

### Codespaces Integration
- **PostCreateCommand**: Automatically runs `npm ci` and notifies about firewall-safe development
- **Port Forwarding**: Pre-configured for development ports (8787, 8788, 8789)
- **Environment Detection**: Automatically adapts to Codespaces environment
