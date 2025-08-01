#!/usr/bin/env node

/**
 * OpenAPI Audit Script
 * Validates alignment between OpenAPI specification and actual implementation
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
const ADMIN_TOKEN = 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2';

console.log('📋 OpenAPI Specification Audit\n');
console.log(`🌐 API Base: ${BASE_URL}`);
console.log(`📄 OpenAPI Spec: src/openapi-core.json\n`);

let openApiSpec;
const auditResults = {
  timestamp: new Date().toISOString(),
  specFile: 'src/openapi-core.json',
  baseUrl: BASE_URL,
  endpoints: {
    total: 0,
    tested: 0,
    working: 0,
    failing: 0,
    details: []
  },
  authentication: {
    scheme: null,
    tested: false,
    working: false
  },
  compliance: {
    score: 0,
    issues: []
  },
  recommendations: []
};

async function loadOpenApiSpec() {
  try {
    const specPath = path.join(__dirname, 'src', 'openapi-core.json');
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = JSON.parse(specContent);
    
    console.log(`✅ Loaded OpenAPI spec: ${openApiSpec.info.title} v${openApiSpec.info.version}`);
    console.log(`📖 Description: ${openApiSpec.info.description}`);
    
    // Extract endpoint count
    auditResults.endpoints.total = Object.keys(openApiSpec.paths || {}).length;
    
    // Extract auth scheme
    const security = openApiSpec.security?.[0];
    if (security && security.bearerAuth) {
      auditResults.authentication.scheme = 'bearerAuth';
    }
    
    console.log(`🔗 Total endpoints defined: ${auditResults.endpoints.total}\n`);
    
  } catch (error) {
    console.error('❌ Failed to load OpenAPI spec:', error.message);
    auditResults.compliance.issues.push({
      type: 'spec_loading_error',
      message: `Cannot load OpenAPI spec: ${error.message}`,
      severity: 'critical'
    });
    return false;
  }
  return true;
}

async function testEndpoint(path, methods, authRequired = true) {
  const results = [];
  
  for (const method of methods) {
    try {
      const url = `${BASE_URL}${path}`;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authRequired) {
        headers['Authorization'] = `Bearer ${USER_TOKEN}`;
      }
      
      console.log(`🔄 Testing: ${method.toUpperCase()} ${path}`);
      
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers
      });
      
      const isSuccess = response.status >= 200 && response.status < 400;
      const isNotFound = response.status === 404;
      
      results.push({
        method: method.toUpperCase(),
        path,
        status: response.status,
        success: isSuccess,
        notFound: isNotFound,
        authRequired
      });
      
      if (isSuccess) {
        console.log(`  ✅ ${method.toUpperCase()} ${path}: ${response.status}`);
        auditResults.endpoints.working++;
      } else if (isNotFound) {
        console.log(`  ⚠️  ${method.toUpperCase()} ${path}: 404 - Endpoint not implemented`);
        auditResults.endpoints.failing++;
        auditResults.compliance.issues.push({
          type: 'missing_endpoint',
          message: `${method.toUpperCase()} ${path} returns 404`,
          severity: 'high',
          path,
          method: method.toUpperCase()
        });
      } else {
        console.log(`  ❌ ${method.toUpperCase()} ${path}: ${response.status}`);
        auditResults.endpoints.failing++;
        auditResults.compliance.issues.push({
          type: 'endpoint_error',
          message: `${method.toUpperCase()} ${path} returns ${response.status}`,
          severity: 'medium',
          path,
          method: method.toUpperCase(),
          status: response.status
        });
      }
      
      auditResults.endpoints.tested++;
      
    } catch (error) {
      console.log(`  💥 ${method.toUpperCase()} ${path}: ${error.message}`);
      results.push({
        method: method.toUpperCase(),
        path,
        error: error.message,
        success: false
      });
      auditResults.endpoints.failing++;
      auditResults.endpoints.tested++;
      auditResults.compliance.issues.push({
        type: 'network_error',
        message: `${method.toUpperCase()} ${path} failed: ${error.message}`,
        severity: 'high',
        path,
        method: method.toUpperCase()
      });
    }
  }
  
  auditResults.endpoints.details.push({
    path,
    methods: results
  });
  
  return results;
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication Implementation...\n');
  
  const testCases = [
    {
      name: 'Valid User Token',
      token: USER_TOKEN,
      expectedStatus: 200
    },
    {
      name: 'Valid Admin Token',
      token: ADMIN_TOKEN,
      expectedStatus: 200
    },
    {
      name: 'Invalid Token',
      token: 'invalid_token_123',
      expectedStatus: 401
    },
    {
      name: 'Missing Token',
      token: null,
      expectedStatus: 401
    }
  ];
  
  let authWorking = true;
  
  for (const testCase of testCases) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (testCase.token) {
        headers['Authorization'] = `Bearer ${testCase.token}`;
      }
      
      const response = await fetch(`${BASE_URL}/system/health`, { headers });
      const statusMatch = response.status === testCase.expectedStatus;
      
      console.log(`🔑 ${testCase.name}: ${response.status} ${statusMatch ? '✅' : '❌'}`);
      
      if (!statusMatch) {
        authWorking = false;
        auditResults.compliance.issues.push({
          type: 'auth_error',
          message: `${testCase.name} expected ${testCase.expectedStatus}, got ${response.status}`,
          severity: 'high'
        });
      }
      
    } catch (error) {
      console.log(`🔑 ${testCase.name}: ERROR - ${error.message}`);
      authWorking = false;
      auditResults.compliance.issues.push({
        type: 'auth_network_error',
        message: `${testCase.name} failed: ${error.message}`,
        severity: 'high'
      });
    }
  }
  
  auditResults.authentication.tested = true;
  auditResults.authentication.working = authWorking;
  
  console.log('');
}

async function auditAllEndpoints() {
  if (!openApiSpec || !openApiSpec.paths) {
    console.error('❌ No paths found in OpenAPI spec');
    return;
  }
  
  console.log('🚀 Testing All Defined Endpoints...\n');
  
  for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
    const methods = Object.keys(pathItem).filter(key => 
      ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(key.toLowerCase())
    );
    
    if (methods.length > 0) {
      await testEndpoint(path, methods);
      console.log(''); // Add spacing between endpoints
    }
  }
}

function calculateComplianceScore() {
  const totalTests = auditResults.endpoints.tested + (auditResults.authentication.tested ? 1 : 0);
  const passedTests = auditResults.endpoints.working + (auditResults.authentication.working ? 1 : 0);
  
  if (totalTests === 0) {
    auditResults.compliance.score = 0;
  } else {
    auditResults.compliance.score = Math.round((passedTests / totalTests) * 100);
  }
  
  // Generate recommendations
  if (auditResults.endpoints.failing > 0) {
    auditResults.recommendations.push(
      `Fix ${auditResults.endpoints.failing} failing endpoint(s) to improve compliance`
    );
  }
  
  if (!auditResults.authentication.working) {
    auditResults.recommendations.push(
      'Fix authentication implementation to match OpenAPI security scheme'
    );
  }
  
  if (auditResults.compliance.score === 100) {
    auditResults.recommendations.push(
      'Perfect OpenAPI compliance! All endpoints and authentication working correctly.'
    );
  }
}

function printSummary() {
  console.log('\n📊 OpenAPI Audit Summary:');
  console.log('='.repeat(50));
  
  console.log(`📋 Specification: ${openApiSpec?.info?.title || 'Unknown'} v${openApiSpec?.info?.version || 'Unknown'}`);
  console.log(`🔗 Total Endpoints: ${auditResults.endpoints.total}`);
  console.log(`✅ Working: ${auditResults.endpoints.working}`);
  console.log(`❌ Failing: ${auditResults.endpoints.failing}`);
  console.log(`🔐 Authentication: ${auditResults.authentication.working ? 'Working' : 'Failing'}`);
  console.log(`📈 Compliance Score: ${auditResults.compliance.score}%`);
  
  if (auditResults.compliance.issues.length > 0) {
    console.log(`\n⚠️  Issues Found (${auditResults.compliance.issues.length}):`);
    auditResults.compliance.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
    });
  }
  
  if (auditResults.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    auditResults.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n🎯 CustomGPT Integration Status:');
  if (auditResults.compliance.score >= 80) {
    console.log('✅ Ready for CustomGPT integration!');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Auth: Bearer ${USER_TOKEN}`);
    console.log('   Schema: Upload src/openapi-core.json');
  } else {
    console.log('❌ Not ready for CustomGPT integration');
    console.log('   Fix failing endpoints and authentication first');
  }
}

async function saveResults() {
  try {
    const outputPath = path.join(__dirname, 'audit-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n💾 Audit results saved to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to save audit results: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    const specLoaded = await loadOpenApiSpec();
    if (!specLoaded) {
      console.error('Cannot proceed without OpenAPI specification');
      process.exit(1);
    }
    
    await testAuthentication();
    await auditAllEndpoints();
    
    calculateComplianceScore();
    printSummary();
    await saveResults();
    
    // Exit with error code if compliance is too low
    if (auditResults.compliance.score < 80) {
      console.log('\n❌ OpenAPI audit failed - compliance score too low');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 OpenAPI audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadOpenApiSpec, testEndpoint, testAuthentication, auditResults };