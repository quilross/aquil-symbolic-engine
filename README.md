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

---

## 🚀 Deployment Automation

This repository includes comprehensive CI/CD automation for reliable deployment:

### Prerequisites
- Node.js 18+
- npm

### GitHub Codespaces

This repository ships with a ready-to-use [dev container](.devcontainer/devcontainer.json) optimized for GitHub Codespaces. Open it in GitHub Codespaces to get a cloud-hosted Node.js 18 environment with dependencies installed automatically.

#### Codespaces Setup
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

**🌐 Required Domain Allowlist**
For optimal functionality in restrictive networks, allowlist these domains:
- `sparrow.cloudflare.com` - Cloudflare API endpoint
- `workers.cloudflare.com` - Workers platform endpoint  
- `registry.npmjs.org` - npm package registry
- `signal_q.catnip-pieces1.workers.dev` - Production API endpoint (from OpenAPI spec)

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

### Network Requirements
For optimal functionality, allowlist these domains:
- `sparrow.cloudflare.com` - Cloudflare API endpoint
- `workers.cloudflare.com` - Workers platform endpoint  
- `registry.npmjs.org` - npm package registry
- `signal_q.catnip-pieces1.workers.dev` - Production API endpoint
