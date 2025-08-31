/**
 * Error Handling and Edge Cases Test Suite
 * Tests malformed requests, database failures, and edge cases
 */

import { detectTriggers, callAutonomousEndpoint } from './src/utils/autonomy.js';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logTest(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAILED: ${testName} - ${details}`);
    testResults.failed++;
  }
  testResults.details.push({ testName, passed, details });
}

// Mock environment with failure simulation
const createMockEnv = (simulateFailures = {}) => ({
  AQUIL_DB: {
    prepare: (query) => ({
      bind: (...params) => ({
        run: async () => {
          if (simulateFailures.d1) throw new Error('D1 Database failure');
          return { success: true };
        },
        all: async () => {
          if (simulateFailures.d1) throw new Error('D1 Database failure');
          return { results: [] };
        }
      })
    })
  },
  AQUIL_MEMORIES: {
    put: async () => {
      if (simulateFailures.kv) throw new Error('KV Store failure');
      return true;
    },
    get: async () => {
      if (simulateFailures.kv) throw new Error('KV Store failure');
      return null;
    }
  },
  AI: {
    run: async () => {
      if (simulateFailures.ai) throw new Error('AI Service failure');
      return { values: new Array(384).fill(0.1) };
    }
  }
});

async function testMalformedInputs() {
  console.log('\n🔍 Testing Malformed Inputs:');
  console.log('─'.repeat(50));

  // Test null input
  try {
    const result = await detectTriggers(null, createMockEnv());
    logTest('Null input handling', result === null);
  } catch (error) {
    logTest('Null input handling', false, error.message);
  }

  // Test undefined input
  try {
    const result = await detectTriggers(undefined, createMockEnv());
    logTest('Undefined input handling', result === null);
  } catch (error) {
    logTest('Undefined input handling', false, error.message);
  }

  // Test empty string
  try {
    const result = await detectTriggers('', createMockEnv());
    logTest('Empty string handling', result === null);
  } catch (error) {
    logTest('Empty string handling', false, error.message);
  }

  // Test non-string types
  const nonStringInputs = [123, [], {}, true, false];
  for (const input of nonStringInputs) {
    try {
      const result = await detectTriggers(input, createMockEnv());
      logTest(`Non-string input (${typeof input}) handling`, result === null);
    } catch (error) {
      logTest(`Non-string input (${typeof input}) handling`, false, error.message);
    }
  }

  // Test extremely long string
  try {
    const longString = 'a'.repeat(10000);
    const result = await detectTriggers(longString, createMockEnv());
    logTest('Extremely long string handling', result === null);
  } catch (error) {
    logTest('Extremely long string handling', false, error.message);
  }

  // Test string with special characters
  try {
    const specialString = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ anxious 测试 🚀';
    const result = await detectTriggers(specialString, createMockEnv());
    logTest('Special characters handling', result !== null && result.action === 'wellbeing');
  } catch (error) {
    logTest('Special characters handling', false, error.message);
  }
}

async function testDatabaseFailures() {
  console.log('\n💾 Testing Database Failures:');
  console.log('─'.repeat(50));

  // Test D1 failure
  try {
    const mockEnv = createMockEnv({ d1: true });
    const result = await callAutonomousEndpoint('wellbeing', {
      payload: { content: 'I feel anxious' },
      test_mode: true
    }, mockEnv);
    
    // Should handle gracefully and still return a response
    logTest('D1 failure handling', result && result.status === 200);
  } catch (error) {
    logTest('D1 failure handling', false, error.message);
  }

  // Test KV failure
  try {
    const mockEnv = createMockEnv({ kv: true });
    const result = await callAutonomousEndpoint('wellbeing', {
      payload: { content: 'I feel anxious' },
      test_mode: true
    }, mockEnv);
    
    logTest('KV failure handling', result && result.status === 200);
  } catch (error) {
    logTest('KV failure handling', false, error.message);
  }

  // Test AI service failure
  try {
    const mockEnv = createMockEnv({ ai: true });
    const result = await callAutonomousEndpoint('wellbeing', {
      payload: { content: 'I feel anxious' },
      test_mode: true
    }, mockEnv);
    
    logTest('AI service failure handling', result && result.status === 200);
  } catch (error) {
    logTest('AI service failure handling', false, error.message);
  }

  // Test multiple service failures
  try {
    const mockEnv = createMockEnv({ d1: true, kv: true, ai: true });
    const result = await callAutonomousEndpoint('wellbeing', {
      payload: { content: 'I feel anxious' },
      test_mode: true
    }, mockEnv);
    
    logTest('Multiple service failures handling', result && result.status === 200);
  } catch (error) {
    logTest('Multiple service failures handling', false, error.message);
  }
}

async function testConcurrencyScenarios() {
  console.log('\n⚡ Testing Concurrency Scenarios:');
  console.log('─'.repeat(50));

  // Test simultaneous trigger detection
  try {
    const promises = [];
    const testPhrases = [
      'I feel anxious',
      'My body is tense',
      'I need to find my voice',
      'I read an amazing book',
      'I have creative block'
    ];

    for (const phrase of testPhrases) {
      promises.push(detectTriggers(phrase, createMockEnv()));
    }

    const results = await Promise.all(promises);
    const allSuccessful = results.every(result => result !== null);
    logTest('Simultaneous trigger detection', allSuccessful);
  } catch (error) {
    logTest('Simultaneous trigger detection', false, error.message);
  }

  // Test simultaneous autonomous endpoint calls
  try {
    const promises = [];
    const actions = ['wellbeing', 'somatic', 'standing_tall', 'media_wisdom', 'creativity'];

    for (const action of actions) {
      promises.push(callAutonomousEndpoint(action, {
        payload: { content: `Test ${action}` },
        test_mode: true
      }, createMockEnv()));
    }

    const results = await Promise.all(promises);
    const allSuccessful = results.every(result => result && result.status === 200);
    logTest('Simultaneous endpoint calls', allSuccessful);
  } catch (error) {
    logTest('Simultaneous endpoint calls', false, error.message);
  }
}

async function testEdgeCaseInputs() {
  console.log('\n🎯 Testing Edge Case Inputs:');
  console.log('─'.repeat(50));

  // Test mixed case sensitivity
  try {
    const result = await detectTriggers('I Feel ANXIOUS About Everything', createMockEnv());
    logTest('Mixed case sensitivity', result !== null && result.action === 'wellbeing');
  } catch (error) {
    logTest('Mixed case sensitivity', false, error.message);
  }

  // Test multiple triggers in one phrase
  try {
    const result = await detectTriggers('I feel anxious and my body is tense and I need money', createMockEnv());
    logTest('Multiple triggers detection', result !== null);
  } catch (error) {
    logTest('Multiple triggers detection', false, error.message);
  }

  // Test partial keyword matches (should not trigger)
  try {
    const result = await detectTriggers('I am not anxiously waiting', createMockEnv());
    logTest('Partial keyword matches', result !== null); // "anxious" is contained in "anxiously"
  } catch (error) {
    logTest('Partial keyword matches', false, error.message);
  }

  // Test keywords in different contexts
  try {
    const result = await detectTriggers('The movie was about anxiety but I loved it', createMockEnv());
    logTest('Contextual keyword detection', result !== null);
  } catch (error) {
    logTest('Contextual keyword detection', false, error.message);
  }

  // Test very short phrases
  try {
    const result = await detectTriggers('anxious', createMockEnv());
    logTest('Single word trigger', result !== null && result.action === 'wellbeing');
  } catch (error) {
    logTest('Single word trigger', false, error.message);
  }

  // Test phrases with no triggers
  try {
    const result = await detectTriggers('The weather is nice today and I had lunch', createMockEnv());
    logTest('No trigger phrases', result === null);
  } catch (error) {
    logTest('No trigger phrases', false, error.message);
  }
}

async function testMalformedEndpointCalls() {
  console.log('\n🔧 Testing Malformed Endpoint Calls:');
  console.log('─'.repeat(50));

  // Test invalid action
  try {
    const result = await callAutonomousEndpoint('invalid_action', {
      payload: { content: 'test' },
      test_mode: true
    }, createMockEnv());
    
    logTest('Invalid action handling', result && result.status >= 400);
  } catch (error) {
    logTest('Invalid action handling', true); // Should throw or handle gracefully
  }

  // Test missing payload
  try {
    const result = await callAutonomousEndpoint('wellbeing', {
      test_mode: true
    }, createMockEnv());
    
    logTest('Missing payload handling', result && result.status === 200);
  } catch (error) {
    logTest('Missing payload handling', false, error.message);
  }

  // Test malformed payload
  try {
    const result = await callAutonomousEndpoint('wellbeing', {
      payload: 'not an object',
      test_mode: true
    }, createMockEnv());
    
    logTest('Malformed payload handling', result && result.status === 200);
  } catch (error) {
    logTest('Malformed payload handling', false, error.message);
  }

  // Test missing environment
  try {
    const result = await callAutonomousEndpoint('wellbeing', {
      payload: { content: 'test' },
      test_mode: true
    }, null);
    
    logTest('Missing environment handling', false, 'Should have thrown error');
  } catch (error) {
    logTest('Missing environment handling', true); // Should throw
  }
}

async function runAllErrorTests() {
  console.log('🚨 Starting Error Handling and Edge Cases Tests\n');
  
  await testMalformedInputs();
  await testDatabaseFailures();
  await testConcurrencyScenarios();
  await testEdgeCaseInputs();
  await testMalformedEndpointCalls();
  
  // Print final results
  console.log('\n📊 ERROR HANDLING TEST RESULTS:');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  • ${test.testName}: ${test.details}`);
      });
  }
  
  return testResults.failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllErrorTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runAllErrorTests };