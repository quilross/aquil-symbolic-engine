import { test } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * D1 Fail-Open Behavior Tests
 * Tests that D1 failures don't break logging and proper metrics are recorded
 */

test('D1 outage simulation - fail-open behavior', async () => {
  let missingStoreWriteCalls = 0;
  let circuitBreakerCalls = 0;
  
  // Mock environment with failing D1
  const mockEnv = {
    AQUIL_DB: {
      prepare: () => {
        throw new Error('D1 database unavailable');
      }
    },
    AQUIL_MEMORIES: {
      get: async () => null,
      put: async () => true
    }
  };
  
  // Mock metrics and circuit breaker functions
  const mockUtils = {
    'utils/metrics.js': {
      incrementMissingStoreWrite: (env, store) => {
        missingStoreWriteCalls++;
        assert.equal(store, 'd1', 'Should record missing write for d1 store');
      }
    },
    'utils/ops-middleware.js': {
      checkStoreCircuitBreaker: async (env, store) => {
        circuitBreakerCalls++;
        return { open: false, shouldSkip: false };
      },
      recordStoreFailure: async (env, store) => {
        assert.equal(store, 'd1', 'Should record failure for d1 store');
      }
    }
  };
  
  // Simulate the D1 logging logic with mocked dependencies
  async function simulateD1Write(env) {
    try {
      // Check circuit breaker
      const { checkStoreCircuitBreaker, recordStoreFailure } = mockUtils['utils/ops-middleware.js'];
      const { shouldSkip } = await checkStoreCircuitBreaker(env, 'd1');
      
      if (shouldSkip) {
        // Circuit breaker open - track missing store write
        const { incrementMissingStoreWrite } = mockUtils['utils/metrics.js'];
        incrementMissingStoreWrite(env, 'd1');
        return "circuit_breaker_open";
      } else {
        // Try D1 insert
        try {
          await env.AQUIL_DB.prepare("INSERT OR IGNORE INTO metamorphic_logs (...)")
            .bind('test-id', new Date().toISOString())
            .run();
          return "ok";
        } catch (primaryError) {
          // Record store failure for circuit breaker
          await recordStoreFailure(env, 'd1');
          
          // Track missing store write (fail-open)
          const { incrementMissingStoreWrite } = mockUtils['utils/metrics.js'];
          incrementMissingStoreWrite(env, 'd1');
          
          return String(primaryError);
        }
      }
    } catch (e) {
      return String(e);
    }
  }
  
  // Execute the test
  const result = await simulateD1Write(mockEnv);
  
  // Verify fail-open behavior
  assert.equal(circuitBreakerCalls, 1, 'Circuit breaker should be checked');
  assert.equal(missingStoreWriteCalls, 1, 'Missing store write metric should be incremented');
  assert.equal(result, 'Error: D1 database unavailable', 'Should return error message but not throw');
});

test('D1 circuit breaker open - skip write and record metric', async () => {
  let missingStoreWriteCalls = 0;
  
  // Mock circuit breaker returning "open" state
  const mockUtils = {
    'utils/ops-middleware.js': {
      checkStoreCircuitBreaker: async (env, store) => {
        return { open: true, shouldSkip: true };
      }
    },
    'utils/metrics.js': {
      incrementMissingStoreWrite: (env, store) => {
        missingStoreWriteCalls++;
        assert.equal(store, 'd1', 'Should record missing write for d1 store');
      }
    }
  };
  
  // Simulate circuit breaker behavior
  async function simulateCircuitBreakerSkip(env) {
    const { checkStoreCircuitBreaker } = mockUtils['utils/ops-middleware.js'];
    const { shouldSkip } = await checkStoreCircuitBreaker(env, 'd1');
    
    if (shouldSkip) {
      const { incrementMissingStoreWrite } = mockUtils['utils/metrics.js'];
      incrementMissingStoreWrite(env, 'd1');
      return "circuit_breaker_open";
    }
    
    return "ok";
  }
  
  const result = await simulateCircuitBreakerSkip({});
  
  // Verify circuit breaker behavior
  assert.equal(result, "circuit_breaker_open", 'Should return circuit breaker status');
  assert.equal(missingStoreWriteCalls, 1, 'Should record missing store write metric');
});

test('Stores array tracking with partial failures', () => {
  // Test the stores array logic when some stores fail
  const mockStatus = {
    d1: "ok",
    kv: "Error: KV unavailable", 
    r2: "ok",
    vector: "circuit_breaker_open"
  };
  
  // Simulate the stores tracking logic
  const stores = [];
  const missingStores = [];
  const circuitBreakerOpen = [];
  
  if (mockStatus.d1 === "ok" || mockStatus.d1 === "ok_fallback") stores.push('d1');
  else if (mockStatus.d1) missingStores.push('d1');
  
  if (mockStatus.kv === "ok") stores.push('kv');
  else if (mockStatus.kv && mockStatus.kv !== "circuit_breaker_open") missingStores.push('kv');
  
  if (mockStatus.r2 === "ok") stores.push('r2');
  else if (mockStatus.r2 && mockStatus.r2 !== "circuit_breaker_open") missingStores.push('r2');
  
  if (mockStatus.vector === "ok") stores.push('vector');
  else if (mockStatus.vector && mockStatus.vector !== "circuit_breaker_open") missingStores.push('vector');
  
  if (mockStatus.d1 === "circuit_breaker_open") circuitBreakerOpen.push('d1');
  if (mockStatus.kv === "circuit_breaker_open") circuitBreakerOpen.push('kv');
  if (mockStatus.r2 === "circuit_breaker_open") circuitBreakerOpen.push('r2');
  if (mockStatus.vector === "circuit_breaker_open") circuitBreakerOpen.push('vector');
  
  // Verify correct categorization
  assert.deepEqual(stores, ['d1', 'r2'], 'Should include only successful stores');
  assert.deepEqual(missingStores, ['kv'], 'Should include failed stores');
  assert.deepEqual(circuitBreakerOpen, ['vector'], 'Should include circuit breaker open stores');
});

test('Oversized payload handling with R2 overflow', async () => {
  let r2StoreSuccess = false;
  let r2Key = null;
  
  // Mock R2 storage
  const mockR2 = {
    put: async (key, data, options) => {
      r2StoreSuccess = true;
      r2Key = key;
      return true;
    }
  };
  
  // Simulate oversized payload logic
  function handleOversizedPayload(payload, maxBytes, r2Available) {
    const payloadStr = JSON.stringify(payload);
    const payloadSize = new TextEncoder().encode(payloadStr).length;
    
    if (payloadSize > maxBytes) {
      if (r2Available) {
        // Move to R2
        const artifactKey = `overflow/${new Date().toISOString().split('T')[0]}/test.json`;
        
        // Simulate R2 storage
        mockR2.put(artifactKey, payloadStr, {
          httpMetadata: { contentType: 'application/json' }
        });
        
        return {
          finalPayload: {
            _original_size: payloadSize,
            summary: `Payload too large (${payloadSize} bytes) - stored in R2`,
            content_preview: (payload.content || '').substring(0, 200) + '...'
          },
          r2Status: 'success',
          artifactKey
        };
      } else {
        // Truncate payload
        return {
          finalPayload: {
            _payload_truncated: true,
            _original_size: payloadSize,
            summary: `Payload truncated (${payloadSize} > ${maxBytes} bytes)`,
            content: payloadStr.substring(0, maxBytes - 500) + '... [TRUNCATED]'
          },
          r2Status: 'unavailable_truncated',
          artifactKey: null
        };
      }
    }
    
    return {
      finalPayload: payload,
      r2Status: null,
      artifactKey: null
    };
  }
  
  // Test with oversized payload and R2 available
  const largePayload = { content: 'x'.repeat(20000) }; // 20KB
  const result = handleOversizedPayload(largePayload, 16384, true);
  
  assert.ok(r2StoreSuccess, 'Should store in R2');
  assert.ok(r2Key, 'Should have R2 key');
  assert.equal(result.r2Status, 'success', 'Should indicate R2 success');
  assert.ok(result.artifactKey, 'Should have artifact key');
  assert.ok(result.finalPayload._original_size > 16384, 'Should record original size');
  
  // Test with oversized payload and R2 unavailable
  const truncateResult = handleOversizedPayload(largePayload, 16384, false);
  
  assert.equal(truncateResult.r2Status, 'unavailable_truncated', 'Should indicate truncation');
  assert.equal(truncateResult.artifactKey, null, 'Should not have artifact key');
  assert.ok(truncateResult.finalPayload._payload_truncated, 'Should indicate truncation');
});