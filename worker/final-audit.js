#!/usr/bin/env node

/**
 * Final Audit Script
 * Comprehensive validation of Signal Q Worker deployment
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';

console.log('🏁 Final Deployment Audit\n');
console.log(`🌐 API Base: ${BASE_URL}`);
console.log(`🔑 Using Token: ${USER_TOKEN.substring(0, 20)}...\n`);

const finalResults = {
  timestamp: new Date().toISOString(),
  deployment: {},
  functionality: {},
  performance: {},
  security: {},
  compatibility: {},
  overall: {},
  critical_issues: [],
  warnings: [],
  passed: false
};

async function testCoreEndpoints() {
  console.log('🔄 Testing Core Endpoints...');
  
  const coreEndpoints = [
    '/system/health',
    '/agent-suggestions',
    '/identity-nodes',
    '/play-protocols',
    '/effectiveness-dashboard'
  ];
  
  let workingEndpoints = 0;
  const endpointResults = {};
  
  for (const endpoint of coreEndpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      const responseTime = Date.now() - startTime;
      
      const isWorking = response.status < 500;
      if (isWorking) {
        workingEndpoints++;
        console.log(`✅ ${endpoint}: ${response.status} (${responseTime}ms)`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status} (${responseTime}ms)`);
        finalResults.critical_issues.push(`Core endpoint ${endpoint} failed with status ${response.status}`);
      }
      
      endpointResults[endpoint] = {
        status: response.status,
        responseTime,
        working: isWorking
      };
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
      finalResults.critical_issues.push(`Core endpoint ${endpoint} error: ${error.message}`);
      endpointResults[endpoint] = {
        error: error.message,
        working: false
      };
    }
  }
  
  finalResults.functionality = {
    core_endpoints_working: workingEndpoints,
    total_core_endpoints: coreEndpoints.length,
    success_rate: Math.round((workingEndpoints / coreEndpoints.length) * 100),
    endpoints: endpointResults
  };
  
  console.log(`📊 Core Functionality: ${workingEndpoints}/${coreEndpoints.length} working (${finalResults.functionality.success_rate}%)\n`);
}

async function testPerformance() {
  console.log('⚡ Performance Testing...');
  
  const performanceTests = [];
  const testCount = 5;
  
  for (let i = 0; i < testCount; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/system/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      const responseTime = Date.now() - startTime;
      
      performanceTests.push({
        test: i + 1,
        responseTime,
        status: response.status,
        success: response.ok
      });
      
      console.log(`⚡ Test ${i + 1}: ${responseTime}ms (${response.status})`);
      
    } catch (error) {
      performanceTests.push({
        test: i + 1,
        error: error.message,
        success: false
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successfulTests = performanceTests.filter(t => t.success);
  const avgResponseTime = successfulTests.length > 0 ? 
    Math.round(successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length) : 0;
  
  finalResults.performance = {
    average_response_time: avgResponseTime,
    successful_tests: successfulTests.length,
    total_tests: testCount,
    performance_score: avgResponseTime < 1000 ? 100 : Math.max(0, 100 - Math.floor((avgResponseTime - 1000) / 100) * 10),
    tests: performanceTests
  };
  
  console.log(`📈 Average Response Time: ${avgResponseTime}ms`);
  console.log(`🎯 Performance Score: ${finalResults.performance.performance_score}/100\n`);
  
  if (avgResponseTime > 2000) {
    finalResults.warnings.push(`Slow response times detected (${avgResponseTime}ms average)`);
  }
}

async function testSecurity() {
  console.log('🔐 Security Validation...');
  
  const securityTests = [
    {
      name: 'Valid Authentication',
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      expectAuth: true
    },
    {
      name: 'Invalid Token Rejection',
      headers: { 'Authorization': 'Bearer invalid_token_12345' },
      expectAuth: false
    },
    {
      name: 'Missing Token Rejection',
      headers: {},
      expectAuth: false
    },
    {
      name: 'CORS Headers',
      method: 'OPTIONS',
      headers: {},
      expectCORS: true
    }
  ];
  
  let securityPassed = 0;
  const securityResults = {};
  
  for (const test of securityTests) {
    try {
      const response = await fetch(`${BASE_URL}/system/health`, {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      });
      
      let passed = false;
      
      if (test.expectAuth !== undefined) {
        // Authentication test
        passed = test.expectAuth ? response.ok : response.status === 401;
      } else if (test.expectCORS) {
        // CORS test
        passed = response.headers.get('Access-Control-Allow-Origin') !== null;
      }
      
      if (passed) {
        console.log(`✅ ${test.name}: PASS`);
        securityPassed++;
      } else {
        console.log(`❌ ${test.name}: FAIL`);
        finalResults.critical_issues.push(`Security test failed: ${test.name}`);
      }
      
      securityResults[test.name] = {
        passed,
        status: response.status,
        corsHeaders: test.expectCORS ? Object.fromEntries(
          Array.from(response.headers.entries()).filter(([key]) => 
            key.toLowerCase().startsWith('access-control')
          )
        ) : undefined
      };
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      finalResults.critical_issues.push(`Security test error: ${test.name} - ${error.message}`);
      securityResults[test.name] = { error: error.message, passed: false };
    }
  }
  
  finalResults.security = {
    tests_passed: securityPassed,
    total_tests: securityTests.length,
    security_score: Math.round((securityPassed / securityTests.length) * 100),
    tests: securityResults
  };
  
  console.log(`🔒 Security Score: ${finalResults.security.security_score}/100\n`);
}

async function testCustomGPTCompatibility() {
  console.log('🤖 CustomGPT Compatibility Check...');
  
  try {
    // Test OpenAPI spec accessibility
    const specResponse = await fetch(`${BASE_URL}/openapi`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    
    // Test health endpoint (critical for CustomGPT)
    const healthResponse = await fetch(`${BASE_URL}/system/health`, {
      headers: { 
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const healthData = healthResponse.ok ? await healthResponse.json() : null;
    
    const compatibilityChecks = {
      health_endpoint: healthResponse.ok,
      json_response: healthData !== null,
      required_fields: healthData && healthData.overall && healthData.api,
      cors_support: healthResponse.headers.get('Access-Control-Allow-Origin') !== null,
      bearer_auth: healthResponse.ok
    };
    
    const passedChecks = Object.values(compatibilityChecks).filter(Boolean).length;
    const totalChecks = Object.keys(compatibilityChecks).length;
    
    finalResults.compatibility = {
      customgpt_score: Math.round((passedChecks / totalChecks) * 100),
      checks: compatibilityChecks,
      passed_checks: passedChecks,
      total_checks: totalChecks,
      integration_ready: passedChecks === totalChecks
    };
    
    console.log(`🤖 CustomGPT Compatibility: ${finalResults.compatibility.customgpt_score}%`);
    
    Object.entries(compatibilityChecks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check.replace(/_/g, ' ')}`);
    });
    
    if (!finalResults.compatibility.integration_ready) {
      finalResults.warnings.push('CustomGPT integration may have compatibility issues');
    }
    
  } catch (error) {
    console.log(`❌ CustomGPT compatibility test failed: ${error.message}`);
    finalResults.critical_issues.push(`CustomGPT compatibility error: ${error.message}`);
    finalResults.compatibility = { error: error.message, customgpt_score: 0 };
  }
  
  console.log('');
}

function calculateOverallScore() {
  console.log('🏆 Calculating Overall Score...');
  
  const scores = {
    functionality: finalResults.functionality?.success_rate || 0,
    performance: finalResults.performance?.performance_score || 0,
    security: finalResults.security?.security_score || 0,
    compatibility: finalResults.compatibility?.customgpt_score || 0
  };
  
  const weights = {
    functionality: 0.4,  // 40% - most important
    security: 0.3,       // 30% - critical for production
    compatibility: 0.2,  // 20% - important for integration
    performance: 0.1     // 10% - nice to have
  };
  
  const weightedScore = Object.entries(scores).reduce((total, [category, score]) => {
    return total + (score * weights[category]);
  }, 0);
  
  finalResults.overall = {
    score: Math.round(weightedScore),
    category_scores: scores,
    weights_used: weights,
    passed: weightedScore >= 70 && finalResults.critical_issues.length === 0
  };
  
  console.log(`🏆 Overall Score: ${finalResults.overall.score}/100`);
  Object.entries(scores).forEach(([category, score]) => {
    console.log(`   ${category}: ${score}% (weight: ${Math.round(weights[category] * 100)}%)`);
  });
  
  finalResults.passed = finalResults.overall.passed;
}

function generateFinalReport() {
  console.log('\n📋 Generating Final Audit Report...');
  
  const reportPath = path.join(__dirname, 'final-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(finalResults, null, 2));
  
  console.log(`📄 Report saved to: ${reportPath}`);
  
  if (finalResults.critical_issues.length > 0) {
    console.log('\n🚨 Critical Issues:');
    finalResults.critical_issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (finalResults.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    finalResults.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
  
  return finalResults.passed;
}

async function main() {
  try {
    await testCoreEndpoints();
    await testPerformance();
    await testSecurity();
    await testCustomGPTCompatibility();
    calculateOverallScore();
    
    const passed = generateFinalReport();
    
    if (passed) {
      console.log('\n🎉 FINAL AUDIT: PASSED ✅');
      console.log('🚀 Signal Q Worker is ready for production!');
    } else {
      console.log('\n⚠️  FINAL AUDIT: NEEDS ATTENTION ❌');
      console.log('🔧 Please address critical issues before production deployment.');
    }
    
    console.log(`\n📊 Overall Score: ${finalResults.overall.score}/100`);
    console.log(`🚨 Critical Issues: ${finalResults.critical_issues.length}`);
    console.log(`⚠️  Warnings: ${finalResults.warnings.length}`);
    
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Final audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, finalResults };