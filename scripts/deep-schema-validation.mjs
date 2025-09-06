#!/usr/bin/env node
/**
 * Deep Schema Validation for ChatGPT Actions
 * Performs comprehensive validation as described in the problem statement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load schemas
const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
const loggingSchemaPath = path.join(rootDir, 'config/ark.actions.logging.json');
const indexPath = path.join(rootDir, 'src/index.js');

const mainSchema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));
const loggingSchema = JSON.parse(fs.readFileSync(loggingSchemaPath, 'utf8'));
const indexContent = fs.readFileSync(indexPath, 'utf8');

let issues = [];

console.log('🔍 DEEP CHATGPT ACTIONS SCHEMA VALIDATION');
console.log('━'.repeat(80));

/**
 * Extract operations from schema
 */
function extractOperations(schema) {
  const operations = [];
  if (!schema.paths) return operations;
  
  for (const [path, pathData] of Object.entries(schema.paths)) {
    for (const [method, methodData] of Object.entries(pathData)) {
      if (methodData.operationId) {
        operations.push({
          operationId: methodData.operationId,
          path,
          method: method.toUpperCase(),
          description: methodData.description,
          summary: methodData.summary,
          responses: methodData.responses,
          requestBody: methodData.requestBody,
          parameters: methodData.parameters,
          'x-openai-autonomous': methodData['x-openai-autonomous'],
          'x-openai-isConsequential': methodData['x-openai-isConsequential']
        });
      }
    }
  }
  return operations;
}

/**
 * Validate operation descriptions and trigger phrases
 */
function validateDescriptions(operations) {
  console.log('\n📝 VALIDATING DESCRIPTIONS AND TRIGGER PHRASES');
  console.log('─'.repeat(50));
  
  const missingDescriptions = [];
  const missingTriggerPhrases = [];
  const shortDescriptions = [];
  
  for (const op of operations) {
    // Check description completeness
    if (!op.description) {
      missingDescriptions.push(op.operationId);
    } else if (op.description.length < 30) {
      shortDescriptions.push({
        operationId: op.operationId,
        description: op.description,
        length: op.description.length
      });
    }
    
    // Check trigger phrases for autonomous operations
    if (op['x-openai-autonomous'] && op.description) {
      const hasTriggerPhrases = op.description.toLowerCase().includes('triggers on:') || 
                               op.description.toLowerCase().includes('called when') ||
                               op.description.toLowerCase().includes('called automatically');
      if (!hasTriggerPhrases) {
        missingTriggerPhrases.push(op.operationId);
      }
    }
  }
  
  if (missingDescriptions.length > 0) {
    console.log(`❌ ${missingDescriptions.length} operations missing descriptions:`);
    missingDescriptions.forEach(id => console.log(`  - ${id}`));
    issues.push(`Missing descriptions: ${missingDescriptions.join(', ')}`);
  } else {
    console.log('✅ All operations have descriptions');
  }
  
  if (shortDescriptions.length > 0) {
    console.log(`⚠️  ${shortDescriptions.length} operations with short descriptions (<30 chars):`);
    shortDescriptions.forEach(op => console.log(`  - ${op.operationId}: "${op.description}" (${op.length} chars)`));
    issues.push(`Short descriptions: ${shortDescriptions.map(op => op.operationId).join(', ')}`);
  } else {
    console.log('✅ All descriptions are adequately detailed');
  }
  
  if (missingTriggerPhrases.length > 0) {
    console.log(`⚠️  ${missingTriggerPhrases.length} autonomous operations missing clear trigger phrases:`);
    missingTriggerPhrases.forEach(id => console.log(`  - ${id}`));
    issues.push(`Missing trigger phrases: ${missingTriggerPhrases.join(', ')}`);
  } else {
    console.log('✅ All autonomous operations have clear trigger phrases');
  }
}

/**
 * Validate parameter definitions
 */
function validateParameters(operations) {
  console.log('\n🔧 VALIDATING PARAMETER DEFINITIONS');
  console.log('─'.repeat(50));
  
  const parameterIssues = [];
  
  for (const op of operations) {
    if (!op.requestBody?.content?.['application/json']?.schema?.properties) {
      // Skip operations without request body parameters
      continue;
    }
    
    const properties = op.requestBody.content['application/json'].schema.properties;
    const required = op.requestBody.content['application/json'].schema.required || [];
    
    for (const [paramName, paramDef] of Object.entries(properties)) {
      // Check for missing type
      if (!paramDef.type) {
        parameterIssues.push({
          operation: op.operationId,
          parameter: paramName,
          issue: 'Missing type definition'
        });
      }
      
      // Check for missing description
      if (!paramDef.description) {
        parameterIssues.push({
          operation: op.operationId,
          parameter: paramName,
          issue: 'Missing description'
        });
      }
      
      // Check for inadequate description
      if (paramDef.description && paramDef.description.length < 5) {
        parameterIssues.push({
          operation: op.operationId,
          parameter: paramName,
          issue: `Description too short: "${paramDef.description}"`
        });
      }
    }
  }
  
  if (parameterIssues.length > 0) {
    console.log(`❌ ${parameterIssues.length} parameter definition issues found:`);
    parameterIssues.forEach(issue => {
      console.log(`  - ${issue.operation}.${issue.parameter}: ${issue.issue}`);
    });
    issues.push(`Parameter issues: ${parameterIssues.length} found`);
  } else {
    console.log('✅ All parameters have proper type and description definitions');
  }
}

/**
 * Validate response schemas
 */
function validateResponseSchemas(operations) {
  console.log('\n📤 VALIDATING RESPONSE SCHEMAS');
  console.log('─'.repeat(50));
  
  const responseIssues = [];
  
  for (const op of operations) {
    if (!op.responses) {
      responseIssues.push({
        operation: op.operationId,
        issue: 'Missing responses definition'
      });
      continue;
    }
    
    // Check for 200 response
    if (!op.responses['200']) {
      responseIssues.push({
        operation: op.operationId,
        issue: 'Missing 200 success response'
      });
    } else {
      const successResponse = op.responses['200'];
      if (!successResponse.content?.['application/json']?.schema) {
        responseIssues.push({
          operation: op.operationId,
          issue: 'Missing success response schema'
        });
      }
    }
    
    // Check for error responses
    const hasErrorResponse = op.responses['400'] || op.responses['500'] || op.responses['4XX'] || op.responses['5XX'];
    if (!hasErrorResponse) {
      responseIssues.push({
        operation: op.operationId,
        issue: 'Missing error response definitions'
      });
    }
  }
  
  if (responseIssues.length > 0) {
    console.log(`❌ ${responseIssues.length} response schema issues found:`);
    responseIssues.forEach(issue => {
      console.log(`  - ${issue.operation}: ${issue.issue}`);
    });
    issues.push(`Response schema issues: ${responseIssues.length} found`);
  } else {
    console.log('✅ All operations have complete response schemas with error handling');
  }
}

/**
 * Validate flag consistency
 */
function validateFlags(operations) {
  console.log('\n🏁 VALIDATING FLAG CONSISTENCY');
  console.log('─'.repeat(50));
  
  const flagIssues = [];
  let autonomousCount = 0;
  let consequentialCount = 0;
  
  for (const op of operations) {
    if (op['x-openai-autonomous']) autonomousCount++;
    if (op['x-openai-isConsequential']) consequentialCount++;
    
    // Check if autonomous operations have proper trigger phrases
    if (op['x-openai-autonomous'] && op.description) {
      const hasTriggerInfo = op.description.toLowerCase().includes('triggers on:') || 
                            op.description.toLowerCase().includes('called when') ||
                            op.description.toLowerCase().includes('called automatically');
      if (!hasTriggerInfo) {
        flagIssues.push({
          operation: op.operationId,
          issue: 'Autonomous operation lacks trigger phrase definition'
        });
      }
    }
    
    // Check if consequential operations are properly documented
    if (op['x-openai-isConsequential'] && op.description) {
      // Consequential operations should clearly indicate their impact
      const hasImpactInfo = op.description.toLowerCase().includes('create') ||
                           op.description.toLowerCase().includes('update') ||
                           op.description.toLowerCase().includes('delete') ||
                           op.description.toLowerCase().includes('modify') ||
                           op.description.toLowerCase().includes('set') ||
                           op.description.toLowerCase().includes('track') ||
                           op.description.toLowerCase().includes('log');
      if (!hasImpactInfo) {
        flagIssues.push({
          operation: op.operationId,
          issue: 'Consequential operation should clearly describe its impact'
        });
      }
    }
  }
  
  console.log(`📈 ${autonomousCount} operations marked as autonomous`);
  console.log(`⚡ ${consequentialCount} operations marked as consequential`);
  
  if (flagIssues.length > 0) {
    console.log(`⚠️  ${flagIssues.length} flag consistency issues:`);
    flagIssues.forEach(issue => {
      console.log(`  - ${issue.operation}: ${issue.issue}`);
    });
    issues.push(`Flag issues: ${flagIssues.length} found`);
  } else {
    console.log('✅ Flags are consistently applied and documented');
  }
}

/**
 * Validate implementation coverage
 */
function validateImplementation(operations) {
  console.log('\n🛠️  VALIDATING IMPLEMENTATION COVERAGE');
  console.log('─'.repeat(50));
  
  const implementationIssues = [];
  
  for (const op of operations) {
    // Check if operation is referenced in index.js
    const hasRoute = indexContent.includes(`"${op.path}"`) || 
                     indexContent.includes(`'${op.path}'`) ||
                     indexContent.includes(op.path);
    
    if (!hasRoute) {
      implementationIssues.push({
        operation: op.operationId,
        path: op.path,
        issue: 'No route found in index.js'
      });
    }
    
    // Check if operationId is referenced for logging
    const hasLogging = indexContent.includes(`'${op.operationId}'`) ||
                      indexContent.includes(`"${op.operationId}"`);
    
    if (!hasLogging) {
      implementationIssues.push({
        operation: op.operationId,
        path: op.path,
        issue: 'No logging reference found'
      });
    }
  }
  
  if (implementationIssues.length > 0) {
    console.log(`❌ ${implementationIssues.length} implementation issues found:`);
    implementationIssues.forEach(issue => {
      console.log(`  - ${issue.operation} (${issue.path}): ${issue.issue}`);
    });
    issues.push(`Implementation issues: ${implementationIssues.length} found`);
  } else {
    console.log('✅ All operations have corresponding implementation');
  }
}

/**
 * Validate schema alignment between main and logging schemas
 */
function validateSchemaAlignment() {
  console.log('\n🔗 VALIDATING SCHEMA ALIGNMENT');
  console.log('─'.repeat(50));
  
  const alignmentIssues = [];
  
  // Check if logging schema operations conflict with main schema
  const mainOps = extractOperations(mainSchema);
  const loggingOps = extractOperations(loggingSchema);
  
  const mainOpIds = new Set(mainOps.map(op => op.operationId));
  const loggingOpIds = new Set(loggingOps.map(op => op.operationId));
  
  // Check for operation ID conflicts
  const conflicts = [...loggingOpIds].filter(id => mainOpIds.has(id));
  if (conflicts.length > 0) {
    alignmentIssues.push(`Operation ID conflicts: ${conflicts.join(', ')}`);
  }
  
  // Check logging schema completeness
  const requiredLoggingOps = ['logDataOrEvent', 'retrieveLogsOrDataEntries'];
  const missingLoggingOps = requiredLoggingOps.filter(op => !loggingOpIds.has(op));
  if (missingLoggingOps.length > 0) {
    alignmentIssues.push(`Missing required logging operations: ${missingLoggingOps.join(', ')}`);
  }
  
  if (alignmentIssues.length > 0) {
    console.log(`❌ ${alignmentIssues.length} schema alignment issues:`);
    alignmentIssues.forEach(issue => console.log(`  - ${issue}`));
    issues.push(`Schema alignment issues: ${alignmentIssues.length} found`);
  } else {
    console.log('✅ Schemas are properly aligned with no conflicts');
  }
}

// Run all validations
const mainOps = extractOperations(mainSchema);
const loggingOps = extractOperations(loggingSchema);

console.log(`📊 Found ${mainOps.length} main operations and ${loggingOps.length} logging operations`);

validateDescriptions([...mainOps, ...loggingOps]);
validateParameters([...mainOps, ...loggingOps]);
validateResponseSchemas([...mainOps, ...loggingOps]);
validateFlags([...mainOps, ...loggingOps]);
validateImplementation(mainOps);
validateSchemaAlignment();

// Final report
console.log('\n📊 VALIDATION SUMMARY');
console.log('━'.repeat(80));

if (issues.length === 0) {
  console.log('🎉 NO ISSUES FOUND - All schemas are fully ChatGPT Actions ready!');
  console.log('✅ All operations have complete descriptions with trigger phrases');
  console.log('✅ All parameters have proper type and description definitions');
  console.log('✅ All operations have complete response schemas with error handling');
  console.log('✅ All flags are consistently applied and documented');
  console.log('✅ All operations are properly implemented');
  console.log('✅ Schemas are properly aligned with no conflicts');
} else {
  console.log(`⚠️  FOUND ${issues.length} CATEGORIES OF ISSUES:`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  console.log('\n💡 Use the provided GitHub Copilot prompt to address these issues systematically.');
}

console.log('\n📄 For detailed fixes, refer to the problem statement examples.');