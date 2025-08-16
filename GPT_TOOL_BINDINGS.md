# Signal Q GPT Tool Bindings

This document defines the GPT tool bindings for all Signal Q actions. These should be configured in the GPT tool namespace `signal_q_me__jit_plugin`.

## Tool Definitions

### 1. Version Tool (No Auth)
**Tool Name**: `signal_q_me__jit_plugin.version`

```json
{
  "method": "GET",
  "url": "https://signal-q.me/version",
  "headers": {
    "Content-Type": "application/json"
  },
  "description": "Get version information including git SHA, build time, and environment",
  "response_format": {
    "version": "string",
    "gitSha": "string", 
    "buildTime": "string",
    "environment": "string"
  }
}
```

### 2. System Health 
**Tool Name**: `signal_q_me__jit_plugin.systemHealth`

```json
{
  "method": "POST",
  "url": "https://signal-q.me/actions/system_health",
  "headers": {
    "Authorization": "Bearer $API_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {},
  "description": "Check system health status and version information",
  "response_format": {
    "status": "healthy",
    "timestamp": "string",
    "worker": "string", 
    "version": "string"
  },
  "error_handling": "Returns problem+json format with correlationId on errors"
}
```

### 3. List Actions
**Tool Name**: `signal_q_me__jit_plugin.listActions`

```json
{
  "method": "POST",
  "url": "https://signal-q.me/actions/list",
  "headers": {
    "Authorization": "Bearer $API_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {},
  "description": "Get list of all available actions for dynamic discovery",
  "response_format": {
    "actions": ["list", "system_health", "probe_identity", "recalibrate_state", "deploy"]
  },
  "error_handling": "Returns problem+json format with correlationId on errors"
}
```

### 4. Probe Identity
**Tool Name**: `signal_q_me__jit_plugin.probeIdentity`

```json
{
  "method": "POST",
  "url": "https://signal-q.me/actions/probe_identity",
  "headers": {
    "Authorization": "Bearer $API_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {},
  "description": "Probe current identity status with enriched analysis including stability, coherence, authenticity metrics",
  "response_format": {
    "probe": "string",
    "timestamp": "string",
    "analysis": {
      "stability": "number (0-1)",
      "coherence": "string (high/medium/low)", 
      "authenticity": "number (0-1)",
      "recommendation": "string"
    }
  },
  "error_handling": "Returns problem+json format with correlationId on errors"
}
```

### 5. Recalibrate State
**Tool Name**: `signal_q_me__jit_plugin.recalibrateState`

```json
{
  "method": "POST",
  "url": "https://signal-q.me/actions/recalibrate_state",
  "headers": {
    "Authorization": "Bearer $API_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {},
  "description": "Recalibrate symbolic state and identity configuration",
  "response_format": {
    "state": "recalibrated",
    "timestamp": "string",
    "identity_key": "string",
    "dominant_emotion": "string"
  },
  "error_handling": "Returns problem+json format with correlationId on errors"
}
```

### 6. Trigger Deploy (Admin Required)
**Tool Name**: `signal_q_me__jit_plugin.triggerDeploy`

```json
{
  "method": "POST",
  "url": "https://signal-q.me/actions/trigger_deploy",
  "headers": {
    "Authorization": "Bearer $API_TOKEN_ADMIN",
    "Content-Type": "application/json"
  },
  "body": {},
  "description": "Trigger deployment workflow (requires admin token)",
  "response_format": {
    "deployment": "triggered",
    "timestamp": "string"
  },
  "error_handling": "Returns 403 for user tokens, 401 for invalid tokens. Returns problem+json format with correlationId on errors"
}
```

## GPT Instructions

When using these tools in your GPT configuration, include these instructions:

```
Use POST /actions/system_health for health checks, not the legacy GET /system/health endpoint.

If any action returns a problem+json response, report the title, detail, status, and correlationId to the user.

The triggerDeploy action requires an admin token and may return 403 Forbidden if called with a regular user token.

All actions except version require Bearer authentication. Never echo or log the actual token values.

For error responses, look for the correlationId field to help with debugging.
```

## Environment Variables

The GPT runtime should inject these tokens from secrets:
- $API_TOKEN – For regular user actions
- $API_TOKEN_ADMIN – For admin actions like deploy

## Testing Tools

You can test these bindings manually:

```bash
# Test version (no auth)
curl https://signal-q.me/version

# Test system health
curl -X POST -H "Authorization: Bearer $API_TOKEN" \
  https://signal-q.me/actions/system_health

# Test deploy (may require admin token)
curl -X POST -H "Authorization: Bearer $API_TOKEN_ADMIN" \
  https://signal-q.me/actions/trigger_deploy
```
