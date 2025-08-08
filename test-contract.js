#!/usr/bin/env node

/**
 * Contract tests for Signal Q API
 * Tests that validate the expected structure and behavior of key endpoints
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';
const TOKEN = process.env.SIGNALQ_API_TOKEN || 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';

console.log('🧪 Running Signal Q Contract Tests');
console.log(`📡 Base URL: ${BASE_URL}`);
console.log(`🔑 Token: ${TOKEN.substring(0, 10)}...`);
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