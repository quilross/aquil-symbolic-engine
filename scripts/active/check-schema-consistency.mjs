#!/usr/bin/env node
/**
 * Schema Consistency Checker
 * Ensures GPT Actions schema has exactly 30 operations with no drift
 * Updated to work with canonical operation aliases system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getAllCanonical, getAllAliases, toCanonical } from '../../backend/ops/operation-aliases.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

async function checkSchemaConsistency() {
  console.log('🔍 Checking GPT Actions Schema Consistency...\n');
  
  let exitCode = 0;
  const errors = [];
  
  try {
    // 1. Parse config/gpt-actions-schema.json and collect operationIds
    const schemaPath = path.join(rootDir, 'config/gpt-actions-schema.json');
    if (!fs.existsSync(schemaPath)) {
      errors.push('❌ config/gpt-actions-schema.json not found');
      exitCode = 1;
    } else {
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      
      // Extract operationIds from schema
      const operationIds = [];
      for (const [path, methods] of Object.entries(schema.paths || {})) {
        for (const [method, spec] of Object.entries(methods)) {
          if (spec.operationId) {
            operationIds.push(spec.operationId);
          }
        }
      }
      
      console.log(`📊 Found ${operationIds.length} operations in schema`);
      
      // Check for exactly 30 operations
      if (operationIds.length !== 30) {
        errors.push(`❌ Expected 30 operations, found ${operationIds.length}`);
        exitCode = 1;
      } else {
        console.log('✅ Operation count is correct (30)');
      }
      
      // Check for duplicates
      const duplicates = operationIds.filter((id, index) => operationIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push(`❌ Duplicate operationIds found: ${duplicates.join(', ')}`);
        exitCode = 1;
      } else {
        console.log('✅ No duplicate operationIds found');
      }
      
      // 2. Check implementation consistency using alias system
      try {
        const { stdout } = await execAsync('grep -r "logChatGPTAction" backend/ --include="*.js" || true');
        const implementedOps = new Set();
        
        // Extract operationIds from logChatGPTAction calls
        const logChatGPTMatches = stdout.match(/logChatGPTAction\([^,]+,\s*['"`]([^'"`]+)['"`]/g) || [];
        logChatGPTMatches.forEach(match => {
          const opId = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (opId) implementedOps.add(opId);
        });
        
        console.log(`📊 Found ${implementedOps.size} implemented operations in code`);
        
        // Convert implemented operations to canonical form
        const canonicalImplemented = new Set();
        const validOperations = new Set([...getAllCanonical(), ...getAllAliases()]);
        const invalidOperations = [];
        
        for (const op of implementedOps) {
          if (validOperations.has(op)) {
            canonicalImplemented.add(toCanonical(op));
          } else {
            invalidOperations.push(op);
          }
        }
        
        // Check for invalid operations (not in canonical or alias mapping)
        if (invalidOperations.length > 0) {
          errors.push(`❌ Operations in code not in alias system: ${invalidOperations.join(', ')}`);
          exitCode = 1;
        }
        
        // Compare schema operations (canonical) with implemented operations (converted to canonical)
        const schemaOpsSet = new Set(operationIds);
        const missingInCode = [...schemaOpsSet].filter(op => !canonicalImplemented.has(op));
        const extraInCode = [...canonicalImplemented].filter(op => !schemaOpsSet.has(op));
        
        if (missingInCode.length > 0) {
          console.log(`⚠️  Operations in schema but not yet implemented: ${missingInCode.join(', ')}`);
          // Note: This is expected during development, so it's a warning not an error
        }
        
        if (extraInCode.length > 0) {
          errors.push(`❌ Operations implemented but missing from schema: ${extraInCode.join(', ')}`);
          exitCode = 1;
        }
        
        if (missingInCode.length === 0 && extraInCode.length === 0) {
          console.log('✅ Schema and implementation are consistent');
        } else if (extraInCode.length === 0) {
          console.log('✅ No extra operations in code (some schema operations not yet implemented)');
        }
        
      } catch (grepError) {
        errors.push(`❌ Failed to grep implementations: ${grepError.message}`);
        exitCode = 1;
      }
    }
    
  } catch (error) {
    errors.push(`❌ Unexpected error: ${error.message}`);
    exitCode = 1;
  }
  
  // Summary
  console.log('\n📋 Schema Consistency Check Summary:');
  if (errors.length === 0) {
    console.log('✅ All checks passed - schema is consistent');
  } else {
    console.log('❌ Issues found:');
    errors.forEach(error => console.log(`  ${error}`));
  }
  
  process.exit(exitCode);
}

checkSchemaConsistency().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});