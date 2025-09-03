/**
 * End-to-end test for conversational engine integration
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

test('Integration: Discovery endpoint with conversational engine', async () => {
  // Import the discovery endpoint handler
  const { handleDiscoveryInquiry } = await import('../src/ark/endpoints.js');
  
  // Mock environment with conversational engine enabled
  const mockEnv = {
    ENABLE_CONVERSATIONAL_ENGINE: '1',
    PRESS_BASE: '1', 
    PRESS_MAX: '4',
    OVERWHELM_SENSITIVITY: '0.5',
    AQUIL_MEMORIES: {
      get: async () => null,
      put: async () => {}
    }
  };
  
  // Mock request object
  const mockRequest = {
    json: async () => ({
      topic: "I guess maybe I should do something about my goals",
      context: { input: "I guess maybe I should do something about my goals" },
      session_id: 'test-session-123'
    })
  };
  
  // Call the handler
  const response = await handleDiscoveryInquiry(mockRequest, mockEnv);
  const result = await response.json();
  
  // Verify response structure
  assert(typeof result === 'object', 'Expected object result');
  assert(typeof result.inquiry === 'string', 'Expected inquiry string');
  assert(typeof result.voice_used === 'string', 'Expected voice_used string');
  
  // When engine is active, should have additional fields
  if (result.engine_active) {
    assert(Array.isArray(result.questions), 'Expected questions array when engine active');
    assert(typeof result.press_level === 'number', 'Expected press_level when engine active');
    assert(result.questions.length <= 3, 'Expected ≤3 questions from engine');
  }
  
  console.log('Discovery endpoint response:', result);
});

test('Integration: Discovery endpoint without conversational engine', async () => {
  // Import the discovery endpoint handler
  const { handleDiscoveryInquiry } = await import('../src/ark/endpoints.js');
  
  // Mock environment with conversational engine disabled
  const mockEnv = {
    ENABLE_CONVERSATIONAL_ENGINE: '0', // Disabled
  };
  
  // Mock request object
  const mockRequest = {
    json: async () => ({
      topic: "I want to explore my patterns",
      context: { input: "I want to explore my patterns" },
      session_id: 'test-session-456'
    })
  };
  
  // Call the handler
  const response = await handleDiscoveryInquiry(mockRequest, mockEnv);
  const result = await response.json();
  
  // Should use standard processing
  assert(typeof result === 'object', 'Expected object result');
  assert(typeof result.inquiry === 'string', 'Expected inquiry string');
  assert(typeof result.voice_used === 'string', 'Expected voice_used string');
  assert(!result.engine_active, 'Engine should not be active');
  
  console.log('Standard discovery response:', result);
});

console.log('✅ Integration tests completed');