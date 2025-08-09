# Troubleshooting Guide

## 🔍 Symptom → Diagnosis → Test → Fix Matrix

### 🚫 Connection & Network Issues

| Symptom | Likely Cause | Test | Fix |
|---------|-------------|------|-----|
| `ECONNREFUSED` connecting to localhost:8788 | Dev server not running | `curl localhost:8788/version` | `npm run dev:fallback` |
| Timeout connecting to *.workers.dev | Firewall/proxy blocking | `curl -m 5 https://signal_q.catnip-pieces1.workers.dev/version` | Use `npm run dev:fallback` or configure proxy |
| Port 8788 already in use | Another process using port | `lsof -i :8788` | Test runner auto-detects available port |
| Can't reach Cloudflare endpoints | Corporate firewall | `curl -m 5 https://sparrow.cloudflare.com` | Use local development mode |

### 🔐 Authentication Errors  

| Symptom | Likely Cause | Test | Fix |
|---------|-------------|------|-----|
| 401 "Authentication Required" | Missing Bearer token | `curl /system/health` (no auth) | Add `-H "Authorization: Bearer <token>"` |
| 401 "Invalid Credentials" | Wrong/expired token | `echo $TOKEN \| cut -c1-10` | Use valid $SIGNALQ_API_TOKEN* or $SIGNALQ_ADMIN_TOKEN* token |
| 403 "Insufficient Permissions" | User token on admin endpoint | `curl -X POST /admin/reset` with user token | Use admin token ($SIGNALQ_ADMIN_TOKEN*) |
| Token looks truncated in logs | Shell escaping issue | `echo "${TOKEN}" \| wc -c` | Quote token properly: `"$TOKEN"` |

### ⚙️ Configuration Issues

| Symptom | Likely Cause | Test | Fix |
|---------|-------------|------|-----|
| 500 "Configuration Error" | Missing wrangler secrets | `wrangler secret list` | `wrangler secret put SIGNALQ_API_TOKEN` |
| Version shows "unknown" gitSha | Missing GIT_SHA env var | `curl /version` | Set `wrangler secret put GIT_SHA` |
| Wrong environment in /version | NODE_ENV not set | Check version.environment field | `wrangler secret put NODE_ENV` |
| Dev tokens in production | Using .env instead of secrets | Check if hardcoded tokens appear | Set production secrets properly |

### 🔥 Runtime Errors

| Symptom | Likely Cause | Test | Fix |
|---------|-------------|------|-----|
| 500 Internal Server Error | JavaScript syntax/runtime error | Check wrangler logs: `wrangler tail` | Fix syntax error, redeploy |
| Durable Object errors | Storage/state issues | Test with fresh X-User-Id header | Clear DO state or use new user ID |
| CORS errors in browser | Missing CORS headers | Check preflight: `curl -X OPTIONS` | Ensure OPTIONS handler works |
| Memory/CPU limit errors | Resource exhaustion | Monitor Cloudflare dashboard | Optimize code, consider upgrading plan |

### 📡 API Response Issues

| Symptom | Likely Cause | Test | Fix |
|---------|-------------|------|-----|
| Empty response body | No response handler | `curl -v /endpoint` | Add proper response handler |
| Invalid JSON | Malformed response | `curl /endpoint \| jq .` | Fix JSON structure |
| Missing required fields | Incomplete response object | Check response against schema | Add missing fields to response |
| Unexpected 404 | Route not defined | Check exact path/method | Add route handler or fix URL |

### 🧪 Testing & CI Issues

| Symptom | Likely Cause | Test | Fix |
|---------|-------------|------|-----|
| Tests hang/timeout | Dev server didn't start | Check test runner logs | Increase timeout or fix server startup |
| Secret scan blocks commit | Hardcoded credentials detected | `npm run secret-scan` | Remove secrets, add to whitelist if safe |
| npm audit failures | Vulnerable dependencies | `npm audit` | `npm audit fix` or update dependencies |
| Codespaces port forwarding issues | Port not properly forwarded | Check PORTS tab in VS Code | Restart codespace or manual port forward |

## 🛠️ Development Environment Differences

### Local Development (`npm run dev:fallback`)
- **Limits**: No CPU/memory limits
- **Fetch**: All external requests work
- **Timeouts**: No 10-second timeout
- **Body Size**: No 100MB limit
- **CORS**: Development CORS headers
- **Storage**: Local file-based storage simulation

### Cloud Development (`npm run dev`)  
- **Limits**: Simulated Cloudflare limits
- **Fetch**: Real external requests
- **Timeouts**: 10-second request timeout
- **Body Size**: 100MB request limit
- **CORS**: Production CORS headers
- **Storage**: Real Durable Object storage

### Production
- **Limits**: Full Cloudflare Worker limits enforced
- **Fetch**: Rate-limited external requests
- **Timeouts**: 10-second CPU timeout per request
- **Body Size**: 100MB request/response limit
- **CORS**: Production CORS configuration
- **Storage**: Persistent Durable Object storage

## 🚨 Emergency Procedures

### Complete Service Outage

1. **Check Status Page**
   ```bash
   curl https://www.cloudflarestatus.com
   ```

2. **Test Health Endpoint**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://signal_q.catnip-pieces1.workers.dev/system/health
   ```

3. **Check Recent Deployments**
   ```bash
   wrangler deployments list
   ```

4. **Rollback if Needed**
   ```bash
   wrangler rollback [deployment-id]
   ```

### Authentication System Failure

1. **Verify Secrets**
   ```bash
   wrangler secret list
   ```

2. **Test with Known Good Token**
   ```bash
   curl -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
     https://signal_q.catnip-pieces1.workers.dev/system/health
   ```

3. **Reset Secrets if Compromised**
   ```bash
   wrangler secret put SIGNALQ_API_TOKEN
   wrangler secret put SIGNALQ_ADMIN_TOKEN
   ```

### Data Corruption/Loss

1. **Check Durable Object Status**
   ```bash
   # Monitor DO operations in dashboard
   wrangler tail --format pretty
   ```

2. **Test with Fresh User ID**
   ```bash
   curl -H "X-User-Id: test-recovery-$(date +%s)" \
     -H "Authorization: Bearer $TOKEN" \
     https://signal_q.catnip-pieces1.workers.dev/identity-nodes
   ```

3. **Admin Reset (Last Resort)**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://signal_q.catnip-pieces1.workers.dev/admin/reset
   ```

## 🔍 Diagnostic Commands

### Quick Health Check
```bash
#!/bin/bash
# comprehensive-health-check.sh

BASE_URL="https://signal_q.catnip-pieces1.workers.dev"
TOKEN="$SIGNALQ_API_TOKEN"

echo "🔍 Signal Q Health Diagnostic"
echo "============================="

# Test version endpoint (public)
echo "📦 Version Check:"
curl -s "$BASE_URL/version" | jq . || echo "❌ Version endpoint failed"

# Test health endpoint (auth required)
echo -e "\n🏥 Health Check:"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/system/health" | jq . || echo "❌ Health endpoint failed"

# Test probe identity (actions)
echo -e "\n🔍 Identity Probe:"
curl -s -X POST -H "Authorization: Bearer $TOKEN" "$BASE_URL/actions/probe_identity" | jq . || echo "❌ Probe failed"

echo -e "\n✅ Diagnostic complete"
```

### Network Connectivity Test
```bash
#!/bin/bash
# network-test.sh

echo "🌐 Testing network connectivity..."

# Test basic connectivity
echo "1. Basic connectivity:"
curl -m 5 -s https://signal_q.catnip-pieces1.workers.dev/version && echo "✅ Production accessible" || echo "❌ Production blocked"

# Test Cloudflare infrastructure  
echo "2. Cloudflare endpoints:"
curl -m 5 -s https://sparrow.cloudflare.com && echo "✅ Cloudflare API accessible" || echo "❌ Cloudflare API blocked"

# Test local development
echo "3. Local development:"
curl -m 2 -s http://localhost:8788/version && echo "✅ Local server running" || echo "❌ Local server down"

echo "🏁 Network test complete"
```

### Environment Validation
```bash
#!/bin/bash
# env-validation.sh

echo "🔧 Environment Validation"
echo "========================"

# Check required environment variables
echo "Environment variables:"
[ -n "$SIGNALQ_API_TOKEN" ] && echo "✅ SIGNALQ_API_TOKEN set" || echo "❌ SIGNALQ_API_TOKEN missing"
[ -n "$SIGNALQ_ADMIN_TOKEN" ] && echo "✅ SIGNALQ_ADMIN_TOKEN set" || echo "❌ SIGNALQ_ADMIN_TOKEN missing"

# Check token format
echo -e "\nToken format validation:"
if [[ "$SIGNALQ_API_TOKEN" =~ ^$SIGNALQ_API_TOKEN[a-zA-Z0-9]{32}$ ]]; then
  echo "✅ API token format valid"
else
  echo "❌ API token format invalid (should be $SIGNALQ_API_TOKEN[32chars])"
fi

if [[ "$SIGNALQ_ADMIN_TOKEN" =~ ^$SIGNALQ_ADMIN_TOKEN[a-zA-Z0-9]{32}$ ]]; then
  echo "✅ Admin token format valid"  
else
  echo "❌ Admin token format invalid (should be $SIGNALQ_ADMIN_TOKEN[32chars])"
fi

echo "🏁 Validation complete"
```

## 📱 Mobile/Client Integration Issues

### CORS Problems
```javascript
// Test CORS in browser
fetch('https://signal_q.catnip-pieces1.workers.dev/version')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### SDK Usage Problems
```javascript
// Debug SDK connection
const client = new SignalQClient({
  baseUrl: 'https://signal_q.catnip-pieces1.workers.dev',
  token: '$SIGNALQ_API_TOKEN'
});

// Test with timeout
try {
  const health = await client.health();
  console.log('✅ SDK working:', health);
} catch (error) {
  console.error('❌ SDK error:', error.message);
  // Check if error includes correlation ID for debugging
}
```

## 📞 Getting Help

### Self-Service Debugging
1. Run health diagnostic: `./comprehensive-health-check.sh`
2. Check network connectivity: `./network-test.sh`  
3. Validate environment: `./env-validation.sh`
4. Review recent logs: `wrangler tail`

### Information to Include in Bug Reports
- Correlation ID from error response
- Exact curl command that failed
- Environment (local/staging/production)
- Timestamp of the issue
- Browser/client information (if applicable)