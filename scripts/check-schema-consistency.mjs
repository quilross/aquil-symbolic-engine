#!/usr/bin/env node
/**
 * Schema Consistency Checker
 * Ensures GPT Actions schema has exactly 30 operations with no drift
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function checkSchemaConsistency() {
  console.log('🔍 Checking GPT Actions Schema Consistency...\n');
  
  let exitCode = 0;
  const errors = [];
  
  try {
    // 1. Parse gpt-actions-schema.json and collect operationIds
    const schemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    if (!fs.existsSync(schemaPath)) {
      errors.push('❌ gpt-actions-schema.json not found');
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
      
      // 2. Grep router/handlers for implemented operationIds
      try {
        const { stdout } = await execAsync('grep -r "logChatGPTAction" src/ --include="*.js" || true');
        const implementedOps = new Set();
        
        // Extract operationIds from logChatGPTAction calls
        const logChatGPTMatches = stdout.match(/logChatGPTAction\([^,]+,\s*['"`]([^'"`]+)['"`]/g) || [];
        logChatGPTMatches.forEach(match => {
          const opId = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (opId) implementedOps.add(opId);
        });
        
        console.log(`📊 Found ${implementedOps.size} implemented operations in code`);
        
        // Create mapping functions for camelCase <-> snake_case
        const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const toCamelCase = (str) => str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        
        // Normalize both sets to snake_case for comparison
        const normalizedSchemaOps = new Set(operationIds.map(op => toSnakeCase(op)));
        const normalizedImplementedOps = new Set([...implementedOps].map(op => op.includes('_') ? op : toSnakeCase(op)));
        
        // Check set differences
        const missingInCode = [...normalizedSchemaOps].filter(op => !normalizedImplementedOps.has(op));
        const extraInCode = [...normalizedImplementedOps].filter(op => !normalizedSchemaOps.has(op));
        
        if (missingInCode.length > 0) {
          errors.push(`❌ Operations in schema but missing in code: ${missingInCode.join(', ')}`);
          exitCode = 1;
        }
        
        if (extraInCode.length > 0) {
          errors.push(`❌ Operations in code but missing in schema: ${extraInCode.join(', ')}`);
          exitCode = 1;
        }
        
        if (missingInCode.length === 0 && extraInCode.length === 0) {
          console.log('✅ Schema and implementation are consistent');
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