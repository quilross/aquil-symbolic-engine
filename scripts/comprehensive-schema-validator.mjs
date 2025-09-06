#!/usr/bin/env node
/**
 * Comprehensive ChatGPT Actions Schema Validator
 * Validates schema completeness, consistency, and implementation alignment
 * Addresses all issues identified in the GitHub Copilot prompt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 COMPREHENSIVE CHATGPT ACTIONS SCHEMA VALIDATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Validation results tracking
const validationResults = {
  mainSchema: {
    operationCount: 0,
    missingDescriptions: [],
    missingTriggerPhrases: [],
    incompleteResponseSchemas: [],
    missingErrorResponses: [],
    inconsistentParameters: [],
    flagMismatches: []
  },
  loggingSchema: {
    operationCount: 0,
    schemaAlignmentIssues: [],
    missingEndpointDefinitions: [],
    inconsistentDataTypes: [],
    invalidRequestFormats: []
  },
  implementation: {
    missingImports: [],
    unimplementedOperations: [],
    implementationGaps: [],
    configurationIssues: [],
    errorHandlingIssues: []
  },
  overall: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

/**
 * Load and validate JSON schema files
 */
function loadSchema(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading schema ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract operations from OpenAPI schema
 */
function extractOperations(schema) {
  const operations = [];
  
  if (!schema.paths) {
    console.error('❌ Schema missing paths object');
    return operations;
  }
  
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
          'x-openai-isConsequential': methodData['x-openai-isConsequential'],
          triggerPhrases: extractTriggerPhrases(methodData.description)
        });
      }
    }
  }
  
  return operations;
}

/**
 * Extract trigger phrases from operation descriptions
 */
function extractTriggerPhrases(description) {
  if (!description) return [];
  
  const triggerMatch = description.match(/Triggers on:?\s*([^.]+)/i);
  if (triggerMatch) {
    return triggerMatch[1]
      .split(/[,;]/)
      .map(phrase => phrase.trim().replace(/['"]/g, ''))
      .filter(phrase => phrase.length > 0);
  }
  
  return [];
}

/**
 * Validate main schema operations for completeness
 */
function validateMainSchema(schema) {
  console.log('📋 VALIDATING MAIN SCHEMA (gpt-actions-schema.json)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const operations = extractOperations(schema);
  validationResults.mainSchema.operationCount = operations.length;
  
  console.log(`📊 Found ${operations.length} operations`);
  
  // Check 1: Missing descriptions
  const missingDescriptions = operations.filter(op => 
    !op.description || op.description.length < 30
  );
  
  if (missingDescriptions.length > 0) {
    validationResults.mainSchema.missingDescriptions = missingDescriptions.map(op => op.operationId);
    console.log(`❌ ${missingDescriptions.length} operations have insufficient descriptions:`);
    missingDescriptions.forEach(op => {
      console.log(`  - ${op.operationId}: "${op.description || 'MISSING'}"`);
    });
    validationResults.overall.failed++;
  } else {
    console.log('✅ All operations have adequate descriptions');
    validationResults.overall.passed++;
  }
  
  // Check 2: Missing trigger phrases
  const missingTriggerPhrases = operations.filter(op => 
    op.triggerPhrases.length === 0 && op['x-openai-autonomous']
  );
  
  if (missingTriggerPhrases.length > 0) {
    validationResults.mainSchema.missingTriggerPhrases = missingTriggerPhrases.map(op => op.operationId);
    console.log(`⚠️  ${missingTriggerPhrases.length} autonomous operations missing trigger phrases:`);
    missingTriggerPhrases.forEach(op => {
      console.log(`  - ${op.operationId}`);
    });
    validationResults.overall.warnings++;
  } else {
    console.log('✅ All autonomous operations have trigger phrases');
    validationResults.overall.passed++;
  }
  
  // Check 3: Incomplete response schemas
  const incompleteResponses = operations.filter(op => {
    const response200 = op.responses?.['200'];
    if (!response200) return true;
    
    const jsonSchema = response200.content?.['application/json']?.schema;
    if (!jsonSchema) return true;
    
    return !jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0;
  });
  
  if (incompleteResponses.length > 0) {
    validationResults.mainSchema.incompleteResponseSchemas = incompleteResponses.map(op => op.operationId);
    console.log(`❌ ${incompleteResponses.length} operations have incomplete response schemas:`);
    incompleteResponses.forEach(op => {
      console.log(`  - ${op.operationId}`);
    });
    validationResults.overall.failed++;
  } else {
    console.log('✅ All operations have complete response schemas');
    validationResults.overall.passed++;
  }
  
  // Check 4: Missing error responses
  const missingErrorResponses = operations.filter(op => {
    const responses = op.responses || {};
    return !responses['400'] && !responses['500'] && !responses.default;
  });
  
  if (missingErrorResponses.length > 0) {
    validationResults.mainSchema.missingErrorResponses = missingErrorResponses.map(op => op.operationId);
    console.log(`⚠️  ${missingErrorResponses.length} operations missing error response definitions:`);
    missingErrorResponses.forEach(op => {
      console.log(`  - ${op.operationId}`);
    });
    validationResults.overall.warnings++;
  } else {
    console.log('✅ All operations have error response handling');
    validationResults.overall.passed++;
  }
  
  // Check 5: Parameter validation
  const inconsistentParameters = operations.filter(op => {
    if (!op.requestBody?.content?.['application/json']?.schema?.properties) return false;
    
    const properties = op.requestBody.content['application/json'].schema.properties;
    return Object.values(properties).some(prop => 
      !prop.type || !prop.description
    );
  });
  
  if (inconsistentParameters.length > 0) {
    validationResults.mainSchema.inconsistentParameters = inconsistentParameters.map(op => op.operationId);
    console.log(`❌ ${inconsistentParameters.length} operations have inconsistent parameter definitions:`);
    inconsistentParameters.forEach(op => {
      console.log(`  - ${op.operationId}`);
    });
    validationResults.overall.failed++;
  } else {
    console.log('✅ All parameters have consistent type and description definitions');
    validationResults.overall.passed++;
  }
  
  // Check 6: Flag consistency
  const autonomousCount = operations.filter(op => op['x-openai-autonomous']).length;
  const consequentialCount = operations.filter(op => op['x-openai-isConsequential']).length;
  
  console.log(`📈 ${autonomousCount} operations marked as autonomous`);
  console.log(`⚡ ${consequentialCount} operations marked as consequential`);
  
  console.log();
}

/**
 * Validate logging schema alignment and completeness
 */
function validateLoggingSchema(loggingSchema, mainSchema) {
  console.log('📋 VALIDATING LOGGING SCHEMA (ark.actions.logging.json)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const loggingOps = extractOperations(loggingSchema);
  const mainOps = extractOperations(mainSchema);
  
  validationResults.loggingSchema.operationCount = loggingOps.length;
  
  console.log(`📊 Found ${loggingOps.length} logging operations`);
  
  // Check 1: Schema alignment
  const alignmentIssues = [];
  
  // Check if logging endpoints are properly defined
  const expectedLoggingEndpoints = ['/api/log', '/api/logs'];
  const missingEndpoints = expectedLoggingEndpoints.filter(endpoint => 
    !loggingSchema.paths?.[endpoint]
  );
  
  if (missingEndpoints.length > 0) {
    validationResults.loggingSchema.missingEndpointDefinitions = missingEndpoints;
    console.log(`❌ Missing required logging endpoints: ${missingEndpoints.join(', ')}`);
    validationResults.overall.failed++;
  } else {
    console.log('✅ All required logging endpoints are defined');
    validationResults.overall.passed++;
  }
  
  // Check 2: Request/Response format validation for logging endpoints
  const loggingEndpoints = ['/api/log', '/api/logs'];
  loggingEndpoints.forEach(endpoint => {
    const endpointDef = loggingSchema.paths?.[endpoint];
    if (endpointDef) {
      Object.keys(endpointDef).forEach(method => {
        const methodDef = endpointDef[method];
        if (method === 'post' && !methodDef.requestBody) {
          validationResults.loggingSchema.invalidRequestFormats.push(`${endpoint} ${method}`);
        }
        if (!methodDef.responses?.['200']) {
          validationResults.loggingSchema.invalidRequestFormats.push(`${endpoint} ${method} - missing 200 response`);
        }
      });
    }
  });
  
  if (validationResults.loggingSchema.invalidRequestFormats.length > 0) {
    console.log(`❌ Invalid request/response formats found:`);
    validationResults.loggingSchema.invalidRequestFormats.forEach(issue => {
      console.log(`  - ${issue}`);
    });
    validationResults.overall.failed++;
  } else {
    console.log('✅ All logging endpoint formats are valid');
    validationResults.overall.passed++;
  }
  
  // Check 3: Data type consistency in metadata
  const arkMetadata = loggingSchema['x-ark-metadata'];
  if (arkMetadata) {
    const requiredFields = ['stores', 'routes', 'enums', 'validation'];
    const missingFields = requiredFields.filter(field => !arkMetadata[field]);
    
    if (missingFields.length > 0) {
      validationResults.loggingSchema.inconsistentDataTypes = missingFields;
      console.log(`❌ Missing ark metadata fields: ${missingFields.join(', ')}`);
      validationResults.overall.failed++;
    } else {
      console.log('✅ All ark metadata fields are present');
      validationResults.overall.passed++;
    }
  }
  
  console.log();
}

/**
 * Validate implementation coverage and consistency
 */
function validateImplementation() {
  console.log('📋 VALIDATING IMPLEMENTATION (src/index.js)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const indexContent = fs.readFileSync(path.join(rootDir, 'src/index.js'), 'utf8');
    
    // Check 1: Import statements
    const imports = indexContent.match(/^import\s+.*$/gm) || [];
    console.log(`📦 Found ${imports.length} import statements`);
    
    // Check 2: Router endpoints
    const routerMatches = indexContent.match(/router\.(get|post|put|delete)\s*\(\s*["'][^"']+["']/g) || [];
    console.log(`🔗 Found ${routerMatches.length} router endpoints`);
    
    // Check 3: Error handling
    const tryBlocks = (indexContent.match(/try\s*{/g) || []).length;
    const catchBlocks = (indexContent.match(/catch\s*\(/g) || []).length;
    
    if (tryBlocks !== catchBlocks) {
      validationResults.implementation.errorHandlingIssues.push(`Mismatched try/catch blocks: ${tryBlocks} try, ${catchBlocks} catch`);
      console.log(`⚠️  Mismatched try/catch blocks: ${tryBlocks} try, ${catchBlocks} catch`);
      validationResults.overall.warnings++;
    } else {
      console.log(`✅ Proper error handling: ${tryBlocks} try/catch blocks`);
      validationResults.overall.passed++;
    }
    
    // Check 4: logChatGPTAction calls
    const logCalls = (indexContent.match(/logChatGPTAction/g) || []).length;
    console.log(`📝 Found ${logCalls} logging calls`);
    
    // Check 5: Export statement
    if (indexContent.includes('export default')) {
      console.log('✅ Proper default export found');
      validationResults.overall.passed++;
    } else {
      validationResults.implementation.configurationIssues.push('Missing default export');
      console.log('❌ Missing default export statement');
      validationResults.overall.failed++;
    }
    
  } catch (error) {
    console.error(`❌ Error reading index.js: ${error.message}`);
    validationResults.implementation.implementationGaps.push('Cannot read index.js file');
    validationResults.overall.failed++;
  }
  
  console.log();
}

/**
 * Generate comprehensive validation report
 */
function generateValidationReport() {
  console.log('📊 COMPREHENSIVE VALIDATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Summary statistics
  const totalChecks = validationResults.overall.passed + validationResults.overall.failed + validationResults.overall.warnings;
  console.log(`\n📈 VALIDATION SUMMARY:`);
  console.log(`   ✅ Passed: ${validationResults.overall.passed}/${totalChecks}`);
  console.log(`   ❌ Failed: ${validationResults.overall.failed}/${totalChecks}`);
  console.log(`   ⚠️  Warnings: ${validationResults.overall.warnings}/${totalChecks}`);
  
  // Main schema issues
  if (validationResults.mainSchema.missingDescriptions.length > 0 ||
      validationResults.mainSchema.incompleteResponseSchemas.length > 0 ||
      validationResults.mainSchema.inconsistentParameters.length > 0) {
    console.log(`\n❌ MAIN SCHEMA ISSUES:`);
    if (validationResults.mainSchema.missingDescriptions.length > 0) {
      console.log(`   - ${validationResults.mainSchema.missingDescriptions.length} operations with insufficient descriptions`);
    }
    if (validationResults.mainSchema.incompleteResponseSchemas.length > 0) {
      console.log(`   - ${validationResults.mainSchema.incompleteResponseSchemas.length} operations with incomplete response schemas`);
    }
    if (validationResults.mainSchema.inconsistentParameters.length > 0) {
      console.log(`   - ${validationResults.mainSchema.inconsistentParameters.length} operations with inconsistent parameters`);
    }
  }
  
  // Logging schema issues
  if (validationResults.loggingSchema.missingEndpointDefinitions.length > 0 ||
      validationResults.loggingSchema.invalidRequestFormats.length > 0) {
    console.log(`\n❌ LOGGING SCHEMA ISSUES:`);
    if (validationResults.loggingSchema.missingEndpointDefinitions.length > 0) {
      console.log(`   - Missing endpoints: ${validationResults.loggingSchema.missingEndpointDefinitions.join(', ')}`);
    }
    if (validationResults.loggingSchema.invalidRequestFormats.length > 0) {
      console.log(`   - ${validationResults.loggingSchema.invalidRequestFormats.length} invalid request/response formats`);
    }
  }
  
  // Implementation issues
  if (validationResults.implementation.errorHandlingIssues.length > 0 ||
      validationResults.implementation.configurationIssues.length > 0) {
    console.log(`\n❌ IMPLEMENTATION ISSUES:`);
    validationResults.implementation.errorHandlingIssues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
    validationResults.implementation.configurationIssues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }
  
  // Overall assessment
  const overallHealth = validationResults.overall.failed === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION';
  console.log(`\n🎯 OVERALL ASSESSMENT: ${overallHealth}`);
  
  if (overallHealth === 'HEALTHY') {
    console.log('✅ All critical validations passed. Schemas are ChatGPT Actions ready.');
  } else {
    console.log('⚠️  Some issues found. Please address the failed validations above.');
  }
  
  // Save report to file
  const reportPath = path.join(rootDir, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

/**
 * Main validation function
 */
async function runValidation() {
  // Load schemas
  const mainSchema = loadSchema(path.join(rootDir, 'gpt-actions-schema.json'));
  const loggingSchema = loadSchema(path.join(rootDir, 'config/ark.actions.logging.json'));
  
  if (!mainSchema || !loggingSchema) {
    console.error('❌ Failed to load required schemas');
    process.exit(1);
  }
  
  // Run validations
  validateMainSchema(mainSchema);
  validateLoggingSchema(loggingSchema, mainSchema);
  validateImplementation();
  
  // Generate report
  generateValidationReport();
  
  // Exit with appropriate code
  const hasFailures = validationResults.overall.failed > 0;
  process.exit(hasFailures ? 1 : 0);
}

// Run the validation
runValidation().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});