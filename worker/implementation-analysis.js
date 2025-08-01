#!/usr/bin/env node

/**
 * Signal Q Implementation vs OpenAPI Spec Analysis
 * 
 * This script analyzes the worker implementation against the OpenAPI spec
 * to identify mismatches, missing endpoints, and implementation issues
 * without requiring actual deployment.
 */

const fs = require('fs');
const path = require('path');

// Load OpenAPI spec
const openApiPath = path.join(__dirname, 'src', 'openapi-core.json');
const workerPath = path.join(__dirname, 'src', 'index.js');

let openApiSpec, workerCode;

try {
  openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
  workerCode = fs.readFileSync(workerPath, 'utf8');
} catch (error) {
  console.error('❌ Failed to load files:', error.message);
  process.exit(1);
}

const analysis = {
  timestamp: new Date().toISOString(),
  summary: {
    totalOpenApiEndpoints: 0,
    implementedEndpoints: 0,
    missingEndpoints: 0,
    misalignedEndpoints: 0,
    extraEndpoints: 0
  },
  openApiEndpoints: [],
  implementedEndpoints: [],
  missingImplementations: [],
  misalignments: [],
  extraImplementations: [],
  issues: [],
  recommendations: []
};

/**
 * Extract endpoints from OpenAPI spec
 */
function extractOpenApiEndpoints() {
  const endpoints = [];
  
  for (const [path, pathMethods] of Object.entries(openApiSpec.paths)) {
    for (const [method, operation] of Object.entries(pathMethods)) {
      endpoints.push({
        path,
        method: method.toUpperCase(),
        operationId: operation.operationId,
        summary: operation.summary,
        requestBody: operation.requestBody,
        responses: operation.responses,
        security: operation.security || openApiSpec.security
      });
    }
  }
  
  analysis.summary.totalOpenApiEndpoints = endpoints.length;
  return endpoints;
}

/**
 * Extract endpoints from worker implementation by analyzing routing logic
 */
function extractImplementedEndpoints() {
  const endpoints = [];
  
  // Extract endpoint handlers from the code
  const handleMethods = [
    'handleCoreEndpoints',
    'handleAgentEndpoints', 
    'handleBlueprintEndpoints',
    'handleSystemEndpoints',
    'handleIdentityEndpoints',
    'handlePhiladelphiaEndpoints',
    'handleCraftEndpoints',
    'handleSomaticEndpoints',
    'handleMicrodoseEndpoints',
    'handlePatternEndpoints',
    'handleEnergyEndpoints',
    'handleAutonomousEndpoints',
    'handleTokenEndpoints',
    'handleAIEndpoints'
  ];

  // Extract routes from each handler method
  handleMethods.forEach(methodName => {
    const methodRegex = new RegExp(`async ${methodName}\\(.*?\\)\\s*\\{([\\s\\S]*?)\\n\\s*return null;`, 'g');
    const match = methodRegex.exec(workerCode);
    
    if (match) {
      const methodBody = match[1];
      
      // Extract endpoint definitions
      const endpointRegex = /'([^']+)':\s*\{\s*'([^']+)':\s*[^}]+\}/g;
      let endpointMatch;
      
      while ((endpointMatch = endpointRegex.exec(methodBody)) !== null) {
        const path = endpointMatch[1];
        const method = endpointMatch[2];
        
        endpoints.push({
          path,
          method: method.toUpperCase(),
          handler: methodName,
          implementationFound: true
        });
      }
      
      // Also check for individual endpoint checks
      const ifRegex = /if \(path === '([^']+)' && method === '([^']+)'\)/g;
      let ifMatch;
      
      while ((ifMatch = ifRegex.exec(methodBody)) !== null) {
        const path = ifMatch[1];
        const method = ifMatch[2];
        
        endpoints.push({
          path,
          method: method.toUpperCase(),
          handler: methodName,
          implementationFound: true
        });
      }
    }
  });

  // Remove duplicates
  const uniqueEndpoints = endpoints.filter((endpoint, index, self) => 
    index === self.findIndex(e => e.path === endpoint.path && e.method === endpoint.method)
  );
  
  return uniqueEndpoints;
}

/**
 * Compare OpenAPI spec with implementation
 */
function compareImplementations() {
  const openApiEndpoints = extractOpenApiEndpoints();
  const implementedEndpoints = extractImplementedEndpoints();
  
  analysis.openApiEndpoints = openApiEndpoints;
  analysis.implementedEndpoints = implementedEndpoints;
  
  // Find missing implementations
  openApiEndpoints.forEach(openApiEndpoint => {
    const implemented = implementedEndpoints.find(impl => 
      impl.path === openApiEndpoint.path && impl.method === openApiEndpoint.method
    );
    
    if (!implemented) {
      analysis.missingImplementations.push({
        path: openApiEndpoint.path,
        method: openApiEndpoint.method,
        operationId: openApiEndpoint.operationId,
        summary: openApiEndpoint.summary
      });
    } else {
      analysis.summary.implementedEndpoints++;
    }
  });
  
  // Find extra implementations (not in OpenAPI spec)
  implementedEndpoints.forEach(implEndpoint => {
    const inSpec = openApiEndpoints.find(spec => 
      spec.path === implEndpoint.path && spec.method === implEndpoint.method
    );
    
    if (!inSpec) {
      analysis.extraImplementations.push(implEndpoint);
    }
  });
  
  analysis.summary.missingEndpoints = analysis.missingImplementations.length;
  analysis.summary.extraEndpoints = analysis.extraImplementations.length;
}

/**
 * Analyze authentication implementation
 */
function analyzeAuthentication() {
  const hasTokenAuth = workerCode.includes('Authorization') && 
                      workerCode.includes('Bearer') &&
                      workerCode.includes('API_TOKEN');
  
  const hasCORS = workerCode.includes('Access-Control-Allow-Origin') &&
                 workerCode.includes('Access-Control-Allow-Methods') &&
                 workerCode.includes('Access-Control-Allow-Headers');
  
  if (!hasTokenAuth) {
    analysis.issues.push({
      severity: 'HIGH',
      category: 'Authentication',
      issue: 'Bearer token authentication not properly implemented',
      location: 'fetch handler'
    });
  }
  
  if (!hasCORS) {
    analysis.issues.push({
      severity: 'MEDIUM',
      category: 'CORS',
      issue: 'CORS headers not properly configured',
      location: 'response headers'
    });
  }
  
  return { hasTokenAuth, hasCORS };
}

/**
 * Analyze request/response handling
 */
function analyzeRequestResponseHandling() {
  const hasJSONParsing = workerCode.includes('request.json()') ||
                        workerCode.includes('await request.json()');
  
  const hasJSONResponse = workerCode.includes('JSON.stringify') &&
                         workerCode.includes('Content-Type') &&
                         workerCode.includes('application/json');
  
  const hasErrorHandling = workerCode.includes('try') &&
                          workerCode.includes('catch') &&
                          workerCode.includes('error');
  
  if (!hasJSONParsing) {
    analysis.issues.push({
      severity: 'HIGH',
      category: 'Request Handling',
      issue: 'JSON request parsing not consistently implemented',
      location: 'endpoint handlers'
    });
  }
  
  if (!hasJSONResponse) {
    analysis.issues.push({
      severity: 'HIGH', 
      category: 'Response Handling',
      issue: 'JSON response formatting not properly implemented',
      location: 'response creation'
    });
  }
  
  if (!hasErrorHandling) {
    analysis.issues.push({
      severity: 'MEDIUM',
      category: 'Error Handling',
      issue: 'Error handling not consistently implemented',
      location: 'endpoint handlers'
    });
  }
  
  return { hasJSONParsing, hasJSONResponse, hasErrorHandling };
}

/**
 * Check specific OpenAPI requirements
 */
function checkOpenApiCompliance() {
  // Check server URL match
  const specServer = openApiSpec.servers[0].url;
  const workerHasMatchingURL = workerCode.includes('signal_q.catnip-pieces1.workers.dev');
  
  if (!workerHasMatchingURL) {
    analysis.issues.push({
      severity: 'LOW',
      category: 'Configuration',
      issue: `Worker URL may not match OpenAPI server URL: ${specServer}`,
      location: 'wrangler.toml or worker configuration'
    });
  }
  
  // Check if all required security schemes are implemented
  const hasSecuritySchemes = openApiSpec.components?.securitySchemes?.bearerAuth;
  if (hasSecuritySchemes && !workerCode.includes('Bearer')) {
    analysis.issues.push({
      severity: 'HIGH',
      category: 'Security',
      issue: 'OpenAPI specifies bearerAuth but implementation may be missing',
      location: 'authentication middleware'
    });
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations() {
  // Critical recommendations
  if (analysis.summary.missingEndpoints > 0) {
    analysis.recommendations.push({
      priority: 'HIGH',
      category: 'Missing Endpoints',
      recommendation: `Implement ${analysis.summary.missingEndpoints} missing endpoints`,
      action: 'Add route handlers for missing endpoints in appropriate handler methods',
      endpoints: analysis.missingImplementations.slice(0, 5).map(e => `${e.method} ${e.path}`)
    });
  }
  
  if (analysis.summary.extraEndpoints > 0) {
    analysis.recommendations.push({
      priority: 'MEDIUM',
      category: 'Documentation',
      recommendation: `Document ${analysis.summary.extraEndpoints} implemented endpoints not in OpenAPI spec`,
      action: 'Add missing endpoints to OpenAPI spec or remove extra implementations',
      endpoints: analysis.extraImplementations.slice(0, 5).map(e => `${e.method} ${e.path}`)
    });
  }
  
  // Issue-based recommendations
  const authIssues = analysis.issues.filter(i => i.category === 'Authentication');
  if (authIssues.length > 0) {
    analysis.recommendations.push({
      priority: 'HIGH',
      category: 'Authentication',
      recommendation: 'Fix authentication implementation to match OpenAPI security requirements',
      action: 'Ensure Bearer token validation is consistent across all endpoints'
    });
  }
  
  const handlingIssues = analysis.issues.filter(i => 
    i.category === 'Request Handling' || i.category === 'Response Handling'
  );
  if (handlingIssues.length > 0) {
    analysis.recommendations.push({
      priority: 'HIGH',
      category: 'Request/Response Handling',
      recommendation: 'Standardize request/response handling across all endpoints',
      action: 'Ensure consistent JSON parsing, response formatting, and error handling'
    });
  }
}

/**
 * Print analysis results
 */
function printResults() {
  console.log('📋 Signal Q Implementation Analysis');
  console.log('=====================================\n');
  console.log(`📊 OpenAPI Spec: ${openApiSpec.info.title} v${openApiSpec.info.version}`);
  console.log(`📄 Total endpoints in spec: ${analysis.summary.totalOpenApiEndpoints}`);
  console.log(`✅ Implemented endpoints: ${analysis.summary.implementedEndpoints}`);
  console.log(`❌ Missing endpoints: ${analysis.summary.missingEndpoints}`);
  console.log(`➕ Extra endpoints: ${analysis.summary.extraEndpoints}`);
  console.log(`⚠️  Issues found: ${analysis.issues.length}\n`);

  // Implementation coverage
  const coverage = (analysis.summary.implementedEndpoints / analysis.summary.totalOpenApiEndpoints * 100).toFixed(1);
  console.log(`📈 Implementation Coverage: ${coverage}%\n`);

  // Missing endpoints
  if (analysis.missingImplementations.length > 0) {
    console.log('❌ MISSING IMPLEMENTATIONS:');
    analysis.missingImplementations.forEach(endpoint => {
      console.log(`   ${endpoint.method} ${endpoint.path} - ${endpoint.operationId || 'No operationId'}`);
      if (endpoint.summary) console.log(`      "${endpoint.summary}"`);
    });
    console.log('');
  }

  // Extra endpoints
  if (analysis.extraImplementations.length > 0) {
    console.log('➕ EXTRA IMPLEMENTATIONS (not in OpenAPI):');
    analysis.extraImplementations.forEach(endpoint => {
      console.log(`   ${endpoint.method} ${endpoint.path} - ${endpoint.handler}`);
    });
    console.log('');
  }

  // Issues
  if (analysis.issues.length > 0) {
    console.log('⚠️  IMPLEMENTATION ISSUES:');
    analysis.issues.forEach(issue => {
      console.log(`   [${issue.severity}] ${issue.category}: ${issue.issue}`);
      console.log(`           Location: ${issue.location}`);
    });
    console.log('');
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
      console.log(`   Action: ${rec.action}`);
      if (rec.endpoints) {
        console.log(`   Examples: ${rec.endpoints.slice(0, 3).join(', ')}${rec.endpoints.length > 3 ? '...' : ''}`);
      }
      console.log('');
    });
  }
}

/**
 * Save analysis results
 */
function saveAnalysis() {
  const analysisPath = path.join(__dirname, 'implementation-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  console.log(`📄 Detailed analysis saved to: ${analysisPath}`);
}

/**
 * Main analysis function
 */
function main() {
  try {
    console.log('🔍 Analyzing Signal Q Implementation vs OpenAPI Spec...\n');
    
    compareImplementations();
    analyzeAuthentication();
    analyzeRequestResponseHandling();
    checkOpenApiCompliance();
    generateRecommendations();
    
    printResults();
    saveAnalysis();
    
    if (analysis.summary.missingEndpoints === 0 && analysis.issues.length === 0) {
      console.log('🎉 Implementation fully aligned with OpenAPI spec!');
      process.exit(0);
    } else {
      console.log('⚠️  Implementation issues found - see recommendations above');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}

module.exports = { main, analysis };