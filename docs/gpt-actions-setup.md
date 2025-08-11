# GPT Actions Setup

This guide provides exact steps to configure GPT Actions with the Signal Q API.

## Setup Steps

### 1. Add Actions from URL
In GPT Builder → Actions → Add from URL → https://signal-q.me/openapi.yaml

### 2. Fallback URL (if needed)
If the GPT builder refuses the runtime URL, use the raw GitHub URL:
```bash
./scripts/print-spec-url.sh
```

### 3. Authentication Setup
- Auth Method: API Key
- Auth Type: HTTP Bearer
- Header: Authorization: Bearer test-token

### 4. Test Endpoints
Test these key endpoints in order:
1. **getSystemHealth** - Health check (public endpoint)
2. **getVersion** - Service version (public endpoint)  
3. **listActions** - List available actions (requires auth)

## Available Actions

- `getSystemHealth` - Check system health status
- `getVersion` - Get service version information
- `listActions` - List all available actions
- `probeIdentity` - Probe current identity status
- `recalibrateState` - Recalibrate server state  
- `triggerDeploy` - Trigger a deployment

## Authentication Requirements

- **Public endpoints**: `/system/health`, `/version` - No authentication required
- **Action endpoints**: `/actions/*` - Require Bearer token authentication

## Troubleshooting

### Parse Error
If you get a parse error when importing the OpenAPI spec:
1. Try the raw GitHub URL from `scripts/print-spec-url.sh`
2. Verify the URL is accessible in your browser
3. Check that the YAML is valid with `npm run validate:openapi`

### Authentication Issues
- Ensure Bearer token format: `Authorization: Bearer <token>`
- Test with a simple curl command first:
  ```bash
  curl -H "Authorization: Bearer test-token" https://signal-q.me/actions/list
  ```

### Connection Issues
- Verify the base URL `https://signal-q.me` is accessible
- Check firewall/network restrictions
- Use the health endpoint to test basic connectivity: `https://signal-q.me/system/health`
