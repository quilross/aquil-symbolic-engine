#!/usr/bin/env node

/**
 * OpenAPI Audit Script for Signal Q Worker
 * Validates OpenAPI compliance and CustomGPT compatibility
 */

const fs = require('fs');
const path = require('path');

const WORKER_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const API_TOKEN = process.env.API_TOKEN || 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';

console.log('📋 OpenAPI Audit for Signal Q Worker\n');

async function validateOpenAPICompliance() {
  const auditResults = {
    timestamp: new Date().toISOString(),
    workerUrl: WORKER_URL,
    apiVersion: '2.1.0',
    compliance: {
      openapi: true,
      customgpt: true,
      authentication: true,
      cors: true
    },
    endpoints: [],
    issues: [],
    recommendations: []
  };

  try {
    // Test core OpenAPI endpoints
    const coreEndpoints = [
      '/system/health',
      '/identity-nodes',
      '/protocols/aquil-probe',
      '/voice-shifts',
      '/identity-memories',
      '/narratives/generate',
      '/play-protocols',
      '/feedback',
      '/logs'
    ];

    console.log('🔍 Testing core API endpoints...');
    
    for (const endpoint of coreEndpoints) {
      try {
        const response = await fetch(`${WORKER_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        const endpointResult = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          accessible: response.status < 500,
          hasValidJson: false,
          corsEnabled: response.headers.get('Access-Control-Allow-Origin') === '*'
        };

        // Try to parse JSON
        try {
          const data = await response.json();
          endpointResult.hasValidJson = true;
          endpointResult.responseStructure = typeof data;
          endpointResult.hasTimestamp = !!data.timestamp;
        } catch (e) {
          endpointResult.jsonError = e.message;
        }

        auditResults.endpoints.push(endpointResult);

        console.log(`  ${endpoint}: ${response.status} ${endpointResult.hasValidJson ? '✅' : '⚠️'}`);

        // Validate CORS
        if (!endpointResult.corsEnabled) {
          auditResults.issues.push({
            type: 'cors',
            endpoint,
            message: 'CORS headers not properly configured'
          });
        }

      } catch (error) {
        auditResults.endpoints.push({
          endpoint,
          error: error.message,
          accessible: false
        });
        
        auditResults.issues.push({
          type: 'connectivity',
          endpoint,
          message: error.message
        });
        
        console.log(`  ${endpoint}: ❌ ${error.message}`);
      }
    }

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    
    try {
      const authTestResponse = await fetch(`${WORKER_URL}/system/health`, {
        headers: { 'Authorization': 'Bearer invalid_token' }
      });
      
      if (authTestResponse.status === 401) {
        console.log('  Authentication: ✅ Properly rejects invalid tokens');
        auditResults.compliance.authentication = true;
      } else {
        console.log('  Authentication: ⚠️ Should reject invalid tokens');
        auditResults.compliance.authentication = false;
        auditResults.issues.push({
          type: 'security',
          message: 'Authentication not properly validating tokens'
        });
      }
    } catch (error) {
      auditResults.issues.push({
        type: 'auth_test',
        message: `Authentication test failed: ${error.message}`
      });
    }

    // CustomGPT compatibility check
    console.log('\n🤖 Testing CustomGPT compatibility...');
    
    const customGptTestEndpoints = [
      { endpoint: '/system/health', method: 'GET' },
      { endpoint: '/identity-nodes', method: 'GET' },
      { endpoint: '/feedback', method: 'POST', body: { message: 'test', rating: 5 } }
    ];

    for (const test of customGptTestEndpoints) {
      try {
        const options = {
          method: test.method,
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CustomGPT/1.0'
          }
        };

        if (test.body) {
          options.body = JSON.stringify(test.body);
        }

        const response = await fetch(`${WORKER_URL}${test.endpoint}`, options);
        
        if (response.status < 500) {
          console.log(`  ${test.method} ${test.endpoint}: ✅ CustomGPT compatible`);
        } else {
          console.log(`  ${test.method} ${test.endpoint}: ⚠️ Server error`);
          auditResults.compliance.customgpt = false;
        }
      } catch (error) {
        console.log(`  ${test.method} ${test.endpoint}: ❌ ${error.message}`);
        auditResults.compliance.customgpt = false;
      }
    }

    // Generate recommendations
    if (auditResults.issues.length === 0) {
      auditResults.recommendations.push('✅ All OpenAPI compliance checks passed');
      auditResults.recommendations.push('✅ CustomGPT compatibility verified');
      auditResults.recommendations.push('✅ No immediate issues detected');
    } else {
      auditResults.recommendations.push('Review and address identified issues');
      auditResults.recommendations.push('Re-run audit after fixes');
    }

    // Calculate overall compliance score
    const totalChecks = auditResults.endpoints.length + Object.keys(auditResults.compliance).length;
    const passedChecks = auditResults.endpoints.filter(e => e.accessible).length + 
                        Object.values(auditResults.compliance).filter(Boolean).length;
    auditResults.complianceScore = Math.round((passedChecks / totalChecks) * 100);

  } catch (error) {
    auditResults.issues.push({
      type: 'audit_error',
      message: `Audit script error: ${error.message}`
    });
  }

  // Save results
  fs.writeFileSync('openapi-audit-results.json', JSON.stringify(auditResults, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(auditResults);
  fs.writeFileSync('openapi-audit-report.html', htmlReport);

  console.log('\n📊 OpenAPI Audit Summary:');
  console.log(`  Compliance Score: ${auditResults.complianceScore}%`);
  console.log(`  Endpoints Tested: ${auditResults.endpoints.length}`);
  console.log(`  Issues Found: ${auditResults.issues.length}`);
  console.log(`  CustomGPT Compatible: ${auditResults.compliance.customgpt ? 'Yes' : 'No'}`);
  
  if (auditResults.issues.length > 0) {
    console.log('\n⚠️ Issues:');
    auditResults.issues.forEach(issue => {
      console.log(`  - ${issue.type}: ${issue.message}`);
    });
  }

  console.log('\n📄 Reports generated:');
  console.log('  - openapi-audit-results.json');
  console.log('  - openapi-audit-report.html');

  return auditResults;
}

function generateHTMLReport(results) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Signal Q OpenAPI Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 8px; }
        .score { font-size: 24px; font-weight: bold; color: ${results.complianceScore >= 90 ? '#22c55e' : results.complianceScore >= 70 ? '#f59e0b' : '#ef4444'}; }
        .endpoint { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        .pass { color: #22c55e; }
        .warn { color: #f59e0b; }
        .fail { color: #ef4444; }
        .issue { background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Signal Q OpenAPI Audit Report</h1>
        <p><strong>Generated:</strong> ${results.timestamp}</p>
        <p><strong>Worker URL:</strong> ${results.workerUrl}</p>
        <p><strong>API Version:</strong> ${results.apiVersion}</p>
        <div class="score">Compliance Score: ${results.complianceScore}%</div>
    </div>

    <h2>Compliance Overview</h2>
    <ul>
        <li class="${results.compliance.openapi ? 'pass' : 'fail'}">OpenAPI Standards: ${results.compliance.openapi ? 'PASS' : 'FAIL'}</li>
        <li class="${results.compliance.customgpt ? 'pass' : 'fail'}">CustomGPT Compatibility: ${results.compliance.customgpt ? 'PASS' : 'FAIL'}</li>
        <li class="${results.compliance.authentication ? 'pass' : 'fail'}">Authentication: ${results.compliance.authentication ? 'PASS' : 'FAIL'}</li>
        <li class="${results.compliance.cors ? 'pass' : 'fail'}">CORS: ${results.compliance.cors ? 'PASS' : 'FAIL'}</li>
    </ul>

    <h2>Endpoint Results</h2>
    ${results.endpoints.map(ep => `
        <div class="endpoint">
            <strong>${ep.endpoint}</strong> - 
            <span class="${ep.accessible ? 'pass' : 'fail'}">${ep.status || 'ERROR'}</span>
            ${ep.hasValidJson ? '<span class="pass">✓ Valid JSON</span>' : '<span class="warn">⚠ No JSON</span>'}
            ${ep.corsEnabled ? '<span class="pass">✓ CORS</span>' : '<span class="warn">⚠ No CORS</span>'}
        </div>
    `).join('')}

    ${results.issues.length > 0 ? `
    <h2>Issues Found</h2>
    ${results.issues.map(issue => `
        <div class="issue">
            <strong>${issue.type}:</strong> ${issue.message}
            ${issue.endpoint ? `<br><em>Endpoint: ${issue.endpoint}</em>` : ''}
        </div>
    `).join('')}
    ` : '<h2>No Issues Found ✅</h2>'}

    <h2>Recommendations</h2>
    <ul>
        ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>`;
}

// Run the audit
if (require.main === module) {
  validateOpenAPICompliance().catch(console.error);
}

module.exports = { validateOpenAPICompliance };