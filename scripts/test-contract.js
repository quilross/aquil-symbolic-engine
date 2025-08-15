#!/usr/bin/env node

/**
 * Contract tests for Signal Q API
 * Tests that validate the expected structure and behavior of key endpoints
 * 
 * Usage:
 *   node scripts/test-contract.js
 *   node scripts/test-contract.js --base https://signal-q.me --token abc123
 *   BASE_URL=https://signal-q.me SIGNALQ_API_TOKEN=abc123 node scripts/test-contract.js
 */

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && i + 1 < args.length) {
      parsed.base = args[i + 1];
      i++;
    } else if (args[i] === '--token' && i + 1 < args.length) {
      parsed.token = args[i + 1];
      i++;
    }
  }
  
  return parsed;
}

const cliArgs = parseArgs();
const BASE_URL = cliArgs.base || process.env.BASE_URL || 'http://localhost:8787';
const TOKEN = cliArgs.token || process.env.SIGNALQ_API_TOKEN || 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';

console.log('🧪 Running Signal Q Contract Tests');
console.log(`📡 Base URL: ${BASE_URL}`);
console.log(`🔑 Token: ${TOKEN ? '[SET]' : '[NOT SET]'}`);
console.log('');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

function assertKeys(obj, keys, path = '') {
  keys.forEach(key => {
    const fullPath = path ? `${path}.${key}` : key;
    assert(obj.hasOwnProperty(key), `Has required key: ${fullPath}`);
  });
}

async function testSystemHealth() {
  console.log('🏥 Testing POST /actions/system_health');
  
  try {
    const response = await fetch(`${BASE_URL}/actions/system_health`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    assert(response.status === 200, 'system_health returns 200 OK');
    
    const data = await response.json();
    
    // Assert required keys
    assertKeys(data, ['status', 'timestamp', 'worker', 'version']);
    
    // Assert status is "healthy"
    assert(data.status === 'healthy', 'system_health status is "healthy"');
    
    console.log(`   📊 Response: ${JSON.stringify(data)}`);
    
  } catch (error) {
    console.log(`❌ system_health test failed: ${error.message}`);
    failed++;
  }
  
  console.log('');
}

async function testProbeIdentity() {
  console.log('🔍 Testing POST /actions/probe_identity');
  
  try {
    const response = await fetch(`${BASE_URL}/actions/probe_identity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    assert(response.status === 200, 'probe_identity returns 200 OK');
    
    const data = await response.json();
    
    // Assert required keys
    assertKeys(data, ['probe', 'timestamp', 'analysis']);
    assertKeys(data.analysis, ['stability', 'coherence', 'authenticity', 'recommendation'], 'analysis');
    
    console.log(`   📊 Response: ${JSON.stringify(data)}`);
    
  } catch (error) {
    console.log(`❌ probe_identity test failed: ${error.message}`);
    failed++;
  }
  
  console.log('');
}

async function runTests() {
  await testSystemHealth();
  await testProbeIdentity();
  
  console.log('📋 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
