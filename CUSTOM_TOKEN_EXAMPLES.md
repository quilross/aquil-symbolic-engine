# Custom Token Management - Signal Q

## Overview
Custom tokens allow you to create personalized authentication tokens with specific permissions, expiry dates, and usage restrictions for accessing your Signal Q API.

## Quick Start

### 1. Generate a Custom Token
```bash
curl -X POST https://signal_q.catnip-pieces1.workers.dev/tokens/generate \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{
    "tokenName": "My Personal Token",
    "description": "Token for my mobile app",
    "expiryDays": 90,
    "permissions": ["read:basic", "write:memories", "execute:protocols"],
    "rateLimitPerHour": 50
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "sq_custom_aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW",
  "tokenId": "aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW",
  "name": "My Personal Token",
  "permissions": ["read:basic", "write:memories", "execute:protocols"],
  "expiresAt": "2025-10-30T12:00:00.000Z",
  "usage": "Authorization: Bearer sq_custom_aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW",
  "security": {
    "storeSecurely": "This token will not be shown again",
    "permissions": "Token has limited permissions as specified",
    "expiry": "Token will expire automatically"
  }
}
```

### 2. Use Your Custom Token
```bash
curl -X GET https://signal_q.catnip-pieces1.workers.dev/identity-nodes \
  -H "Authorization: Bearer sq_custom_aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW" \
  -H "X-User-Id: your-user-id"
```

### 3. List Your Tokens
```bash
curl -X GET https://signal_q.catnip-pieces1.workers.dev/tokens/list \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "X-User-Id: your-user-id"
```

### 4. Revoke a Token
```bash
curl -X POST https://signal_q.catnip-pieces1.workers.dev/tokens/revoke \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{
    "tokenId": "aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW",
    "reason": "No longer needed"
  }'
```

## Token Permissions

### Read Permissions
- `read:basic` - Basic information access
- `read:identity` - Identity nodes and profiles
- `read:memories` - Memory logs and experiences
- `read:protocols` - Protocol definitions
- `read:analytics` - Usage analytics
- `read:system` - System health information

### Write Permissions
- `write:memories` - Create memory logs
- `write:feedback` - Submit feedback
- `write:protocols` - Create custom protocols
- `write:settings` - Update user settings
- `write:identity` - Create identity nodes

### Execute Permissions
- `execute:protocols` - Run protocols and rituals
- `execute:rituals` - Trigger ritual actions
- `execute:ai-enhance` - Use AI-enhanced features
- `execute:deploy` - Access deployment features

### Admin Permissions
- `admin:export` - Export user data
- `admin:reset` - Reset user data
- `admin:tokens` - Manage all tokens

## Token Settings

### View Current Settings
```bash
curl -X GET https://signal_q.catnip-pieces1.workers.dev/tokens/settings \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "X-User-Id: your-user-id"
```

### Update Settings
```bash
curl -X POST https://signal_q.catnip-pieces1.workers.dev/tokens/settings \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{
    "maxTokensPerUser": 15,
    "defaultExpiryDays": 60,
    "rateLimitingEnabled": true
  }'
```

## Advanced Features

### IP Whitelisting
```bash
curl -X POST https://signal_q.catnip-pieces1.workers.dev/tokens/generate \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{
    "tokenName": "Office Computer Token",
    "permissions": ["read:basic", "write:memories"],
    "ipWhitelist": ["192.168.1.100", "203.0.113.0/24"],
    "rateLimitPerHour": 200
  }'
```

### Endpoint Restrictions
```bash
curl -X POST https://signal_q.catnip-pieces1.workers.dev/tokens/generate \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{
    "tokenName": "Read-Only Token",
    "permissions": ["read:basic", "read:identity"],
    "allowedEndpoints": ["/identity-nodes", "/logs", "/gene-key-guidance"]
  }'
```

### Token Validation
```bash
curl -X POST https://signal_q.catnip-pieces1.workers.dev/tokens/validate \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{
    "token": "sq_custom_aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW"
  }'
```

## Token Status Types

- **active** - Recently used and functioning
- **dormant** - Not used in 7+ days but still valid
- **inactive** - Not used in 30+ days
- **unused** - Never been used since creation
- **expired** - Past expiration date
- **revoked** - Manually deactivated

## Security Best Practices

1. **Use Descriptive Names** - Name tokens based on their purpose
2. **Set Expiry Dates** - Use temporary tokens for temporary access
3. **Minimal Permissions** - Only grant necessary permissions
4. **Regular Cleanup** - Revoke unused tokens periodically
5. **IP Whitelisting** - Restrict access to specific networks when possible
6. **Rate Limiting** - Set appropriate usage limits
7. **Monitor Usage** - Check token activity regularly

## Use Cases

### Mobile App Token
```json
{
  "tokenName": "iPhone Signal Q App",
  "permissions": ["read:basic", "write:memories", "execute:protocols"],
  "expiryDays": 365,
  "rateLimitPerHour": 100
}
```

### Integration Token
```json
{
  "tokenName": "Zapier Integration",
  "permissions": ["read:analytics", "write:feedback"],
  "expiryDays": 180,
  "rateLimitPerHour": 50
}
```

### Development Token
```json
{
  "tokenName": "Testing Environment",
  "permissions": ["read:basic", "read:system"],
  "expiryDays": 30,
  "rateLimitPerHour": 1000
}
```

### Guest Access Token
```json
{
  "tokenName": "Friend Demo Access",
  "permissions": ["read:basic"],
  "expiryDays": 7,
  "rateLimitPerHour": 20
}
```

## Troubleshooting

### Common Errors

**401 Unauthorized - Invalid Token**
- Check token format (should start with `sq_custom_`)
- Verify token hasn't been revoked
- Check expiration date

**403 Forbidden - Permission Denied**
- Verify token has required permissions for the endpoint
- Check if endpoint is in allowedEndpoints list

**429 Too Many Requests**
- Rate limit exceeded for the hour
- Wait for next hour or request rate limit increase

**Token Validation Failed**
- Use `/tokens/validate` to check token status
- Review token permissions and restrictions

### Support

For token-related issues:
1. Check token status with `/tokens/validate`
2. Review token list with `/tokens/list`
3. Check system health with `/system/health`
4. Contact support with token ID (never share the actual token)

---

*Your custom tokens provide secure, controlled access to Signal Q while maintaining your data sovereignty and privacy.*
