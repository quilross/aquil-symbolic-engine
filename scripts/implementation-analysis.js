#!/usr/bin/env node

/**
 * Implementation Analysis Script
 * Analyzes worker implementation for completeness and best practices
 */

const fs = require('fs');
const path = require('path');

console.log('🔬 Implementation Analysis Starting...\n');

async function analyzeImplementation() {
  try {
    // Load worker implementation
    const workerPath = path.join(__dirname, '../worker/src/index.js');
    
    if (!fs.existsSync(workerPath)) {
      console.log('❌ Worker implementation not found at:', workerPath);
      process.exit(1);
    }

    const workerContent = fs.readFileSync(workerPath, 'utf8');
    
    console.log('✅ Worker implementation loaded');
    
    // Analyze key components
    const analysis = {
      hasAuthHandler: workerContent.includes('Authorization') && (workerContent.includes('Bearer') || workerContent.includes('token')),
      hasCorsSupport: workerContent.includes('Access-Control-Allow-Origin'),
      hasHealthEndpoint: workerContent.includes('/system/health'),
      hasErrorHandling: workerContent.includes('try') && workerContent.includes('catch'),
      hasDurableObjects: workerContent.includes('USER_STATE') && workerContent.includes('class UserState'),
      hasAIBinding: workerContent.includes('AI') && workerContent.includes('@cf/meta/llama'),
      hasKVStorage: workerContent.includes('storage.put') && workerContent.includes('storage.get'),
      hasEnvironmentVars: workerContent.includes('env.API_TOKEN')
    };

    // Count endpoints by analyzing route handlers
    const methodMatches = workerContent.match(/async handle\w+Endpoints/g) || [];
    const endpointHandlers = methodMatches.length;

    // Check for specific Signal Q features
    const signalQFeatures = {
      geneKeySupport: workerContent.includes('gene-key') || workerContent.includes('GeneKey'),
      philadelphiaContext: workerContent.includes('philadelphia') || workerContent.includes('Philadelphia'),
      throatcraftProtocol: workerContent.includes('throatcraft') || workerContent.includes('THROATCRAFT'),
      autonomousDecision: workerContent.includes('autonomous') && workerContent.includes('decision'),
      identityOrchestration: workerContent.includes('identity') && workerContent.includes('orchestration'),
      recoverySupport: workerContent.includes('recovery') && workerContent.includes('support')
    };

    console.log('📊 Core Implementation Features:');
    console.log('='.repeat(40));
    Object.entries(analysis).forEach(([feature, present]) => {
      console.log(`${present ? '✅' : '❌'} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${present ? 'YES' : 'NO'}`);
    });

    console.log('\n🎯 Signal Q Specific Features:');
    console.log('='.repeat(40));
    Object.entries(signalQFeatures).forEach(([feature, present]) => {
      console.log(`${present ? '✅' : '❌'} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${present ? 'YES' : 'NO'}`);
    });

    console.log(`\n📈 Endpoint Handlers: ${endpointHandlers}`);
    console.log(`📄 Code Size: ${(workerContent.length / 1024).toFixed(1)}KB`);

    // Calculate overall score
    const coreFeatures = Object.values(analysis).filter(Boolean).length;
    const totalCoreFeatures = Object.keys(analysis).length;
    const signalFeatures = Object.values(signalQFeatures).filter(Boolean).length;
    const totalSignalFeatures = Object.keys(signalQFeatures).length;
    
    const coreScore = (coreFeatures / totalCoreFeatures) * 100;
    const signalScore = (signalFeatures / totalSignalFeatures) * 100;
    const overallScore = (coreScore + signalScore) / 2;

    console.log('\n📋 Implementation Analysis Summary:');
    console.log('='.repeat(40));
    console.log(`🏗️  Core Features: ${coreFeatures}/${totalCoreFeatures} (${coreScore.toFixed(1)}%)`);
    console.log(`🎯 Signal Q Features: ${signalFeatures}/${totalSignalFeatures} (${signalScore.toFixed(1)}%)`);
    console.log(`📊 Overall Score: ${overallScore.toFixed(1)}%`);

    if (overallScore >= 80) {
      console.log('\n🎉 Implementation analysis PASSED');
      return true;
    } else {
      console.log('\n⚠️  Implementation analysis needs improvement');
      return false;
    }

  } catch (error) {
    console.log('❌ Implementation analysis failed:', error.message);
    return false;
  }
}

// Run analysis
analyzeImplementation()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Analysis script failed:', error);
    process.exit(1);
  });