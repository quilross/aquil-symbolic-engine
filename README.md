# Signal Q - Clean & Ready 🌟

## 🚀 **Deploy in 2 Commands**
```bash
cd worker
wrangler login && wrangler deploy
```

## 🤖 **Automated CI/CD**
```bash
# All validation scripts run automatically in GitHub Actions
npm run validate  # Run all validation checks locally
npm ci            # Install dependencies (now works!)
```

## 🔑 **Your API Tokens**
- **User Token**: `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Admin Token**: `sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2`

## 🎯 **For CustomGPT**
 - **Base URL**: `https://signal_q.catnip-pieces1.workers.dev`
- **Auth**: Bearer `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Schema**: Upload `worker/src/openapi-core.json`

## 📁 **Clean File Structure**
```
/worker/
  ├── src/
  │   ├── index.js           # Your backend code
  │   └── openapi-core.json  # API schema for CustomGPT
  ├── wrangler.toml          # Config with secure tokens
  └── test-api.js            # Test your deployment
```

**Everything else removed. No more overwhelm.** ✨

---
Ready to deploy: `cd worker && ./deploy.sh`
