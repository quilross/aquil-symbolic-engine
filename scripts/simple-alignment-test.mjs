#!/usr/bin/env node
/**
 * Simple Schema-Backend Alignment Test
 * A straightforward test to validate key operations work correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function testCriticalOperations() {
  console.log('🎯 CRITICAL OPERATIONS ALIGNMENT TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Load schemas
  const mainSchema = JSON.parse(fs.readFileSync(path.join(rootDir, 'gpt-actions-schema.json'), 'utf8'));
  const loggingSchema = JSON.parse(fs.readFileSync(path.join(rootDir, 'config/ark.actions.logging.json'), 'utf8'));
  const backendCode = fs.readFileSync(path.join(rootDir, 'src/index.js'), 'utf8');
  
  // Extract all schema operations
  const schemaOperations = [];
  
  [mainSchema, loggingSchema].forEach(schema => {
    for (const [path, pathData] of Object.entries(schema.paths || {})) {
      for (const [method, methodData] of Object.entries(pathData)) {
        if (methodData.operationId) {
          schemaOperations.push({
            operationId: methodData.operationId,
            path,
            method: method.toUpperCase(),
            source: schema === mainSchema ? 'main' : 'logging'
          });
        }
      }
    }
  });
  
  console.log(`\n📊 Found ${schemaOperations.length} operations in schemas`);
  
  let alignedOperations = 0;
  let misalignedOperations = 0;
  let missingEndpoints = 0;
  
  const testResults = [];
  
  // Test each operation
  for (const operation of schemaOperations) {
    const result = {
      operationId: operation.operationId,
      path: operation.path,
      method: operation.method,
      source: operation.source,
      status: 'unknown'
    };
    
    // Check if endpoint exists in backend
    const methodLower = operation.method.toLowerCase();
    const escapedPath = operation.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const endpointPattern = new RegExp(`router\\.${methodLower}\\s*\\(\\s*["'\`]${escapedPath}["'\`]`);
    
    if (!endpointPattern.test(backendCode)) {
      result.status = 'missing_endpoint';
      missingEndpoints++;
      console.log(`❌ ${operation.operationId}: Missing endpoint ${operation.method} ${operation.path}`);
    } else {
      // Check if operationId is used in the handler
      const operationIdPattern = new RegExp(`logChatGPTAction\\s*\\([^,]+,\\s*["'\`]${operation.operationId}["'\`]`);
      
      if (operationIdPattern.test(backendCode)) {
        result.status = 'aligned';
        alignedOperations++;
        console.log(`✅ ${operation.operationId}: Properly aligned`);
      } else {
        result.status = 'misaligned';
        misalignedOperations++;
        console.log(`⚠️  ${operation.operationId}: Endpoint exists but operationId not used`);
      }
    }
    
    testResults.push(result);
  }
  
  // Summary
  console.log('\n📊 ALIGNMENT SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Operations: ${schemaOperations.length}`);
  console.log(`✅ Aligned: ${alignedOperations}`);
  console.log(`⚠️  Misaligned: ${misalignedOperations}`);
  console.log(`❌ Missing Endpoints: ${missingEndpoints}`);
  
  const successRate = ((alignedOperations / schemaOperations.length) * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  if (alignedOperations === schemaOperations.length) {
    console.log('🎉 PERFECT ALIGNMENT!');
  } else if (successRate >= 80) {
    console.log('✅ GOOD ALIGNMENT - Minor issues to address');
  } else if (successRate >= 60) {
    console.log('⚠️  MODERATE ALIGNMENT - Several issues need fixing');
  } else {
    console.log('❌ POOR ALIGNMENT - Major issues need attention');
  }
  
  // Save results
  const reportPath = path.join(rootDir, 'simple-alignment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalOperations: schemaOperations.length,
      aligned: alignedOperations,
      misaligned: misalignedOperations,
      missingEndpoints: missingEndpoints,
      successRate: parseFloat(successRate)
    },
    results: testResults
  }, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return successRate >= 80;
}

// Run the test
try {
  const success = testCriticalOperations();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}