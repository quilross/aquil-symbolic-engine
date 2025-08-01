#!/usr/bin/env node

/**
 * Implementation Analysis Script
 * Analyzes the Signal Q implementation for completeness, performance, and best practices
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://signal_q.catnip-pieces1.workers.dev';
const USER_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';

console.log('🔍 Signal Q Implementation Analysis\n');

const analysisResults = {
  timestamp: new Date().toISOString(),
  worker: {
    codeAnalysis: {
      linesOfCode: 0,
      functions: 0,
      endpoints: 0,
      complexity: 'unknown'
    },
    features: {
      authentication: false,
      cors: false,
      errorHandling: false,
      durableObjects: false,
      kvStorage: false,
      aiBinding: false
    },
    performance: {
      responseTime: [],
      averageResponseTime: 0,
      reliability: 0
    }
  },
  api: {
    endpoints: {
      core: [],
      system: [],
      agent: [],
      personal: []
    },
    capabilities: {
      healthChecks: false,
      dataManagement: false,
      aiIntegration: false,
      authentication: false
    }
  },
  deployment: {
    status: 'unknown',
    version: 'unknown',
    lastUpdate: null,
    environment: 'production'
  },
  recommendations: [],
  score: 0
};

async function analyzeWorkerCode() {
  console.log('📄 Analyzing Worker Implementation...\n');
  
  try {
    const workerPath = path.join(__dirname, 'src', 'index.js');
    const workerCode = fs.readFileSync(workerPath, 'utf8');
    
    // Basic code metrics
    const lines = workerCode.split('\n');
    analysisResults.worker.codeAnalysis.linesOfCode = lines.filter(line => 
      line.trim() && !line.trim().startsWith('//')
    ).length;
    
    // Feature detection
    analysisResults.worker.features.authentication = workerCode.includes('Authorization') && workerCode.includes('Bearer');
    analysisResults.worker.features.cors = workerCode.includes('Access-Control-Allow');
    analysisResults.worker.features.errorHandling = workerCode.includes('try') && workerCode.includes('catch');
    analysisResults.worker.features.durableObjects = workerCode.includes('USER_STATE') || workerCode.includes('DurableObject');
    analysisResults.worker.features.kvStorage = workerCode.includes('SIGNAL_KV') || workerCode.includes('KV');
    analysisResults.worker.features.aiBinding = workerCode.includes('AI') && workerCode.includes('run');
    
    // Count functions and endpoints
    const functionMatches = workerCode.match(/function\s+\w+|const\s+\w+\s*=\s*async|async\s+function/g);
    analysisResults.worker.codeAnalysis.functions = functionMatches ? functionMatches.length : 0;
    
    const routeMatches = workerCode.match(/\.pathname\s*===\s*['"`]\/|\.pathname\.startsWith\s*\(['"`]\/|case\s+['"`]\/|if\s*\(\s*url\.pathname/g);
    analysisResults.worker.codeAnalysis.endpoints = routeMatches ? routeMatches.length : 0;
    
    console.log(`📊 Lines of Code: ${analysisResults.worker.codeAnalysis.linesOfCode}`);
    console.log(`🔧 Functions: ${analysisResults.worker.codeAnalysis.functions}`);
    console.log(`🔗 Route Handlers: ${analysisResults.worker.codeAnalysis.endpoints}`);
    console.log('');
    
    console.log('🛠️  Feature Detection:');
    Object.entries(analysisResults.worker.features).forEach(([feature, present]) => {
      console.log(`  ${present ? '✅' : '❌'} ${feature}: ${present ? 'Implemented' : 'Missing'}`);
    });
    console.log('');
    
  } catch (error) {
    console.error(`❌ Failed to analyze worker code: ${error.message}`);
    analysisResults.recommendations.push('Fix worker code analysis - unable to read src/index.js');
  }
}

async function analyzeWranglerConfig() {
  console.log('⚙️  Analyzing Wrangler Configuration...\n');
  
  try {
    const wranglerPath = path.join(__dirname, 'wrangler.toml');
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    
    // Parse key configuration elements
    const hasKV = wranglerContent.includes('kv_namespaces');
    const hasDurableObjects = wranglerContent.includes('durable_objects');
    const hasAI = wranglerContent.includes('[ai]');
    const hasVars = wranglerContent.includes('[vars]');
    
    console.log('📋 Wrangler Configuration:');
    console.log(`  ${hasKV ? '✅' : '❌'} KV Storage: ${hasKV ? 'Configured' : 'Not configured'}`);
    console.log(`  ${hasDurableObjects ? '✅' : '❌'} Durable Objects: ${hasDurableObjects ? 'Configured' : 'Not configured'}`);
    console.log(`  ${hasAI ? '✅' : '❌'} AI Binding: ${hasAI ? 'Configured' : 'Not configured'}`);
    console.log(`  ${hasVars ? '✅' : '❌'} Environment Variables: ${hasVars ? 'Configured' : 'Not configured'}`);
    console.log('');
    
  } catch (error) {
    console.error(`❌ Failed to analyze wrangler config: ${error.message}`);
  }
}

async function testPerformance() {
  console.log('⚡ Performance Testing...\n');
  
  const endpoints = [
    '/system/health',
    '/agent-suggestions',
    '/identity-nodes',
    '/play-protocols'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      analysisResults.worker.performance.responseTime.push({
        endpoint,
        time: responseTime,
        status: response.status,
        success: response.status >= 200 && response.status < 400
      });
      
      console.log(`⏱️  ${endpoint}: ${responseTime}ms (${response.status})`);
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
      analysisResults.worker.performance.responseTime.push({
        endpoint,
        time: null,
        error: error.message,
        success: false
      });
    }
  }
  
  // Calculate average response time
  const successfulTests = analysisResults.worker.performance.responseTime.filter(t => t.success && t.time);
  if (successfulTests.length > 0) {
    const totalTime = successfulTests.reduce((sum, test) => sum + test.time, 0);
    analysisResults.worker.performance.averageResponseTime = Math.round(totalTime / successfulTests.length);
    
    console.log(`\n📈 Average Response Time: ${analysisResults.worker.performance.averageResponseTime}ms`);
    
    // Calculate reliability
    const totalTests = analysisResults.worker.performance.responseTime.length;
    const successfulCount = successfulTests.length;
    analysisResults.worker.performance.reliability = Math.round((successfulCount / totalTests) * 100);
    
    console.log(`🎯 Reliability: ${analysisResults.worker.performance.reliability}%`);
  } else {
    console.log('\n❌ No successful performance tests - cannot calculate metrics');
  }
  
  console.log('');
}

async function analyzeAPICapabilities() {
  console.log('🎯 API Capabilities Analysis...\n');
  
  // Test key endpoint categories
  const testCategories = {
    system: ['/system/health', '/deploy/status'],
    core: ['/identity-nodes', '/play-protocols', '/logs'],
    agent: ['/agent-suggestions', '/agent-overwhelm', '/philadelphia-context'],
    personal: ['/gene-key-guidance', '/effectiveness-dashboard', '/recovery-support']
  };
  
  for (const [category, endpoints] of Object.entries(testCategories)) {
    console.log(`📂 ${category.toUpperCase()} Endpoints:`);
    const categoryResults = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${USER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        const success = response.status >= 200 && response.status < 400;
        categoryResults.push({ endpoint, status: response.status, success });
        
        console.log(`  ${success ? '✅' : '❌'} ${endpoint}: ${response.status}`);
        
      } catch (error) {
        categoryResults.push({ endpoint, error: error.message, success: false });
        console.log(`  ❌ ${endpoint}: ${error.message}`);
      }
    }
    
    analysisResults.api.endpoints[category] = categoryResults;
    console.log('');
  }
  
  // Analyze overall capabilities
  analysisResults.api.capabilities.healthChecks = analysisResults.api.endpoints.system.some(e => e.success);
  analysisResults.api.capabilities.dataManagement = analysisResults.api.endpoints.core.some(e => e.success);
  analysisResults.api.capabilities.aiIntegration = analysisResults.api.endpoints.agent.some(e => e.success);
  analysisResults.api.capabilities.authentication = analysisResults.worker.features.authentication;
}

async function checkDeploymentStatus() {
  console.log('🚀 Deployment Status Check...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/system/health`, {
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      analysisResults.deployment.status = 'live';
      analysisResults.deployment.version = data.api?.version || 'unknown';
      analysisResults.deployment.lastUpdate = data.deployment?.lastUpdate || null;
      
      console.log(`✅ Status: ${analysisResults.deployment.status}`);
      console.log(`📦 Version: ${analysisResults.deployment.version}`);
      console.log(`📅 Last Update: ${analysisResults.deployment.lastUpdate || 'Unknown'}`);
      
    } else {
      analysisResults.deployment.status = 'error';
      console.log(`❌ Deployment check failed: ${response.status}`);
    }
    
  } catch (error) {
    analysisResults.deployment.status = 'unreachable';
    console.log(`❌ Deployment unreachable: ${error.message}`);
  }
  
  console.log('');
}

function generateRecommendations() {
  console.log('💡 Generating Recommendations...\n');
  
  // Performance recommendations
  if (analysisResults.worker.performance.averageResponseTime > 500) {
    analysisResults.recommendations.push('Optimize response times - average above 500ms');
  } else if (analysisResults.worker.performance.averageResponseTime > 0) {
    analysisResults.recommendations.push(`Good performance - ${analysisResults.worker.performance.averageResponseTime}ms average response time`);
  }
  
  // Reliability recommendations
  if (analysisResults.worker.performance.reliability < 90) {
    analysisResults.recommendations.push('Improve API reliability - below 90% success rate');
  } else if (analysisResults.worker.performance.reliability >= 95) {
    analysisResults.recommendations.push('Excellent reliability - 95%+ success rate');
  }
  
  // Feature recommendations
  if (!analysisResults.worker.features.authentication) {
    analysisResults.recommendations.push('Implement authentication for security');
  }
  
  if (!analysisResults.worker.features.errorHandling) {
    analysisResults.recommendations.push('Add comprehensive error handling');
  }
  
  if (!analysisResults.worker.features.cors) {
    analysisResults.recommendations.push('Add CORS headers for browser compatibility');
  }
  
  // Deployment recommendations
  if (analysisResults.deployment.status !== 'live') {
    analysisResults.recommendations.push('Fix deployment issues - worker not accessible');
  }
  
  // API capability recommendations
  if (!analysisResults.api.capabilities.healthChecks) {
    analysisResults.recommendations.push('Implement health check endpoints');
  }
  
  if (!analysisResults.api.capabilities.aiIntegration) {
    analysisResults.recommendations.push('Ensure AI integration endpoints are working');
  }
  
  // Add positive recommendations
  if (analysisResults.recommendations.length === 0) {
    analysisResults.recommendations.push('Implementation looks excellent - no major issues found!');
  }
}

function calculateOverallScore() {
  let score = 0;
  let maxScore = 100;
  
  // Features (30 points)
  const featureCount = Object.values(analysisResults.worker.features).filter(Boolean).length;
  const totalFeatures = Object.keys(analysisResults.worker.features).length;
  score += (featureCount / totalFeatures) * 30;
  
  // Performance (25 points)
  if (analysisResults.worker.performance.reliability >= 95) score += 25;
  else if (analysisResults.worker.performance.reliability >= 90) score += 20;
  else if (analysisResults.worker.performance.reliability >= 80) score += 15;
  else score += 5;
  
  // API Capabilities (25 points)
  const capabilityCount = Object.values(analysisResults.api.capabilities).filter(Boolean).length;
  const totalCapabilities = Object.keys(analysisResults.api.capabilities).length;
  score += (capabilityCount / totalCapabilities) * 25;
  
  // Deployment (20 points)
  if (analysisResults.deployment.status === 'live') score += 20;
  else if (analysisResults.deployment.status === 'error') score += 10;
  else score += 0;
  
  analysisResults.score = Math.round(score);
}

function printSummary() {
  console.log('\n📊 Implementation Analysis Summary:');
  console.log('='.repeat(50));
  
  console.log(`🎯 Overall Score: ${analysisResults.score}/100`);
  console.log(`🚀 Deployment: ${analysisResults.deployment.status}`);
  console.log(`⚡ Performance: ${analysisResults.worker.performance.averageResponseTime}ms avg, ${analysisResults.worker.performance.reliability}% reliable`);
  console.log(`🛠️  Features: ${Object.values(analysisResults.worker.features).filter(Boolean).length}/${Object.keys(analysisResults.worker.features).length} implemented`);
  console.log(`🎯 API Capabilities: ${Object.values(analysisResults.api.capabilities).filter(Boolean).length}/${Object.keys(analysisResults.api.capabilities).length} working`);
  
  if (analysisResults.recommendations.length > 0) {
    console.log(`\n💡 Recommendations (${analysisResults.recommendations.length}):`);
    analysisResults.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n🎯 CustomGPT Readiness:');
  if (analysisResults.score >= 80) {
    console.log('✅ Implementation ready for CustomGPT integration!');
  } else {
    console.log('⚠️  Implementation needs improvement before CustomGPT integration');
  }
}

async function saveResults() {
  try {
    const outputPath = path.join(__dirname, 'implementation-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysisResults, null, 2));
    console.log(`\n💾 Analysis results saved to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to save analysis results: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    await analyzeWorkerCode();
    await analyzeWranglerConfig();
    await testPerformance();
    await analyzeAPICapabilities();
    await checkDeploymentStatus();
    
    generateRecommendations();
    calculateOverallScore();
    printSummary();
    await saveResults();
    
    // Exit with error code if score is too low
    if (analysisResults.score < 70) {
      console.log('\n❌ Implementation analysis failed - score too low');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Implementation analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeWorkerCode, testPerformance, analysisResults };