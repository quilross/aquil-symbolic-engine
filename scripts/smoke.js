#!/usr/bin/env node

/**
 * Signal Q Smoke Test Script (Node.js version)
 * Tests the basic health and version endpoints using fetch
 */

// Environment variables with defaults
const SIGNALQ_BASE_URL = process.env.SIGNALQ_BASE_URL || 'https://signal_q.catnip-pieces1.workers.dev';
const SIGNALQ_API_TOKEN = process.env.SIGNALQ_API_TOKEN || '';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function runSmokeTest() {
  console.log('🚀 Signal Q Smoke Test (Node.js)');
  console.log(`Base URL: ${SIGNALQ_BASE_URL}`);
  console.log(`API Token: ${SIGNALQ_API_TOKEN.substring(0, 10)}...`);
  console.log('');

  // Check if API token is provided
  if (!SIGNALQ_API_TOKEN) {
    console.log(`${colors.red}❌ Error: SIGNALQ_API_TOKEN environment variable is required${colors.reset}`);
    console.log('Example: export SIGNALQ_API_TOKEN=sq_live_xxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  try {
    // Test 1: Version endpoint (no auth required)
    console.log('📋 Testing GET /version (no auth)...');
    const versionResponse = await fetch(`${SIGNALQ_BASE_URL}/version`);
    
    if (!versionResponse.ok) {
      console.log(`${colors.red}❌ Version endpoint failed with status ${versionResponse.status}${colors.reset}`);
      const responseText = await versionResponse.text();
      console.log(`Response: ${responseText}`);
      process.exit(1);
    }

    const versionData = await versionResponse.json();
    if (!versionData.version) {
      console.log(`${colors.red}❌ Version endpoint returned invalid JSON${colors.reset}`);
      console.log(`Response: ${JSON.stringify(versionData)}`);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Version endpoint OK (version: ${versionData.version})${colors.reset}`);
    console.log('');

    // Test 2: Health endpoint (requires auth)
    console.log('🏥 Testing GET /system/health (with Bearer auth)...');
    const healthResponse = await fetch(`${SIGNALQ_BASE_URL}/system/health`, {
      headers: {
        'Authorization': `Bearer ${SIGNALQ_API_TOKEN}`
      }
    });

    if (!healthResponse.ok) {
      console.log(`${colors.red}❌ Health endpoint failed with status ${healthResponse.status}${colors.reset}`);
      const responseText = await healthResponse.text();
      console.log(`Response: ${responseText}`);
      process.exit(1);
    }

    const healthData = await healthResponse.json();
    if (healthData.overall !== 'healthy') {
      console.log(`${colors.red}❌ Health check failed - overall status is '${healthData.overall}' (expected 'healthy')${colors.reset}`);
      console.log(`Response: ${JSON.stringify(healthData)}`);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Health endpoint OK (overall: ${healthData.overall})${colors.reset}`);
    console.log('');

    // Summary
    console.log(`${colors.green}🎉 All smoke tests passed!${colors.reset}`);
    console.log(`✅ Version endpoint: ${versionData.version}`);
    console.log(`✅ Health status: ${healthData.overall}`);
    console.log('');
    console.log('Signal Q API is healthy and responding correctly.');

  } catch (error) {
    console.log(`${colors.red}❌ Smoke test failed with error:${colors.reset}`);
    console.log(error.message);
    process.exit(1);
  }
}

// Run the smoke test
runSmokeTest();