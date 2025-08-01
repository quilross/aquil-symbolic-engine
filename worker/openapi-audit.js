#!/usr/bin/env node

/**
 * OpenAPI Audit Script
 * Validates OpenAPI specification against deployed Worker endpoints
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
const ADMIN_TOKEN = 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2';

console.log('🔍 OpenAPI Audit Script\n');
console.log(`🌐 API Base: ${BASE_URL}`);
console.log(`📋 Auditing OpenAPI specification compliance\n`);

const auditResults = {
  timestamp: new Date().toISOString(),
  openapi: {},
  endpoints: {},
  security: {},
  compatibility: {},
  issues: [],
  passed: 0,
  failed: 0
};

async function loadOpenAPISpec() {
  try {
    const specPath = path.join(__dirname, 'src', 'openapi-core.json');
    const specData = fs.readFileSync(specPath, 'utf8');
    return JSON.parse(specData);
  } catch (error) {
    console.error('❌ Failed to load OpenAPI spec:', error.message);
    auditResults.issues.push(`Failed to load OpenAPI spec: ${error.message}`);
    return null;
  }
}

async function testEndpoint(url, method = 'GET', headers = {}) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USER_TOKEN}`,
        ...headers
      }
    });

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    };
  } catch (error) {
    return {
      error: error.message,
      ok: false
    };
  }
}

async function auditOpenAPICompliance() {
  console.log('🔍 Loading OpenAPI specification...');
  const spec = await loadOpenAPISpec();
  
  if (!spec) {
    auditResults.failed++;
    return;
  }

  auditResults.openapi = {
    version: spec.openapi,
    title: spec.info?.title,
    version_info: spec.info?.version,
    server_count: spec.servers?.length || 0
  };

  console.log(`✅ OpenAPI Version: ${spec.openapi}`);
  console.log(`✅ API Title: ${spec.info?.title}`);
  console.log(`✅ API Version: ${spec.info?.version}`);
  auditResults.passed += 3;

  // Test documented endpoints
  console.log('\n🔗 Testing documented endpoints...');
  
  const endpoints = Object.keys(spec.paths || {});
  let workingEndpoints = 0;
  
  for (const endpoint of endpoints) {
    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log(`🔄 Testing: ${endpoint}`);
    
    const result = await testEndpoint(fullUrl);
    
    if (result.ok || result.status < 500) {
      console.log(`✅ ${endpoint}: Accessible (${result.status})`);
      workingEndpoints++;
      auditResults.passed++;
    } else {
      console.log(`❌ ${endpoint}: Failed (${result.status || 'ERROR'})`);
      auditResults.issues.push(`Endpoint ${endpoint} failed: ${result.error || result.status}`);
      auditResults.failed++;
    }

    auditResults.endpoints[endpoint] = {
      status: result.status,
      accessible: result.ok || result.status < 500,
      error: result.error
    };
  }

  console.log(`\n📊 Endpoint Summary: ${workingEndpoints}/${endpoints.length} accessible`);
}

async function auditSecurity() {
  console.log('\n🔐 Security Audit...');
  
  // Test authentication
  const authTests = [
    {
      name: 'Valid User Token',
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectStatus: 200
    },
    {
      name: 'Valid Admin Token', 
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      expectStatus: 200
    },
    {
      name: 'Invalid Token',
      headers: { 'Authorization': 'Bearer invalid_token' },
      expectStatus: 401
    },
    {
      name: 'Missing Auth',
      headers: {},
      expectStatus: 401
    }
  ];

  let securityPassed = 0;
  
  for (const test of authTests) {
    const result = await testEndpoint(`${BASE_URL}/system/health`, 'GET', test.headers);
    const passed = result.status === test.expectStatus;
    
    if (passed) {
      console.log(`✅ ${test.name}: PASS (${result.status})`);
      securityPassed++;
      auditResults.passed++;
    } else {
      console.log(`❌ ${test.name}: FAIL (got ${result.status}, expected ${test.expectStatus})`);
      auditResults.issues.push(`Security test "${test.name}" failed`);
      auditResults.failed++;
    }
  }

  auditResults.security = {
    tests_passed: securityPassed,
    total_tests: authTests.length,
    score: Math.round((securityPassed / authTests.length) * 100)
  };
}

async function auditCORS() {
  console.log('\n🌐 CORS Audit...');
  
  const corsResult = await testEndpoint(`${BASE_URL}/system/health`, 'OPTIONS');
  
  const requiredHeaders = [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ];

  let corsScore = 0;
  
  for (const header of requiredHeaders) {
    if (corsResult.headers && corsResult.headers[header.toLowerCase()]) {
      console.log(`✅ ${header}: ${corsResult.headers[header.toLowerCase()]}`);
      corsScore++;
      auditResults.passed++;
    } else {
      console.log(`❌ ${header}: Missing`);
      auditResults.issues.push(`Missing CORS header: ${header}`);
      auditResults.failed++;
    }
  }

  auditResults.compatibility.cors = {
    score: Math.round((corsScore / requiredHeaders.length) * 100),
    headers_present: corsScore,
    total_headers: requiredHeaders.length
  };
}

async function generateReport() {
  console.log('\n📋 Generating Audit Report...');
  
  const total = auditResults.passed + auditResults.failed;
  const score = total > 0 ? Math.round((auditResults.passed / total) * 100) : 0;
  
  auditResults.summary = {
    overall_score: score,
    total_tests: total,
    passed: auditResults.passed,
    failed: auditResults.failed,
    issues_count: auditResults.issues.length
  };

  // Write report to file
  const reportPath = path.join(__dirname, 'openapi-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`\n🏆 Overall Score: ${score}%`);
  console.log(`✅ Tests Passed: ${auditResults.passed}`);
  console.log(`❌ Tests Failed: ${auditResults.failed}`);
  
  if (auditResults.issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    auditResults.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  return score >= 80; // Pass threshold
}

async function main() {
  try {
    await auditOpenAPICompliance();
    await auditSecurity();
    await auditCORS();
    
    const passed = await generateReport();
    
    if (passed) {
      console.log('\n🎉 OpenAPI Audit: PASSED');
      process.exit(0);
    } else {
      console.log('\n⚠️  OpenAPI Audit: NEEDS ATTENTION');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, auditResults };