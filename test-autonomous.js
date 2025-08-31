/**
 * Comprehensive Autonomous Logic Validation Test
 * Tests all keyword triggers, scheduled actions, and edge cases
 */

import { detectTriggers, callAutonomousEndpoint, AUTONOMOUS_TRIGGERS } from './src/utils/autonomy.js';

// Mock environment for testing
const mockEnv = {
  AQUIL_DB: {
    prepare: (query) => ({
      bind: (...params) => ({
        run: async () => ({ success: true }),
        all: async () => ({ results: [] })
      })
    })
  },
  AQUIL_MEMORIES: {
    put: async () => true,
    get: async () => null
  },
  AI: {
    run: async () => ({ values: new Array(384).fill(0.1) })
  }
};

// Test cases for each trigger category
const testCases = {
  wellbeing: [
    "I feel so anxious about my meeting tomorrow",
    "I'm really stressed about this project",
    "I have so much doubt about my abilities",
    "I feel uncertain about my future",
    "I'm overwhelmed with everything right now"
  ],
  somatic: [
    "My shoulders are so tight today",
    "I have a terrible headache",
    "My chest feels constricted",
    "I can't breathe properly",
    "My whole body is tense"
  ],
  standing_tall: [
    "I feel so small in meetings",
    "I'm intimidated by my boss",
    "I need to find my voice",
    "I feel powerless in this situation",
    "I keep shrinking when I should speak up"
  ],
  media_wisdom: [
    "I just read an amazing book about trust",
    "I watched a documentary that really moved me",
    "I listened to a podcast about personal growth",
    "This movie made me think about my life",
    "The article I read changed my perspective"
  ],
  creativity: [
    "I'm stuck on my creative project",
    "I have writer's block again",
    "I can't seem to create anything good",
    "I feel blocked artistically",
    "I need inspiration for my art"
  ],
  abundance: [
    "I'm worried about money again",
    "I feel broke and stressed",
    "I need to increase my rates",
    "I have scarcity mindset issues",
    "Financial stress is overwhelming me"
  ],
  transitions: [
    "I'm starting a new job next week",
    "We're moving to a new city",
    "This is a major life change for me",
    "I'm in a transition phase",
    "Everything is shifting in my life"
  ],
  ancestry: [
    "I see my mom's patterns in myself",
    "This feels like generational trauma",
    "My family dynamics are affecting me",
    "I inherited this from my parents",
    "There's a pattern in my lineage"
  ],
  values: [
    "I need to clarify what matters to me",
    "This decision goes against my values",
    "I'm not sure what's important anymore",
    "I need to prioritize better",
    "What are my core principles?"
  ],
  goals: [
    "I want to commit to this goal",
    "I need to make progress on my objectives",
    "What's my next step forward?",
    "I want to achieve something meaningful",
    "I need to set better targets"
  ],
  dreams: [
    "I had a strange dream last night",
    "I keep having recurring nightmares",
    "My dreams have been so symbolic lately",
    "I dreamed about flying again",
    "This dream felt really significant"
  ]
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

async function runTest(category, testPhrase, expectedAction) {
  try {
    console.log(`Testing: "${testPhrase}"`);
    const trigger = await detectTriggers(testPhrase, mockEnv);
    
    if (!trigger) {
      testResults.failed++;
      testResults.details.push({
        category,
        phrase: testPhrase,
        expected: expectedAction,
        actual: null,
        status: 'FAILED - No trigger detected'
      });
      console.log(`❌ FAILED: No trigger detected for "${testPhrase}"`);
      return false;
    }
    
    if (trigger.action !== expectedAction) {
      testResults.failed++;
      testResults.details.push({
        category,
        phrase: testPhrase,
        expected: expectedAction,
        actual: trigger.action,
        status: 'FAILED - Wrong action'
      });
      console.log(`❌ FAILED: Expected "${expectedAction}", got "${trigger.action}"`);
      return false;
    }
    
    // Test autonomous endpoint call
    const response = await callAutonomousEndpoint(trigger.action, {
      payload: { content: testPhrase },
      trigger_keywords: trigger.keywords,
      test_mode: true
    }, mockEnv);
    
    if (!response || response.status !== 200) {
      testResults.failed++;
      testResults.details.push({
        category,
        phrase: testPhrase,
        expected: expectedAction,
        actual: trigger.action,
        status: 'FAILED - Endpoint call failed'
      });
      console.log(`❌ FAILED: Endpoint call failed for "${trigger.action}"`);
      return false;
    }
    
    testResults.passed++;
    testResults.details.push({
      category,
      phrase: testPhrase,
      expected: expectedAction,
      actual: trigger.action,
      status: 'PASSED',
      confidence: trigger.confidence,
      keywords: trigger.keywords
    });
    console.log(`✅ PASSED: "${testPhrase}" → ${trigger.action} (confidence: ${trigger.confidence.toFixed(2)})`);
    return true;
    
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      category,
      phrase: testPhrase,
      expected: expectedAction,
      actual: null,
      status: `FAILED - Error: ${error.message}`
    });
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Autonomous Logic Validation Tests\n');
  
  for (const [category, phrases] of Object.entries(testCases)) {
    console.log(`\n📋 Testing ${category.toUpperCase()} triggers:`);
    console.log('─'.repeat(50));
    
    for (const phrase of phrases) {
      await runTest(category, phrase, category);
    }
  }
  
  // Test edge cases
  console.log('\n🔍 Testing Edge Cases:');
  console.log('─'.repeat(50));
  
  // Empty string
  const emptyResult = await detectTriggers('', mockEnv);
  if (emptyResult === null) {
    console.log('✅ PASSED: Empty string returns null');
    testResults.passed++;
  } else {
    console.log('❌ FAILED: Empty string should return null');
    testResults.failed++;
  }
  
  // Non-string input
  const nonStringResult = await detectTriggers(123, mockEnv);
  if (nonStringResult === null) {
    console.log('✅ PASSED: Non-string input returns null');
    testResults.passed++;
  } else {
    console.log('❌ FAILED: Non-string input should return null');
    testResults.failed++;
  }
  
  // Multiple triggers in one phrase
  const multiTrigger = await detectTriggers('I feel anxious and my body is tense', mockEnv);
  if (multiTrigger && (multiTrigger.action === 'wellbeing' || multiTrigger.action === 'somatic')) {
    console.log(`✅ PASSED: Multiple triggers detected first match: ${multiTrigger.action}`);
    testResults.passed++;
  } else {
    console.log('❌ FAILED: Multiple triggers should detect at least one');
    testResults.failed++;
  }
  
  // Print final results
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status.includes('FAILED'))
      .forEach(test => {
        console.log(`  • ${test.category}: "${test.phrase}" - ${test.status}`);
      });
  }
  
  return testResults.failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runAllTests, testCases, testResults };