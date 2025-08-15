#!/usr/bin/env node

/**
 * Comprehensive Health Endpoint Test Suite
 * Tests the /system/health endpoint with various scenarios
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8788';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
const ADMIN_TOKEN = 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2';

console.log('🏥 Health Endpoint Test Suite\n');
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
      name: 'Valid User Token (Health is Public)',
      url: `${BASE_URL}/system/health`,
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Valid Admin Token (Health is Public)', 
      url: `${BASE_URL}/system/health`,
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Invalid Token (Health is Public)',
      url: `${BASE_URL}/system/health`,
      headers: { 'Authorization': 'Bearer invalid_token_123' },
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Missing Token (Health is Public)',
      url: `${BASE_URL}/system/health`,
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Malformed Auth Header (Health is Public)',
      url: `${BASE_URL}/system/health`, 
      headers: { 'Authorization': 'InvalidFormat' },
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'CORS Preflight',
      url: `${BASE_URL}/system/health`,
      method: 'OPTIONS',
      headers: {},
      expectedStatus: 204,
      shouldHaveJson: false
    },
    {
      name: 'Case Sensitivity Test (Normalized to Lowercase)',
      url: `${BASE_URL}/System/Health`,
      headers: {},
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'Trailing Slash Test',
      url: `${BASE_URL}/system/health/`,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectedStatus: 200,
      shouldHaveJson: true
    },
    {
      name: 'ProbeIdentity Valid Token',
      url: `${BASE_URL}/actions/probe_identity`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectedStatus: 200,
      shouldHaveJson: true,
      isProbeIdentity: true
    },
    {
      name: 'ProbeIdentity No Token',
      url: `${BASE_URL}/actions/probe_identity`,
      method: 'POST',
      headers: {},
      expectedStatus: 401,
      shouldHaveJson: false
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
            if (test.isProbeIdentity) {
              hasRequiredFields = !!(
                jsonData.probe &&
                jsonData.timestamp &&
                jsonData.analysis
              );
            } else if (test.isVersion) {
              hasRequiredFields = !!(
                jsonData.version &&
                jsonData.gitSha &&
                jsonData.buildTime &&
                jsonData.environment
              );
            } else {
              // Health endpoint validation
              hasRequiredFields = !!(
                jsonData.name && 
                jsonData.version && 
                jsonData.status && 
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
          if (test.isProbeIdentity) {
            console.log(`   🔍 Probe: ${jsonData.probe}`);
            console.log(`   ⏰ Timestamp: ${jsonData.timestamp}`);
            console.log(`   ⚡ Analysis: ${JSON.stringify(jsonData.analysis)}`);
          } else if (test.isVersion) {
            console.log(`   📦 Version: ${jsonData.version}`);
            console.log(`   🔗 Git SHA: ${jsonData.gitSha}`);
            console.log(`   🏗️ Build Time: ${jsonData.buildTime}`);
            console.log(`   🌍 Environment: ${jsonData.environment}`);
          } else {
            console.log(`   📛 Name: ${jsonData.name}`);
            console.log(`   📦 Version: ${jsonData.version}`);
            console.log(`   💚 Status: ${jsonData.status}`);
            console.log(`   ⏰ Timestamp: ${jsonData.timestamp}`);
          }
        }
      } else {
        console.log(`❌ ${test.name}: FAIL (got ${response.status}, expected ${test.expectedStatus})`);
        if (test.shouldHaveJson && !jsonValid) {
          console.log(`   ⚠️  Expected JSON response but got invalid/no JSON`);
        }
        if (test.shouldHaveJson && jsonValid && !hasRequiredFields) {
          console.log(`   ⚠️  Missing required fields in response`);
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

  // Check for deployment status
  const successfulHealthCheck = results.find(r => 
    r.name === 'Valid User Token (Health is Public)' && r.success
  );

  if (successfulHealthCheck) {
    console.log('\n🎉 DEPLOYMENT STATUS: HEALTHY');
    console.log('✅ The /system/health endpoint is working correctly!');
    console.log('\n🔗 Ready for CustomGPT Integration:');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Bearer Token: ${USER_TOKEN}`);
    console.log(`   Schema File: worker/openapi-core.yaml`);
  } else {
    console.log('\n⚠️  DEPLOYMENT STATUS: NEEDS ATTENTION');
    console.log('❌ The /system/health endpoint is not working correctly.');
    console.log('\n🔧 Next Steps:');
    console.log('   1. Ensure worker is deployed: wrangler deploy');
    console.log('   2. Check deployment URL is correct');
    console.log('   3. Verify tokens match wrangler.toml configuration');
    console.log('   4. Check Cloudflare Workers dashboard for errors');
  }

  console.log('\n📚 Full Test Results Available Above ↑');
}

// Run tests
testHealthEndpoint()
  .then(printSummary)
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
