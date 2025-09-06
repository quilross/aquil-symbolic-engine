#!/usr/bin/env node
/**
 * Sample Payload Validation Script
 * Tests schema definitions against backend implementation with sample payloads
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Sample payloads for testing common operations
const samplePayloads = {
  // Core logging operations
  logDataOrEvent: {
    path: '/api/log',
    method: 'POST',
    payload: {
      type: 'insight',
      who: 'user',
      level: 'significant',
      payload: {
        content: 'I realized that my morning routine affects my entire day',
        tags: ['routine', 'insights', 'wellbeing'],
        emotional_state: 'reflective'
      }
    }
  },
  
  // Personal growth operations
  somaticHealingSession: {
    path: '/api/somatic/session',
    method: 'POST',
    payload: {
      intention: 'Release tension and stress from the work week',
      duration_minutes: 20,
      focus_area: 'shoulders_and_neck',
      guided: true
    }
  },
  
  // Pattern recognition
  recognizePatterns: {
    path: '/api/patterns/recognize',
    method: 'POST',
    payload: {
      data_type: 'emotional_patterns',
      lookback_days: 30,
      pattern_type: 'trigger_response',
      context: 'work_stress'
    }
  },
  
  // Commitment management
  manageCommitment: {
    path: '/api/commitments/create',
    method: 'POST',
    payload: {
      action: 'create',
      commitment: 'Practice mindful breathing for 5 minutes each morning',
      timeframe: '30 days',
      micro_practice: true
    }
  },
  
  // Trust check-in
  trustCheckIn: {
    path: '/api/trust/check-in',
    method: 'POST',
    payload: {
      trust_level: 8,
      feedback: 'Feeling more confident in my ability to handle challenges',
      areas_of_growth: ['emotional_regulation', 'self_compassion']
    }
  }
};

/**
 * Validate payload against schema definition
 */
function validateAgainstSchema(operationId, payload, schemaPath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  // Find the operation in schema
  for (const [path, pathData] of Object.entries(schema.paths || {})) {
    for (const [method, methodData] of Object.entries(pathData)) {
      if (methodData.operationId === operationId) {
        const requestSchema = methodData.requestBody?.content?.['application/json']?.schema;
        if (!requestSchema) {
          return { valid: false, error: 'No request schema defined' };
        }
        
        // Basic validation
        const validationErrors = [];
        
        // Check required properties
        if (requestSchema.required) {
          for (const requiredProp of requestSchema.required) {
            if (!(requiredProp in payload)) {
              validationErrors.push(`Missing required property: ${requiredProp}`);
            }
          }
        }
        
        // Check property types
        if (requestSchema.properties) {
          for (const [propName, propValue] of Object.entries(payload)) {
            const propSchema = requestSchema.properties[propName];
            if (propSchema) {
              const expectedType = propSchema.type;
              const actualType = typeof propValue;
              
              if (expectedType === 'object' && actualType !== 'object') {
                validationErrors.push(`Property ${propName}: expected object, got ${actualType}`);
              } else if (expectedType === 'string' && actualType !== 'string') {
                validationErrors.push(`Property ${propName}: expected string, got ${actualType}`);
              } else if (expectedType === 'number' && actualType !== 'number') {
                validationErrors.push(`Property ${propName}: expected number, got ${actualType}`);
              } else if (expectedType === 'boolean' && actualType !== 'boolean') {
                validationErrors.push(`Property ${propName}: expected boolean, got ${actualType}`);
              }
            }
          }
        }
        
        return {
          valid: validationErrors.length === 0,
          errors: validationErrors,
          schema: requestSchema
        };
      }
    }
  }
  
  return { valid: false, error: 'Operation not found in schema' };
}

/**
 * Check if backend endpoint exists and matches expected signature
 */
function validateBackendEndpoint(operationId, endpointPath, method) {
  const indexPath = path.join(rootDir, 'src/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Look for the specific endpoint
  const methodLower = method.toLowerCase();
  const endpointPattern = new RegExp(`router\\.${methodLower}\\s*\\(\\s*["'\`]${endpointPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\`]`, 'g');
  const endpointMatch = content.match(endpointPattern);
  
  if (!endpointMatch) {
    return { exists: false, error: `Endpoint ${method} ${endpointPath} not found in backend` };
  }
  
  // Look for operationId in the handler
  const contextPattern = new RegExp(`router\\.${methodLower}\\s*\\([^)]*${endpointPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^}]*logChatGPTAction[^}]*`, 'g');
  const contextMatch = content.match(contextPattern);
  
  if (contextMatch) {
    const logPattern = /logChatGPTAction\s*\([^,]+,\s*["'`]([^"'`]+)["'`]/;
    const logMatch = contextMatch[0].match(logPattern);
    const backendOperationId = logMatch ? logMatch[1] : null;
    
    return {
      exists: true,
      operationId: backendOperationId,
      matches: backendOperationId === operationId
    };
  }
  
  return { exists: true, operationId: null, matches: false };
}

/**
 * Run comprehensive payload validation tests
 */
function runPayloadValidationTests() {
  console.log('🧪 SAMPLE PAYLOAD VALIDATION TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
  const loggingSchemaPath = path.join(rootDir, 'config/ark.actions.logging.json');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  const testResults = [];
  
  for (const [operationId, testCase] of Object.entries(samplePayloads)) {
    totalTests++;
    console.log(`\n🔍 Testing ${operationId}...`);
    console.log(`   Path: ${testCase.method} ${testCase.path}`);
    
    const result = {
      operationId,
      path: testCase.path,
      method: testCase.method,
      schemaValidation: { valid: false },
      backendValidation: { exists: false },
      overallStatus: 'FAILED'
    };
    
    // Test against main schema first, then logging schema
    let schemaValidation = validateAgainstSchema(operationId, testCase.payload, mainSchemaPath);
    if (!schemaValidation.valid || schemaValidation.error) {
      schemaValidation = validateAgainstSchema(operationId, testCase.payload, loggingSchemaPath);
    }
    
    result.schemaValidation = schemaValidation;
    
    if (schemaValidation.valid) {
      console.log(`   ✅ Schema validation: PASSED`);
    } else {
      console.log(`   ❌ Schema validation: FAILED`);
      if (schemaValidation.errors) {
        schemaValidation.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      } else {
        console.log(`      - ${schemaValidation.error}`);
      }
    }
    
    // Test backend endpoint
    const backendValidation = validateBackendEndpoint(operationId, testCase.path, testCase.method);
    result.backendValidation = backendValidation;
    
    if (backendValidation.exists) {
      console.log(`   ✅ Backend endpoint: EXISTS`);
      if (backendValidation.operationId) {
        if (backendValidation.matches) {
          console.log(`   ✅ OperationId match: PASSED (${backendValidation.operationId})`);
        } else {
          console.log(`   ❌ OperationId match: FAILED (expected: ${operationId}, got: ${backendValidation.operationId})`);
        }
      } else {
        console.log(`   ⚠️  OperationId: NOT DETECTED`);
      }
    } else {
      console.log(`   ❌ Backend endpoint: NOT FOUND`);
      console.log(`      - ${backendValidation.error}`);
    }
    
    // Overall status
    if (schemaValidation.valid && backendValidation.exists && 
        (backendValidation.matches || !backendValidation.operationId)) {
      result.overallStatus = 'PASSED';
      passedTests++;
      console.log(`   🎯 Overall: PASSED`);
    } else {
      result.overallStatus = 'FAILED';
      failedTests++;
      console.log(`   💥 Overall: FAILED`);
    }
    
    testResults.push(result);
  }
  
  // Summary
  console.log('\n📊 PAYLOAD VALIDATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📈 RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log(`\n❌ FAILED OPERATIONS:`);
    testResults.filter(r => r.overallStatus === 'FAILED').forEach(result => {
      console.log(`   - ${result.operationId} (${result.method} ${result.path})`);
    });
  }
  
  // Save detailed results
  const reportPath = path.join(rootDir, 'payload-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: ((passedTests / totalTests) * 100)
    },
    results: testResults
  }, null, 2));
  
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  return failedTests === 0;
}

/**
 * Main execution
 */
function main() {
  try {
    const allPassed = runPayloadValidationTests();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error during payload validation:', error.message);
    process.exit(1);
  }
}

main();