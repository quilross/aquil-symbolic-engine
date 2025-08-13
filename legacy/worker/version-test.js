#!/usr/bin/env node

/**
 * Version Endpoint Test Suite
 * Tests the /version endpoint for stable schema and correct metadata
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8788';

console.log('📦 Version Endpoint Test Suite\n');
console.log(`🌐 API Base: ${BASE_URL}\n`);

async function testVersionEndpoint() {
  console.log('🔄 Testing: Version Endpoint Schema');
  
  try {
    const response = await fetch(`${BASE_URL}/version`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      console.log(`❌ Version Endpoint: FAIL (got ${response.status}, expected 200)`);
      return false;
    }

    const correlationId = response.headers.get('X-Correlation-ID');
    if (!correlationId) {
      console.log('❌ Version Endpoint: FAIL (missing X-Correlation-ID header)');
      return false;
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`❌ Version Endpoint: FAIL (wrong content-type: ${contentType})`);
      return false;
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.log('❌ Version Endpoint: FAIL (invalid JSON response)');
      return false;
    }

    // Validate required fields and types
    const requiredFields = {
      version: 'string',
      gitSha: 'string', 
      buildTime: 'string',
      environment: 'string'
    };

    const missingFields = [];
    const wrongTypes = [];

    for (const [field, expectedType] of Object.entries(requiredFields)) {
      if (!(field in data)) {
        missingFields.push(field);
      } else if (typeof data[field] !== expectedType) {
        wrongTypes.push(`${field} (expected ${expectedType}, got ${typeof data[field]})`);
      }
    }

    if (missingFields.length > 0) {
      console.log(`❌ Version Endpoint: FAIL (missing fields: ${missingFields.join(', ')})`);
      return false;
    }

    if (wrongTypes.length > 0) {
      console.log(`❌ Version Endpoint: FAIL (wrong types: ${wrongTypes.join(', ')})`);
      return false;
    }

    // Validate field values
    if (!data.version.match(/^\d+\.\d+\.\d+$/)) {
      console.log(`❌ Version Endpoint: FAIL (invalid version format: ${data.version})`);
      return false;
    }

    if (!data.buildTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)) {
      console.log(`❌ Version Endpoint: FAIL (invalid buildTime format: ${data.buildTime})`);
      return false;
    }

    if (!['development', 'staging', 'production'].includes(data.environment)) {
      console.log(`❌ Version Endpoint: FAIL (invalid environment: ${data.environment})`);
      return false;
    }

    // Validate no extra fields (stable schema)
    const allowedFields = Object.keys(requiredFields);
    const extraFields = Object.keys(data).filter(field => !allowedFields.includes(field));
    
    if (extraFields.length > 0) {
      console.log(`❌ Version Endpoint: FAIL (unexpected fields: ${extraFields.join(', ')})`);
      return false;
    }

    console.log('✅ Version Endpoint: PASS (schema valid)');
    console.log(`   📦 Version: ${data.version}`);
    console.log(`   🔗 Git SHA: ${data.gitSha}`);
    console.log(`   🏗️ Build Time: ${data.buildTime}`);
    console.log(`   🌍 Environment: ${data.environment}`);
    console.log(`   🔗 Correlation ID: ${correlationId}`);

    return true;

  } catch (error) {
    console.log(`❌ Version Endpoint: FAIL (error: ${error.message})`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running version endpoint tests...\n');
  
  const success = await testVersionEndpoint();
  
  console.log('\n📋 Test Summary:');
  console.log('==================================================');
  
  if (success) {
    console.log('✅ Version endpoint schema test: PASSED');
    console.log('\n🎉 All version tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Version endpoint schema test: FAILED');
    console.log('\n💥 Version tests failed!');
    process.exit(1);
  }
}

runTests();