# Cloudflare Setup Guide for Signal Q GPT Backend

This guide provides step-by-step instructions for setting up Cloudflare Workers and custom domains for your Signal Q GPT backend.

## Prerequisites

- GitHub account with this repository
- Cloudflare account (free tier works)
- Custom domain (optional, can use workers.dev subdomain)

## 1. Cloudflare Account Setup

### Create Cloudflare Account
1. Go to https://cloudflare.com
2. Sign up or log in to your account
3. Note your Account ID (found in the right sidebar of the dashboard)

### Get API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Configure:
   - **Permissions**: Zone:Zone Settings:Read, Zone:Zone:Read, User:User Details:Read
   - **Account resources**: Include All accounts (or select your specific account)
   - **Zone resources**: Include All zones (or select your specific zone if using custom domain)
5. Continue to summary and create token
6. **IMPORTANT**: Copy the token immediately and store it securely

## 2. GitHub Repository Secrets

Set up the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add these Repository secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `CLOUDFLARE_API_TOKEN` | Your API token from step 1 | For Wrangler authentication |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID | Found in Cloudflare dashboard |
| `SIGNALQ_API_TOKEN_PROD` | `sq_live_<random>` | Production user API token |
| `SIGNALQ_ADMIN_TOKEN_PROD` | `sq_admin_<random>` | Production admin API token |

### Generate Secure Tokens
Use these commands to generate secure tokens:
```bash
# User token
echo "sq_live_$(openssl rand -hex 20)"

# Admin token  
echo "sq_admin_$(openssl rand -hex 20)"
```

## 3. Domain Configuration (Optional)

### Option A: Use Workers.dev Subdomain (Easiest)
Your API will be available at: `https://signal-q.your-subdomain.workers.dev`
- No additional setup required
- Ready to use immediately after deployment

### Option B: Custom Domain Setup

#### Add Domain to Cloudflare
1. In Cloudflare dashboard, click "Add a Site"
2. Enter your domain name
3. Select a plan (Free works fine)
4. Update your domain's nameservers to Cloudflare's
5. Wait for DNS propagation (can take up to 24 hours)

#### Configure Custom Domain for Workers
1. Go to Workers & Pages → Overview
2. Click on your deployed worker
3. Go to Settings → Triggers
4. Click "Add Custom Domain"
5. Enter your subdomain (e.g., `api.yourdomain.com`)
6. Save the configuration

#### SSL/TLS Settings
1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full (strict)" or "Full"
3. Ensure SSL certificate is active

## 4. Deployment

### Deploy via GitHub Actions
1. Push changes to the `main` branch
2. Go to Actions tab in GitHub
3. The workflow will automatically deploy to production
4. Check the deployment logs for your worker URL

### Manual Deployment (Alternative)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Deploy the worker
cd worker
wrangler deploy
```

## 5. Wrangler Configuration

Your `wrangler.toml` should look like this:

```toml
name = "signal-q"
main = "index.js"
compatibility_date = "2025-08-01"

[env.production]
name = "signal-q-prod"
vars = { LOG_LEVEL = "info" }

[[env.production.durable_objects.bindings]]
name = "MEMORY"
class_name = "MemoryDO"
script_name = "signal-q-prod"

[durable_objects]
bindings = [
  { name = "MEMORY", class_name = "MemoryDO" }
]
```

## 6. Environment Variables (Secrets)

Set these secrets using Wrangler CLI:

```bash
# Production environment
wrangler secret put SIGNALQ_API_TOKEN --env production
wrangler secret put SIGNALQ_ADMIN_TOKEN --env production

# Development environment (optional)
wrangler secret put SIGNALQ_API_TOKEN
wrangler secret put SIGNALQ_ADMIN_TOKEN
```

## 7. Custom GPT Integration

### OpenAPI Specification URL
Use your deployed worker's OpenAPI endpoint:
- **Production**: `https://your-worker.workers.dev/openapi.yaml`
- **Custom Domain**: `https://api.yourdomain.com/openapi.yaml`

### GPT Configuration
1. Go to https://chat.openai.com/gpts/editor
2. Create new GPT or edit existing
3. In "Configure" → "Actions":
   - Click "Import from URL"
   - Enter your OpenAPI URL
   - Configure authentication:
     - Type: Bearer
     - Token: Your production API token

### Test Endpoints
```bash
# Health check (public)
curl https://your-worker.workers.dev/system/health

# Version info (public)  
curl https://your-worker.workers.dev/version

# Chat with Gene Keys (authenticated)
curl -X POST https://your-worker.workers.dev/actions/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel overwhelmed", "user": "test_user"}'

# Memory retrieval (public)
curl https://your-worker.workers.dev/memory/test_user
```

## 8. Monitoring & Troubleshooting

### Cloudflare Dashboard
1. Go to Workers & Pages → Overview
2. Click on your worker
3. View real-time logs and metrics

### Common Issues

#### 1. Authentication Errors
- Verify API token has correct permissions
- Check that secrets are set in both GitHub and Wrangler

#### 2. Domain Not Working
- Ensure DNS is pointing to Cloudflare
- Check SSL certificate status
- Verify custom domain is correctly configured

#### 3. Deployment Failures
- Check GitHub Actions logs for detailed errors
- Verify all required secrets are set
- Ensure wrangler.toml syntax is correct

#### 4. CORS Issues
- The worker includes proper CORS headers
- If issues persist, check browser developer tools

### Live Debugging
```bash
# View real-time logs
wrangler tail --env production

# Test deployment
npm run validate
```

## 9. Security Best Practices

1. **Rotate API tokens regularly** (every 90 days)
2. **Use different tokens** for development and production
3. **Monitor API usage** in Cloudflare dashboard
4. **Enable rate limiting** if needed
5. **Keep secrets secure** - never commit to repository

## 10. Scaling & Performance

### Automatic Scaling
- Cloudflare Workers automatically scale to handle traffic
- No server management required
- Pay-per-request billing model

### Performance Optimization
- Workers run at edge locations globally
- < 10ms cold start times
- Built-in caching and optimization

### Monitoring
- Real-time metrics in Cloudflare dashboard
- Set up alerts for errors or high usage
- Monitor response times and success rates

## Support

If you encounter issues:
1. Check Cloudflare Workers documentation: https://developers.cloudflare.com/workers/
2. Review GitHub Actions logs for deployment issues
3. Use `wrangler tail` for real-time debugging
4. Check Cloudflare dashboard for service status

Your Signal Q backend is now fully deployed and ready for GPT integration!