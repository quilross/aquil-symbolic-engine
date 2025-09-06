#!/usr/bin/env node
/**
 * Schema-Backend Alignment Checker
 * Comprehensive comparison between gpt-actions-schema and backend endpoint implementations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Results structure
const alignmentResults = {
  schema: {
    operations: [],
    paths: new Set(),
    operationIds: new Set()
  },
  backend: {
    endpoints: [],
    paths: new Set(),
    operationPatterns: new Set()
  },
  misalignments: {
    missingInBackend: [],
    missingInSchema: [],
    pathMismatches: [],
    parameterMismatches: [],
    responseMismatches: [],
    errorHandlingMismatches: []
  }
};

/**
 * Extract operations from schema files
 */
function extractSchemaOperations(schemaPath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const operations = [];
  
  for (const [path, pathData] of Object.entries(schema.paths || {})) {
    for (const [method, methodData] of Object.entries(pathData)) {
      if (methodData.operationId) {
        operations.push({
          operationId: methodData.operationId,
          path,
          method: method.toUpperCase(),
          summary: methodData.summary,
          description: methodData.description,
          requestBody: methodData.requestBody,
          responses: methodData.responses,
          parameters: methodData.parameters || [],
          autonomous: methodData['x-openai-autonomous'],
          consequential: methodData['x-openai-isConsequential']
        });
      }
    }
  }
  
  return operations;
}

/**
 * Extract backend endpoints from index.js
 */
function extractBackendEndpoints() {
  const indexPath = path.join(rootDir, 'src/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  const endpoints = [];
  
  // Match router definitions: router.method("/path", async (req, env) => {
  const routerPattern = /router\.(get|post|put|delete|patch|options|all)\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*async\s*\(/g;
  let match;
  
  while ((match = routerPattern.exec(content)) !== null) {
    const [fullMatch, method, path] = match;
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Extract function context for operation detection
    const contextStart = Math.max(0, match.index - 200);
    const contextEnd = Math.min(content.length, match.index + 1000);
    const context = content.substring(contextStart, contextEnd);
    
    // Look for logChatGPTAction calls to identify operationId
    const logPattern = /logChatGPTAction\s*\([^,]+,\s*["'`]([^"'`]+)["'`]/;
    const logMatch = context.match(logPattern);
    const operationId = logMatch ? logMatch[1] : null;
    
    endpoints.push({
      method: method.toUpperCase(),
      path,
      lineNumber,
      operationId,
      context: context.substring(0, 500) // First 500 chars of context
    });
  }
  
  return endpoints;
}

/**
 * Compare schema operations with backend endpoints
 */
function compareSchemaWithBackend() {
  console.log('🔍 SCHEMA-BACKEND ALIGNMENT ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Load schemas
  const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
  const loggingSchemaPath = path.join(rootDir, 'config/ark.actions.logging.json');
  
  console.log('\n📋 Loading Schema Operations...');
  const mainOperations = extractSchemaOperations(mainSchemaPath);
  const loggingOperations = extractSchemaOperations(loggingSchemaPath);
  const allSchemaOperations = [...mainOperations, ...loggingOperations];
  
  console.log(`  - Main schema: ${mainOperations.length} operations`);
  console.log(`  - Logging schema: ${loggingOperations.length} operations`);
  console.log(`  - Total: ${allSchemaOperations.length} operations`);
  
  // Build schema operation sets
  allSchemaOperations.forEach(op => {
    alignmentResults.schema.operations.push(op);
    alignmentResults.schema.paths.add(op.path);
    alignmentResults.schema.operationIds.add(op.operationId);
  });
  
  console.log('\n🔧 Extracting Backend Endpoints...');
  const backendEndpoints = extractBackendEndpoints();
  console.log(`  - Found ${backendEndpoints.length} backend endpoints`);
  
  // Build backend endpoint sets
  backendEndpoints.forEach(endpoint => {
    alignmentResults.backend.endpoints.push(endpoint);
    alignmentResults.backend.paths.add(endpoint.path);
    if (endpoint.operationId) {
      alignmentResults.backend.operationPatterns.add(endpoint.operationId);
    }
  });
  
  console.log('\n⚖️  Comparing Schema vs Backend...');
  
  // Find missing operations in backend
  for (const operation of allSchemaOperations) {
    const backendMatch = backendEndpoints.find(ep => 
      ep.path === operation.path && ep.method === operation.method
    );
    
    if (!backendMatch) {
      alignmentResults.misalignments.missingInBackend.push({
        operationId: operation.operationId,
        path: operation.path,
        method: operation.method
      });
    } else if (backendMatch.operationId && backendMatch.operationId !== operation.operationId) {
      alignmentResults.misalignments.parameterMismatches.push({
        schemaOperationId: operation.operationId,
        backendOperationId: backendMatch.operationId,
        path: operation.path,
        method: operation.method
      });
    }
  }
  
  // Find extra endpoints in backend not in schema
  for (const endpoint of backendEndpoints) {
    const schemaMatch = allSchemaOperations.find(op => 
      op.path === endpoint.path && op.method === endpoint.method
    );
    
    if (!schemaMatch && endpoint.path.startsWith('/api/') && endpoint.method !== 'OPTIONS') {
      alignmentResults.misalignments.missingInSchema.push({
        path: endpoint.path,
        method: endpoint.method,
        operationId: endpoint.operationId
      });
    }
  }
  
  return alignmentResults;
}

/**
 * Analyze error handling consistency
 */
function analyzeErrorHandling() {
  console.log('\n🚨 Analyzing Error Handling Consistency...');
  
  const indexPath = path.join(rootDir, 'src/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Count try/catch blocks
  const tryCount = (content.match(/\btry\s*{/g) || []).length;
  const catchCount = (content.match(/\bcatch\s*\(/g) || []).length;
  
  console.log(`  - Try blocks: ${tryCount}`);
  console.log(`  - Catch blocks: ${catchCount}`);
  
  if (tryCount !== catchCount) {
    alignmentResults.misalignments.errorHandlingMismatches.push({
      issue: 'Mismatched try/catch blocks',
      tryCount,
      catchCount,
      difference: Math.abs(tryCount - catchCount)
    });
    console.log(`  ❌ Mismatched try/catch blocks: ${tryCount} try, ${catchCount} catch`);
  } else {
    console.log(`  ✅ Try/catch blocks are balanced`);
  }
  
  // Check for consistent error response formats
  const errorResponsePattern = /return\s+(?:json|Response)\s*\(\s*\{[^}]*error[^}]*\}/g;
  const errorResponses = content.match(errorResponsePattern) || [];
  console.log(`  - Error response patterns found: ${errorResponses.length}`);
  
  return alignmentResults.misalignments.errorHandlingMismatches;
}

/**
 * Generate detailed report
 */
function generateReport() {
  console.log('\n📊 ALIGNMENT REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { misalignments } = alignmentResults;
  
  // Summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Schema Operations: ${alignmentResults.schema.operations.length}`);
  console.log(`   Backend Endpoints: ${alignmentResults.backend.endpoints.length}`);
  console.log(`   Missing in Backend: ${misalignments.missingInBackend.length}`);
  console.log(`   Missing in Schema: ${misalignments.missingInSchema.length}`);
  console.log(`   Parameter Mismatches: ${misalignments.parameterMismatches.length}`);
  console.log(`   Error Handling Issues: ${misalignments.errorHandlingMismatches.length}`);
  
  // Detailed issues
  if (misalignments.missingInBackend.length > 0) {
    console.log(`\n❌ MISSING IN BACKEND (${misalignments.missingInBackend.length}):`);
    misalignments.missingInBackend.forEach(item => {
      console.log(`   - ${item.method} ${item.path} (${item.operationId})`);
    });
  }
  
  if (misalignments.missingInSchema.length > 0) {
    console.log(`\n❌ MISSING IN SCHEMA (${misalignments.missingInSchema.length}):`);
    misalignments.missingInSchema.forEach(item => {
      console.log(`   - ${item.method} ${item.path} ${item.operationId ? `(${item.operationId})` : ''}`);
    });
  }
  
  if (misalignments.parameterMismatches.length > 0) {
    console.log(`\n⚠️  PARAMETER MISMATCHES (${misalignments.parameterMismatches.length}):`);
    misalignments.parameterMismatches.forEach(item => {
      console.log(`   - ${item.path}: Schema(${item.schemaOperationId}) ≠ Backend(${item.backendOperationId})`);
    });
  }
  
  if (misalignments.errorHandlingMismatches.length > 0) {
    console.log(`\n🚨 ERROR HANDLING ISSUES (${misalignments.errorHandlingMismatches.length}):`);
    misalignments.errorHandlingMismatches.forEach(item => {
      console.log(`   - ${item.issue}: ${item.difference} unmatched blocks`);
    });
  }
  
  // Overall assessment
  const totalIssues = misalignments.missingInBackend.length + 
                     misalignments.missingInSchema.length + 
                     misalignments.parameterMismatches.length + 
                     misalignments.errorHandlingMismatches.length;
  
  console.log(`\n🎯 OVERALL ASSESSMENT:`);
  if (totalIssues === 0) {
    console.log(`   ✅ PERFECT ALIGNMENT - No issues found!`);
  } else if (totalIssues <= 3) {
    console.log(`   ⚠️  MINOR MISALIGNMENTS - ${totalIssues} issues need attention`);
  } else if (totalIssues <= 10) {
    console.log(`   ❌ MODERATE MISALIGNMENTS - ${totalIssues} issues require fixing`);
  } else {
    console.log(`   💥 MAJOR MISALIGNMENTS - ${totalIssues} critical issues detected`);
  }
  
  // Save detailed report
  const reportPath = path.join(rootDir, 'schema-backend-alignment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(alignmentResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return totalIssues;
}

/**
 * Main execution
 */
async function main() {
  try {
    compareSchemaWithBackend();
    analyzeErrorHandling();
    const issueCount = generateReport();
    
    // Exit with error code if issues found
    process.exit(issueCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error during alignment analysis:', error.message);
    process.exit(1);
  }
}

main();