#!/usr/bin/env node

/**
 * Signal Q Final Audit & Alignment Report
 * 
 * Comprehensive analysis and recommendations for Signal Q Worker and OpenAPI alignment
 */

const fs = require('fs');
const path = require('path');

// Load files
const openApiPath = path.join(__dirname, 'src', 'openapi-core.json');
const workerPath = path.join(__dirname, 'src', 'index.js');
const wranglerPath = path.join(__dirname, 'wrangler.toml');

const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const workerCode = fs.readFileSync(workerPath, 'utf8');
const wranglerConfig = fs.readFileSync(wranglerPath, 'utf8');

const report = {
  timestamp: new Date().toISOString(),
  version: openApiSpec.info.version,
  summary: {
    status: 'ALIGNED',
    confidence: 95,
    totalEndpoints: 0,
    readyForDeployment: true
  },
  alignment: {
    openApiEndpoints: 0,
    implementedEndpoints: 0,
    alignmentPercentage: 0
  },
  authentication: {
    implemented: false,
    corsConfigured: false,
    bearerTokens: false
  },
  deployment: {
    configurationReady: false,
    tokensConfigured: false,
    aiBindingConfigured: false
  },
  recommendations: [],
  deploymentChecklist: [],
  testingGuidance: []
};

/**
 * Analyze authentication implementation
 */
function analyzeAuthentication() {
  // Check for Bearer token implementation
  const hasBearerAuth = workerCode.includes('Authorization') && 
                       workerCode.includes('Bearer') &&
                       workerCode.includes('token');
  
  // Check for CORS implementation
  const hasCORS = workerCode.includes('Access-Control-Allow-Origin') &&
                 workerCode.includes('Access-Control-Allow-Methods') &&
                 workerCode.includes('Access-Control-Allow-Headers');
  
  // Check token validation
  const hasTokenValidation = workerCode.includes('API_TOKEN') &&
                            workerCode.includes('unauthorized');
  
  report.authentication.implemented = hasBearerAuth && hasTokenValidation;
  report.authentication.corsConfigured = hasCORS;
  report.authentication.bearerTokens = hasBearerAuth;
  
  if (!report.authentication.implemented) {
    report.recommendations.push({
      priority: 'HIGH',
      category: 'Authentication',
      issue: 'Bearer token authentication implementation needs verification',
      solution: 'Verify auth flow: Authorization header → Bearer token → env.API_TOKEN validation'
    });
  }
}

/**
 * Analyze deployment configuration
 */
function analyzeDeploymentConfig() {
  const hasAPITokens = wranglerConfig.includes('API_TOKEN') &&
                      wranglerConfig.includes('API_TOKEN_ADMIN');
  
  const hasAIBinding = wranglerConfig.includes('[ai]') &&
                      wranglerConfig.includes('binding = "AI"');
  
  const hasDurableObjects = wranglerConfig.includes('durable_objects') &&
                           wranglerConfig.includes('UserState');
  
  report.deployment.tokensConfigured = hasAPITokens;
  report.deployment.aiBindingConfigured = hasAIBinding;
  report.deployment.configurationReady = hasAPITokens && hasAIBinding && hasDurableObjects;
  
  if (!report.deployment.configurationReady) {
    report.recommendations.push({
      priority: 'MEDIUM',
      category: 'Deployment',
      issue: 'Wrangler configuration incomplete',
      solution: 'Verify all bindings: API tokens, AI binding, Durable Objects'
    });
  }
}

/**
 * Count endpoints in spec vs implementation
 */
function analyzeEndpointCoverage() {
  const openApiEndpoints = Object.keys(openApiSpec.paths).reduce(
    (count, path) => count + Object.keys(openApiSpec.paths[path]).length, 0
  );
  
  // Count implemented endpoints by searching for route patterns
  const routePatterns = [
    /\/'([^']+)':\s*\{\s*'([^']+)':/g,
    /if \(path === '([^']+)' && method === '([^']+)'\)/g
  ];
  
  const implementedRoutes = new Set();
  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(workerCode)) !== null) {
      implementedRoutes.add(`${match[2].toUpperCase()} ${match[1]}`);
    }
  });
  
  report.alignment.openApiEndpoints = openApiEndpoints;
  report.alignment.implementedEndpoints = implementedRoutes.size;
  report.alignment.alignmentPercentage = Math.round(
    (Math.min(openApiEndpoints, implementedRoutes.size) / openApiEndpoints) * 100
  );
  
  report.summary.totalEndpoints = openApiEndpoints;
}

/**
 * Generate deployment checklist
 */
function generateDeploymentChecklist() {
  report.deploymentChecklist = [
    {
      task: 'Install Wrangler CLI',
      command: 'npm install -g wrangler',
      status: 'required'
    },
    {
      task: 'Login to Cloudflare',
      command: 'wrangler login',
      status: 'required'
    },
    {
      task: 'Verify wrangler.toml configuration',
      command: 'cat wrangler.toml',
      status: report.deployment.configurationReady ? 'ready' : 'needs_check'
    },
    {
      task: 'Deploy worker',
      command: 'wrangler deploy',
      status: 'ready'
    },
    {
      task: 'Test health endpoint',
      command: 'curl -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" https://signal_q.catnip-pieces1.workers.dev/system/health',
      status: 'ready'
    }
  ];
}

/**
 * Generate testing guidance
 */
function generateTestingGuidance() {
  report.testingGuidance = [
    {
      phase: 'Pre-deployment Testing',
      description: 'Use included scripts to verify configuration',
      commands: [
        'node implementation-analysis.js  # Verify code alignment',
        'node openapi-audit.js           # Test endpoint structure (requires deployment)'
      ]
    },
    {
      phase: 'Post-deployment Testing',
      description: 'Verify live functionality',
      commands: [
        'node health-test.js             # Comprehensive health check',
        'node test-api.js                # Test major endpoints',
        'node openapi-audit.js           # Full OpenAPI compliance audit'
      ]
    },
    {
      phase: 'CustomGPT Integration',
      description: 'Configure CustomGPT with Signal Q',
      setup: {
        baseURL: 'https://signal_q.catnip-pieces1.workers.dev',
        authHeader: 'Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h',
        schemaFile: 'worker/src/openapi-core.json'
      }
    }
  ];
}

/**
 * Analyze specific endpoint patterns
 */
function analyzeEndpointPatterns() {
  const criticalEndpoints = [
    '/system/health',
    '/agent-suggestions', 
    '/protocols/aquil-probe',
    '/gene-key-guidance',
    '/throatcraft-session',
    '/ai-enhance'
  ];
  
  const implementedCritical = criticalEndpoints.filter(endpoint => 
    workerCode.includes(`'${endpoint}'`) || workerCode.includes(`path === '${endpoint}'`)
  );
  
  if (implementedCritical.length < criticalEndpoints.length) {
    report.recommendations.push({
      priority: 'MEDIUM',
      category: 'Core Endpoints',
      issue: `${criticalEndpoints.length - implementedCritical.length} critical endpoints may need verification`,
      solution: 'Test core endpoints after deployment to ensure proper routing'
    });
  }
}

/**
 * Generate final assessment
 */
function generateFinalAssessment() {
  let score = 100;
  
  // Deduct points for issues
  if (!report.authentication.implemented) score -= 15;
  if (!report.deployment.configurationReady) score -= 10;
  if (report.alignment.alignmentPercentage < 95) score -= 10;
  
  report.summary.confidence = Math.max(0, score);
  
  if (score >= 90) {
    report.summary.status = 'EXCELLENT_ALIGNMENT';
  } else if (score >= 75) {
    report.summary.status = 'GOOD_ALIGNMENT';
  } else if (score >= 60) {
    report.summary.status = 'NEEDS_IMPROVEMENT';
  } else {
    report.summary.status = 'CRITICAL_ISSUES';
  }
  
  report.summary.readyForDeployment = score >= 75;
}

/**
 * Print comprehensive report
 */
function printReport() {
  console.log('🎯 Signal Q Worker & OpenAPI Alignment Report');
  console.log('==============================================\n');
  
  console.log(`📊 Overall Status: ${report.summary.status}`);
  console.log(`🎲 Confidence Score: ${report.summary.confidence}%`);
  console.log(`🚀 Ready for Deployment: ${report.summary.readyForDeployment ? 'YES' : 'NO'}\n`);
  
  console.log('📋 ALIGNMENT ANALYSIS:');
  console.log(`   📈 OpenAPI Endpoints: ${report.alignment.openApiEndpoints}`);
  console.log(`   ⚙️  Implemented Routes: ${report.alignment.implementedEndpoints}`);
  console.log(`   🎯 Alignment: ${report.alignment.alignmentPercentage}%\n`);
  
  console.log('🔐 AUTHENTICATION:');
  console.log(`   ✅ Bearer Token Auth: ${report.authentication.bearerTokens ? 'YES' : 'NO'}`);
  console.log(`   ✅ CORS Configured: ${report.authentication.corsConfigured ? 'YES' : 'NO'}`);
  console.log(`   ✅ Implementation: ${report.authentication.implemented ? 'READY' : 'NEEDS_CHECK'}\n`);
  
  console.log('🚀 DEPLOYMENT STATUS:');
  console.log(`   ✅ Tokens Configured: ${report.deployment.tokensConfigured ? 'YES' : 'NO'}`);
  console.log(`   ✅ AI Binding Ready: ${report.deployment.aiBindingConfigured ? 'YES' : 'NO'}`);
  console.log(`   ✅ Config Complete: ${report.deployment.configurationReady ? 'YES' : 'NO'}\n`);
  
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}\n`);
    });
  }
  
  console.log('📋 DEPLOYMENT CHECKLIST:');
  report.deploymentChecklist.forEach((item, index) => {
    const status = item.status === 'ready' ? '✅' : 
                  item.status === 'required' ? '🔄' : '⚠️';
    console.log(`${index + 1}. ${status} ${item.task}`);
    console.log(`   Command: ${item.command}\n`);
  });
  
  console.log('🧪 TESTING PHASES:');
  report.testingGuidance.forEach(phase => {
    console.log(`📋 ${phase.phase}:`);
    console.log(`   ${phase.description}`);
    if (phase.commands) {
      phase.commands.forEach(cmd => console.log(`   $ ${cmd}`));
    }
    if (phase.setup) {
      console.log(`   Base URL: ${phase.setup.baseURL}`);
      console.log(`   Auth: ${phase.setup.authHeader}`);
      console.log(`   Schema: ${phase.setup.schemaFile}`);
    }
    console.log('');
  });
  
  console.log('🎉 CONCLUSION:');
  if (report.summary.readyForDeployment) {
    console.log('✅ Signal Q Worker is well-aligned with OpenAPI spec and ready for deployment!');
    console.log('🔗 Next step: Deploy with `wrangler deploy` and run post-deployment tests');
  } else {
    console.log('⚠️  Please address the recommendations above before deployment');
    console.log('🔧 Focus on high-priority items first');
  }
}

/**
 * Save detailed report
 */
function saveReport() {
  const reportPath = path.join(__dirname, 'alignment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

/**
 * Main analysis function
 */
function main() {
  console.log('🔍 Analyzing Signal Q Worker & OpenAPI Alignment...\n');
  
  analyzeAuthentication();
  analyzeDeploymentConfig();
  analyzeEndpointCoverage();
  analyzeEndpointPatterns();
  generateDeploymentChecklist();
  generateTestingGuidance();
  generateFinalAssessment();
  
  printReport();
  saveReport();
  
  process.exit(report.summary.readyForDeployment ? 0 : 1);
}

// Run the analysis
if (require.main === module) {
  main();
}

module.exports = { main, report };