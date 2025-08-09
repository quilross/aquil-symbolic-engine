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
const BASE = process.env.BASE || 'https://signal_q.catnip-pieces1.workers.dev';
const TOKEN = process.env.TOKEN || '';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function runSmokeTest() {
  console.log('🚀 Signal Q Smoke Test (Node.js with SDK)');
  console.log(`Base URL: ${BASE}`);
  console.log(`API Token: ${TOKEN.substring(0, 10)}...`);
  console.log('');

  // Check if API token is provided
  if (!TOKEN) {
    console.log(`${colors.red}❌ Error: TOKEN environment variable is required${colors.reset}`);
    console.log('Example: export TOKEN=$SIGNALQ_API_TOKEN');
    process.exit(1);
  }

  try {
    // Test 1: Version endpoint (no auth required) - using raw fetch
    console.log('📋 Testing GET /version (raw fetch)...');
    const versionResponse = await fetch(`${BASE}/version`);
    
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

    // Test 2: Health endpoint (requires auth) - using raw fetch
    console.log('🏥 Testing POST /actions/system_health (raw fetch)...');
    
    const healthResponse = await fetch(`${BASE}/actions/system_health`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!healthResponse.ok) {
      console.log(`${colors.red}❌ Health endpoint failed with status ${healthResponse.status}${colors.reset}`);
      const responseText = await healthResponse.text();
      console.log(`Response: ${responseText}`);
      process.exit(1);
    }

    const healthData = await healthResponse.json();
    if (healthData.status !== 'healthy') {
      console.log(`${colors.red}❌ Health check failed - status is '${healthData.status}' (expected 'healthy')${colors.reset}`);
      console.log(`Response: ${JSON.stringify(healthData)}`);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Health endpoint OK (status: ${healthData.status})${colors.reset}`);
    
    // Test 3: SDK version method
    console.log('📦 Testing SDK version method...');
    const client = new SignalQClient({
      baseUrl: BASE,
      token: TOKEN
    });
    
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
    console.log(`✅ Health status: ${healthData.status}`);
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