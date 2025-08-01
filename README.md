# Signal Q - Live & Ready 🌟

## 🎯 **For CustomGPT**
- **Base URL**: `https://signal_q.catnip-pieces1.workers.dev`
- **Auth**: Bearer `[Your API Token]` (see GitHub Secrets configuration)
- **Schema**: Upload `worker/src/openapi-core.json`

## 🔑 **Your API Tokens**
- **User Token**: `[Your User API Token]` (configured in GitHub Secrets)
- **Admin Token**: `[Your Admin API Token]` (configured in GitHub Secrets)

> ⚠️ **Security Note**: API tokens are now configured via GitHub Secrets for security. 
> See `GITHUB_SECRETS_AND_VARIABLES.md` for setup instructions.

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

### ⚠️ First-Time Setup Required
Before deployment, you must configure GitHub Secrets and Variables:
📖 **See [GITHUB_SECRETS_AND_VARIABLES.md](GITHUB_SECRETS_AND_VARIABLES.md) for complete setup instructions**

### Prerequisites
- Node.js 18+
- npm

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

### CI/CD Pipeline
The GitHub Actions workflow automatically:
- ✅ Validates npm dependencies and security
- ✅ Checks worker configuration
- ✅ Validates JavaScript syntax
- ✅ Tests deployment configuration
- ✅ Runs OpenAPI sync validation
- ✅ Performs comprehensive project validation
- ✅ **Deploys to Cloudflare Workers** (on push to main)
- ✅ **Runs health checks** after deployment

## 🛡️ Security & Validation
- Automated security auditing with `npm audit`
- Wrangler v4 for latest security updates
- Comprehensive deployment validation
- Zero-vulnerability dependency management
