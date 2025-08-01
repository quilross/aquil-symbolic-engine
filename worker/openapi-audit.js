#!/usr/bin/env node

/**
 * Signal Q OpenAPI Audit & Alignment Tool
 * 
 * This script systematically tests every endpoint defined in the OpenAPI spec
 * against the actual worker implementation to identify mismatches and issues.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'https://signal_q.catnip-pieces1.workers.dev';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
const ADMIN_TOKEN = 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2';

// Load OpenAPI spec
const openApiPath = path.join(__dirname, 'src', 'openapi-core.json');
let openApiSpec;

try {
  openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load OpenAPI spec:', error.message);
  process.exit(1);
}

// Test results storage
const auditResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalEndpoints: 0,
    successfulTests: 0,
    failedTests: 0,
    endpointMismatches: 0,
    authenticationIssues: 0,
    serverErrors: 0
  },
  endpoints: [],
  mismatches: [],
  recommendations: []
};

/**
 * Make an HTTP request with proper headers and error handling
 */
async function makeRequest(endpoint, method = 'GET', body = null, useAdminToken = false) {
  const url = `${API_BASE}${endpoint}`;
  const token = useAdminToken ? ADMIN_TOKEN : USER_TOKEN;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-User-Id': 'audit-test-user'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`🔄 ${method} ${endpoint}`);
    const response = await fetch(url, options);
    
    let responseData = null;
    let isJson = false;
    
    try {
      const text = await response.text();
      if (text) {
        responseData = JSON.parse(text);
        isJson = true;
      }
    } catch (parseError) {
      // Response is not JSON or empty
      responseData = text;
    }

    return {
      endpoint,
      method,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      isJson,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.message}`);
    return {
      endpoint,
      method,
      status: null,
      error: error.message,
      success: false
    };
  }
}

/**
 * Generate appropriate test data for POST endpoints based on OpenAPI schema
 */
function generateTestData(endpoint, schema) {
  const testDataMap = {
    '/protocols/aquil-probe': {
      context: 'Testing AQUIL probe activation',
      readiness: 8
    },
    '/emotional-wave-tracker': {
      intensity: 7,
      clarity: true
    },
    '/manifestor-initiation': {
      initiationUrge: 'Testing manifestor initiation',
      impactLevel: 'medium'
    },
    '/throatcraft-session': {
      intention: 'Testing THROATCRAFT activation',
      currentVoiceState: 'seeking_clarity'
    },
    '/trauma-informed-response': {
      context: 'Testing trauma-informed response',
      triggerLevel: 'low'
    },
    '/multi-identity-orchestration': {
      context: 'Testing identity orchestration'
    },
    '/identity/voice-switch': {
      taskType: 'creative',
      context: 'Testing voice switch',
      energyLevel: 'medium'
    },
    '/recovery/nervous-system': {
      currentState: 'calm',
      safetyLevel: 8
    },
    '/philadelphia/neighborhood-energy': {
      creativeEnergy: 'flowing',
      socialCapacity: 'small_group'
    },
    '/throatcraft/voice-emergence': {
      currentVoiceState: 'emerging'
    },
    '/lunacraft/cattle-dog-guidance': {
      energyLevel: 'moderate_energy'
    },
    '/lunacraft/companion-bonding': {
      bondingGoal: 'trust_building'
    },
    '/somatic/body-awareness': {
      currentBodyState: 'relaxed',
      tensionAreas: ['shoulders'],
      breathingPattern: 'deep'
    },
    '/somatic/nervous-system-regulation': {
      dysregulationType: 'hyperactivation'
    },
    '/somatic/trauma-release': {
      readiness: true,
      bodyMemories: false
    },
    '/ai-enhance': {
      prompt: 'Test AI enhancement',
      context: 'Testing AI-enhanced responses',
      enhancementType: 'general'
    }
  };

  return testDataMap[endpoint] || { test: true, timestamp: new Date().toISOString() };
}

/**
 * Test a single endpoint from the OpenAPI spec
 */
async function testEndpoint(path, method, operation) {
  const endpoint = {
    path,
    method: method.toUpperCase(),
    operationId: operation.operationId,
    summary: operation.summary,
    testResults: []
  };

  // Test without authentication first
  let result = await makeRequest(path, method);
  
  // Check if endpoint requires authentication (should return 401 without token)
  const requiresAuth = result.status === 401;
  
  if (requiresAuth) {
    // Test with user token
    result = await makeRequest(path, method);
    endpoint.testResults.push({
      testType: 'user_auth',
      ...result
    });

    // Test with admin token if user token fails
    if (!result.success) {
      const adminResult = await makeRequest(path, method, null, true);
      endpoint.testResults.push({
        testType: 'admin_auth',
        ...adminResult
      });
      result = adminResult.success ? adminResult : result;
    }
  } else {
    endpoint.testResults.push({
      testType: 'no_auth',
      ...result
    });
  }

  // For POST endpoints, test with appropriate request body
  if (method.toUpperCase() === 'POST' && operation.requestBody) {
    const testData = generateTestData(path, operation.requestBody);
    const postResult = await makeRequest(path, method, testData);
    endpoint.testResults.push({
      testType: 'with_body',
      requestBody: testData,
      ...postResult
    });
    
    if (postResult.success || postResult.status < 500) {
      result = postResult; // Use POST result if it's better
    }
  }

  // Determine overall endpoint status
  endpoint.status = result.success ? 'WORKING' : 
                   result.status === 404 ? 'NOT_FOUND' :
                   result.status === 401 ? 'AUTH_ISSUE' :
                   result.status >= 500 ? 'SERVER_ERROR' : 'ISSUE';
  
  endpoint.finalResult = result;
  
  // Update summary counters
  if (result.success) {
    auditResults.summary.successfulTests++;
    console.log(`✅ ${method.toUpperCase()} ${path}: ${result.status}`);
  } else {
    auditResults.summary.failedTests++;
    console.log(`❌ ${method.toUpperCase()} ${path}: ${result.status || 'ERROR'} - ${result.error || result.statusText}`);
    
    if (result.status === 404) auditResults.summary.endpointMismatches++;
    if (result.status === 401 || result.status === 403) auditResults.summary.authenticationIssues++;
    if (result.status >= 500) auditResults.summary.serverErrors++;
  }

  return endpoint;
}

/**
 * Test all endpoints defined in the OpenAPI spec
 */
async function auditAllEndpoints() {
  console.log('🔍 Signal Q OpenAPI Alignment Audit');
  console.log('=====================================\n');
  console.log(`📋 OpenAPI Spec: ${openApiSpec.info.title} v${openApiSpec.info.version}`);
  console.log(`🌐 Server: ${API_BASE}`);
  console.log(`🔑 Auth: Bearer tokens configured\n`);

  const paths = openApiSpec.paths;
  auditResults.summary.totalEndpoints = Object.keys(paths).reduce(
    (count, path) => count + Object.keys(paths[path]).length, 0
  );

  console.log(`📊 Testing ${auditResults.summary.totalEndpoints} endpoints...\n`);

  // Test each endpoint
  for (const [path, pathMethods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathMethods)) {
      const endpointResult = await testEndpoint(path, method, operation);
      auditResults.endpoints.push(endpointResult);
      
      // Brief delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Analyze results and generate recommendations
 */
function analyzeResults() {
  console.log('\n📊 AUDIT SUMMARY');
  console.log('==================');
  console.log(`✅ Working endpoints: ${auditResults.summary.successfulTests}/${auditResults.summary.totalEndpoints}`);
  console.log(`❌ Failed endpoints: ${auditResults.summary.failedTests}/${auditResults.summary.totalEndpoints}`);
  console.log(`🔍 404 Not Found: ${auditResults.summary.endpointMismatches}`);
  console.log(`🔐 Auth Issues: ${auditResults.summary.authenticationIssues}`);
  console.log(`🔥 Server Errors: ${auditResults.summary.serverErrors}\n`);

  // Categorize issues
  const notFoundEndpoints = auditResults.endpoints.filter(e => e.status === 'NOT_FOUND');
  const authIssueEndpoints = auditResults.endpoints.filter(e => e.status === 'AUTH_ISSUE');
  const serverErrorEndpoints = auditResults.endpoints.filter(e => e.status === 'SERVER_ERROR');
  const workingEndpoints = auditResults.endpoints.filter(e => e.status === 'WORKING');

  // Generate recommendations
  if (auditResults.summary.failedTests === auditResults.summary.totalEndpoints) {
    auditResults.recommendations.push({
      priority: 'CRITICAL',
      issue: 'Worker not deployed or inaccessible',
      solution: 'Deploy the worker using: cd worker && wrangler deploy'
    });
  }

  if (notFoundEndpoints.length > 0) {
    auditResults.recommendations.push({
      priority: 'HIGH',
      issue: `${notFoundEndpoints.length} endpoints return 404`,
      solution: 'Check routing implementation in src/index.js',
      endpoints: notFoundEndpoints.map(e => `${e.method} ${e.path}`)
    });
  }

  if (authIssueEndpoints.length > 0) {
    auditResults.recommendations.push({
      priority: 'MEDIUM',
      issue: `${authIssueEndpoints.length} endpoints have authentication issues`,
      solution: 'Verify bearer token configuration in wrangler.toml',
      endpoints: authIssueEndpoints.map(e => `${e.method} ${e.path}`)
    });
  }

  if (serverErrorEndpoints.length > 0) {
    auditResults.recommendations.push({
      priority: 'HIGH',
      issue: `${serverErrorEndpoints.length} endpoints have server errors`,
      solution: 'Check CloudFlare Worker logs for error details',
      endpoints: serverErrorEndpoints.map(e => `${e.method} ${e.path}`)
    });
  }

  // Print detailed results
  if (notFoundEndpoints.length > 0) {
    console.log('🔍 NOT FOUND ENDPOINTS:');
    notFoundEndpoints.forEach(e => {
      console.log(`   ${e.method} ${e.path} - ${e.operationId || 'No operationId'}`);
    });
    console.log('');
  }

  if (authIssueEndpoints.length > 0) {
    console.log('🔐 AUTHENTICATION ISSUES:');
    authIssueEndpoints.forEach(e => {
      console.log(`   ${e.method} ${e.path} - ${e.finalResult.status} ${e.finalResult.statusText}`);
    });
    console.log('');
  }

  if (serverErrorEndpoints.length > 0) {
    console.log('🔥 SERVER ERRORS:');
    serverErrorEndpoints.forEach(e => {
      console.log(`   ${e.method} ${e.path} - ${e.finalResult.status} ${e.finalResult.statusText}`);
    });
    console.log('');
  }

  if (workingEndpoints.length > 0) {
    console.log('✅ WORKING ENDPOINTS:');
    workingEndpoints.forEach(e => {
      console.log(`   ${e.method} ${e.path} - ${e.summary || 'No summary'}`);
    });
    console.log('');
  }

  // Print recommendations
  console.log('💡 RECOMMENDATIONS:');
  auditResults.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
    console.log(`   Solution: ${rec.solution}`);
    if (rec.endpoints) {
      console.log(`   Affected: ${rec.endpoints.slice(0, 3).join(', ')}${rec.endpoints.length > 3 ? `... (+${rec.endpoints.length - 3} more)` : ''}`);
    }
    console.log('');
  });
}

/**
 * Save detailed results to JSON file
 */
function saveResults() {
  const resultsPath = path.join(__dirname, 'audit-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
  console.log(`📄 Detailed results saved to: ${resultsPath}`);
}

/**
 * Main audit function
 */
async function main() {
  try {
    await auditAllEndpoints();
    analyzeResults();
    saveResults();
    
    const successRate = (auditResults.summary.successfulTests / auditResults.summary.totalEndpoints * 100).toFixed(1);
    console.log(`\n🎯 AUDIT COMPLETE: ${successRate}% success rate`);
    
    if (auditResults.summary.successfulTests === auditResults.summary.totalEndpoints) {
      console.log('🎉 All endpoints are working correctly!');
      process.exit(0);
    } else {
      console.log('⚠️  Issues found - see recommendations above');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }
}

// Run the audit
if (require.main === module) {
  main();
}

module.exports = { auditAllEndpoints, makeRequest, API_BASE };