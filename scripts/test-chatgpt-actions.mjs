#!/usr/bin/env node
/**
 * ChatGPT Actions Testing Suite
 * Tests all operations for proper ChatGPT integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function testChatGPTActionsCompatibility() {
  console.log('🧪 Testing ChatGPT Actions Compatibility...\n');
  
  const schemas = [
    { name: 'Main Schema', path: 'gpt-actions-schema.json' },
    { name: 'Logging Schema', path: 'config/ark.actions.logging.json' }
  ];
  
  let totalIssues = 0;
  
  for (const schema of schemas) {
    console.log(`📋 Testing ${schema.name}...`);
    const schemaPath = path.join(rootDir, schema.path);
    const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const issues = await testSchema(schemaContent, schema.name);
    totalIssues += issues;
    console.log();
  }
  
  if (totalIssues === 0) {
    console.log('🎉 All schemas are ChatGPT Actions ready!');
  } else {
    console.log(`⚠️  Found ${totalIssues} optimization opportunities`);
  }
}

async function testSchema(schema, schemaName) {
  let issues = 0;
  const operations = extractOperations(schema);
  
  console.log(`  📊 Found ${operations.length} operations`);
  
  // Test 1: Operation count
  if (operations.length > 30) {
    console.log(`  ❌ Too many operations: ${operations.length} (max 30)`);
    issues++;
  } else {
    console.log(`  ✅ Operation count OK: ${operations.length}/30`);
  }
  
  // Test 2: Description quality
  const poorDescriptions = operations.filter(op => 
    !op.description || op.description.length < 30 || 
    !op.description.includes('when') && !op.description.includes('Called')
  );
  
  if (poorDescriptions.length > 0) {
    console.log(`  ⚠️  ${poorDescriptions.length} operations need better descriptions`);
    issues++;
  } else {
    console.log(`  ✅ All descriptions are detailed`);
  }
  
  // Test 3: Response schema completeness
  const incompleteResponses = operations.filter(op => {
    const response = op.responses?.['200'];
    return !response?.content?.['application/json']?.schema?.properties;
  });
  
  if (incompleteResponses.length > 0) {
    console.log(`  ⚠️  ${incompleteResponses.length} operations need complete response schemas`);
    issues++;
  } else {
    console.log(`  ✅ All operations have complete response schemas`);
  }
  
  // Test 4: Autonomous flags
  const autonomousOps = operations.filter(op => op['x-openai-autonomous']);
  console.log(`  📈 ${autonomousOps.length} operations marked as autonomous`);
  
  // Test 5: Consequential flags
  const consequentialOps = operations.filter(op => op['x-openai-isConsequential']);
  console.log(`  ⚡ ${consequentialOps.length} operations marked as consequential`);
  
  return issues;
}

function extractOperations(schema) {
  const operations = [];
  
  for (const [path, pathData] of Object.entries(schema.paths || {})) {
    for (const [method, methodData] of Object.entries(pathData)) {
      if (methodData.operationId) {
        operations.push({
          operationId: methodData.operationId,
          path,
          method,
          description: methodData.description,
          responses: methodData.responses,
          'x-openai-autonomous': methodData['x-openai-autonomous'],
          'x-openai-isConsequential': methodData['x-openai-isConsequential']
        });
      }
    }
  }
  
  return operations;
}

testChatGPTActionsCompatibility().catch(console.error);
