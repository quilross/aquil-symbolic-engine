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
- Node.js 20+
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

## 🛡️ Security & Validation
- Automated security auditing with `npm audit`
- Wrangler v4 for latest security updates
- Comprehensive deployment validation
- Zero-vulnerability dependency management
