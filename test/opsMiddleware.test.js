import { test } from 'node:test';
import { strict as assert } from 'node:assert';

test('ops middleware modules load', async () => {
  // Test that ops middleware modules can be imported
  const { rateLimitMiddleware, requestSizeMiddleware, addSecurityHeaders } = await import('../src/utils/ops-middleware.js');
  
  assert(typeof rateLimitMiddleware === 'function');
  assert(typeof requestSizeMiddleware === 'function');
  assert(typeof addSecurityHeaders === 'function');
});

test('metrics helpers load', async () => {
  // Test that new metrics helpers can be imported
  const { incrementStoreCircuitOpen, incrementRateLimitExceeded, incrementRequestSizeExceeded } = await import('../src/utils/metrics.js');
  
  assert(typeof incrementStoreCircuitOpen === 'function');
  assert(typeof incrementRateLimitExceeded === 'function');
  assert(typeof incrementRequestSizeExceeded === 'function');
});

test('enhanced CORS helpers load', async () => {
  // Test that enhanced CORS helpers can be imported
  const { getCORSHeaders } = await import('../src/utils/cors.js');
  
  assert(typeof getCORSHeaders === 'function');
});

test('ops wrapper loads', async () => {
  // Test that ops wrapper can be imported
  const { withOpsChecks } = await import('../src/utils/ops-wrapper.js');
  
  assert(typeof withOpsChecks === 'function');
});

test('rate limit middleware basic functionality', async () => {
  // Test basic rate limit middleware with mock environment
  const { rateLimitMiddleware } = await import('../src/utils/ops-middleware.js');
  
  const mockReq = {
    headers: {
      get: (name) => {
        if (name === 'CF-Connecting-IP') return '127.0.0.1';
        return null;
      }
    }
  };
  
  const mockEnv = {
    ENABLE_RATE_LIMIT: '0', // Disabled, should return null
    RATE_LIMIT_RPS: '10',
    RATE_LIMIT_BURST: '20'
  };
  
  const result = await rateLimitMiddleware(mockReq, mockEnv);
  assert(result === null, 'Should return null when rate limiting is disabled');
});

test('request size middleware basic functionality', async () => {
  // Test basic request size middleware with mock environment
  const { requestSizeMiddleware } = await import('../src/utils/ops-middleware.js');
  
  const mockReq = {
    headers: {
      get: (name) => {
        if (name === 'Content-Length') return '1000'; // Small request
        return null;
      }
    }
  };
  
  const mockEnv = {
    ENABLE_REQ_SIZE_CAP: '0', // Disabled
    REQ_SIZE_BYTES: '500' // Smaller than request, but disabled
  };
  
  const result = await requestSizeMiddleware(mockReq, mockEnv);
  assert(result === null, 'Should return null when size cap is disabled');
});

test('circuit breaker basic functionality', async () => {
  // Test basic circuit breaker functionality
  const { checkStoreCircuitBreaker } = await import('../src/utils/ops-middleware.js');
  
  const mockEnv = {
    ENABLE_STORE_BREAKER: '0', // Disabled
    BREAKER_THRESHOLD: '5'
  };
  
  const result = await checkStoreCircuitBreaker(mockEnv, 'd1');
  assert(result.open === false, 'Circuit breaker should be closed when disabled');
  assert(result.shouldSkip === false, 'Should not skip when disabled');
});

test('security headers functionality', async () => {
  // Test security headers addition
  const { addSecurityHeaders } = await import('../src/utils/ops-middleware.js');
  
  const mockResponse = new Response(JSON.stringify({test: true}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  
  const mockEnv = {
    ENABLE_SECURITY_HEADERS: '1',
    ENABLE_HSTS: '0'
  };
  
  const result = addSecurityHeaders(mockResponse, mockEnv);
  assert(result.headers.get('X-Content-Type-Options') === 'nosniff');
  assert(result.headers.get('X-Frame-Options') === 'DENY');
  assert(result.headers.get('Referrer-Policy') === 'no-referrer');
  assert(result.headers.get('Strict-Transport-Security') === null, 'HSTS should not be set when disabled');
});