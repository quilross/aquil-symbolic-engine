#!/usr/bin/env node

/**
 * Final Comprehensive Audit Script
 * Runs complete validation of Signal Q deployment for CustomGPT integration readiness
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
const ADMIN_TOKEN = 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2';

console.log('🏁 Signal Q Final Comprehensive Audit\n');
console.log(`🌐 API Base: ${BASE_URL}`);
console.log(`🕒 Timestamp: ${new Date().toISOString()}\n`);

const finalAuditReport = {
  timestamp: new Date().toISOString(),
  apiBase: BASE_URL,
  version: '2.0.0',
  auditCategories: {
    deployment: {
      score: 0,
      status: 'unknown',
      tests: [],
      issues: []
    },
    authentication: {
      score: 0,
      status: 'unknown',
      tests: [],
      issues: []
    },
    apiCompliance: {
      score: 0,
      status: 'unknown',
      tests: [],
      issues: []
    },
    performance: {
      score: 0,
      status: 'unknown',
      tests: [],
      issues: []
    },
    customGptReadiness: {
      score: 0,
      status: 'unknown',
      requirements: [],
      issues: []
    }
  },
  overallScore: 0,
  overallStatus: 'unknown',
  recommendations: [],
  criticalIssues: [],
  passingCriteria: {
    minimumScore: 85,
    requiredFeatures: [
      'health_endpoint',
      'authentication',
      'cors_headers',
      'openapi_spec',
      'error_handling'
    ],
    customGptRequirements: [
      'base_url_accessible',
      'bearer_auth_working',
      'openapi_spec_valid',
      'core_endpoints_working'
    ]
  }
};

async function testDeploymentStatus() {
  console.log('🚀 Testing Deployment Status...\n');
  
  const tests = [
    {
      name: 'Base URL Accessibility',
      test: async () => {
        const response = await fetch(BASE_URL);
        return response.status !== 404;
      }
    },
    {
      name: 'Health Endpoint Available',
      test: async () => {
        const response = await fetch(`${BASE_URL}/system/health`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        return response.ok;
      }
    },
    {
      name: 'CORS Headers Present',
      test: async () => {
        const response = await fetch(`${BASE_URL}/system/health`, {
          method: 'OPTIONS'
        });
        return response.headers.get('Access-Control-Allow-Origin') !== null;
      }
    },
    {
      name: 'JSON Response Format',
      test: async () => {
        const response = await fetch(`${BASE_URL}/system/health`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data && typeof data === 'object';
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const testCase of tests) {
    try {
      const passed = await testCase.test();
      const result = {
        name: testCase.name,
        passed,
        timestamp: new Date().toISOString()
      };
      
      finalAuditReport.auditCategories.deployment.tests.push(result);
      
      console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}`);
      
      if (passed) {
        passedTests++;
      } else {
        finalAuditReport.auditCategories.deployment.issues.push({
          severity: 'high',
          message: `${testCase.name} failed`,
          category: 'deployment'
        });
      }
      
    } catch (error) {
      console.log(`  ❌ ${testCase.name}: ${error.message}`);
      finalAuditReport.auditCategories.deployment.issues.push({
        severity: 'critical',
        message: `${testCase.name} error: ${error.message}`,
        category: 'deployment'
      });
    }
  }
  
  finalAuditReport.auditCategories.deployment.score = Math.round((passedTests / tests.length) * 100);
  finalAuditReport.auditCategories.deployment.status = passedTests === tests.length ? 'passing' : 'failing';
  
  console.log(`\n📊 Deployment Score: ${finalAuditReport.auditCategories.deployment.score}/100\n`);
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');
  
  const authTests = [
    {
      name: 'Valid User Token',
      token: USER_TOKEN,
      expectedStatus: 200,
      description: 'Standard user token should grant access'
    },
    {
      name: 'Valid Admin Token',
      token: ADMIN_TOKEN,
      expectedStatus: 200,
      description: 'Admin token should grant access'
    },
    {
      name: 'Invalid Token Rejection',
      token: 'invalid_token_12345',
      expectedStatus: 401,
      description: 'Invalid tokens should be rejected'
    },
    {
      name: 'Missing Token Rejection',
      token: null,
      expectedStatus: 401,
      description: 'Requests without tokens should be rejected'
    },
    {
      name: 'Malformed Auth Header',
      token: 'NotBearerFormat',
      expectedStatus: 401,
      description: 'Malformed auth headers should be rejected',
      customHeader: true
    }
  ];
  
  let passedTests = 0;
  
  for (const authTest of authTests) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      if (authTest.token) {
        if (authTest.customHeader) {
          headers['Authorization'] = authTest.token;
        } else {
          headers['Authorization'] = `Bearer ${authTest.token}`;
        }
      }
      
      const response = await fetch(`${BASE_URL}/system/health`, { headers });
      const passed = response.status === authTest.expectedStatus;
      
      const result = {
        name: authTest.name,
        passed,
        expectedStatus: authTest.expectedStatus,
        actualStatus: response.status,
        description: authTest.description
      };
      
      finalAuditReport.auditCategories.authentication.tests.push(result);
      
      console.log(`  ${passed ? '✅' : '❌'} ${authTest.name}: ${response.status} (expected ${authTest.expectedStatus})`);
      
      if (passed) {
        passedTests++;
      } else {
        finalAuditReport.auditCategories.authentication.issues.push({
          severity: 'high',
          message: `${authTest.name}: expected ${authTest.expectedStatus}, got ${response.status}`,
          category: 'authentication'
        });
      }
      
    } catch (error) {
      console.log(`  ❌ ${authTest.name}: ${error.message}`);
      finalAuditReport.auditCategories.authentication.issues.push({
        severity: 'critical',
        message: `${authTest.name} error: ${error.message}`,
        category: 'authentication'
      });
    }
  }
  
  finalAuditReport.auditCategories.authentication.score = Math.round((passedTests / authTests.length) * 100);
  finalAuditReport.auditCategories.authentication.status = passedTests === authTests.length ? 'passing' : 'failing';
  
  console.log(`\n📊 Authentication Score: ${finalAuditReport.auditCategories.authentication.score}/100\n`);
}

async function testAPICompliance() {
  console.log('📋 Testing API Compliance...\n');
  
  // Load and validate OpenAPI spec
  let openApiSpec;
  try {
    const specPath = path.join(__dirname, 'src', 'openapi-core.json');
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = JSON.parse(specContent);
    console.log(`  ✅ OpenAPI Spec Loaded: ${openApiSpec.info.title} v${openApiSpec.info.version}`);
  } catch (error) {
    console.log(`  ❌ OpenAPI Spec Loading Failed: ${error.message}`);
    finalAuditReport.auditCategories.apiCompliance.issues.push({
      severity: 'critical',
      message: `Cannot load OpenAPI spec: ${error.message}`,
      category: 'apiCompliance'
    });
    finalAuditReport.auditCategories.apiCompliance.score = 0;
    finalAuditReport.auditCategories.apiCompliance.status = 'failing';
    return;
  }
  
  // Test key endpoints from spec
  const keyEndpoints = [
    '/system/health',
    '/agent-suggestions',
    '/identity-nodes',
    '/play-protocols'
  ];
  
  let workingEndpoints = 0;
  
  for (const endpoint of keyEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      
      const working = response.status >= 200 && response.status < 400;
      
      const result = {
        endpoint,
        status: response.status,
        working,
        timestamp: new Date().toISOString()
      };
      
      finalAuditReport.auditCategories.apiCompliance.tests.push(result);
      
      console.log(`  ${working ? '✅' : '❌'} ${endpoint}: ${response.status}`);
      
      if (working) {
        workingEndpoints++;
      } else {
        finalAuditReport.auditCategories.apiCompliance.issues.push({
          severity: 'medium',
          message: `${endpoint} returns ${response.status}`,
          category: 'apiCompliance'
        });
      }
      
    } catch (error) {
      console.log(`  ❌ ${endpoint}: ${error.message}`);
      finalAuditReport.auditCategories.apiCompliance.issues.push({
        severity: 'high',
        message: `${endpoint} error: ${error.message}`,
        category: 'apiCompliance'
      });
    }
  }
  
  finalAuditReport.auditCategories.apiCompliance.score = Math.round((workingEndpoints / keyEndpoints.length) * 100);
  finalAuditReport.auditCategories.apiCompliance.status = workingEndpoints >= keyEndpoints.length * 0.8 ? 'passing' : 'failing';
  
  console.log(`\n📊 API Compliance Score: ${finalAuditReport.auditCategories.apiCompliance.score}/100\n`);
}

async function testPerformance() {
  console.log('⚡ Testing Performance...\n');
  
  const performanceTests = [
    { endpoint: '/system/health', name: 'Health Check' },
    { endpoint: '/agent-suggestions', name: 'Agent Suggestions' },
    { endpoint: '/identity-nodes', name: 'Identity Nodes' }
  ];
  
  const responseTimes = [];
  
  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
      });
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      const result = {
        name: test.name,
        endpoint: test.endpoint,
        responseTime,
        status: response.status,
        success: response.ok
      };
      
      finalAuditReport.auditCategories.performance.tests.push(result);
      
      console.log(`  ⏱️  ${test.name}: ${responseTime}ms (${response.status})`);
      
      if (responseTime > 1000) {
        finalAuditReport.auditCategories.performance.issues.push({
          severity: 'medium',
          message: `${test.name} slow response: ${responseTime}ms`,
          category: 'performance'
        });
      }
      
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
      finalAuditReport.auditCategories.performance.issues.push({
        severity: 'high',
        message: `${test.name} error: ${error.message}`,
        category: 'performance'
      });
    }
  }
  
  // Calculate performance score
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    console.log(`\n📈 Average Response Time: ${Math.round(avgResponseTime)}ms`);
    
    // Score based on response time
    if (avgResponseTime < 200) {
      finalAuditReport.auditCategories.performance.score = 100;
    } else if (avgResponseTime < 500) {
      finalAuditReport.auditCategories.performance.score = 85;
    } else if (avgResponseTime < 1000) {
      finalAuditReport.auditCategories.performance.score = 70;
    } else {
      finalAuditReport.auditCategories.performance.score = 50;
    }
  } else {
    finalAuditReport.auditCategories.performance.score = 0;
  }
  
  finalAuditReport.auditCategories.performance.status = finalAuditReport.auditCategories.performance.score >= 70 ? 'passing' : 'failing';
  
  console.log(`📊 Performance Score: ${finalAuditReport.auditCategories.performance.score}/100\n`);
}

async function testCustomGPTReadiness() {
  console.log('🤖 Testing CustomGPT Integration Readiness...\n');
  
  const requirements = [
    {
      name: 'Base URL Accessible',
      test: async () => {
        const response = await fetch(BASE_URL);
        return response.status !== 404;
      }
    },
    {
      name: 'Bearer Auth Working',
      test: async () => {
        const response = await fetch(`${BASE_URL}/system/health`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        return response.ok;
      }
    },
    {
      name: 'OpenAPI Spec Valid',
      test: async () => {
        try {
          const specPath = path.join(__dirname, 'src', 'openapi-core.json');
          const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
          return spec.openapi && spec.info && spec.paths;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Core Endpoints Working',
      test: async () => {
        const coreEndpoints = ['/system/health', '/agent-suggestions'];
        const results = await Promise.all(
          coreEndpoints.map(async (endpoint) => {
            try {
              const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
              });
              return response.ok;
            } catch {
              return false;
            }
          })
        );
        return results.every(Boolean);
      }
    },
    {
      name: 'CORS Headers Present',
      test: async () => {
        const response = await fetch(`${BASE_URL}/system/health`, {
          method: 'OPTIONS'
        });
        return response.headers.get('Access-Control-Allow-Origin') !== null;
      }
    }
  ];
  
  let metRequirements = 0;
  
  for (const requirement of requirements) {
    try {
      const met = await requirement.test();
      
      const result = {
        name: requirement.name,
        met,
        timestamp: new Date().toISOString()
      };
      
      finalAuditReport.auditCategories.customGptReadiness.requirements.push(result);
      
      console.log(`  ${met ? '✅' : '❌'} ${requirement.name}`);
      
      if (met) {
        metRequirements++;
      } else {
        finalAuditReport.auditCategories.customGptReadiness.issues.push({
          severity: 'high',
          message: `CustomGPT requirement not met: ${requirement.name}`,
          category: 'customGptReadiness'
        });
      }
      
    } catch (error) {
      console.log(`  ❌ ${requirement.name}: ${error.message}`);
      finalAuditReport.auditCategories.customGptReadiness.issues.push({
        severity: 'critical',
        message: `${requirement.name} error: ${error.message}`,
        category: 'customGptReadiness'
      });
    }
  }
  
  finalAuditReport.auditCategories.customGptReadiness.score = Math.round((metRequirements / requirements.length) * 100);
  finalAuditReport.auditCategories.customGptReadiness.status = metRequirements === requirements.length ? 'ready' : 'not_ready';
  
  console.log(`\n🤖 CustomGPT Readiness Score: ${finalAuditReport.auditCategories.customGptReadiness.score}/100\n`);
}

function calculateOverallScore() {
  const categories = finalAuditReport.auditCategories;
  const scores = [
    categories.deployment.score,
    categories.authentication.score,
    categories.apiCompliance.score,
    categories.performance.score,
    categories.customGptReadiness.score
  ];
  
  finalAuditReport.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  // Determine overall status
  if (finalAuditReport.overallScore >= finalAuditReport.passingCriteria.minimumScore) {
    finalAuditReport.overallStatus = 'passing';
  } else {
    finalAuditReport.overallStatus = 'failing';
  }
  
  // Check for critical issues
  Object.values(categories).forEach(category => {
    category.issues.forEach(issue => {
      if (issue.severity === 'critical') {
        finalAuditReport.criticalIssues.push(issue);
      }
    });
  });
}

function generateRecommendations() {
  const categories = finalAuditReport.auditCategories;
  
  // Deployment recommendations
  if (categories.deployment.score < 100) {
    finalAuditReport.recommendations.push('Fix deployment issues to ensure full accessibility');
  }
  
  // Authentication recommendations
  if (categories.authentication.score < 100) {
    finalAuditReport.recommendations.push('Improve authentication system reliability');
  }
  
  // API compliance recommendations
  if (categories.apiCompliance.score < 80) {
    finalAuditReport.recommendations.push('Fix failing API endpoints to improve compliance');
  }
  
  // Performance recommendations
  if (categories.performance.score < 85) {
    finalAuditReport.recommendations.push('Optimize API performance for better response times');
  }
  
  // CustomGPT readiness recommendations
  if (categories.customGptReadiness.status !== 'ready') {
    finalAuditReport.recommendations.push('Address CustomGPT integration requirements');
  }
  
  // Critical issues recommendations
  if (finalAuditReport.criticalIssues.length > 0) {
    finalAuditReport.recommendations.unshift('URGENT: Fix critical issues before proceeding');
  }
  
  // Success recommendations
  if (finalAuditReport.overallScore >= 95) {
    finalAuditReport.recommendations.push('Excellent! Signal Q is fully ready for production use');
  }
}

function printFinalSummary() {
  console.log('\n🏁 Final Comprehensive Audit Summary:');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 Overall Score: ${finalAuditReport.overallScore}/100 (${finalAuditReport.overallStatus.toUpperCase()})`);
  console.log(`🕒 Audit Completed: ${finalAuditReport.timestamp}\n`);
  
  console.log('📊 Category Scores:');
  Object.entries(finalAuditReport.auditCategories).forEach(([category, data]) => {
    const icon = data.score >= 85 ? '✅' : data.score >= 70 ? '⚠️' : '❌';
    console.log(`  ${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${data.score}/100 (${data.status})`);
  });
  
  if (finalAuditReport.criticalIssues.length > 0) {
    console.log(`\n🚨 Critical Issues (${finalAuditReport.criticalIssues.length}):`);
    finalAuditReport.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.message}`);
    });
  }
  
  if (finalAuditReport.recommendations.length > 0) {
    console.log(`\n💡 Recommendations (${finalAuditReport.recommendations.length}):`);
    finalAuditReport.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n🤖 CustomGPT Integration Status:');
  if (finalAuditReport.auditCategories.customGptReadiness.status === 'ready') {
    console.log('✅ READY FOR CUSTOMGPT INTEGRATION!');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Bearer Token: ${USER_TOKEN}`);
    console.log('   OpenAPI Schema: worker/src/openapi-core.json');
  } else {
    console.log('❌ NOT READY - Fix issues first');
  }
  
  console.log('\n📈 Audit Quality:');
  if (finalAuditReport.overallScore >= 95) {
    console.log('🌟 EXCELLENT - Production ready!');
  } else if (finalAuditReport.overallScore >= 85) {
    console.log('👍 GOOD - Minor improvements needed');
  } else if (finalAuditReport.overallScore >= 70) {
    console.log('⚠️  FAIR - Several issues need attention');
  } else {
    console.log('🚫 POOR - Major issues require fixing');
  }
}

async function saveResults() {
  try {
    const outputPath = path.join(__dirname, 'final-audit-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalAuditReport, null, 2));
    console.log(`\n💾 Final audit report saved to: ${outputPath}`);
    
    // Also create alignment report for backward compatibility
    const alignmentReport = {
      timestamp: finalAuditReport.timestamp,
      overall_status: finalAuditReport.overallStatus,
      score: finalAuditReport.overallScore,
      customgpt_ready: finalAuditReport.auditCategories.customGptReadiness.status === 'ready',
      api_base: BASE_URL,
      bearer_token: USER_TOKEN,
      openapi_schema: 'worker/src/openapi-core.json'
    };
    
    const alignmentPath = path.join(__dirname, 'alignment-report.json');
    fs.writeFileSync(alignmentPath, JSON.stringify(alignmentReport, null, 2));
    
  } catch (error) {
    console.error(`❌ Failed to save audit results: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    await testDeploymentStatus();
    await testAuthentication();
    await testAPICompliance();
    await testPerformance();
    await testCustomGPTReadiness();
    
    calculateOverallScore();
    generateRecommendations();
    printFinalSummary();
    await saveResults();
    
    // Exit with appropriate code
    if (finalAuditReport.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND - Deployment not recommended');
      process.exit(2);
    } else if (finalAuditReport.overallScore < finalAuditReport.passingCriteria.minimumScore) {
      console.log('\n⚠️  AUDIT FAILED - Score below minimum threshold');
      process.exit(1);
    } else {
      console.log('\n🎉 AUDIT PASSED - Signal Q ready for production!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Final audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDeploymentStatus, testAuthentication, finalAuditReport };