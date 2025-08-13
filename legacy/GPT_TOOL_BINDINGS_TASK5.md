# Signal Q GPT Tool Bindings Configuration

## Task 5: Bind all five actions for GPT under the existing namespace

### GPT Namespace
The tools should be added to the existing GPT namespace: `signal_q_me__jit_plugin`

### Required Tool Bindings

Configure these 6 tool bindings in your GPT tool/builder configuration:

#### 1. `version` - GET /version (Public)
- **Method**: GET
- **Path**: `/version`
- **Content-Type**: N/A (no body)
- **Authentication**: None required
- **Description**: Get version metadata including version number, git SHA, build time, and environment
- **Expected Success Shape**:
  ```json
  {
    "version": "2.1.0",
    "gitSha": "abc123def456",
    "buildTime": "2024-01-01T00:00:00.000Z",
    "environment": "production"
  }
  ```

#### 2. `listActions` - POST /actions/list
- **Method**: POST
- **Path**: `/actions/list`
- **Content-Type**: application/json
- **Authentication**: Bearer token (injected by tool system)
- **Request Body**: `{}` (optional)
- **Description**: List all available public actions for dynamic discovery
- **Expected Success Shape**:
  ```json
  {
    "actions": ["list", "system_health", "probe_identity", "recalibrate_state", "deploy"]
  }
  ```

#### 3. `systemHealth` - POST /actions/system_health
- **Method**: POST
- **Path**: `/actions/system_health`
- **Content-Type**: application/json
- **Authentication**: Bearer token (injected by tool system)
- **Request Body**: `{}` (optional)
- **Description**: Check system health status and version
- **Expected Success Shape**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "worker": "signal_q",
    "version": "v6.0"
  }
  ```

#### 4. `probeIdentity` - POST /actions/probe_identity
- **Method**: POST
- **Path**: `/actions/probe_identity`
- **Content-Type**: application/json
- **Authentication**: Bearer token (injected by tool system)
- **Request Body**: `{}` (optional)
- **Description**: Probe current identity status with enriched analysis
- **Expected Success Shape**:
  ```json
  {
    "probe": "Identity confirmed",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "analysis": {
      "stability": 0.92,
      "coherence": "high",
      "authenticity": 0.88,
      "recommendation": "Identity integration optimal - proceed with confidence"
    }
  }
  ```

#### 5. `recalibrateState` - POST /actions/recalibrate_state
- **Method**: POST
- **Path**: `/actions/recalibrate_state`
- **Content-Type**: application/json
- **Authentication**: Bearer token (injected by tool system)
- **Request Body**: `{}` (optional)
- **Description**: Recalibrate symbolic state and identity configuration
- **Expected Success Shape**:
  ```json
  {
    "state": "recalibrated",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "identity_key": "primary_manifester",
    "dominant_emotion": "clarity"
  }
  ```

#### 6. `triggerDeploy` - POST /actions/trigger_deploy
- **Method**: POST
- **Path**: `/actions/trigger_deploy`
- **Content-Type**: application/json
- **Authentication**: Bearer token (injected by tool system, may require admin token)
- **Request Body**: `{}` (optional)
- **Description**: Trigger deployment workflow (may require administrative privileges)
- **Expected Success Shape**:
  ```json
  {
    "deployment": "triggered",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

### Configuration Details

#### Base URL
```
https://signal-q.me
```

#### Authentication
- The tool system should inject `Authorization: Bearer {token}` header for all POST endpoints
- The token should be stored securely by the tool system and not echoed or logged
- For `/actions/trigger_deploy`, an admin token may be required if configured

#### Error Handling
All endpoints may return `application/problem+json` errors with:
```json
{
  "type": "about:blank",
  "title": "Error Title",
  "detail": "Error description",
  "status": 401,
  "correlationId": "uuid-here",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

When receiving such errors, the GPT should report the `title`, `detail`, `status`, and `X-Correlation-ID` header to the user.

#### Special Cases
- If `triggerDeploy` returns 403, report that admin privileges are required
- All timestamps are in ISO 8601 format
- Correlation IDs are provided in both the `X-Correlation-ID` header and response body

### GPT Instruction Text Update

Update your GPT instructions to include:

```
Use POST /actions/system_health for health checks, GET /version for metadata, and the other POST /actions/* endpoints as listed in your tools. If you receive application/problem+json responses, report the title, detail, status, and X-Correlation-ID to the user. The triggerDeploy action may require an admin token; if you receive a 403 response, inform the user that administrative privileges are required.
```

### Validation

After configuration, test each binding to ensure:
1. All 6 tools are callable from the GPT interface
2. Authentication is properly injected
3. Response shapes match expectations
4. Error handling works correctly
5. Correlation IDs are properly surfaced to users

### OpenAPI Schema
Use `worker/src/openapi-core.json` (OpenAPI 3.1.0) or `worker/src/openapi-core.yaml` (OpenAPI 3.0.3) for schema validation and tool generation if your GPT system supports it.
