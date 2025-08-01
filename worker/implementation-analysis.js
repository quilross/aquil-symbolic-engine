#!/usr/bin/env node

/**
 * Implementation Analysis Script
 * Analyzes Worker implementation against OpenAPI specification
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Implementation Analysis Script\n');

const analysisResults = {
  timestamp: new Date().toISOString(),
  implementation: {},
  coverage: {},
  quality: {},
  recommendations: [],
  score: 0
};

function analyzeWorkerCode() {
  console.log('📄 Analyzing Worker implementation...');
  
  try {
    const workerPath = path.join(__dirname, 'src', 'index.js');
    const workerCode = fs.readFileSync(workerPath, 'utf8');
    
    // Basic code analysis
    const lines = workerCode.split('\n');
    const codeLines = lines.filter(line => 
      line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
    ).length;
    
    // Count endpoints defined in worker
    const routePattern = /if\s*\(\s*path\s*===\s*['"]([^'"]+)['"]/g;
    const routes = [];
    let match;
    while ((match = routePattern.exec(workerCode)) !== null) {
      routes.push(match[1]);
    }
    
    // Count HTTP methods handled
    const methodPattern = /request\.method\s*===\s*['"]([^'"]+)['"]/g;
    const methods = new Set();
    while ((match = methodPattern.exec(workerCode)) !== null) {
      methods.add(match[1]);
    }
    
    // Security features
    const hasAuth = workerCode.includes('Authorization') && (workerCode.includes('Bearer') || workerCode.includes('API_TOKEN'));
    const hasCORS = workerCode.includes('Access-Control-Allow');
    const hasErrorHandling = workerCode.includes('try') && workerCode.includes('catch');
    
    analysisResults.implementation = {
      total_lines: lines.length,
      code_lines: codeLines,
      routes_found: routes.length,
      route_list: routes,
      http_methods: Array.from(methods),
      has_authentication: hasAuth,
      has_cors: hasCORS,
      has_error_handling: hasErrorHandling
    };
    
    console.log(`✅ Worker Code Lines: ${codeLines}`);
    console.log(`✅ Routes Found: ${routes.length}`);
    console.log(`✅ HTTP Methods: ${Array.from(methods).join(', ')}`);
    console.log(`✅ Authentication: ${hasAuth ? 'Present' : 'Missing'}`);
    console.log(`✅ CORS: ${hasCORS ? 'Present' : 'Missing'}`);
    console.log(`✅ Error Handling: ${hasErrorHandling ? 'Present' : 'Missing'}`);
    
  } catch (error) {
    console.error('❌ Failed to analyze worker code:', error.message);
    analysisResults.recommendations.push(`Fix worker code analysis: ${error.message}`);
  }
}

function analyzeOpenAPISpecification() {
  console.log('\n📋 Analyzing OpenAPI specification...');
  
  try {
    const specPath = path.join(__dirname, 'src', 'openapi-core.json');
    const specData = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    
    const paths = Object.keys(specData.paths || {});
    const operations = [];
    
    for (const path of paths) {
      const pathMethods = Object.keys(specData.paths[path]);
      for (const method of pathMethods) {
        operations.push({ path, method: method.toUpperCase() });
      }
    }
    
    analysisResults.coverage = {
      documented_paths: paths.length,
      documented_operations: operations.length,
      path_list: paths,
      operation_list: operations,
      has_security: !!(specData.security && specData.security.length > 0),
      has_components: !!(specData.components),
      openapi_version: specData.openapi
    };
    
    console.log(`✅ Documented Paths: ${paths.length}`);
    console.log(`✅ Total Operations: ${operations.length}`);
    console.log(`✅ OpenAPI Version: ${specData.openapi}`);
    console.log(`✅ Security Schemes: ${specData.security ? 'Defined' : 'Missing'}`);
    
  } catch (error) {
    console.error('❌ Failed to analyze OpenAPI spec:', error.message);
    analysisResults.recommendations.push(`Fix OpenAPI analysis: ${error.message}`);
  }
}

function analyzeCoverage() {
  console.log('\n🎯 Analyzing Implementation Coverage...');
  
  const implementedRoutes = analysisResults.implementation.route_list || [];
  const documentedPaths = analysisResults.coverage.path_list || [];
  
  // Find gaps
  const undocumented = implementedRoutes.filter(route => !documentedPaths.includes(route));
  const unimplemented = documentedPaths.filter(path => !implementedRoutes.includes(path));
  
  const coverageScore = documentedPaths.length > 0 ? 
    Math.round(((documentedPaths.length - unimplemented.length) / documentedPaths.length) * 100) : 0;
  
  analysisResults.quality = {
    coverage_score: coverageScore,
    implemented_routes: implementedRoutes.length,
    documented_paths: documentedPaths.length,
    undocumented_routes: undocumented,
    unimplemented_paths: unimplemented,
    perfect_match: undocumented.length === 0 && unimplemented.length === 0
  };
  
  console.log(`🎯 Coverage Score: ${coverageScore}%`);
  
  if (undocumented.length > 0) {
    console.log(`⚠️  Undocumented Routes: ${undocumented.length}`);
    undocumented.forEach(route => console.log(`   - ${route}`));
    analysisResults.recommendations.push(`Document ${undocumented.length} undocumented routes in OpenAPI spec`);
  }
  
  if (unimplemented.length > 0) {
    console.log(`⚠️  Unimplemented Paths: ${unimplemented.length}`);
    unimplemented.forEach(path => console.log(`   - ${path}`));
    analysisResults.recommendations.push(`Implement ${unimplemented.length} documented paths in worker`);
  }
  
  if (analysisResults.quality.perfect_match) {
    console.log('🎉 Perfect implementation-documentation match!');
  }
}

function analyzeQuality() {
  console.log('\n🏆 Quality Assessment...');
  
  let qualityScore = 0;
  const checks = [];
  
  // Implementation quality checks
  const impl = analysisResults.implementation;
  
  if (impl.has_authentication) {
    qualityScore += 20;
    checks.push('✅ Authentication implemented');
  } else {
    checks.push('❌ Authentication missing');
    analysisResults.recommendations.push('Implement proper authentication');
  }
  
  if (impl.has_cors) {
    qualityScore += 20;
    checks.push('✅ CORS headers implemented');
  } else {
    checks.push('❌ CORS headers missing');
    analysisResults.recommendations.push('Add CORS headers for browser compatibility');
  }
  
  if (impl.has_error_handling) {
    qualityScore += 20;
    checks.push('✅ Error handling present');
  } else {
    checks.push('❌ Error handling insufficient');
    analysisResults.recommendations.push('Improve error handling with try-catch blocks');
  }
  
  if (impl.routes_found >= 5) {
    qualityScore += 20;
    checks.push('✅ Sufficient endpoint coverage');
  } else {
    checks.push('❌ Limited endpoint coverage');
    analysisResults.recommendations.push('Expand endpoint coverage for full functionality');
  }
  
  // Coverage quality
  if (analysisResults.quality && analysisResults.quality.coverage_score >= 80) {
    qualityScore += 20;
    checks.push('✅ Good documentation coverage');
  } else {
    checks.push('❌ Poor documentation coverage');
    analysisResults.recommendations.push('Improve documentation coverage in OpenAPI spec');
  }
  
  analysisResults.score = qualityScore;
  
  console.log(`🏆 Quality Score: ${qualityScore}/100`);
  checks.forEach(check => console.log(`   ${check}`));
}

function generateReport() {
  console.log('\n📋 Generating Implementation Analysis Report...');
  
  const reportPath = path.join(__dirname, 'implementation-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysisResults, null, 2));
  
  console.log(`📄 Report saved to: ${reportPath}`);
  
  if (analysisResults.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysisResults.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  return analysisResults.score >= 60; // Pass threshold
}

async function main() {
  try {
    analyzeWorkerCode();
    analyzeOpenAPISpecification();
    analyzeCoverage();
    analyzeQuality();
    
    const passed = generateReport();
    
    if (passed) {
      console.log('\n🎉 Implementation Analysis: PASSED');
      process.exit(0);
    } else {
      console.log('\n⚠️  Implementation Analysis: NEEDS IMPROVEMENT');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, analysisResults };