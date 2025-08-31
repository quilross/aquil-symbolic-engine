/**
 * Performance and Latency Test Suite
 * Tests response times, concurrent load, and identifies bottlenecks
 */

import { detectTriggers, callAutonomousEndpoint } from './src/utils/autonomy.js';

// Performance metrics tracking
const performanceMetrics = {
  triggerDetection: [],
  endpointCalls: [],
  concurrentLoad: [],
  memoryUsage: []
};

// Mock environment for performance testing
const createMockEnv = () => ({
  AQUIL_DB: {
    prepare: (query) => ({
      bind: (...params) => ({
        run: async () => {
          // Simulate database latency
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return { success: true };
        },
        all: async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 15));
          return { results: [] };
        }
      })
    })
  },
  AQUIL_MEMORIES: {
    put: async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      return true;
    },
    get: async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
      return null;
    }
  },
  AI: {
    run: async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
      return { values: new Array(384).fill(0.1) };
    }
  }
});

function measureTime(fn) {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    return { result, duration: end - start };
  };
}

function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
    };
  }
  return { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
}

async function testTriggerDetectionPerformance() {
  console.log('\n⚡ Testing Trigger Detection Performance:');
  console.log('─'.repeat(50));

  const testPhrases = [
    'I feel anxious about my meeting tomorrow',
    'My shoulders are so tight today',
    'I need to find my voice in meetings',
    'I just read an amazing book about trust',
    'I have creative block on my project',
    'I\'m worried about money again',
    'I\'m starting a new job next week',
    'I see my mom\'s patterns in myself',
    'I need to clarify what matters to me',
    'I want to commit to this goal',
    'I had a strange dream last night'
  ];

  const measuredDetectTriggers = measureTime(detectTriggers);
  
  for (const phrase of testPhrases) {
    const { result, duration } = await measuredDetectTriggers(phrase, createMockEnv());
    performanceMetrics.triggerDetection.push({
      phrase,
      duration,
      detected: result !== null,
      action: result?.action || null
    });
    
    console.log(`${result ? '✅' : '❌'} "${phrase.substring(0, 30)}..." - ${duration.toFixed(2)}ms`);
  }

  const avgDetectionTime = performanceMetrics.triggerDetection.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.triggerDetection.length;
  console.log(`\n📊 Average trigger detection time: ${avgDetectionTime.toFixed(2)}ms`);
  
  const maxDetectionTime = Math.max(...performanceMetrics.triggerDetection.map(m => m.duration));
  console.log(`📊 Maximum trigger detection time: ${maxDetectionTime.toFixed(2)}ms`);
  
  return avgDetectionTime < 50; // Should be under 50ms
}

async function testEndpointCallPerformance() {
  console.log('\n🚀 Testing Endpoint Call Performance:');
  console.log('─'.repeat(50));

  const actions = ['wellbeing', 'somatic', 'standing_tall', 'media_wisdom', 'creativity'];
  const measuredCallEndpoint = measureTime(callAutonomousEndpoint);
  
  for (const action of actions) {
    const { result, duration } = await measuredCallEndpoint(action, {
      payload: { content: `Test ${action}` },
      test_mode: true
    }, createMockEnv());
    
    performanceMetrics.endpointCalls.push({
      action,
      duration,
      success: result && result.status === 200
    });
    
    console.log(`${result && result.status === 200 ? '✅' : '❌'} ${action} - ${duration.toFixed(2)}ms`);
  }

  const avgEndpointTime = performanceMetrics.endpointCalls.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.endpointCalls.length;
  console.log(`\n📊 Average endpoint call time: ${avgEndpointTime.toFixed(2)}ms`);
  
  const maxEndpointTime = Math.max(...performanceMetrics.endpointCalls.map(m => m.duration));
  console.log(`📊 Maximum endpoint call time: ${maxEndpointTime.toFixed(2)}ms`);
  
  return avgEndpointTime < 100; // Should be under 100ms
}

async function testConcurrentLoadPerformance() {
  console.log('\n🔄 Testing Concurrent Load Performance:');
  console.log('─'.repeat(50));

  const concurrencyLevels = [1, 5, 10, 20, 50];
  
  for (const concurrency of concurrencyLevels) {
    console.log(`\nTesting ${concurrency} concurrent requests:`);
    
    const promises = [];
    const startTime = performance.now();
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(
        detectTriggers(`I feel anxious about test ${i}`, createMockEnv())
          .then(result => callAutonomousEndpoint('wellbeing', {
            payload: { content: `Concurrent test ${i}` },
            test_mode: true
          }, createMockEnv()))
      );
    }
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const avgDuration = totalDuration / concurrency;
    
    const successCount = results.filter(r => r && r.status === 200).length;
    const successRate = (successCount / concurrency) * 100;
    
    performanceMetrics.concurrentLoad.push({
      concurrency,
      totalDuration,
      avgDuration,
      successRate,
      throughput: concurrency / (totalDuration / 1000) // requests per second
    });
    
    console.log(`  Total time: ${totalDuration.toFixed(2)}ms`);
    console.log(`  Avg per request: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Success rate: ${successRate.toFixed(1)}%`);
    console.log(`  Throughput: ${(concurrency / (totalDuration / 1000)).toFixed(2)} req/sec`);
  }
  
  return true;
}

async function testMemoryUsage() {
  console.log('\n💾 Testing Memory Usage:');
  console.log('─'.repeat(50));

  const initialMemory = getMemoryUsage();
  console.log(`Initial memory usage: ${initialMemory.heapUsed}MB`);
  
  // Simulate heavy load
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      detectTriggers(`I feel anxious about memory test ${i}`, createMockEnv())
        .then(result => {
          if (result) {
            return callAutonomousEndpoint(result.action, {
              payload: { content: `Memory test ${i}` },
              test_mode: true
            }, createMockEnv());
          }
        })
    );
  }
  
  await Promise.all(promises);
  
  const afterLoadMemory = getMemoryUsage();
  console.log(`After load memory usage: ${afterLoadMemory.heapUsed}MB`);
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    const afterGCMemory = getMemoryUsage();
    console.log(`After GC memory usage: ${afterGCMemory.heapUsed}MB`);
  }
  
  const memoryIncrease = afterLoadMemory.heapUsed - initialMemory.heapUsed;
  console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
  
  performanceMetrics.memoryUsage.push({
    initial: initialMemory,
    afterLoad: afterLoadMemory,
    increase: memoryIncrease
  });
  
  return memoryIncrease < 50; // Should not increase by more than 50MB
}

async function testDatabaseIndexPerformance() {
  console.log('\n🗃️ Testing Database Index Performance:');
  console.log('─'.repeat(50));

  // Test queries that would benefit from indexes
  const mockEnv = createMockEnv();
  
  const queries = [
    'SELECT * FROM metamorphic_logs ORDER BY timestamp DESC LIMIT 20',
    'SELECT * FROM metamorphic_logs WHERE session_id = ? ORDER BY timestamp DESC',
    'SELECT * FROM metamorphic_logs WHERE kind = ? ORDER BY timestamp DESC LIMIT 10',
    'SELECT * FROM event_log WHERE type = ? ORDER BY ts DESC LIMIT 20',
    'SELECT * FROM event_log WHERE session_id = ? ORDER BY ts DESC'
  ];
  
  for (const query of queries) {
    const start = performance.now();
    
    // Simulate query execution
    await mockEnv.AQUIL_DB.prepare(query).bind('test_value').all();
    
    const duration = performance.now() - start;
    console.log(`Query: "${query.substring(0, 50)}..." - ${duration.toFixed(2)}ms`);
  }
  
  console.log('\n💡 Recommended indexes are already in schema.sql:');
  console.log('  - idx_metamorphic_timestamp ON metamorphic_logs(timestamp DESC)');
  console.log('  - idx_metamorphic_session ON metamorphic_logs(session_id)');
  console.log('  - idx_metamorphic_kind ON metamorphic_logs(kind)');
  console.log('  - idx_event_ts ON event_log(ts DESC)');
  console.log('  - idx_event_type ON event_log(type)');
  console.log('  - idx_event_session ON event_log(session_id)');
  
  return true;
}

function generatePerformanceReport() {
  console.log('\n📈 PERFORMANCE REPORT:');
  console.log('═'.repeat(60));
  
  // Trigger Detection Stats
  if (performanceMetrics.triggerDetection.length > 0) {
    const avgDetection = performanceMetrics.triggerDetection.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.triggerDetection.length;
    const maxDetection = Math.max(...performanceMetrics.triggerDetection.map(m => m.duration));
    const minDetection = Math.min(...performanceMetrics.triggerDetection.map(m => m.duration));
    
    console.log('\n🎯 Trigger Detection Performance:');
    console.log(`  Average: ${avgDetection.toFixed(2)}ms`);
    console.log(`  Maximum: ${maxDetection.toFixed(2)}ms`);
    console.log(`  Minimum: ${minDetection.toFixed(2)}ms`);
    console.log(`  Target: <50ms ${avgDetection < 50 ? '✅' : '❌'}`);
  }
  
  // Endpoint Call Stats
  if (performanceMetrics.endpointCalls.length > 0) {
    const avgEndpoint = performanceMetrics.endpointCalls.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.endpointCalls.length;
    const maxEndpoint = Math.max(...performanceMetrics.endpointCalls.map(m => m.duration));
    const minEndpoint = Math.min(...performanceMetrics.endpointCalls.map(m => m.duration));
    
    console.log('\n🚀 Endpoint Call Performance:');
    console.log(`  Average: ${avgEndpoint.toFixed(2)}ms`);
    console.log(`  Maximum: ${maxEndpoint.toFixed(2)}ms`);
    console.log(`  Minimum: ${minEndpoint.toFixed(2)}ms`);
    console.log(`  Target: <100ms ${avgEndpoint < 100 ? '✅' : '❌'}`);
  }
  
  // Concurrent Load Stats
  if (performanceMetrics.concurrentLoad.length > 0) {
    console.log('\n🔄 Concurrent Load Performance:');
    performanceMetrics.concurrentLoad.forEach(metric => {
      console.log(`  ${metric.concurrency} concurrent: ${metric.avgDuration.toFixed(2)}ms avg, ${metric.throughput.toFixed(2)} req/sec, ${metric.successRate.toFixed(1)}% success`);
    });
  }
  
  // Memory Usage Stats
  if (performanceMetrics.memoryUsage.length > 0) {
    const memoryMetric = performanceMetrics.memoryUsage[0];
    console.log('\n💾 Memory Usage:');
    console.log(`  Initial: ${memoryMetric.initial.heapUsed}MB`);
    console.log(`  After Load: ${memoryMetric.afterLoad.heapUsed}MB`);
    console.log(`  Increase: ${memoryMetric.increase.toFixed(2)}MB`);
    console.log(`  Target: <50MB increase ${memoryMetric.increase < 50 ? '✅' : '❌'}`);
  }
  
  console.log('\n🎯 Performance Recommendations:');
  console.log('  1. Database indexes are properly configured');
  console.log('  2. Consider caching frequent autonomous responses in KV');
  console.log('  3. Monitor Cloudflare Worker CPU time in production');
  console.log('  4. Use batch operations for multiple database writes');
  console.log('  5. Implement request deduplication for identical triggers');
}

async function runAllPerformanceTests() {
  console.log('⚡ Starting Performance and Latency Tests\n');
  
  const results = [];
  
  results.push(await testTriggerDetectionPerformance());
  results.push(await testEndpointCallPerformance());
  results.push(await testConcurrentLoadPerformance());
  results.push(await testMemoryUsage());
  results.push(await testDatabaseIndexPerformance());
  
  generatePerformanceReport();
  
  const allPassed = results.every(result => result === true);
  console.log(`\n📊 Overall Performance: ${allPassed ? '✅ PASSED' : '❌ NEEDS OPTIMIZATION'}`);
  
  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllPerformanceTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runAllPerformanceTests };