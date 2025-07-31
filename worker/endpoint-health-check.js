#!/usr/bin/env node

/**
 * Automated endpoint health checker for Signal Q
 * Tests all OpenAPI endpoints for proper response structure
 */

const WORKER_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const API_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h'; // From wrangler.toml

// Define test endpoints with expected schemas
const TEST_ENDPOINTS = [
  {
    path: '/system/health',
    method: 'GET',
    expectedFields: ['overall', 'api', 'storage', 'deployment']
  },
  {
    path: '/agent-suggestions',
    method: 'GET', 
    expectedFields: ['suggestions']
  },
  {
    path: '/agent-overwhelm',
    method: 'GET',
    expectedFields: ['overwhelmed', 'message']
  },
  {
    path: '/philadelphia-context',
    method: 'GET',
    expectedFields: ['culture', 'events', 'history']
  },
  {
    path: '/patterns/cross-domain',
    method: 'GET',
    expectedFields: ['correlations', 'emergingPatterns']
  },
  {
    path: '/energy/circadian-optimization',
    method: 'GET',
    expectedFields: ['currentPhase', 'energyOptimization']
  }
];

async function testEndpoint(endpoint, startTime) {
  try {
    const response = await fetch(`${WORKER_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'X-User-Id': 'health-check'
      }
    });

    if (!response.ok) {
      return {
        path: endpoint.path,
        status: 'FAIL',
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    const missingFields = endpoint.expectedFields.filter(field => !(field in data));
    
    return {
      path: endpoint.path,
      status: missingFields.length === 0 ? 'PASS' : 'PARTIAL',
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      path: endpoint.path,
      status: 'ERROR',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function runHealthCheck() {
  console.log('🏥 Signal Q Endpoint Health Check\n');
  console.log(`Testing: ${WORKER_URL}`);
  console.log(`Token: ${API_TOKEN.substring(0, 10)}...`);
  console.log('='.repeat(50));

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const endpoint of TEST_ENDPOINTS) {
    const startTime = Date.now();
    const result = await testEndpoint(endpoint, startTime);
    results.push(result);

    const status = result.status === 'PASS' ? '✅' : 
                  result.status === 'PARTIAL' ? '⚠️' : '❌';
    
    console.log(`${status} ${endpoint.path} (${result.responseTime || 'N/A'}ms)`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.missingFields) {
      console.log(`   Missing: ${result.missingFields.join(', ')}`);
    }

    if (result.status === 'PASS') passed++;
    else failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Health Score: ${Math.round(passed / (passed + failed) * 100)}%`);

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().then(results => {
    process.exit(results.every(r => r.status === 'PASS') ? 0 : 1);
  });
}

export { runHealthCheck };
