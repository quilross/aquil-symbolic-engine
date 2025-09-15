#!/usr/bin/env node

/**
 * Simple test to verify the logging endpoints are properly implemented
 */

import { loggingRouter } from './src/routes/logging.js';

// Mock environment for testing
const mockEnv = {
  AQUIL_MEMORIES: {
    put: (key, value, options) => {
      console.log(`✅ KV PUT: ${key} (${value.length} bytes)`);
      return Promise.resolve();
    },
    get: (key) => {
      console.log(`✅ KV GET: ${key}`);
      // Return mock data
      return Promise.resolve(JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'session',
        detail: 'test log entry',
        timestamp: new Date().toISOString(),
        storedIn: 'KV'
      }));
    }
  },
  AQUIL_DB: {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: () => {
          console.log(`✅ D1 EXEC: ${sql} with args: ${JSON.stringify(args)}`);
          return Promise.resolve({ success: true });
        }
      })
    }),
    exec: (sql) => {
      console.log(`✅ D1 EXEC: ${sql}`);
      return Promise.resolve();
    }
  }
};

// Mock request with valid log data
const createMockRequest = (data) => ({
  json: () => Promise.resolve(data),
  clone: () => createMockRequest(data),
  url: 'http://localhost/test'
});

// Test data - valid log entry
const validLogData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'session',
  detail: 'test log entry from automated test',
  timestamp: new Date().toISOString(),
  storedIn: 'KV'
};

const validD1LogData = {
  ...validLogData,
  storedIn: 'D1'
};

console.log('🧪 Testing Logging Endpoints Implementation\n');

// Test KV write endpoint
console.log('1. Testing /api/logs/kv-write endpoint...');
try {
  const req = createMockRequest(validLogData);
  const response = await loggingRouter.fetch(new Request('http://localhost/api/logs/kv-write', {
    method: 'POST',
    body: JSON.stringify(validLogData),
    headers: { 'Content-Type': 'application/json' }
  }), mockEnv);
  
  if (response.ok) {
    const result = await response.json();
    console.log('   Result:', result);
    if (result.ok && result.key && result.id) {
      console.log('   ✅ KV write endpoint working correctly\n');
    } else {
      console.log('   ❌ KV write endpoint returned unexpected format\n');
    }
  }
} catch (error) {
  console.log('   ❌ KV write endpoint failed:', error.message, '\n');
}

// Test D1 insert endpoint
console.log('2. Testing /api/logs/d1-insert endpoint...');
try {
  const response = await loggingRouter.fetch(new Request('http://localhost/api/logs/d1-insert', {
    method: 'POST',
    body: JSON.stringify(validD1LogData),
    headers: { 'Content-Type': 'application/json' }
  }), mockEnv);
  
  if (response.ok) {
    const result = await response.json();
    console.log('   Result:', result);
    if (result.ok && result.id) {
      console.log('   ✅ D1 insert endpoint working correctly\n');
    } else {
      console.log('   ❌ D1 insert endpoint returned unexpected format\n');
    }
  }
} catch (error) {
  console.log('   ❌ D1 insert endpoint failed:', error.message, '\n');
}

// Test promote endpoint
console.log('3. Testing /api/logs/promote endpoint...');
try {
  const promoteData = { id: '550e8400-e29b-41d4-a716-446655440000' };
  const response = await loggingRouter.fetch(new Request('http://localhost/api/logs/promote', {
    method: 'POST',
    body: JSON.stringify(promoteData),
    headers: { 'Content-Type': 'application/json' }
  }), mockEnv);
  
  if (response.ok) {
    const result = await response.json();
    console.log('   Result:', result);
    if (result.ok && result.promotedId) {
      console.log('   ✅ Promote endpoint working correctly\n');
    } else {
      console.log('   ❌ Promote endpoint returned unexpected format\n');
    }
  }
} catch (error) {
  console.log('   ❌ Promote endpoint failed:', error.message, '\n');
}

// Test retrieval-meta endpoint
console.log('4. Testing /api/logs/retrieval-meta endpoint...');
try {
  const metaData = { action: 'test_retrieval' };
  const response = await loggingRouter.fetch(new Request('http://localhost/api/logs/retrieval-meta', {
    method: 'POST',
    body: JSON.stringify(metaData),
    headers: { 'Content-Type': 'application/json' }
  }), mockEnv);
  
  if (response.ok) {
    const result = await response.json();
    console.log('   Result:', result);
    if (result.ok && result.lastRetrieved) {
      console.log('   ✅ Retrieval-meta endpoint working correctly\n');
    } else {
      console.log('   ❌ Retrieval-meta endpoint returned unexpected format\n');
    }
  }
} catch (error) {
  console.log('   ❌ Retrieval-meta endpoint failed:', error.message, '\n');
}

console.log('🎉 Logging endpoints implementation test completed!');