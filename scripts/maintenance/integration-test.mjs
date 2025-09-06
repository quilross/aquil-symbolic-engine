#!/usr/bin/env node
/**
 * Integration Test Script for ChatGPT Actions
 * Tests the complete pipeline from schema validation to implementation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🧪 CHATGPT ACTIONS INTEGRATION TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test results tracking
const testResults = {
  schemaValidation: { passed: 0, failed: 0, warnings: 0 },
  operationCoverage: { passed: 0, failed: 0 },
  parameterValidation: { passed: 0, failed: 0 },
  responseSchemas: { passed: 0, failed: 0 },
  errorHandling: { passed: 0, failed: 0 },
  triggerPhrases: { passed: 0, failed: 0 }
};

/**
 * Test 1: Schema Validation
 */
async function testSchemaValidation() {
  console.log('🔍 TEST 1: Schema Validation');
  console.log('─'.repeat(50));
  
  try {
    // Load main schema
    const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    const mainSchema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));
    
    // Basic structure validation
    if (mainSchema.openapi && mainSchema.info && mainSchema.paths) {
      console.log('✅ Main schema has valid OpenAPI structure');
      testResults.schemaValidation.passed++;
    } else {
      console.log('❌ Main schema missing required OpenAPI fields');
      testResults.schemaValidation.failed++;
    }
    
    // Load logging schema
    const loggingSchemaPath = path.join(rootDir, 'config/ark.actions.logging.json');
    const loggingSchema = JSON.parse(fs.readFileSync(loggingSchemaPath, 'utf8'));
    
    if (loggingSchema.openapi && loggingSchema.info && loggingSchema.paths) {
      console.log('✅ Logging schema has valid OpenAPI structure');
      testResults.schemaValidation.passed++;
    } else {
      console.log('❌ Logging schema missing required OpenAPI fields');
      testResults.schemaValidation.failed++;
    }
    
    // Check operation count
    const mainOpsCount = Object.keys(mainSchema.paths).length;
    const loggingOpsCount = Object.keys(loggingSchema.paths).length;
    
    console.log(`📊 Main schema: ${mainOpsCount} endpoints`);
    console.log(`📊 Logging schema: ${loggingOpsCount} endpoints`);
    
    if (mainOpsCount > 0 && loggingOpsCount > 0) {
      console.log('✅ Both schemas have operational endpoints');
      testResults.schemaValidation.passed++;
    } else {
      console.log('❌ One or both schemas have no endpoints');
      testResults.schemaValidation.failed++;
    }
    
  } catch (error) {
    console.log(`❌ Schema validation failed: ${error.message}`);
    testResults.schemaValidation.failed++;
  }
  
  console.log();
}

/**
 * Test 2: Operation Coverage
 */
async function testOperationCoverage() {
  console.log('🔍 TEST 2: Operation Coverage');
  console.log('─'.repeat(50));
  
  try {
    const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    const mainSchema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));
    
    const indexPath = path.join(rootDir, 'src/index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    let operationsCovered = 0;
    let operationsMissing = 0;
    
    // Extract all operation IDs from schema
    for (const [path, pathData] of Object.entries(mainSchema.paths)) {
      for (const [method, operation] of Object.entries(pathData)) {
        if (operation.operationId) {
          // Check if operation is referenced in index.js
          if (indexContent.includes(operation.operationId) || 
              indexContent.includes(path.replace(/\/api\//, ''))) {
            operationsCovered++;
          } else {
            operationsMissing++;
            console.log(`⚠️  Operation ${operation.operationId} may not be implemented`);
          }
        }
      }
    }
    
    console.log(`✅ ${operationsCovered} operations appear to be implemented`);
    if (operationsMissing > 0) {
      console.log(`⚠️  ${operationsMissing} operations may be missing implementation`);
      testResults.operationCoverage.warnings = operationsMissing;
    }
    
    testResults.operationCoverage.passed = operationsCovered;
    testResults.operationCoverage.failed = operationsMissing;
    
  } catch (error) {
    console.log(`❌ Operation coverage test failed: ${error.message}`);
    testResults.operationCoverage.failed++;
  }
  
  console.log();
}

/**
 * Test 3: Parameter Validation
 */
async function testParameterValidation() {
  console.log('🔍 TEST 3: Parameter Validation');
  console.log('─'.repeat(50));
  
  try {
    const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    const mainSchema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));
    
    let validParameters = 0;
    let invalidParameters = 0;
    
    for (const [path, pathData] of Object.entries(mainSchema.paths)) {
      for (const [method, operation] of Object.entries(pathData)) {
        if (operation.operationId && operation.requestBody?.content?.['application/json']?.schema?.properties) {
          const properties = operation.requestBody.content['application/json'].schema.properties;
          
          for (const [paramName, paramDef] of Object.entries(properties)) {
            if (paramDef.type && paramDef.description) {
              validParameters++;
            } else {
              invalidParameters++;
            }
          }
        }
      }
    }
    
    console.log(`✅ ${validParameters} parameters have proper type and description`);
    if (invalidParameters > 0) {
      console.log(`❌ ${invalidParameters} parameters missing type or description`);
    }
    
    testResults.parameterValidation.passed = validParameters;
    testResults.parameterValidation.failed = invalidParameters;
    
  } catch (error) {
    console.log(`❌ Parameter validation test failed: ${error.message}`);
    testResults.parameterValidation.failed++;
  }
  
  console.log();
}

/**
 * Test 4: Response Schema Validation
 */
async function testResponseSchemas() {
  console.log('🔍 TEST 4: Response Schema Validation');
  console.log('─'.repeat(50));
  
  try {
    const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    const mainSchema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));
    
    let validResponses = 0;
    let invalidResponses = 0;
    let errorResponses = 0;
    
    for (const [path, pathData] of Object.entries(mainSchema.paths)) {
      for (const [method, operation] of Object.entries(pathData)) {
        if (operation.operationId && operation.responses) {
          // Check 200 response
          if (operation.responses['200']?.content?.['application/json']?.schema) {
            validResponses++;
          } else {
            invalidResponses++;
          }
          
          // Check error responses
          if (operation.responses['400'] || operation.responses['500']) {
            errorResponses++;
          }
        }
      }
    }
    
    console.log(`✅ ${validResponses} operations have valid 200 response schemas`);
    console.log(`✅ ${errorResponses} operations have error response schemas`);
    if (invalidResponses > 0) {
      console.log(`❌ ${invalidResponses} operations missing valid response schemas`);
    }
    
    testResults.responseSchemas.passed = validResponses;
    testResults.responseSchemas.failed = invalidResponses;
    testResults.errorHandling.passed = errorResponses;
    
  } catch (error) {
    console.log(`❌ Response schema test failed: ${error.message}`);
    testResults.responseSchemas.failed++;
  }
  
  console.log();
}

/**
 * Test 5: Trigger Phrases Validation
 */
async function testTriggerPhrases() {
  console.log('🔍 TEST 5: Trigger Phrases Validation');
  console.log('─'.repeat(50));
  
  try {
    const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    const mainSchema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));
    
    let autonomousOps = 0;
    let autonomousWithTriggers = 0;
    
    for (const [path, pathData] of Object.entries(mainSchema.paths)) {
      for (const [method, operation] of Object.entries(pathData)) {
        if (operation.operationId && operation['x-openai-autonomous']) {
          autonomousOps++;
          
          if (operation.description?.includes('Triggers on:')) {
            autonomousWithTriggers++;
          }
        }
      }
    }
    
    console.log(`📊 ${autonomousOps} operations marked as autonomous`);
    console.log(`✅ ${autonomousWithTriggers} autonomous operations have trigger phrases`);
    
    const missing = autonomousOps - autonomousWithTriggers;
    if (missing > 0) {
      console.log(`⚠️  ${missing} autonomous operations missing trigger phrases`);
    }
    
    testResults.triggerPhrases.passed = autonomousWithTriggers;
    testResults.triggerPhrases.failed = missing;
    
  } catch (error) {
    console.log(`❌ Trigger phrases test failed: ${error.message}`);
    testResults.triggerPhrases.failed++;
  }
  
  console.log();
}

/**
 * Generate integration test report
 */
function generateIntegrationReport() {
  console.log('📊 INTEGRATION TEST REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const totalTests = Object.keys(testResults).length;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const testPassed = result.failed === 0;
    if (testPassed) passedTests++;
    else failedTests++;
    
    const status = testPassed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${result.passed} passed, ${result.failed} failed`);
  }
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   Tests passed: ${passedTests}/${totalTests}`);
  console.log(`   Tests failed: ${failedTests}/${totalTests}`);
  
  const overallSuccess = failedTests === 0;
  console.log(`\n🎯 INTEGRATION STATUS: ${overallSuccess ? 'SUCCESS' : 'NEEDS_ATTENTION'}`);
  
  if (overallSuccess) {
    console.log('✅ All integration tests passed. ChatGPT Actions are ready for deployment.');
  } else {
    console.log('⚠️  Some integration tests failed. Please review the issues above.');
  }
  
  // Save detailed report
  const reportPath = path.join(rootDir, 'integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return overallSuccess;
}

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  await testSchemaValidation();
  await testOperationCoverage();
  await testParameterValidation();
  await testResponseSchemas();
  await testTriggerPhrases();
  
  const success = generateIntegrationReport();
  process.exit(success ? 0 : 1);
}

// Run the integration tests
runIntegrationTests().catch(error => {
  console.error('❌ Integration tests failed:', error);
  process.exit(1);
});