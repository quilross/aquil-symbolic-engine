# GitHub Secrets and Variables Configuration

This document lists all the GitHub Secrets and Variables required for the Signal Q Worker project to operate securely and automatically deploy via CI/CD.

## 🔐 Required GitHub Secrets

Secrets contain sensitive information that should never be exposed in public repositories. Configure these in your GitHub repository settings under **Settings > Secrets and variables > Actions**.

### `CLOUDFLARE_API_TOKEN`
- **Purpose**: Authentication for Wrangler CLI to deploy to Cloudflare Workers
- **How to get**: 
  1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
  2. Click "Create Token"
  3. Use "Edit Cloudflare Workers" template or custom token with:
     - Zone: Zone:Read, Zone:Zone:Read  
     - Account: Cloudflare Workers:Edit
     - Include: All accounts
- **Example**: `abc123def456ghi789jkl012mno345pqr678stu901`

### `CLOUDFLARE_ACCOUNT_ID`
- **Purpose**: Cloudflare account identifier for worker deployment
- **How to get**: 
  1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
  2. Right sidebar shows "Account ID"
- **Current value to replace**: `b07412f2f2389e8b537051bc092f3376`

### `SIGNAL_KV_ID`
- **Purpose**: KV namespace ID for the SIGNAL_KV binding
- **How to get**:
  1. Go to Cloudflare Dashboard > Workers & Pages > KV
  2. Find your KV namespace
  3. Copy the namespace ID
- **Current value to replace**: `cb01f3bf664a4feb9a3ec29fd86cd43e`

### `API_TOKEN_USER`
- **Purpose**: User-level API token for the Signal Q application
- **Security**: Generate a secure random token (32+ characters)
- **Current value to replace**: `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Example**: `sq_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

### `API_TOKEN_ADMIN`
- **Purpose**: Admin-level API token for the Signal Q application
- **Security**: Generate a secure random token (32+ characters)  
- **Current value to replace**: `sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1i6o`
- **Example**: `sq_admin_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0`

## 📋 Required GitHub Variables

Variables contain non-sensitive configuration that can be publicly visible. Configure these in your GitHub repository settings under **Settings > Secrets and variables > Actions**.

### `WORKER_NAME`
- **Purpose**: Name of the Cloudflare Worker
- **Value**: `signal_q`

### `BASE_URL`
- **Purpose**: Base URL of the deployed worker for testing and documentation
- **Value**: `https://signal_q.catnip-pieces1.workers.dev`

## 🛠️ Setup Instructions

### 1. Configure GitHub Secrets
1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret listed above with its corresponding value

### 2. Configure GitHub Variables  
1. In the same **Actions** page, click the **Variables** tab
2. Click **New repository variable**
3. Add each variable listed above with its corresponding value

### 3. Verify Configuration
After adding secrets and variables, the CI/CD pipeline will:
- ✅ Automatically deploy to Cloudflare Workers on push to main
- ✅ Run health checks using the configured tokens
- ✅ Validate deployment success

## 🔄 Migration Process

The following files currently contain hardcoded values that will be replaced:

### Files to Update:
- ✅ `worker/wrangler.toml` - Updated to use development defaults, overridden in CI
- ✅ `worker/health-test.js` - Updated to use environment variables with fallbacks
- ✅ `worker/deploy.sh` - Updated to use environment variables with fallbacks
- ✅ `README.md` - Removed exposed tokens, added security notice
- ✅ `.github/workflows/ci.yml` - Added secure deployment with secrets
- ✅ `.env.example` - Added template for local development

### Security Improvements:
- ❌ **Before**: Sensitive values exposed in public repository
- ✅ **After**: All sensitive values secured in GitHub Secrets
- ✅ **After**: Automated secure deployment via CI/CD
- ✅ **After**: Environment-specific configuration support

## 🧪 Testing

After configuration, you can test the setup:

```bash
# Local development (requires wrangler login)
npm run dev

# CI/CD deployment (automatic on push to main)
git push origin main

# Manual health check
npm run test
```

## 🔒 Security Best Practices

1. **Rotate tokens regularly** - Generate new API tokens periodically
2. **Principle of least privilege** - Use minimum required permissions for Cloudflare API token
3. **Monitor access** - Review Cloudflare audit logs for API token usage
4. **Environment separation** - Use different tokens for staging/production if applicable

## 📞 Support

If you encounter issues:
1. Verify all secrets and variables are configured correctly
2. Check Cloudflare dashboard for account/namespace IDs
3. Ensure API token has sufficient permissions
4. Review GitHub Actions logs for specific error messages