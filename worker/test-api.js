#!/usr/bin/env node

// Signal Q API Testing Script for GPT Integration
// This script helps test your Signal Q deployment

const API_BASE = 'https://signal_q.catnip-pieces1.workers.dev';
const API_TOKEN = process.env.SIGNALQ_API_TOKEN || 'dev-placeholder';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔄 Testing: ${method} ${endpoint}`);
    const response = await fetch(url, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
      console.log('✅ Response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('📄 Raw Response:', text);
      console.log('⚠️  JSON Parse Error:', parseError.message);
    }
    
    return { status: response.status, data: data || text };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { error: error.message };
  }
}

async function testBasicEndpoints() {
  console.log('🚀 Signal Q API Testing Suite\n');
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log(`🔑 Using Token: ${API_TOKEN.substring(0, 20)}...`);
  
  // Test endpoints that should work
  const tests = [
    // Basic system endpoints
    { endpoint: '/system/health', method: 'GET' },
    { endpoint: '/deploy/status', method: 'GET' },
    
    // Core Signal Q endpoints
    { endpoint: '/identity-nodes', method: 'GET' },
    { endpoint: '/play-protocols', method: 'GET' },
    { endpoint: '/logs', method: 'GET' },
    
    // Agent endpoints
    { endpoint: '/agent-overwhelm', method: 'GET' },
    { endpoint: '/agent-suggestions', method: 'GET' },
    { endpoint: '/philadelphia-context', method: 'GET' },
    
    // Personal blueprint endpoints
    { endpoint: '/gene-key-guidance', method: 'GET' },
    { endpoint: '/effectiveness-dashboard', method: 'GET' },
    { endpoint: '/recovery-support', method: 'GET' },
    { endpoint: '/ark-coherence-check', method: 'GET' },
    
    // Token management
    { endpoint: '/tokens/list', method: 'GET' },
    { endpoint: '/tokens/settings', method: 'GET' },
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await makeRequest(test.endpoint, test.method);
    results.push({ ...test, ...result });
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
  }
  
  // Summary
  console.log('\n📋 Test Summary:');
  const successful = results.filter(r => r.status && r.status < 400);
  const failed = results.filter(r => !r.status || r.status >= 400);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n🔍 Failed Tests:');
    failed.forEach(f => {
      console.log(`  - ${f.method} ${f.endpoint}: ${f.status || 'ERROR'}`);
    });
  }
  
  return results;
}

async function testPostEndpoints() {
  console.log('\n🔧 Testing POST Endpoints:');
  
  const postTests = [
    {
      endpoint: '/identity-nodes',
      method: 'POST',
      body: {
        identity_key: 'test_node_' + Date.now(),
        description: 'Test identity node for API validation',
        active: true
      }
    },
    {
      endpoint: '/voice-shifts',
      method: 'POST', 
      body: {
        from_voice: 'analytical',
        to_voice: 'creative',
        context: 'Testing voice shift functionality',
        intensity: 7
      }
    },
    {
      endpoint: '/track-time',
      method: 'POST',
      body: {
        activity: 'api_testing',
        duration: 30,
        timezone: 'America/New_York'
      }
    }
  ];
  
  for (const test of postTests) {
    await makeRequest(test.endpoint, test.method, test.body);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Main execution
async function main() {
  try {
    await testBasicEndpoints();
    await testPostEndpoints();
    
    console.log('\n🎯 For GPT Integration:');
    console.log(`Base URL: ${API_BASE}`);
    console.log(`Auth Header: Authorization: Bearer ${API_TOKEN}`);
    console.log('Content-Type: application/json');
    console.log('\n📚 Key Endpoints for GPT:');
    console.log('- GET /gene-key-guidance - Get Gene Key insights');
    console.log('- GET /philadelphia-context - Philadelphia intelligence');
    console.log('- POST /throatcraft-session - Activate THROATCRAFT');
    console.log('- GET /effectiveness-dashboard - Personal analytics');
    console.log('- POST /autonomous/decision-engine - AI decision support');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { makeRequest, testBasicEndpoints, API_BASE, API_TOKEN };
