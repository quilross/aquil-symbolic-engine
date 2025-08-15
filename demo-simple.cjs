#!/usr/bin/env node

/**
 * Simple SDK Demo - Tests the Signal Q API manually with curl
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`\n🔧 ${description}`);
  console.log(`   Command: ${command}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
    console.log('   ✅ Success:');
    console.log('   ' + output.split('\n').join('\n   '));
    return true;
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    return false;
  }
}

function demoAPI() {
  console.log('🚀 Signal Q API Demo (Manual Testing)\n');
  
  const BASE_URL = 'http://localhost:8788';
  const TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
  
  let success = 0;
  let total = 0;
  
  // Test 1: Version endpoint (public)
  total++;
  if (runCommand(`curl -s ${BASE_URL}/version`, 'Testing version endpoint (public)')) {
    success++;
  }
  
  // Test 2: Health endpoint (auth required)
  total++;
  if (runCommand(`curl -s -H "Authorization: Bearer ${TOKEN}" ${BASE_URL}/system/health`, 'Testing health endpoint (auth required)')) {
    success++;
  }
  
  // Test 3: Identity probe
  total++;
  if (runCommand(`curl -s -X POST -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d '{"context":"demo"}' ${BASE_URL}/actions/probe_identity`, 'Testing identity probe action')) {
    success++;
  }
  
  console.log(`\n📊 Results: ${success}/${total} tests passed`);
  
  if (success === total) {
    console.log('🎉 All API tests passed!');
    console.log('\n💡 To use the JavaScript SDK in your own projects:');
    console.log('   const SignalQClient = require("./sdk/signal-q-client.js");');
    console.log('   const client = new SignalQClient({ baseUrl, token });');
    console.log('   const health = await client.health();');
  } else {
    console.log('❌ Some tests failed. Make sure the dev server is running:');
    console.log('   npm run dev');
  }
}

// Check if dev server is running
console.log('🔍 Checking if dev server is running...');
try {
  execSync('curl -s http://localhost:8788/version > /dev/null', { timeout: 2000 });
  console.log('✅ Dev server is running');
  demoAPI();
} catch (error) {
  console.log('❌ Dev server not responding');
  console.log('🚀 Starting dev server for demo...');
  
  // Try to start the server
  try {
    require('child_process').spawn('npm', ['test'], { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.log('❌ Could not start dev server automatically');
    console.log('📝 Please run manually: npm run dev');
  }
}
