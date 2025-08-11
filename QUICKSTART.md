# Signal Q API - Quick Start Guide

## 🚀 One-Minute Local Quickstart

Get Signal Q running locally in under 60 seconds:

```bash
# 1. Install dependencies (15 seconds)
npm ci

# 2. Start development server (10 seconds) 
npm run dev:fallback

# 3. Test health endpoint (5 seconds)
curl -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  http://localhost:8788/system/health
```

**Expected Response:**
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

## 🌐 One-Minute Production Smoke Test

Test the live production API:

```bash
# 1. Set environment variables (5 seconds)
export BASE_URL="https://signal-q.me"
export SIGNALQ_API_TOKEN="prod-token"

# 2. Test health endpoint (10 seconds)
curl -H "Authorization: Bearer $SIGNALQ_API_TOKEN" "$BASE_URL/system/health"

# 3. Test version endpoint (public) (10 seconds)
curl "$BASE_URL/version"

# 4. Test identity probe (15 seconds)
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/actions/probe_identity"
```

**Expected Health Response:**
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

**Expected Version Response (Public):**
```json
{
  "version": "2.1.0",
  "gitSha": "abc123def456",
  "buildTime": "2025-01-01T12:00:00.000Z",
  "environment": "production"
}
```

**Expected Probe Response:**
```json
{
  "probe": "Identity confirmed with detailed analysis",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "friction": ["Continue as your whole self", "Trust your authentic expression"],
  "analysis": {
    "stability": 0.92,
    "coherence": "high",
    "authenticity": 0.88,
    "recommendation": "Identity integration optimal - proceed with confidence"
  }
}
```

## 🔧 Development Options

### Local Development (Firewall-Safe)
```bash
npm run dev:fallback  # Automatic fallback for restrictive networks
```

### Cloud Development
```bash
npm run dev  # Requires Cloudflare connectivity
```

### Testing
```bash
npm test  # Full test suite with health checks
```

### Validation
```bash
npm run validate  # Security scan + dependency audit
```

## 🛠️ Troubleshooting

### Connection Issues
- **Local dev not starting?** Try `npm run dev:fallback`
- **Port already in use?** The script auto-detects and uses the next available port
- **Firewall blocking?** Use fallback mode which runs completely locally

### Authentication Errors
- **401 Unauthorized?** Check your Bearer token format: `Bearer $SIGNALQ_API_TOKEN...`
- **403 Forbidden?** Some endpoints require admin tokens, not user tokens

### Quick Health Check
```bash
# Test local server
curl http://localhost:8788/version

# Test production (no auth required)
curl https://signal-q.me/version
```

## 📚 Next Steps

- **SDK Usage**: See `sdk/signal-q-client.js` for JavaScript client
- **API Documentation**: See `worker/src/openapi-core.json` for full OpenAPI spec
- **Auth & Roles**: See `ROLES_AND_AUTH.md` for detailed permission matrix
- **Production Setup**: See `PRODUCTION_SETUP.md` for deployment guide
