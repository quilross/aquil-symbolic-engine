#!/usr/bin/env node

/**
 * Domain Validation Script
 * Tests both custom domain and workers.dev fallback
 * Provides validation outputs with jq assertions
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const domains = {
  primary: process.env.CUSTOM_DOMAIN || 'signal-q.example.com',
  fallback: 'signal_q.catnip-pieces1.workers.dev'
};

const token = process.env.SIGNALQ_API_TOKEN || 'dev-placeholder';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Signal-Q Domain Validator/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            result.json = JSON.parse(data);
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Validation functions
async function validateVersion(domain) {
  console.log(`\n🔍 Testing version endpoint: https://${domain}/version`);
  
  try {
    const response = await makeRequest(`https://${domain}/version`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const json = response.json;
    if (!json) {
      throw new Error('Response is not JSON');
    }
    
    // jq assertions
    const assertions = [
      { field: 'version', value: json.version, test: v => typeof v === 'string' && v.length > 0 },
      { field: 'gitSha', value: json.gitSha, test: v => typeof v === 'string' && v.length > 0 },
      { field: 'buildTime', value: json.buildTime, test: v => typeof v === 'string' && v.length > 0 },
      { field: 'environment', value: json.environment, test: v => typeof v === 'string' && v.length > 0 }
    ];
    
    for (const assertion of assertions) {
      if (!assertion.test(assertion.value)) {
        throw new Error(`Assertion failed: ${assertion.field} = ${assertion.value}`);
      }
    }
    
    console.log(`✅ Version endpoint passed all assertions`);
    console.log(`   📦 Version: ${json.version}`);
    console.log(`   🔗 Git SHA: ${json.gitSha}`);
    console.log(`   🏗️ Environment: ${json.environment}`);
    
    return { success: true, data: json };
    
  } catch (error) {
    console.log(`❌ Version endpoint failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function validateHealth(domain) {
  console.log(`\n🏥 Testing health endpoint: https://${domain}/actions/system_health`);
  
  try {
    const response = await makeRequest(`https://${domain}/actions/system_health`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {}
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const json = response.json;
    if (!json) {
      throw new Error('Response is not JSON');
    }
    
    // jq assertion: .status == "healthy"
    if (json.status !== 'healthy') {
      throw new Error(`Expected status="healthy", got status="${json.status}"`);
    }
    
    console.log(`✅ Health endpoint passed assertions`);
    console.log(`   💚 Status: ${json.status}`);
    console.log(`   ⏰ Timestamp: ${json.timestamp}`);
    
    return { success: true, data: json };
    
  } catch (error) {
    console.log(`❌ Health endpoint failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function validateUptime() {
  console.log('🌐 Signal Q Domain Validation & Uptime Check');
  console.log('=' .repeat(50));
  
  const results = {
    primary: { domain: domains.primary, version: null, health: null },
    fallback: { domain: domains.fallback, version: null, health: null }
  };
  
  // Test primary domain
  console.log(`\n🎯 Testing PRIMARY domain: ${domains.primary}`);
  results.primary.version = await validateVersion(domains.primary);
  results.primary.health = await validateHealth(domains.primary);
  
  // Test fallback domain  
  console.log(`\n🔄 Testing FALLBACK domain: ${domains.fallback}`);
  results.fallback.version = await validateVersion(domains.fallback);
  results.fallback.health = await validateHealth(domains.fallback);
  
  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  const primaryOk = results.primary.version.success && results.primary.health.success;
  const fallbackOk = results.fallback.version.success && results.fallback.health.success;
  
  console.log(`Primary Domain (${domains.primary}):`);
  console.log(`  Version: ${results.primary.version.success ? '✅' : '❌'}`);
  console.log(`  Health:  ${results.primary.health.success ? '✅' : '❌'}`);
  
  console.log(`Fallback Domain (${domains.fallback}):`);
  console.log(`  Version: ${results.fallback.version.success ? '✅' : '❌'}`);
  console.log(`  Health:  ${results.fallback.health.success ? '✅' : '❌'}`);
  
  console.log(`\nOverall Status: ${primaryOk || fallbackOk ? '✅ OPERATIONAL' : '❌ DOWN'}`);
  
  if (primaryOk) {
    console.log('🎯 Primary domain is operational');
  } else if (fallbackOk) {
    console.log('🔄 Fallback domain is operational (primary domain issues)');
  } else {
    console.log('🚨 Both domains are experiencing issues');
    process.exit(1);
  }
  
  // Output JSON for jq processing
  console.log('\n📋 JSON Output for jq processing:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

// Run validation if script is executed directly
if (require.main === module) {
  validateUptime().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateUptime, validateVersion, validateHealth };