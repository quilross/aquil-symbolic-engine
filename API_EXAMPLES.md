# API Usage Examples

## 🔗 cURL Examples

### Public Endpoints (No Authentication)

```bash
# Get version information
curl https://signal_q.catnip-pieces1.workers.dev/version

# Expected response:
{
  "version": "2.1.0",
  "gitSha": "abc123def456",
  "buildTime": "2025-01-01T12:00:00.000Z",
  "environment": "production"
}
```

### Protected Endpoints (Bearer Authentication)

```bash
# Health check with USER token
curl -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  https://signal_q.catnip-pieces1.workers.dev/system/health

# Expected response:
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

```bash
# Admin reset with ADMIN token
curl -X POST \
  -H "Authorization: Bearer sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2" \
  https://signal_q.catnip-pieces1.workers.dev/admin/reset

# Expected response:
{
  "status": "admin_reset_ok",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "version": "2.1.0"
}
```

### Action Endpoints

```bash
# List all available actions
curl -X POST \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  https://signal_q.catnip-pieces1.workers.dev/actions/list

# Probe identity
curl -X POST \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -d '{"context": "testing"}' \
  https://signal_q.catnip-pieces1.workers.dev/actions/probe_identity
```

## 🔧 JavaScript SDK Examples

### Basic Usage

```javascript
// Import the SDK
const SignalQClient = require('./sdk/signal-q-client.js');

// Create client instance
const client = new SignalQClient({
  baseUrl: 'https://signal_q.catnip-pieces1.workers.dev',
  token: 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h'
});

// Basic operations
async function basicExample() {
  try {
    // Get version (public endpoint)
    const version = await client.version();
    console.log('Version:', version.version);
    
    // Check health
    const health = await client.health();
    console.log('Health:', health.overall);
    
    // Probe identity
    const probe = await client.probeIdentity({ context: 'example' });
    console.log('Identity:', probe.probe);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Advanced Usage

```javascript
async function advancedExample() {
  const client = new SignalQClient({
    baseUrl: 'https://signal_q.catnip-pieces1.workers.dev',
    token: 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h',
    timeout: 10000 // 10 second timeout
  });

  try {
    // List all available actions
    const actions = await client.listActions();
    console.log('Available actions:', actions.actions.length);
    
    // Custom action invocation
    const result = await client.action('system_health');
    console.log('System health:', result);
    
    // Raw request with custom headers
    const response = await client.request('/system/health', {
      method: 'GET',
      headers: {
        'X-Custom-Header': 'example'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Raw response:', data);
    }
    
  } catch (error) {
    console.error('Advanced error:', error.message);
    // Error includes correlation ID if it's a problem+json response
  }
}
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Signal Q Browser Example</title>
</head>
<body>
    <div id="output"></div>
    
    <script src="./sdk/signal-q-client.js"></script>
    <script>
        async function testAPI() {
            const client = new SignalQClient({
                baseUrl: 'https://signal_q.catnip-pieces1.workers.dev',
                token: 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h'
            });
            
            const output = document.getElementById('output');
            
            try {
                // Test version endpoint (no auth required)
                const version = await client.version();
                output.innerHTML += `<p>Version: ${version.version}</p>`;
                
                // Test health endpoint (auth required)
                const health = await client.health();
                output.innerHTML += `<p>Health: ${health.overall}</p>`;
                
                // Test identity probe
                const probe = await client.probeIdentity();
                output.innerHTML += `<p>Identity: ${probe.probe}</p>`;
                
            } catch (error) {
                output.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
        
        // Run test when page loads
        testAPI();
    </script>
</body>
</html>
```

### Error Handling

```javascript
async function errorHandlingExample() {
  const client = new SignalQClient({
    baseUrl: 'https://signal_q.catnip-pieces1.workers.dev',
    token: 'invalid_token'
  });

  try {
    await client.health();
  } catch (error) {
    // SDK automatically parses problem+json errors
    console.error('Error message:', error.message);
    // Example: "Invalid Credentials: The provided Bearer token is not valid (Correlation: 123e4567...)"
    
    // Extract correlation ID for debugging
    const correlationMatch = error.message.match(/Correlation: ([^)]+)/);
    if (correlationMatch) {
      console.log('Correlation ID:', correlationMatch[1]);
    }
  }
}
```

## 🐍 Python Examples

```python
import requests
import json

class SignalQClient:
    def __init__(self, base_url, token, timeout=30):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'SignalQ-Python/1.0'
        })
    
    def version(self):
        """Get version information (public endpoint)"""
        response = self.session.get(f'{self.base_url}/version', timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def health(self):
        """Check system health"""
        response = self.session.get(f'{self.base_url}/system/health', timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def probe_identity(self, context=None):
        """Probe identity status"""
        data = {'context': context} if context else {}
        response = self.session.post(
            f'{self.base_url}/actions/probe_identity',
            json=data,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

# Usage example
def main():
    client = SignalQClient(
        base_url='https://signal_q.catnip-pieces1.workers.dev',
        token='sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h'
    )
    
    try:
        # Test version
        version = client.version()
        print(f"Version: {version['version']}")
        
        # Test health
        health = client.health()
        print(f"Health: {health['overall']}")
        
        # Test identity probe
        probe = client.probe_identity(context="python-example")
        print(f"Identity: {probe['probe']}")
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e.response, 'json'):
            try:
                error_data = e.response.json()
                if 'correlationId' in error_data:
                    print(f"Correlation ID: {error_data['correlationId']}")
            except:
                pass

if __name__ == '__main__':
    main()
```

## 🔨 Shell Script Examples

### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Comprehensive API health verification

BASE_URL="https://signal_q.catnip-pieces1.workers.dev"
TOKEN="sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h"

echo "🏥 Signal Q Health Check"
echo "======================="

# Test version endpoint (public)
echo "📦 Version check..."
VERSION_RESPONSE=$(curl -s "$BASE_URL/version")
if [ $? -eq 0 ]; then
    echo "✅ Version endpoint accessible"
    echo "$VERSION_RESPONSE" | jq .
else
    echo "❌ Version endpoint failed"
    exit 1
fi

# Test health endpoint (auth required)
echo -e "\n🔍 Health check..."
HEALTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/system/health")
if [ $? -eq 0 ]; then
    HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r .overall)
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo "✅ System healthy"
        echo "$HEALTH_RESPONSE" | jq .
    else
        echo "⚠️ System unhealthy: $HEALTH_STATUS"
        exit 1
    fi
else
    echo "❌ Health check failed"
    exit 1
fi

# Test identity probe
echo -e "\n🤖 Identity probe..."
PROBE_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"context":"health-check"}' "$BASE_URL/actions/probe_identity")
if [ $? -eq 0 ]; then
    echo "✅ Identity probe successful"
    echo "$PROBE_RESPONSE" | jq .probe
else
    echo "❌ Identity probe failed"
    exit 1
fi

echo -e "\n🎉 All health checks passed!"
```

### Batch Operations Script

```bash
#!/bin/bash
# batch-operations.sh - Perform multiple API operations

BASE_URL="https://signal_q.catnip-pieces1.workers.dev"
TOKEN="sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h"

echo "🔄 Batch Operations"
echo "=================="

# Array of actions to test
ACTIONS=("list" "probe_identity" "system_health")

for action in "${ACTIONS[@]}"; do
    echo "🔧 Testing action: $action"
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}' \
        "$BASE_URL/actions/$action")
    
    if [ $? -eq 0 ]; then
        echo "✅ Action $action successful"
        # Print first 100 characters of response
        echo "   Response: $(echo "$RESPONSE" | cut -c1-100)..."
    else
        echo "❌ Action $action failed"
    fi
    
    echo
done

echo "🏁 Batch operations complete"
```

## 🧪 Testing Examples

### Jest Test Suite

```javascript
// __tests__/signal-q-api.test.js
const SignalQClient = require('../sdk/signal-q-client.js');

describe('Signal Q API', () => {
  let client;
  
  beforeEach(() => {
    client = new SignalQClient({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:8788',
      token: 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h'
    });
  });

  test('version endpoint should return version information', async () => {
    const version = await client.version();
    
    expect(version).toHaveProperty('version');
    expect(version).toHaveProperty('gitSha');
    expect(version).toHaveProperty('buildTime');
    expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('health endpoint should return healthy status', async () => {
    const health = await client.health();
    
    expect(health).toHaveProperty('overall', 'healthy');
    expect(health).toHaveProperty('api');
    expect(health).toHaveProperty('storage');
    expect(health).toHaveProperty('timestamp');
  });

  test('probe identity should return probe information', async () => {
    const probe = await client.probeIdentity({ context: 'test' });
    
    expect(probe).toHaveProperty('probe');
    expect(probe).toHaveProperty('timestamp');
    expect(probe).toHaveProperty('friction');
    expect(Array.isArray(probe.friction)).toBe(true);
  });

  test('invalid token should throw authentication error', async () => {
    const badClient = new SignalQClient({
      baseUrl: client.baseUrl,
      token: 'invalid_token'
    });

    await expect(badClient.health()).rejects.toThrow(/Invalid Credentials/);
  });
});
```

Run with: `npm test` (after setting up Jest in package.json)