#!/usr/bin/env node

/**
 * OpenAPI-Worker Sync Validator
 * Ensures all OpenAPI operationIds have corresponding Worker implementations
 */

import fs from 'fs';
import path from 'path';

const OPENAPI_PATH = './src/openapi.json';
const WORKER_PATH = './src/index.js';

function extractOperationIds(openApiPath) {
  const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
  const operationIds = [];
  
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      if (spec.paths[pathKey][method].operationId) {
        operationIds.push({
          operationId: spec.paths[pathKey][method].operationId,
          path: pathKey,
          method: method.toUpperCase()
        });
      }
    }
  }
  return operationIds;
}

function extractWorkerMethods(workerPath) {
  const content = fs.readFileSync(workerPath, 'utf8');
  const methodMatches = content.match(/async\s+(\w+)\s*\(/g);
  
  if (!methodMatches) return [];
  
  return methodMatches.map(match => {
    const methodName = match.match(/async\s+(\w+)/)[1];
    return methodName;
  });
}

function extractWorkerRoutes(workerPath) {
  const content = fs.readFileSync(workerPath, 'utf8');
  const routeMatches = content.match(/if\s*\(\s*path\s*===\s*['"][^'"]+['"]/g);
  
  if (!routeMatches) return [];
  
  return routeMatches.map(match => {
    const path = match.match(/['"]([^'"]+)['"]/)[1];
    return path;
  });
}

function validateSync() {
  console.log('🔍 OpenAPI-Worker Sync Validation\n');
  
  // Extract data
  const operationIds = extractOperationIds(OPENAPI_PATH);
  const workerMethods = extractWorkerMethods(WORKER_PATH);
  const workerRoutes = extractWorkerRoutes(WORKER_PATH);
  
  console.log(`Found ${operationIds.length} OpenAPI operations`);
  console.log(`Found ${workerMethods.length} Worker methods`);
  console.log(`Found ${workerRoutes.length} Worker routes\n`);
  
  // Check missing methods
  const missingMethods = operationIds.filter(op => 
    !workerMethods.includes(op.operationId)
  );
  
  // Check missing routes
  const missingRoutes = operationIds.filter(op => 
    !workerRoutes.some(route => route === op.path || route.startsWith(op.path.replace('{', '').replace('}', '')))
  );
  
  // Check extra methods (not in OpenAPI)
  const extraMethods = workerMethods.filter(method => 
    !operationIds.some(op => op.operationId === method) &&
    !['fetch', 'respond', 'inc', 'rotateDay'].includes(method) // Exclude utility methods
  );
  
  // Report results
  console.log('=' * 60);
  
  if (missingMethods.length === 0) {
    console.log('✅ All OpenAPI operations have method implementations');
  } else {
    console.log('❌ Missing method implementations:');
    missingMethods.forEach(op => {
      console.log(`   - ${op.operationId} (${op.method} ${op.path})`);
    });
  }
  
  if (missingRoutes.length === 0) {
    console.log('✅ All OpenAPI paths have route handlers');
  } else {
    console.log('❌ Missing route handlers:');
    missingRoutes.forEach(op => {
      console.log(`   - ${op.path} (${op.method})`);
    });
  }
  
  if (extraMethods.length > 0) {
    console.log('ℹ️  Extra methods in Worker (not in OpenAPI):');
    extraMethods.slice(0, 10).forEach(method => {
      console.log(`   - ${method}`);
    });
    if (extraMethods.length > 10) {
      console.log(`   ... and ${extraMethods.length - 10} more`);
    }
  }
  
  const totalIssues = missingMethods.length + missingRoutes.length;
  
  console.log('\n' + '=' * 60);
  console.log(`Sync Status: ${totalIssues === 0 ? '✅ PERFECT SYNC' : `❌ ${totalIssues} issues found`}`);
  
  return {
    missingMethods,
    missingRoutes,
    extraMethods,
    syncPerfect: totalIssues === 0
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateSync();
  process.exit(result.syncPerfect ? 0 : 1);
}

export { validateSync };
