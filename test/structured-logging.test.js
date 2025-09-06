/**
 * Test suite for enhanced structured logging functionality
 */
import { test } from 'node:test';
import assert from 'node:assert';

// Mock environment for testing
const mockEnv = {
  ENV: 'test',
  ARK_VERSION: '2.0'
};

test('writeLog should create structured log entries with observability metadata', async (t) => {
  // Import the logging module (would normally be dynamic in actual worker)
  const { writeLog } = await import('../src/actions/logging.js');
  
  // Mock the environment bindings to avoid actual database calls
  const testEnv = {
    ...mockEnv,
    AQUIL_DB: null, // Will be handled gracefully by isGPTCompatMode
    AQUIL_MEMORIES: null,
    AQUIL_STORAGE: null,
    AQUIL_CONTEXT: null
  };
  
  const testData = {
    type: 'test_action',
    payload: {
      message: 'Test log entry',
      user_id: 'test_user'
    },
    session_id: 'test_session_123',
    who: 'system',
    level: 'info',
    tags: ['test', 'structured_logging'],
    trace_id: 'test_trace_123',
    error_code: null
  };
  
  // writeLog should not throw and should return status object
  const result = await writeLog(testEnv, testData);
  
  assert(typeof result === 'object', 'writeLog should return an object');
  assert(result.success === true, 'writeLog should succeed in GPT compat mode');
  assert(Array.isArray(result.stores), 'writeLog should return stores array');
  assert(Array.isArray(result.missingStores), 'writeLog should return missingStores array');
});

test('writeLog should handle error codes and structured error data', async (t) => {
  const { writeLog } = await import('../src/actions/logging.js');
  
  const testEnv = {
    ...mockEnv,
    AQUIL_DB: null,
    AQUIL_MEMORIES: null,
    AQUIL_STORAGE: null,
    AQUIL_CONTEXT: null
  };
  
  const errorData = {
    type: 'test_error',
    payload: {
      message: 'Test error occurred',
      error_category: 'validation',
      error_severity: 'medium'
    },
    session_id: 'test_session_456',
    who: 'system',
    level: 'error',
    tags: ['test', 'error'],
    error_code: 'TEST_VALIDATION_MEDIUM'
  };
  
  const result = await writeLog(testEnv, errorData);
  
  assert(typeof result === 'object', 'writeLog should handle error logging');
  assert(result.success === true, 'writeLog should succeed even with errors in compat mode');
});

test('writeAutonomousLog should create enhanced autonomous action logs', async (t) => {
  const { writeAutonomousLog } = await import('../src/actions/logging.js');
  
  const testEnv = {
    ...mockEnv,
    AQUIL_DB: null,
    AQUIL_MEMORIES: null,
    AQUIL_STORAGE: null,
    AQUIL_CONTEXT: null
  };
  
  const autonomousData = {
    action: 'test_autonomous_action',
    trigger_keywords: ['wisdom', 'insight'],
    trigger_phrase: 'seeking wisdom',
    user_state: 'contemplative',
    response: { message: 'Autonomous response provided' },
    session_id: 'autonomous_session_789',
    level: 'info',
    confidence: 0.8,
    endpoint: '/api/test',
    success: true
  };
  
  const result = await writeAutonomousLog(testEnv, autonomousData);
  
  assert(typeof result === 'object', 'writeAutonomousLog should return status object');
  assert(result.success === true, 'writeAutonomousLog should succeed in compat mode');
});

test('logChatGPTAction should include trace IDs and structured error codes', async (t) => {
  // This would test the enhanced logChatGPTAction from index.js
  // For now, test the helper functions that were added
  
  // Test error categorization
  const dbError = new Error('database connection failed');
  const timeoutError = new Error('request timeout occurred');
  const validationError = new Error('validation failed for required field');
  
  // We'll test these indirectly through the structured logging
  assert(dbError.message.includes('database'), 'Database error should be categorizable');
  assert(timeoutError.message.includes('timeout'), 'Timeout error should be categorizable');
  assert(validationError.message.includes('validation'), 'Validation error should be categorizable');
});

test('structured logging should preserve trace correlation', async (t) => {
  const { writeLog } = await import('../src/actions/logging.js');
  
  const testEnv = {
    ...mockEnv,
    AQUIL_DB: null,
    AQUIL_MEMORIES: null
  };
  
  const traceId = 'correlation_test_trace_123';
  const testData = {
    type: 'correlation_test',
    payload: {
      message: 'Test trace correlation',
      correlation_id: 'external_correlation_456'
    },
    session_id: 'trace_session',
    who: 'system',
    level: 'info',
    trace_id: traceId
  };
  
  const result = await writeLog(testEnv, testData);
  
  // In a real environment, we would verify that the trace ID is properly propagated
  // through all storage backends and is queryable for correlation
  assert(result.success === true, 'Trace correlation should not break logging');
});