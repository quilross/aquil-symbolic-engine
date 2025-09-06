#!/usr/bin/env node
/**
 * Final Alignment Validation with Sample Payloads
 * Tests the most critical operations with realistic payloads
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Critical operations for ChatGPT integration
const criticalOperationTests = [
  {
    name: 'Core Logging',
    operationId: 'logDataOrEvent',
    path: '/api/log',
    method: 'POST',
    payload: {
      type: 'insight',
      who: 'user',
      level: 'significant',
      payload: {
        content: 'Breakthrough moment: I realized my fear of failure was holding me back',
        tags: ['breakthrough', 'fear', 'growth'],
        emotional_state: 'empowered'
      }
    }
  },
  {
    name: 'Trust Building',
    operationId: 'trustCheckIn',
    path: '/api/trust/check-in',
    method: 'POST',
    payload: {
      trust_level: 7,
      feedback: 'Working through self-doubt but feeling more grounded',
      areas_of_growth: ['self_compassion', 'decision_making']
    }
  },
  {
    name: 'Pattern Recognition',
    operationId: 'recognizePatterns',
    path: '/api/patterns/recognize',
    method: 'POST',
    payload: {
      data_type: 'behavioral_patterns',
      lookback_days: 14,
      pattern_type: 'emotional_triggers',
      context: 'work_relationships'
    }
  },
  {
    name: 'Commitment Management',
    operationId: 'manageCommitment',
    path: '/api/commitments/create',
    method: 'POST',
    payload: {
      action: 'create',
      commitment: 'Practice daily morning meditation for mental clarity',
      timeframe: '21 days',
      micro_practice: true
    }
  },
  {
    name: 'Wisdom Synthesis',
    operationId: 'synthesizeWisdom',
    path: '/api/wisdom/synthesize',
    method: 'POST',
    payload: {
      sources: ['recent_insights', 'patterns', 'breakthroughs'],
      timeframe: '7d',
      focus: 'personal_growth'
    }
  }
];

function validateSchemaDefinition(operationId, payload, schemaPath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  for (const [path, pathData] of Object.entries(schema.paths || {})) {
    for (const [method, methodData] of Object.entries(pathData)) {
      if (methodData.operationId === operationId) {
        const requestSchema = methodData.requestBody?.content?.['application/json']?.schema;
        
        if (!requestSchema) {
          return { valid: false, error: 'No request schema defined' };
        }
        
        // Validate required fields
        const errors = [];
        if (requestSchema.required) {
          for (const requiredField of requestSchema.required) {
            if (!(requiredField in payload)) {
              errors.push(`Missing required field: ${requiredField}`);
            }
          }
        }
        
        // Validate types (basic check)
        if (requestSchema.properties) {
          for (const [key, value] of Object.entries(payload)) {
            const propSchema = requestSchema.properties[key];
            if (propSchema && propSchema.type) {
              const expectedType = propSchema.type;
              const actualType = typeof value;
              
              if (expectedType === 'object' && actualType !== 'object') {
                errors.push(`${key}: expected object, got ${actualType}`);
              } else if (expectedType === 'string' && actualType !== 'string') {
                errors.push(`${key}: expected string, got ${actualType}`);
              } else if (expectedType === 'number' && actualType !== 'number') {
                errors.push(`${key}: expected number, got ${actualType}`);
              } else if (expectedType === 'boolean' && actualType !== 'boolean') {
                errors.push(`${key}: expected boolean, got ${actualType}`);
              }
            }
          }
        }
        
        return {
          valid: errors.length === 0,
          errors,
          hasRequestSchema: true,
          hasResponseSchema: !!methodData.responses?.['200']?.content?.['application/json']?.schema,
          isAutonomous: methodData['x-openai-autonomous'],
          isConsequential: methodData['x-openai-isConsequential']
        };
      }
    }
  }
  
  return { valid: false, error: 'Operation not found in schema' };
}

function validateBackendImplementation(operationId, endpointPath, method) {
  const indexPath = path.join(rootDir, 'src/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  const methodLower = method.toLowerCase();
  const escapedPath = endpointPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Check if endpoint exists
  const endpointPattern = new RegExp(`router\\.${methodLower}\\s*\\(\\s*["'\`]${escapedPath}["'\`]`);
  if (!endpointPattern.test(content)) {
    return { exists: false, error: 'Endpoint not found' };
  }
  
  // Check if operationId is logged
  const operationIdPattern = new RegExp(`logChatGPTAction\\s*\\([^,]+,\\s*["'\`]${operationId}["'\`]`);
  const hasCorrectLogging = operationIdPattern.test(content);
  
  // Check for error handling
  const errorHandlingPattern = new RegExp(
    `router\\.${methodLower}\\s*\\([^}]*${escapedPath}[^}]*catch\\s*\\([^}]*logChatGPTAction[^}]*error`,
    'g'
  );
  const hasErrorHandling = errorHandlingPattern.test(content);
  
  return {
    exists: true,
    hasCorrectLogging,
    hasErrorHandling
  };
}

function runFinalValidation() {
  console.log('🎯 FINAL SCHEMA-BACKEND ALIGNMENT VALIDATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
  const loggingSchemaPath = path.join(rootDir, 'config/ark.actions.logging.json');
  
  let totalTests = 0;
  let passedTests = 0;
  let schemaIssues = 0;
  let backendIssues = 0;
  
  const results = [];
  
  for (const test of criticalOperationTests) {
    totalTests++;
    console.log(`\n🔍 Testing ${test.name} (${test.operationId})...`);
    
    // Test schema validation
    let schemaValidation = validateSchemaDefinition(test.operationId, test.payload, mainSchemaPath);
    if (!schemaValidation.valid || schemaValidation.error) {
      schemaValidation = validateSchemaDefinition(test.operationId, test.payload, loggingSchemaPath);
    }
    
    // Test backend implementation
    const backendValidation = validateBackendImplementation(test.operationId, test.path, test.method);
    
    const result = {
      name: test.name,
      operationId: test.operationId,
      path: test.path,
      method: test.method,
      schema: schemaValidation,
      backend: backendValidation,
      overall: 'unknown'
    };
    
    // Schema validation results
    if (schemaValidation.valid) {
      console.log(`   ✅ Schema: Valid payload structure`);
      if (schemaValidation.hasResponseSchema) {
        console.log(`   ✅ Schema: Has response definition`);
      }
      if (schemaValidation.isAutonomous) {
        console.log(`   🤖 Schema: Marked as autonomous`);
      }
      if (schemaValidation.isConsequential) {
        console.log(`   ⚡ Schema: Marked as consequential`);
      }
    } else {
      schemaIssues++;
      console.log(`   ❌ Schema: ${schemaValidation.error || 'Validation failed'}`);
      if (schemaValidation.errors) {
        schemaValidation.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      }
    }
    
    // Backend validation results
    if (backendValidation.exists) {
      console.log(`   ✅ Backend: Endpoint exists`);
      if (backendValidation.hasCorrectLogging) {
        console.log(`   ✅ Backend: Correct operationId logging`);
      } else {
        console.log(`   ⚠️  Backend: Missing or incorrect operationId logging`);
        backendIssues++;
      }
      if (backendValidation.hasErrorHandling) {
        console.log(`   ✅ Backend: Has error handling with logging`);
      } else {
        console.log(`   ⚠️  Backend: Limited error handling`);
      }
    } else {
      backendIssues++;
      console.log(`   ❌ Backend: ${backendValidation.error}`);
    }
    
    // Overall assessment
    if (schemaValidation.valid && backendValidation.exists && backendValidation.hasCorrectLogging) {
      result.overall = 'perfect';
      passedTests++;
      console.log(`   🎯 Overall: PERFECT ALIGNMENT`);
    } else if (schemaValidation.valid && backendValidation.exists) {
      result.overall = 'good';
      passedTests++;
      console.log(`   ✅ Overall: GOOD (minor logging issue)`);
    } else {
      result.overall = 'failed';
      console.log(`   ❌ Overall: FAILED`);
    }
    
    results.push(result);
  }
  
  // Final summary
  console.log('\n📊 FINAL VALIDATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📈 CRITICAL OPERATIONS TEST RESULTS:`);
  console.log(`   Total Critical Operations: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (schemaIssues > 0) {
    console.log(`\n⚠️  Schema Issues: ${schemaIssues}`);
  }
  if (backendIssues > 0) {
    console.log(`\n⚠️  Backend Issues: ${backendIssues}`);
  }
  
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\n🎯 OVERALL ASSESSMENT:`);
  if (successRate === 100) {
    console.log(`   🎉 PERFECT - All critical operations are perfectly aligned!`);
  } else if (successRate >= 80) {
    console.log(`   ✅ EXCELLENT - Critical operations are well-aligned with minor issues`);
  } else if (successRate >= 60) {
    console.log(`   ⚠️  GOOD - Most critical operations work but some issues need attention`);
  } else {
    console.log(`   ❌ NEEDS WORK - Significant alignment issues found`);
  }
  
  // Save detailed results
  const reportPath = path.join(rootDir, 'final-alignment-validation.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: parseFloat(successRate.toFixed(1)),
      schemaIssues,
      backendIssues
    },
    results
  }, null, 2));
  
  console.log(`\n📄 Detailed validation report saved to: ${reportPath}`);
  
  return successRate >= 80;
}

// Run validation
try {
  const success = runFinalValidation();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Final validation failed:', error.message);
  process.exit(1);
}