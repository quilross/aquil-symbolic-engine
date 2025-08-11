#!/usr/bin/env node

/**
 * Minimal Smoke Tests for Signal Q Worker
 * Tests canonical endpoints after runtime simplification (Aug 2025)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8788';
const USER_TOKEN = process.env.SIGNALQ_API_TOKEN || 'test-token';

console.log('💨 Signal Q Smoke Tests (Gene Keys Runtime)\n');
console.log(`🌐 API Base: ${BASE_URL}`);
console.log(`🔑 Token: [REDACTED]\n`);

async function smokeTest() {
  const tests = [
    {
      name: 'GET /version → 200 JSON with semver',
      test: async () => {
        const res = await fetch(`${BASE_URL}/version`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (!data.version || !data.version.match(/^\d+\.\d+\.\d+$/)) {
          throw new Error(`Invalid version format: ${data.version}`);
        }
        return data;
      }
    },
    {
      name: 'GET /system/health → 200 JSON with uptime/timestamp',
      test: async () => {
        const res = await fetch(`${BASE_URL}/system/health`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (!data.status || !data.timestamp) {
          throw new Error(`Missing status or timestamp: ${JSON.stringify(data)}`);
        }
        return data;
      }
    },
    {
      name: 'GET /actions/list with Bearer → 200',
      test: async () => {
        const res = await fetch(`${BASE_URL}/actions/list`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (!data.actions || !Array.isArray(data.actions)) {
          throw new Error(`Invalid actions response: ${JSON.stringify(data)}`);
        }
        return data;
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🔄 ${test.name}`);
      const result = await test.test();
      console.log(`✅ PASS`);
      results.push({ name: test.name, status: 'PASS', result });
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      results.push({ name: test.name, status: 'FAIL', error: error.message });
    }
  }

  console.log('\n📋 Smoke Test Summary:');
  console.log('==================================================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ All ${total} smoke tests passed!`);
    console.log('\n🎉 Gene Keys runtime is operational');
    return true;
  } else {
    console.log(`❌ ${total - passed}/${total} smoke tests failed!`);
    console.log('\n💥 Runtime needs attention');
    return false;
  }
}

// Run smoke tests
smokeTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Smoke test error:', error);
  process.exit(1);
});
