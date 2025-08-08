#!/usr/bin/env node

/**
 * Signal Q Smoke Test Script (Node.js version)
 * Tests the basic health and version endpoints using both raw fetch and SDK
 */

import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';

// Load the SDK dynamically to work around ES module issues
const sdkPath = new URL('../sdk/signal-q-client.js', import.meta.url);
const sdkCode = readFileSync(sdkPath, 'utf8');

// Create a function that returns the SignalQClient class
const getSignalQClient = new Function(sdkCode + '; return SignalQClient;');
const SignalQClient = getSignalQClient();

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
  console.log('🚀 Signal Q Smoke Test (Node.js with SDK)');
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
    // Test 1: Version endpoint (no auth required) - using raw fetch
    console.log('📋 Testing GET /version (raw fetch)...');
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

    // Test 2: Health endpoint (requires auth) - using SDK
    console.log('🏥 Testing GET /system/health (using SDK)...');
    
    const client = new SignalQClient({
      baseUrl: SIGNALQ_BASE_URL,
      token: SIGNALQ_API_TOKEN
    });

    const healthData = await client.health();
    if (healthData.overall !== 'healthy') {
      console.log(`${colors.red}❌ Health check failed - overall status is '${healthData.overall}' (expected 'healthy')${colors.reset}`);
      console.log(`Response: ${JSON.stringify(healthData)}`);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Health endpoint OK (overall: ${healthData.overall})${colors.reset}`);
    
    // Test 3: SDK version method
    console.log('📦 Testing SDK version method...');
    const sdkVersionData = await client.version();
    if (sdkVersionData.version !== versionData.version) {
      console.log(`${colors.red}❌ SDK version mismatch${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✅ SDK version method OK${colors.reset}`);
    console.log('');

    // Summary
    console.log(`${colors.green}🎉 All smoke tests passed!${colors.reset}`);
    console.log(`✅ Version endpoint: ${versionData.version}`);
    console.log(`✅ Health status: ${healthData.overall}`);
    console.log(`✅ SDK integration: working`);
    console.log('');
    console.log('Signal Q API is healthy and SDK is working correctly.');

  } catch (error) {
    console.log(`${colors.red}❌ Smoke test failed with error:${colors.reset}`);
    console.log(error.message);
    
    // Check if error includes correlation ID for debugging
    const correlationMatch = error.message.match(/Correlation: ([^)]+)/);
    if (correlationMatch) {
      console.log(`🔍 Correlation ID: ${correlationMatch[1]}`);
    }
    
    process.exit(1);
  }
}

// Run the smoke test
runSmokeTest();