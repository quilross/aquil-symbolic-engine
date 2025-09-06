#!/usr/bin/env node
/**
 * Fix Major OperationId Mismatches
 * Addresses the most critical misalignments between schema and backend implementation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Critical mismatches that need to be fixed based on the alignment report
const criticalMismatches = [
  {
    path: '/api/commitments/create',
    method: 'POST',
    schemaOperationId: 'manageCommitment',
    backendOperationId: 'designHabits',
    fix: 'backend' // Fix the backend to use correct operationId
  },
  {
    path: '/api/somatic/session',
    method: 'POST',
    schemaOperationId: 'somaticHealingSession',
    backendOperationId: 'trustCheckIn',
    fix: 'backend'
  },
  {
    path: '/api/media/extract-wisdom',
    method: 'POST',
    schemaOperationId: 'extractMediaWisdom',
    backendOperationId: 'somaticHealingSession',
    fix: 'backend'
  },
  {
    path: '/api/patterns/recognize',
    method: 'POST',
    schemaOperationId: 'recognizePatterns',
    backendOperationId: 'extractMediaWisdom',
    fix: 'backend'
  },
  {
    path: '/api/trust/check-in',
    method: 'POST',
    schemaOperationId: 'trustCheckIn',
    backendOperationId: null, // Missing in backend logs
    fix: 'backend'
  }
];

function fixBackendOperationIds() {
  console.log('🔧 FIXING CRITICAL OPERATION ID MISMATCHES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const indexPath = path.join(rootDir, 'src/index.js');
  let content = fs.readFileSync(indexPath, 'utf8');
  let fixesApplied = 0;
  
  for (const mismatch of criticalMismatches) {
    console.log(`\n🔍 Processing ${mismatch.method} ${mismatch.path}...`);
    console.log(`   Schema expects: ${mismatch.schemaOperationId}`);
    console.log(`   Backend has: ${mismatch.backendOperationId || 'Missing operationId'}`);
    
    if (mismatch.fix === 'backend') {
      // Find the router endpoint and fix the operationId
      const methodLower = mismatch.method.toLowerCase();
      const escapedPath = mismatch.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Pattern to find the router handler
      const routerPattern = new RegExp(
        `(router\\.${methodLower}\\s*\\(\\s*["'\`]${escapedPath}["'\`]\\s*,\\s*async\\s*\\([^)]*\\)\\s*=>\\s*{[^}]*?)` +
        `(logChatGPTAction\\s*\\([^,]+,\\s*)["'\`]([^"'\`]+)["'\`]`,
        'g'
      );
      
      const match = routerPattern.exec(content);
      if (match) {
        const [fullMatch, prefix, logPrefix, currentOperationId] = match;
        
        if (currentOperationId !== mismatch.schemaOperationId) {
          const newLogCall = `${logPrefix}"${mismatch.schemaOperationId}"`;
          const newMatch = fullMatch.replace(
            /logChatGPTAction\s*\([^,]+,\s*["'`][^"'`]+["'`]/,
            newLogCall
          );
          
          content = content.replace(fullMatch, newMatch);
          fixesApplied++;
          console.log(`   ✅ Fixed: ${currentOperationId} → ${mismatch.schemaOperationId}`);
        } else {
          console.log(`   ✅ Already correct: ${currentOperationId}`);
        }
      } else {
        // Try to find the endpoint without operationId and add it
        const simpleRouterPattern = new RegExp(
          `(router\\.${methodLower}\\s*\\(\\s*["'\`]${escapedPath}["'\`]\\s*,\\s*async\\s*\\([^)]*\\)\\s*=>\\s*{(?:(?!logChatGPTAction)[^}])*?)(\\s*return\\s+[^}]+})`,
          'g'
        );
        
        const simpleMatch = simpleRouterPattern.exec(content);
        if (simpleMatch) {
          const [fullMatch, handlerPrefix, returnStatement] = simpleMatch;
          
          // Add logChatGPTAction call before return
          const newHandler = handlerPrefix + 
            `    await logChatGPTAction(env, "${mismatch.schemaOperationId}", req.body || {}, result);\n` +
            returnStatement;
          
          content = content.replace(fullMatch, newHandler);
          fixesApplied++;
          console.log(`   ✅ Added missing operationId: ${mismatch.schemaOperationId}`);
        } else {
          console.log(`   ❌ Could not find endpoint pattern to fix`);
        }
      }
    }
  }
  
  if (fixesApplied > 0) {
    // Write the updated content
    fs.writeFileSync(indexPath, content);
    console.log(`\n✅ Applied ${fixesApplied} operationId fixes`);
  } else {
    console.log(`\n⚠️  No fixes could be applied automatically`);
  }
  
  return fixesApplied;
}

function addMissingSchemaEndpoints() {
  console.log('\n📋 CHECKING FOR MISSING SCHEMA ENDPOINTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Load the alignment report to see what's missing
  const alignmentReportPath = path.join(rootDir, 'schema-backend-alignment-report.json');
  if (!fs.existsSync(alignmentReportPath)) {
    console.log('⚠️  Alignment report not found. Run schema-backend-alignment.mjs first.');
    return 0;
  }
  
  const alignmentReport = JSON.parse(fs.readFileSync(alignmentReportPath, 'utf8'));
  const missingInSchema = alignmentReport.misalignments.missingInSchema;
  
  console.log(`Found ${missingInSchema.length} endpoints missing from schema`);
  
  // For now, just report - adding to schema would require careful consideration
  // of the 30-operation limit for ChatGPT Actions
  if (missingInSchema.length > 0) {
    console.log('\n⚠️  Endpoints in backend but missing from schema:');
    missingInSchema.slice(0, 10).forEach(endpoint => {
      console.log(`   - ${endpoint.method} ${endpoint.path} ${endpoint.operationId ? `(${endpoint.operationId})` : ''}`);
    });
    
    if (missingInSchema.length > 10) {
      console.log(`   ... and ${missingInSchema.length - 10} more`);
    }
    
    console.log('\n💡 Consider whether these endpoints should be:');
    console.log('   1. Added to the schema (if within 30-operation limit)');
    console.log('   2. Removed from backend (if deprecated)');
    console.log('   3. Documented as internal-only endpoints');
  }
  
  return 0;
}

function validateFixes() {
  console.log('\n🔍 VALIDATING FIXES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Re-run a subset of the alignment check
  const indexPath = path.join(rootDir, 'src/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  let validationsPassed = 0;
  let validationsFailed = 0;
  
  for (const mismatch of criticalMismatches) {
    const methodLower = mismatch.method.toLowerCase();
    const escapedPath = mismatch.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const operationIdPattern = new RegExp(
      `router\\.${methodLower}\\s*\\([^)]*${escapedPath}[^}]*logChatGPTAction\\s*\\([^,]+,\\s*["'\`]([^"'\`]+)["'\`]`,
      'g'
    );
    
    const match = operationIdPattern.exec(content);
    if (match) {
      const foundOperationId = match[1];
      if (foundOperationId === mismatch.schemaOperationId) {
        console.log(`   ✅ ${mismatch.path}: ${foundOperationId}`);
        validationsPassed++;
      } else {
        console.log(`   ❌ ${mismatch.path}: expected ${mismatch.schemaOperationId}, got ${foundOperationId}`);
        validationsFailed++;
      }
    } else {
      console.log(`   ⚠️  ${mismatch.path}: operationId not found`);
      validationsFailed++;
    }
  }
  
  console.log(`\n📊 Validation Results:`);
  console.log(`   Passed: ${validationsPassed}`);
  console.log(`   Failed: ${validationsFailed}`);
  
  return validationsFailed === 0;
}

// Main execution
async function main() {
  try {
    const fixes = fixBackendOperationIds();
    addMissingSchemaEndpoints();
    const validationPassed = validateFixes();
    
    console.log('\n🎯 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Applied ${fixes} operationId fixes`);
    console.log(`Validation: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    process.exit(validationPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error during operationId fix process:', error.message);
    process.exit(1);
  }
}

main();