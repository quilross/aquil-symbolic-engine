#!/usr/bin/env node

/**
 * SDK Demo Script
 * Demonstrates the Signal Q JavaScript SDK functionality
 */

// Import the SDK (works in Node.js)
const SignalQClient = require('./signal-q-client.js');

console.log('SDK loaded:', typeof SignalQClient);

async function demoSDK() {
  console.log('🚀 Signal Q SDK Demo\n');

  // Create client instance
  const client = new SignalQClient({
    baseUrl: 'http://localhost:8788', // Use local dev server
    token: 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h',
    timeout: 10000
  });

  try {
    // Test 1: Version endpoint (public)
    console.log('📦 Testing version endpoint...');
    const version = await client.version();
    console.log(`   ✅ Version: ${version.version}`);
    console.log(`   🔗 Git SHA: ${version.gitSha}`);
    console.log(`   🏗️ Environment: ${version.environment}\n`);

    // Test 2: Health endpoint (auth required)
    console.log('🏥 Testing health endpoint...');
    const health = await client.health();
    console.log(`   ✅ Status: ${health.overall}`);
    console.log(`   📡 API: ${health.api?.status}`);
    console.log(`   💾 Storage: ${health.storage?.status}\n`);

    // Test 3: Identity probe action
    console.log('🔍 Testing identity probe...');
    const probe = await client.probeIdentity({ context: 'SDK demo' });
    console.log(`   ✅ Probe: ${probe.probe}`);
    console.log(`   ⚡ Friction: ${probe.friction?.join(', ')}\n`);

    // Test 4: List actions
    console.log('📋 Testing action list...');
    const actions = await client.listActions();
    console.log(`   ✅ Found ${actions.actions?.length || 0} actions`);
    if (actions.actions?.length > 0) {
      console.log(`   📝 First action: ${actions.actions[0].name}\n`);
    }

    // Test 5: Raw request example
    console.log('🔧 Testing raw request...');
    const response = await client.request('/version');
    const rawData = await response.json();
    console.log(`   ✅ Raw response version: ${rawData.version}\n`);

    console.log('🎉 SDK Demo Complete - All tests passed!');

  } catch (error) {
    console.error('❌ SDK Demo failed:', error.message);
    
    // Check if error includes correlation ID
    const correlationMatch = error.message.match(/Correlation: ([^)]+)/);
    if (correlationMatch) {
      console.error(`🔍 Correlation ID: ${correlationMatch[1]}`);
    }
    
    process.exit(1);
  }
}

// Check if we're being run directly
if (require.main === module) {
  demoSDK().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

module.exports = { demoSDK };