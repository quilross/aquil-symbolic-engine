# Signal Q GPT Tool Bindings

This document defines the GPT tool bindings for all Signal Q actions. These should be configured in the GPT tool namespace `signal_q_example_com__jit_plugin` (for custom domain) or `signal_q_catnip_pieces1_workers_dev__jit_plugin` (for workers.dev fallback).

## Tool Definitions

### 1. Version Tool (No Auth)
**Tool Name**: `signal_q_example_com__jit_plugin.version` (or fallback namespace)

```json
{
  "method": "GET",
  "url": "https://signal-q.example.com/version",
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
**Tool Name**: `signal_q_example_com__jit_plugin.systemHealth` (or fallback namespace)

```json
{
  "method": "POST", 
  "url": "https://signal-q.example.com/actions/system_health",
  "headers": {
    "Authorization": "Bearer {SIGNALQ_API_TOKEN}",
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
**Tool Name**: `signal_q_example_com__jit_plugin.listActions` (or fallback namespace)

```json
{
  "method": "POST",
  "url": "https://signal-q.example.com/actions/list", 
  "headers": {
    "Authorization": "Bearer {SIGNALQ_API_TOKEN}",
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
**Tool Name**: `signal_q_example_com__jit_plugin.probeIdentity` (or fallback namespace)

```json
{
  "method": "POST",
  "url": "https://signal-q.example.com/actions/probe_identity",
  "headers": {
    "Authorization": "Bearer {SIGNALQ_API_TOKEN}",
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
**Tool Name**: `signal_q_example_com__jit_plugin.recalibrateState` (or fallback namespace)

```json
{
  "method": "POST",
  "url": "https://signal-q.example.com/actions/recalibrate_state",
  "headers": {
    "Authorization": "Bearer {SIGNALQ_API_TOKEN}",
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
**Tool Name**: `signal_q_example_com__jit_plugin.triggerDeploy` (or fallback namespace)

```json
{
  "method": "POST",
  "url": "https://signal-q.example.com/actions/deploy",
  "headers": {
    "Authorization": "Bearer {SIGNALQ_ADMIN_TOKEN}",
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

## Domain Configuration

### Primary Domain (Preferred)
Use the custom domain namespace: `signal_q_example_com__jit_plugin`
- Base URL: `https://signal-q.example.com`

### Fallback Domain
If custom domain is not available, use: `signal_q_catnip_pieces1_workers_dev__jit_plugin`
- Base URL: `https://signal_q.catnip-pieces1.workers.dev`

## GPT Instructions

When using these tools in your GPT configuration, include these instructions:

```
Use POST /actions/system_health for health checks, not the legacy GET /system/health endpoint.

If any action returns a problem+json response, report the title, detail, status, and correlationId to the user.

The triggerDeploy action requires an admin token and may return 403 Forbidden if called with a regular user token.

Configure tool namespace based on available domain:
- Primary: signal_q_example_com__jit_plugin
- Fallback: signal_q_catnip_pieces1_workers_dev__jit_plugin

All actions except version require Bearer authentication. Never echo or log the actual token values.

For error responses, look for the correlationId field to help with debugging.
```

## Environment Variables

The GPT runtime should inject these tokens from secrets:
- `{SIGNALQ_API_TOKEN}` - For regular user actions
- `{SIGNALQ_ADMIN_TOKEN}` - For admin actions like deploy

## Testing Tools

You can test these bindings manually:

```bash
# Test version (no auth)
curl https://signal_q.catnip-pieces1.workers.dev/version

# Test system health
curl -X POST -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  https://signal_q.catnip-pieces1.workers.dev/actions/system_health

# Test deploy (may require admin token)
curl -X POST -H "Authorization: Bearer $SIGNALQ_ADMIN_TOKEN" \
  https://signal_q.catnip-pieces1.workers.dev/actions/deploy
```