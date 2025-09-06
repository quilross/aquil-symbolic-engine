#!/usr/bin/env node
/**
 * Operation Aliases CI Check
 * Validates that all operationIds used in code are either canonical or known aliases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllCanonical, getAllAliases, toCanonical } from '../../backend/ops/operation-aliases.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

async function checkOperationAliases() {
  let exitCode = 0;
  const errors = [];
  const warnings = [];

  console.log('🔍 Checking Operation Aliases Consistency...\n');

  try {
    // 1. Load canonical operations from schema
    const schemaPath = path.join(rootDir, 'config/gpt-actions-schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    const schemaOperations = new Set();
    
    // Extract operationIds from schema
    for (const [path, pathData] of Object.entries(schema.paths || {})) {
      for (const [method, methodData] of Object.entries(pathData)) {
        if (methodData.operationId) {
          schemaOperations.add(methodData.operationId);
        }
      }
    }
    
    console.log(`📊 Found ${schemaOperations.size} operations in schema`);
    
    // Validate that all 30 expected operations are present
    if (schemaOperations.size !== 30) {
      errors.push(`❌ Expected 30 operations in schema, found ${schemaOperations.size}`);
      exitCode = 1;
    } else {
      console.log('✅ Schema operation count is correct (30)');
    }
    
    // 2. Validate canonical operations mapping
    const canonicalOps = new Set(getAllCanonical());
    const aliasOps = new Set(getAllAliases());
    
    console.log(`📊 Found ${canonicalOps.size} canonical operations defined`);
    console.log(`📊 Found ${aliasOps.size} alias operations defined`);
    
    // Check that all schema operations are in canonical mapping
    const missingCanonical = [...schemaOperations].filter(op => !canonicalOps.has(op));
    if (missingCanonical.length > 0) {
      errors.push(`❌ Schema operations missing from canonical mapping: ${missingCanonical.join(', ')}`);
      exitCode = 1;
    } else {
      console.log('✅ All schema operations are in canonical mapping');
    }
    
    // Check that canonical mapping doesn't have extra operations
    const extraCanonical = [...canonicalOps].filter(op => !schemaOperations.has(op));
    if (extraCanonical.length > 0) {
      warnings.push(`⚠️  Canonical mapping has extra operations not in schema: ${extraCanonical.join(', ')}`);
    }
    
    // 3. Scan code for operation names used in logChatGPTAction calls
    const codeOperations = new Set();
    
    // Function to scan a JavaScript file for operation IDs
    function scanFile(filePath) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match logChatGPTAction calls
      const logMatches = content.match(/logChatGPTAction\([^,]+,\s*['\"`]([^'\"`]+)['\"`]/g) || [];
      logMatches.forEach(match => {
        const opId = match.match(/['\"`]([^'\"`]+)['\"`]/)?.[1];
        if (opId) codeOperations.add(opId);
      });
      
      // Match router handlers that might use operation IDs
      const routerMatches = content.match(/router\.(get|post|put|delete)\s*\(\s*['\"`]([^'\"`]+)['\"`]/g) || [];
      routerMatches.forEach(match => {
        const path = match.match(/['\"`]([^'\"`]+)['\"`]/)?.[1];
        if (path && path.startsWith('/api/')) {
          // Extract potential operation ID from path
          // This is a heuristic - we can improve it if needed
        }
      });
    }
    
    // Scan source files
    function scanDirectory(dir, extensions = ['.js', '.mjs']) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath, extensions);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          scanFile(fullPath);
        }
      }
    }
    
    scanDirectory(path.join(rootDir, 'src'));
    
    console.log(`📊 Found ${codeOperations.size} operation IDs used in code`);
    
    // 4. Validate that all code operations are either canonical or aliases
    const unknownOperations = [];
    const validOperations = new Set([...canonicalOps, ...aliasOps]);
    
    for (const op of codeOperations) {
      if (!validOperations.has(op)) {
        unknownOperations.push(op);
      }
    }
    
    if (unknownOperations.length > 0) {
      errors.push(`❌ Unknown operations used in code (not canonical or alias): ${unknownOperations.join(', ')}`);
      exitCode = 1;
    } else {
      console.log('✅ All code operations are known (canonical or alias)');
    }
    
    // 5. Check that all canonical operations are referenced somewhere
    const usedCanonical = new Set();
    for (const op of codeOperations) {
      const canonical = toCanonical(op);
      usedCanonical.add(canonical);
    }
    
    const unreferencedCanonical = [...canonicalOps].filter(op => !usedCanonical.has(op));
    if (unreferencedCanonical.length > 0) {
      warnings.push(`⚠️  Canonical operations never referenced in code: ${unreferencedCanonical.join(', ')}`);
    }
    
    // 6. Report summary
    console.log('\n📋 Operation Aliases Check Summary:');
    
    if (errors.length === 0) {
      console.log('✅ All checks passed!');
    } else {
      console.log('❌ Issues found:');
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    console.log(`\n📈 Statistics:`);
    console.log(`  Schema operations: ${schemaOperations.size}`);
    console.log(`  Canonical mappings: ${canonicalOps.size}`);
    console.log(`  Alias mappings: ${aliasOps.size}`);
    console.log(`  Code operations: ${codeOperations.size}`);
    console.log(`  Referenced canonical: ${usedCanonical.size}`);
    
  } catch (error) {
    console.error('❌ Error during operation aliases check:', error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

checkOperationAliases();