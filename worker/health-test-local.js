#!/usr/bin/env node

/**
 * Comprehensive Health Endpoint Test Suite - Local Development Version
 * Tests the /system/health endpoint with various scenarios against local dev server
 */

const BASE_URL = 'http://localhost:8788';
const USER_TOKEN = 'dev-placeholder';
const ADMIN_TOKEN = 'dev-admin-placeholder';

console.log('🏥 Health Endpoint Test Suite (Local Dev Server)\n');
console.log(`🌐 API Base: ${BASE_URL}`);
console.log(`🔑 User Token: ${USER_TOKEN.substring(0, 15)}...`);
console.log(`👑 Admin Token: ${ADMIN_TOKEN.substring(0, 18)}...\n`);

const results = [];

async function testHealthEndpoint() {
  const tests = [
    {
      name: 'Version Endpoint (Public)',
      url: `${BASE_URL}/version`,
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: true,
      isVersion: true
    },
    {
      name: 'Valid User Token',
      url: `${BASE_URL}/system/health`,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Valid Admin Token', 
      url: `${BASE_URL}/system/health`,
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Invalid Token',
      url: `${BASE_URL}/system/health`,
      headers: { 'Authorization': 'Bearer invalid_token_123' },
      expectedStatus: 401,
      shouldHaveJson: false
    },
    {
      name: 'Missing Token',
      url: `${BASE_URL}/system/health`,
      headers: {},
      expectedStatus: 401,
      shouldHaveJson: false
    },
    {
      name: 'Malformed Auth Header',
      url: `${BASE_URL}/system/health`, 
      headers: { 'Authorization': 'InvalidFormat' },
      expectedStatus: 401,
      shouldHaveJson: false
    },
    {
      name: 'CORS Preflight',
      url: `${BASE_URL}/system/health`,
      method: 'OPTIONS',
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: false
    },
    {
      name: 'Case Sensitivity Test',
      url: `${BASE_URL}/System/Health`,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectedStatus: 404,
      shouldHaveJson: false
    },
    {
      name: 'Trailing Slash Test',
      url: `${BASE_URL}/system/health/`,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectedStatus: 200,
      shouldHaveJson: true
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔄 Testing: ${test.name}`);
      
      const options = {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      };

      const response = await fetch(test.url, options);
      const statusMatch = response.status === test.expectedStatus;
      
      let jsonData = null;
      let jsonValid = false;
      let hasRequiredFields = false;

      try {
        const text = await response.text();
        if (text) {
          jsonData = JSON.parse(text);
          jsonValid = true;
          
          if (test.shouldHaveJson && test.expectedStatus === 200) {
            if (test.isVersion) {
              hasRequiredFields = !!(
                jsonData.version &&
                jsonData.gitSha &&
                jsonData.buildTime
              );
            } else {
              hasRequiredFields = !!(
                jsonData.overall && 
                jsonData.api && 
                jsonData.storage && 
                jsonData.deployment &&
                jsonData.timestamp
              );
            }
          }
        }
      } catch (e) {
        // Not JSON or empty response
      }

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        statusMatch,
        expectedJson: test.shouldHaveJson,
        hasJson: jsonValid,
        hasRequiredFields,
        corsHeaders,
        data: jsonData,
        success: statusMatch && (!test.shouldHaveJson || hasRequiredFields)
      };

      results.push(result);

      if (result.success) {
        console.log(`✅ ${test.name}: PASS (${response.status})`);
        if (jsonData && result.hasRequiredFields) {
          if (test.isVersion) {
            console.log(`   📦 Version: ${jsonData.version}`);
            console.log(`   🔗 Git SHA: ${jsonData.gitSha}`);
            console.log(`   🏗️ Build Time: ${jsonData.buildTime}`);
          } else {
            console.log(`   📊 Overall: ${jsonData.overall}`);
            console.log(`   📡 API Status: ${jsonData.api?.status}`);
            console.log(`   💾 Storage: ${jsonData.storage?.status}`);
          }
        }
      } else {
        console.log(`❌ ${test.name}: FAIL (got ${response.status}, expected ${test.expectedStatus})`);
        if (test.shouldHaveJson && !jsonValid) {
          console.log(`   ⚠️  Expected JSON response but got invalid/no JSON`);
        }
        if (test.shouldHaveJson && jsonValid && !hasRequiredFields) {
          console.log(`   ⚠️  Missing required fields in response`);
          console.log(`   📄 Response: ${JSON.stringify(jsonData)}`);
        }
      }

    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        error: error.message,
        success: false
      });
    }
    
    console.log('');
  }
}

async function testProbeIdentityEndpoint() {
  console.log('🔍 Testing probeIdentity Action Endpoint\n');
  
  const probeTests = [
    {
      name: 'ProbeIdentity Valid Token',
      url: `${BASE_URL}/actions/probe_identity`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'ProbeIdentity Invalid Token',
      url: `${BASE_URL}/actions/probe_identity`,
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid_token' },
      expectedStatus: 200, // Actions don't require auth based on the code
      shouldHaveJson: true
    },
    {
      name: 'ProbeIdentity No Token',
      url: `${BASE_URL}/actions/probe_identity`,
      method: 'POST',
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'ProbeIdentity CORS Preflight',
      url: `${BASE_URL}/actions/probe_identity`,
      method: 'OPTIONS',
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: false
    }
  ];

  for (const test of probeTests) {
    try {
      console.log(`🔄 Testing: ${test.name}`);
      
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      };

      const response = await fetch(test.url, options);
      const statusMatch = response.status === test.expectedStatus;
      
      let jsonData = null;
      let jsonValid = false;
      let hasRequiredFields = false;

      try {
        const text = await response.text();
        if (text) {
          jsonData = JSON.parse(text);
          jsonValid = true;
          
          if (test.shouldHaveJson && test.expectedStatus === 200) {
            hasRequiredFields = !!(
              jsonData.probe &&
              jsonData.timestamp &&
              jsonData.friction
            );
          }
        }
      } catch (e) {
        // Not JSON or empty response
      }

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        statusMatch,
        expectedJson: test.shouldHaveJson,
        hasJson: jsonValid,
        hasRequiredFields,
        data: jsonData,
        success: statusMatch && (!test.shouldHaveJson || hasRequiredFields)
      };

      results.push(result);

      if (result.success) {
        console.log(`✅ ${test.name}: PASS (${response.status})`);
        if (jsonData && result.hasRequiredFields) {
          console.log(`   🔍 Probe: ${jsonData.probe}`);
          console.log(`   ⏰ Timestamp: ${jsonData.timestamp}`);
          console.log(`   ⚡ Friction: ${JSON.stringify(jsonData.friction)}`);
        }
      } else {
        console.log(`❌ ${test.name}: FAIL (got ${response.status}, expected ${test.expectedStatus})`);
        if (test.shouldHaveJson && !jsonValid) {
          console.log(`   ⚠️  Expected JSON response but got invalid/no JSON`);
        }
        if (test.shouldHaveJson && jsonValid && !hasRequiredFields) {
          console.log(`   ⚠️  Missing required fields in response`);
          console.log(`   📄 Response: ${JSON.stringify(jsonData)}`);
        }
      }

    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        error: error.message,
        success: false
      });
    }
    
    console.log('');
  }
}

async function printSummary() {
  console.log('\n📋 Test Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  if (successful < total) {
    console.log('\n🔍 Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || `STATUS ${r.status}`}`);
    });
  }

  if (successful === total) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ The /system/health endpoint is working correctly!');
    console.log('✅ The /actions/probe_identity endpoint is working correctly!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('❌ Please check the failing tests above.');
  }

  console.log('\n📚 Local Development Server Test Results ↑');
}

// Run tests
testHealthEndpoint()
  .then(testProbeIdentityEndpoint)
  .then(printSummary)
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });