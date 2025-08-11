# Production Setup & Configuration

## 🔒 Secrets Management

### Wrangler Secrets Setup

**Required for Production:**

```bash
# Set API token for user operations
wrangler secret put SIGNALQ_API_TOKEN
# Enter: $SIGNALQ_API_TOKEN[prod-token-32chars]

# Set admin token for administrative operations  
wrangler secret put SIGNALQ_ADMIN_TOKEN
# Enter: $SIGNALQ_ADMIN_TOKEN[prod-admin-token-32chars]

# Optional: Set build information
wrangler secret put GIT_SHA
# Enter: $(git rev-parse HEAD)

wrangler secret put BUILD_TIME
# Enter: $(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

wrangler secret put NODE_ENV
# Enter: production
```

### List Current Secrets
```bash
# View configured secrets (values are hidden)
wrangler secret list
```

### Delete/Update Secrets
```bash
# Update existing secret
wrangler secret put SIGNALQ_API_TOKEN

# Delete secret (will cause deployment failures!)
wrangler secret delete SIGNALQ_API_TOKEN
```

## ⚠️ Environment Validation

The API includes fail-fast validation for missing secrets:

```javascript
// Automatic validation on worker startup
function validateEnvironment(env) {
  const required = [];
  
  if (!env?.SIGNALQ_API_TOKEN) {
    required.push('SIGNALQ_API_TOKEN');
  }
  if (!env?.SIGNALQ_ADMIN_TOKEN) {
    required.push('SIGNALQ_ADMIN_TOKEN');
  }
  
  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}
```

**If secrets are missing, the API returns:**
```json
{
  "type": "about:blank",
  "title": "Configuration Error", 
  "detail": "Missing required environment variables: SIGNALQ_API_TOKEN, SIGNALQ_ADMIN_TOKEN",
  "status": 500,
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 📁 Local Development Configuration

### .env.example → .env

```bash
# Copy example configuration
cp .env.example .env

# Edit with your local values (DO NOT commit this file!)
vim .env
```

### .env File Structure
```bash
# === DEVELOPMENT TOKENS (Local Only) ===
SIGNALQ_API_TOKEN=$SIGNALQ_API_TOKEN
SIGNALQ_ADMIN_TOKEN=$SIGNALQ_ADMIN_TOKEN

# === BUILD INFORMATION ===
GIT_SHA=local-development
BUILD_TIME=2025-01-01T00:00:00.000Z
NODE_ENV=development
```

### Important Notes:
- ✅ `.env.example` is committed to git
- ❌ `.env` is in `.gitignore` - never commit this!
- 🔒 Production uses Wrangler secrets, not .env files
- 🛡️ Dev tokens in .env.example are safe test tokens

## 🚀 CI/CD Setup

### GitHub Secrets Configuration

Add these secrets to your repository settings:

```bash
# Cloudflare credentials
CLOUDFLARE_API_TOKEN=cf-api-token
CLOUDFLARE_ACCOUNT_ID=cf-account-id

# Production tokens (if different from staging)
SIGNALQ_API_TOKEN_PROD=$SIGNALQ_API_TOKEN[prod-token]
SIGNALQ_ADMIN_TOKEN_PROD=$SIGNALQ_ADMIN_TOKEN[production-admin-token]
```

### Automated Version Information

The CI pipeline automatically sets build information:

```yaml
# In GitHub Actions
- name: Set build info
  run: |
    wrangler secret put GIT_SHA --env production <<< "${{ github.sha }}"
    wrangler secret put BUILD_TIME --env production <<< "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
    wrangler secret put NODE_ENV --env production <<< "production"
```

## 🏗️ Deployment Environments

### Staging Environment
```bash
# Deploy to staging
wrangler deploy --env staging

# Set staging secrets
wrangler secret put SIGNALQ_API_TOKEN --env staging
wrangler secret put SIGNALQ_ADMIN_TOKEN --env staging
```

### Production Environment  
```bash
# Deploy to production
wrangler deploy --env production

# Set production secrets
wrangler secret put SIGNALQ_API_TOKEN --env production
wrangler secret put SIGNALQ_ADMIN_TOKEN --env production
```

### Environment Configuration (wrangler.toml)
```toml
name = "signal_q"
main = "worker/index.js"

[env.staging]
name = "signal_q_staging"
vars = { NODE_ENV = "staging" }

[env.production] 
name = "signal_q_production"
vars = { NODE_ENV = "production" }
```

## 🔍 Health Monitoring

### Production Health Check
```bash
# Quick health check
curl -H "Authorization: Bearer $PROD_TOKEN" \
  https://signal-q.me/system/health

# Version check (no auth required)
curl https://signal-q.me/version
```

### Expected Production Response
```json
{
  "overall": "healthy",
  "api": { "status": "online" },
  "storage": { "status": "operational" }, 
  "deployment": { "status": "active" },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "worker": "signal_q",
  "version": "v6.0"
}
```

## 🚨 Troubleshooting Production Issues

### Common Problems

**1. Missing Secrets**
```bash
# Symptom: 500 error with "Configuration Error"
# Fix: Set required secrets
wrangler secret put SIGNALQ_API_TOKEN
wrangler secret put SIGNALQ_ADMIN_TOKEN
```

**2. Invalid Token Format**
```bash
# Symptom: 401 "Invalid Credentials" 
# Fix: Ensure tokens follow pattern $SIGNALQ_API_TOKEN* or $SIGNALQ_ADMIN_TOKEN*
# Check: Token is exactly 32 characters after prefix
```

**3. Wrong Environment**
```bash
# Symptom: Wrong version/gitSha in /version response
# Fix: Ensure correct environment variables are set
wrangler secret put NODE_ENV --env production
```

### Debug Commands
```bash
# Check deployment status
wrangler tail

# View worker logs
wrangler tail --format pretty

# Test specific environment
wrangler dev --env production --remote
```

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **Health Endpoint Response Time** (`/system/health`)
2. **Error Rate** (4xx/5xx responses)
3. **Authentication Failures** (401/403 responses)
4. **Version Endpoint Availability** (`/version`)

### Recommended Alerts

- Health endpoint down > 2 minutes
- Error rate > 5% over 5 minutes  
- Authentication failure spike (>50/minute)
- Missing environment variables

## 🔐 Security Best Practices

1. **Token Rotation**
   - Rotate tokens quarterly
   - Use strong random generation
   - Never log tokens

2. **Environment Separation**
   - Different tokens for staging/production
   - Separate Cloudflare accounts if possible
   - Monitor cross-environment access

3. **Access Control**
   - Limit admin token distribution
   - Monitor admin endpoint usage
   - Regular access reviews

4. **Incident Response**
   - Document token rotation procedures
   - Prepare rollback plans
   - Monitor for unauthorized access
