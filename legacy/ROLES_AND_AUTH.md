# Authentication, Roles, and Error Handling

## 🔑 Authentication Overview

Signal Q API uses Bearer token authentication with two role levels:

- **USER** (`$SIGNALQ_API_TOKEN*`): Standard API access for most operations
- **ADMIN** (`$SIGNALQ_ADMIN_TOKEN*`): Administrative operations and elevated permissions

## 👥 Role Definitions

### USER Role (`$SIGNALQ_API_TOKEN*`)
**Token Pattern:** `$SIGNALQ_API_TOKEN[32-char-alphanumeric]`  
**Example:** `$SIGNALQ_API_TOKEN`

**Permitted Operations:**
- ✅ `/system/health` - Health monitoring
- ✅ `/actions/*` - All action endpoints (no auth required)
- ✅ `/version` - Version information (public)
- ✅ Identity and symbolic operations
- ✅ Data logging and retrieval
- ❌ `/admin/*` - Administrative operations (403 Forbidden)

### ADMIN Role (`$SIGNALQ_ADMIN_TOKEN*`)
**Token Pattern:** `$SIGNALQ_ADMIN_TOKEN[32-char-alphanumeric]`  
**Example:** `$SIGNALQ_ADMIN_TOKEN`

**Permitted Operations:**
- ✅ All USER role operations
- ✅ `/admin/reset` - System reset operations
- ✅ `/export-logs` - Export user data (with token validation)
- ✅ Administrative data access
- ✅ System configuration changes

## 🛡️ Route Permission Matrix

| Route | Method | USER | ADMIN | Public | Auth Required |
|-------|--------|------|-------|--------|---------------|
| `/version` | GET | ✅ | ✅ | ✅ | No |
| `/system/health` | GET | ✅ | ✅ | ❌ | Yes |
| `/actions/*` | POST | ✅ | ✅ | ✅ | No |
| `/admin/reset` | POST | ❌ | ✅ | ❌ | Yes (Admin) |
| `/export-logs` | GET | ❌ | ✅ | ❌ | Yes (Admin) |
| All other routes | * | ✅ | ✅ | ❌ | Yes |

## 📋 Error Response Format

### Problem+JSON Standard

All error responses use the RFC 7807 Problem Details format:

```http
Content-Type: application/problem+json
X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
```

```json
{
  "type": "about:blank",
  "title": "Authentication Required",
  "detail": "Bearer token is required to access this endpoint",
  "status": 401,
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 401 Unauthorized Examples

**Missing Token:**
```bash
curl https://signal-q.me/system/health
```

```json
{
  "type": "about:blank",
  "title": "Authentication Required",
  "detail": "Bearer token is required to access this endpoint",
  "status": 401,
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Invalid Token:**
```bash
curl -H "Authorization: Bearer invalid_token_123" \
  https://signal-q.me/system/health
```

```json
{
  "type": "about:blank",
  "title": "Invalid Credentials",
  "detail": "The provided Bearer token is not valid",
  "status": 401,
  "correlationId": "456e7890-e89b-12d3-a456-426614174001",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 403 Forbidden Examples

**User Token on Admin Endpoint:**
```bash
curl -X POST \
  -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  https://signal-q.me/admin/reset
```

```json
{
  "type": "about:blank",
  "title": "Insufficient Permissions",
  "detail": "This endpoint requires admin privileges. User tokens are not permitted.",
  "status": 403,
  "correlationId": "789e0123-e89b-12d3-a456-426614174002",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 🔧 Error Handling Middleware

### Implementation Example

```javascript
// Error handling middleware for consistent problem+json responses
function createProblemResponse(title, detail, status = 500, correlationId = null) {
  const problemData = {
    type: "about:blank",
    title,
    detail,
    status,
    correlationId: correlationId || crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(problemData), {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Correlation-ID': problemData.correlationId,
      ...corsHeaders()
    }
  });
}

// Usage in request handlers
if (!token) {
  return createProblemResponse(
    'Authentication Required',
    'Bearer token is required to access this endpoint',
    401
  );
}

if (token !== SIGNALQ_ADMIN_TOKEN) {
  return createProblemResponse(
    'Insufficient Permissions',
    'This endpoint requires admin privileges. User tokens are not permitted.',
    403
  );
}
```

## 🧪 Testing Authentication

### Valid Requests
```bash
# USER token - health check
curl -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  https://signal-q.me/system/health

# ADMIN token - reset operation
curl -X POST \
  -H "Authorization: Bearer $SIGNALQ_ADMIN_TOKEN" \
  https://signal-q.me/admin/reset
```

### Error Testing
```bash
# Test 401 - no token
curl https://signal-q.me/system/health

# Test 401 - invalid token  
curl -H "Authorization: Bearer invalid_token" \
  https://signal-q.me/system/health

# Test 403 - user token on admin endpoint
curl -X POST \
  -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
  https://signal-q.me/admin/reset
```

## 🔍 Correlation ID Tracking

Every error response includes a unique `correlationId` for debugging:

- **Header:** `X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000`
- **Body:** `"correlationId": "123e4567-e89b-12d3-a456-426614174000"`

Use this ID when reporting issues or debugging authentication problems.

## 🛠️ JavaScript Client Integration

The SDK automatically handles problem+json errors:

```javascript
const client = new SignalQClient({
  baseUrl: 'https://signal-q.me',
  token: '$SIGNALQ_API_TOKEN'
});

try {
  const health = await client.health();
} catch (error) {
  // Error message includes correlation ID:
  // "Invalid Credentials: The provided Bearer token is not valid (Correlation: 123e4567...)"
  console.error(error.message);
}
