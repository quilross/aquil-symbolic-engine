# Signal Q Worker Deployment Setup

## Required GitHub Secrets

For the automated deployment workflow to function, the following secrets must be configured in your GitHub repository:

### Cloudflare Secrets
- **`CLOUDFLARE_API_TOKEN`**: `ao43LJDrQV4ANgN0ZdmqRJnu7Y9cNCuTPsVXTfJS`
- **`CLOUDFLARE_ACCOUNT_ID`**: `catnip_pieces1@icloud.com`

## Setup Instructions

1. **Configure GitHub Secrets**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add the above secrets with their respective values

2. **Deployment**:
   - The workflow automatically deploys on push to `main` branch when `worker/` files change
   - Manual deployment can be triggered via "Actions" tab → "Deploy Signal Q Cloudflare Worker" → "Run workflow"

3. **Validation**:
   - After deployment, the workflow runs comprehensive validation scripts
   - Reports are uploaded as workflow artifacts for review

## Local Development

```bash
# Install dependencies
cd worker
npm install

# Deploy manually
npm run deploy

# Run validation tests
npm run validate

# Run individual audits
npm run audit:openapi
npm run audit:implementation  
npm run audit:final
```

## API Information

- **Worker URL**: https://signal_q.catnip-pieces1.workers.dev
- **Bearer Token**: `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Health Endpoint**: https://signal_q.catnip-pieces1.workers.dev/system/health

## CustomGPT Integration

The worker is designed for seamless CustomGPT integration:

- **Base URL**: https://signal_q.catnip-pieces1.workers.dev
- **Authentication**: Bearer token (see above)
- **Content-Type**: application/json
- **OpenAPI Schema**: `worker/src/openapi-core.json`

## Workflow Features

- ✅ Node.js v20 support
- ✅ Uses `actions/upload-artifact@v4`
- ✅ Generates `package-lock.json` for reproducible builds
- ✅ Comprehensive validation with multiple audit scripts
- ✅ Non-breaking OpenAPI compatibility checks
- ✅ Artifact upload for all audit reports