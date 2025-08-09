# Signal Q - Live & Ready 🌟

## 🎯 **For CustomGPT**
- **Primary URL**: `https://signal-q.example.com` (custom domain)
- **Fallback URL**: `https://signal_q.catnip-pieces1.workers.dev` (workers.dev)
- **Auth**: Bearer `$SIGNALQ_API_TOKEN`
- **Schema**: Upload `worker/src/openapi-core.json`

## 🔑 **Your API Tokens**
- **User Token**: `$SIGNALQ_API_TOKEN`
- **Admin Token**: `$SIGNALQ_ADMIN_TOKEN`

## 📁 **Essential Files**
```
/worker/
  ├── src/
  │   ├── index.js           # Your live API (deployed)
  │   └── openapi-core.json  # Upload this to CustomGPT
  └── wrangler.toml          # Cloudflare config
```

**Primary API**: https://signal-q.example.com ✨
**Fallback API**: https://signal_q.catnip-pieces1.workers.dev ✨

**🔥 NEW: Firewall-Safe Automation** - Automatic fallback to local development when Cloudflare endpoints are unreachable. Use `npm run dev:fallback` for zero-config development in restrictive networks.

## 🚀 Codespaces Quickstart

Get Signal Q running in GitHub Codespaces in under 2 minutes:

```bash
# 1. Install dependencies
npm ci

# 2. Start development server  
npx wrangler dev
# Note the printed URL (defaults to http://127.0.0.1:8787)

# 3. Set environment variables for testing (in a new terminal)
export DEV_BASE="http://127.0.0.1:8787"  # Use the printed URL
export SIGNALQ_API_TOKEN="dev-placeholder"

# 4. Test the public version endpoint (no auth required)
curl "$DEV_BASE/version"

# 5. Test the authenticated health endpoint (requires Bearer auth)
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" "$DEV_BASE/actions/system_health"
```

**Note**: Always use the printed URL from wrangler dev output (defaults to http://127.0.0.1:8787).

## 📦 SDK Usage

Use the JavaScript SDK for easier API interaction:

```javascript
const SignalQClient = require('./sdk/signal-q-client.js');

const client = new SignalQClient({
  baseUrl: 'https://signal-q.example.com', // Primary custom domain
  // Fallback: 'https://signal_q.catnip-pieces1.workers.dev',
  token: process.env.SIGNALQ_API_TOKEN
});

// Get version info
const version = await client.version();
console.log(version); // {"version":"2.1.0","gitSha":"...","environment":"production"}

// Check system health  
const health = await client.systemHealth();
console.log(health); // {"status":"healthy","timestamp":"...","worker":"signal_q"}
```

**Curl equivalents:**
```bash
# Version endpoint (no auth) - Primary domain
curl https://signal-q.example.com/version

# Version endpoint (no auth) - Fallback domain  
curl https://signal_q.catnip-pieces1.workers.dev/version

# System health (requires Bearer auth) - Primary domain
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
     https://signal-q.example.com/actions/system_health

# System health (requires Bearer auth) - Fallback domain
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
     https://signal_q.catnip-pieces1.workers.dev/actions/system_health
```

### Legacy Endpoint Note

**Legacy GET /system/health**: The endpoint `GET /system/health` is still implemented for backward compatibility but is not recommended for new integrations. It is not included in the OpenAPI specification. Use `POST /actions/system_health` instead.

## Production Smoke

Test production deployment:

```bash
# Set production environment variables
export SIGNALQ_BASE_URL="https://signal-q.example.com"  # Primary domain
# Or fallback: export SIGNALQ_BASE_URL="https://signal_q.catnip-pieces1.workers.dev"
export SIGNALQ_API_TOKEN="your-production-token"

# Test public version endpoint
curl "$SIGNALQ_BASE_URL/version"

# Test authenticated health endpoint
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" "$SIGNALQ_BASE_URL/actions/system_health"
```

## Production Deploy & Smoke

Run the deploy-and-smoke workflow to deploy and verify production:

1. Go to Actions → "Deploy and Smoke Test"
2. Click "Run workflow"
3. The workflow will:
   - `npm ci`
   - `wrangler deploy`
   - `export BASE_URL=https://signal_q.catnip-pieces1.workers.dev`
   - `curl -sSf "$BASE_URL/version" | jq .`
   - `curl -sSf -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN_PROD" "$BASE_URL/actions/system_health" | tee health.json | jq .`
   - Fail if `.status != "healthy"` (jq check)
   - Retry once after sleep 5 on network error

**Expected outputs:**
- Version JSON: `{"version":"2.1.0","gitSha":"...","buildTime":"...","environment":"production"}`
- Health JSON: `{"status":"healthy","timestamp":"...","worker":"signal_q","version":"v6.0"}`

### Triggering Deployment

**Option A: Manual Workflow Dispatch**
1. Go to Actions → "Deploy and Smoke Test"
2. Click "Run workflow" 
3. Select "production" environment
4. Click "Run workflow"

**Option B: Git Tag (Recommended)**
```bash
git tag v2.1.1
git push origin v2.1.1
```

### Manual Smoke Testing

Test production deployment locally:
```bash
export BASE=https://signal_q.catnip-pieces1.workers.dev
export TOKEN=your_production_token_here
bash scripts/smoke.sh
```

### Monitoring & Debugging

Use `wrangler tail` to monitor live production logs:
```bash
npx wrangler tail --env production
```

In another terminal, make test requests:
```bash
curl https://signal_q.catnip-pieces1.workers.dev/version
curl -X POST -H "Authorization: Bearer $TOKEN" https://signal_q.catnip-pieces1.workers.dev/actions/system_health
```
3. Select "production" environment
4. Click "Run workflow"

**Option B: Tagged Release**
```bash
git tag v2.1.1
git push origin v2.1.1
```

#### 3. Verify Deployment

Run the smoke test script against the production endpoint:
```bash
export SIGNALQ_BASE_URL=https://signal-q-prod.catnip-pieces1.workers.dev
export SIGNALQ_API_TOKEN=your_production_token_here
./scripts/smoke.sh
```

#### 4. Live Debugging

Use `wrangler tail` to monitor live logs:
```bash
cd worker
wrangler tail --env production
```

In another terminal, make requests to see real-time logs:
```bash
curl "$SIGNALQ_BASE_URL/version"
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" "$SIGNALQ_BASE_URL/actions/system_health"
```

#### Build Metadata

The `/version` endpoint includes build metadata:
- `gitSha`: Commit SHA from deployment
- `buildTime`: Timestamp of build
- `environment`: "production" for prod deployments
- `version`: From package.json

Example response:
```json
{
  "version": "2.1.0",
  "gitSha": "abc123def456",
  "buildTime": "2025-01-15T10:30:45.123Z",
  "environment": "production"
}
```

### Troubleshooting

**If you get 404 errors:**
- Verify the exact route path (`/system/health` vs `/health`)
- Check that the development server URL is correct (use the URL printed by `wrangler dev`)

**If you get 401/403 errors:**
- Ensure you're using the correct Authorization header: `"Authorization: Bearer $SIGNALQ_API_TOKEN"`
- For admin endpoints, use `$SIGNALQ_ADMIN_TOKEN` instead
- Verify your token is set correctly as an environment variable

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

## Troubleshooting

### Common Issues and Solutions

#### 404: Check path
- Ensure you're using the correct endpoint path
- Correct: `POST /actions/system_health`
- Incorrect: `GET /system_health` or `POST /health`

#### 401/403: Exact Bearer header  
- Ensure exact header format: `Authorization: Bearer <token>`
- Check for extra spaces or incorrect characters
- Verify you're using the right token for dev vs production

#### Dev port: Use printed URL (often 8787)
- Don't assume port - always use the URL that wrangler prints
- Default is often http://localhost:8787 but may vary

#### Prod: Run wrangler tail in a split terminal while curling
- In terminal 1: `npx wrangler tail --env production`
- In terminal 2: Make your curl requests
- View real-time logs to debug issues
- **Check wrangler output**: Always use the URL that `npx wrangler dev` prints
- **Port conflicts**: If 8787 is busy, wrangler will choose another port automatically

#### Production Deployment Issues
- **Check logs**: Use `npx wrangler tail --env production` in a separate terminal
- **Correlation IDs**: Look for `X-Correlation-ID` header in error responses for debugging
- **Retry logic**: The deploy workflow includes automatic retry for transient network issues

#### Network/Firewall Issues
- **Test connectivity**: Run `curl -I https://workers.cloudflare.com` to check access
- **Fallback mode**: Use `npm run dev:fallback` for local development
- **Required domains**: Ensure access to:
  - `workers.cloudflare.com`
  - `sparrow.cloudflare.com` 
  - `signal_q.catnip-pieces1.workers.dev`

#### Error Response Format
All API errors return RFC 7807 problem+json format:
```json
{
  "type": "about:blank",
  "title": "Authentication Required", 
  "detail": "Bearer token is required for action endpoints",
  "status": 401,
  "correlationId": "uuid-for-tracking",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

#### Debugging Steps
1. **Check the correlation ID** in error responses for tracing
2. **Monitor logs** with `npx wrangler tail` while making requests
3. **Test with curl** to isolate client vs server issues:
   ```bash
   # Test version (no auth)
   curl -v http://127.0.0.1:8787/version
   
   # Test authenticated endpoint
   curl -v -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8787/actions/system_health
   ```
4. **Verify environment variables** are properly set in `.dev.vars` or production
