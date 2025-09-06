#!/usr/bin/env node

/**
 * 🚀 **Comprehensive Schema vs. Code Synchronization Audit**
 * 
 * This tool performs a comprehensive audit of the OpenAPI schema vs. code synchronization,
 * behavioral engine integration, fail-open behavior, and Custom GPT functional checks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Load operation aliases module
let toCanonical, getAllCanonical, getAllAliases;
try {
  const aliases = await import(path.join(rootDir, 'backend/ops/operation-aliases.js'));
  toCanonical = aliases.toCanonical;
  getAllCanonical = aliases.getAllCanonical;
  getAllAliases = aliases.getAllAliases;
} catch (error) {
  console.error('❌ Failed to load operation aliases:', error.message);
  process.exit(1);
}

/**
 * Audit Results Structure
 */
const auditResults = {
  schemaConsistency: {
    operationCount: 0,
    expectedCount: 30,
    missingInCode: [],
    extraInCode: [],
    aliasIssues: [],
    parameterMismatches: [],
    responseMismatches: []
  },
  behavioralEngine: {
    engineIntegration: [],
    voiceSelection: [],
    pressingLogic: [],
    loggingIssues: [],
    endpointIntegration: []
  },
  failOpenBehavior: {
    unguardedOperations: [],
    missingDefaults: [],
    healthCheckIssues: []
  },
  functionalChecks: {
    unimplementedOperations: [],
    dynamicFeatures: [],
    progressiveEnhancement: []
  }
};

/**
 * 1. OpenAPI Spec & Handlers Consistency Check
 */
async function checkSchemaConsistency() {
  console.log(colorize('\n🔍 1. OPENAPI SPEC & HANDLERS CONSISTENCY', 'cyan'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Load schema
  const schemaPath = path.join(rootDir, 'config/gpt-actions-schema.json');
  if (!fs.existsSync(schemaPath)) {
    console.log(colorize('❌ config/gpt-actions-schema.json not found', 'red'));
    return;
  }
  
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  // Extract operation IDs from schema
  const schemaOperations = [];
  const operationDetails = new Map();
  
  for (const [path, methods] of Object.entries(schema.paths || {})) {
    for (const [method, spec] of Object.entries(methods)) {
      if (spec.operationId) {
        schemaOperations.push(spec.operationId);
        operationDetails.set(spec.operationId, {
          path,
          method: method.toUpperCase(),
          summary: spec.summary,
          description: spec.description,
          parameters: spec.parameters || [],
          requestBody: spec.requestBody,
          responses: spec.responses,
          headers: []
        });
        
        // Extract headers from requestBody
        if (spec.requestBody?.content?.['application/json']?.examples) {
          const examples = spec.requestBody.content['application/json'].examples;
          if (examples && typeof examples === 'object') {
            // Check for Idempotency-Key in headers
            operationDetails.get(spec.operationId).headers.push('Idempotency-Key');
          }
        }
      }
    }
  }
  
  auditResults.schemaConsistency.operationCount = schemaOperations.length;
  
  console.log(`📊 Found ${colorize(schemaOperations.length, 'bold')} operations in schema`);
  
  // Check for exactly 30 operations
  if (schemaOperations.length !== 30) {
    console.log(colorize(`❌ Expected exactly 30 operations, found ${schemaOperations.length}`, 'red'));
  } else {
    console.log(colorize('✅ Operation count is correct (30)', 'green'));
  }
  
  // Find implemented operations in code
  const implementedOps = await findImplementedOperations();
  console.log(`📊 Found ${colorize(implementedOps.size, 'bold')} implemented operations in code`);
  
  // Convert to canonical form
  const canonicalImplemented = new Set();
  const validOperations = new Set([...getAllCanonical(), ...getAllAliases()]);
  
  for (const op of implementedOps) {
    if (validOperations.has(op)) {
      canonicalImplemented.add(toCanonical(op));
    }
  }
  
  // Compare schema vs implemented
  const schemaOpsSet = new Set(schemaOperations);
  const missingInCode = [...schemaOpsSet].filter(op => !canonicalImplemented.has(op));
  const extraInCode = [...canonicalImplemented].filter(op => !schemaOpsSet.has(op));
  
  auditResults.schemaConsistency.missingInCode = missingInCode;
  auditResults.schemaConsistency.extraInCode = extraInCode;
  
  if (missingInCode.length > 0) {
    console.log(colorize('\n⚠️  DESYNCHRONIZED OPERATIONS:', 'yellow'));
    missingInCode.forEach(op => {
      const details = operationDetails.get(op);
      console.log(colorize(`  ❌ ${op}`, 'red') + ` - defined in schema but no handler found`);
      if (details) {
        console.log(`      ${details.method} ${details.path} - ${details.summary}`);
        console.log(colorize(`      📝 Suggestion: Add handler function for ${op} or remove from schema`, 'yellow'));
      }
    });
  }
  
  if (extraInCode.length > 0) {
    console.log(colorize('\n❌ EXTRA OPERATIONS IN CODE:', 'red'));
    extraInCode.forEach(op => {
      console.log(colorize(`  ❌ ${op}`, 'red') + ` - implemented but missing from schema`);
    });
  }
  
  // Check parameter and response alignment
  await checkParameterAlignment(operationDetails, canonicalImplemented);
}

/**
 * Find all implemented operations by scanning code for logChatGPTAction calls
 */
async function findImplementedOperations() {
  const implementedOps = new Set();
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/logChatGPTAction\([^,]+,\s*['\"`]([^'\"`]+)['\"`]/g) || [];
      matches.forEach(match => {
        const opId = match.match(/['\"`]([^'\"`]+)['\"`]/)?.[1];
        if (opId) implementedOps.add(opId);
      });
    } catch (error) {
      // Ignore read errors
    }
  }
  
  function scanDirectory(dir, extensions = ['.js', '.mjs']) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, extensions);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory(path.join(rootDir, 'src'));
  return implementedOps;
}

/**
 * Check parameter and response alignment between schema and implementation
 */
async function checkParameterAlignment(operationDetails, implementedOps) {
  console.log(colorize('\n🔍 Parameter & Response Alignment Check:', 'blue'));
  
  const issues = [];
  
  for (const opId of implementedOps) {
    const details = operationDetails.get(opId);
    if (!details) continue;
    
    // Check for Idempotency-Key header usage
    if (details.method === 'POST' || details.method === 'PUT') {
      const hasIdempotencySpec = details.headers.includes('Idempotency-Key');
      const handlerUsesIdempotency = await checkIdempotencyUsage(opId);
      
      if (hasIdempotencySpec && !handlerUsesIdempotency) {
        issues.push({
          operation: opId,
          type: 'header_mismatch',
          issue: 'Spec defines Idempotency-Key header but handler does not use it'
        });
      }
    }
  }
  
  auditResults.schemaConsistency.parameterMismatches = issues;
  
  if (issues.length > 0) {
    console.log(colorize('⚠️  Parameter/Header Mismatches Found:', 'yellow'));
    issues.forEach(issue => {
      console.log(`  ❌ ${issue.operation}: ${issue.issue}`);
    });
  } else {
    console.log(colorize('✅ No parameter/header mismatches found', 'green'));
  }
}

/**
 * Check if a handler uses idempotency
 */
async function checkIdempotencyUsage(operationId) {
  try {
    const indexPath = path.join(rootDir, 'backend/index.js');
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Look for idempotency-related code near the operation
    const opPattern = new RegExp(`logChatGPTAction\\([^,]+,\\s*['\"\`]${operationId}['\"\`]`, 'g');
    const matches = [...content.matchAll(opPattern)];
    
    if (matches.length > 0) {
      const match = matches[0];
      const startIndex = Math.max(0, match.index - 500);
      const endIndex = Math.min(content.length, match.index + 500);
      const context = content.substring(startIndex, endIndex);
      
      return context.includes('idempotency') || context.includes('Idempotency-Key');
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 2. Behavioral Engine Integration Check
 */
async function checkBehavioralEngineIntegration() {
  console.log(colorize('\n🧠 2. BEHAVIORAL ENGINE INTEGRATION', 'cyan'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check if behavioral engine files exist and analyze their intent
  const engineFiles = [
    { file: 'backend/agent/engine.js', module: 'Behavioral Engine' },
    { file: 'backend/agent/voice.js', module: 'Voice Selector' },
    { file: 'backend/agent/pressing.js', module: 'Pressing Engine' }
  ];
  
  for (const { file, module } of engineFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      console.log(colorize(`✅ ${module} found: ${file}`, 'green'));
      await analyzeEngineModule(filePath, module);
    } else {
      console.log(colorize(`❌ ${module} missing: ${file}`, 'red'));
      auditResults.behavioralEngine.engineIntegration.push({
        module,
        issue: 'File not found',
        suggestion: `Create ${file} with behavioral logic`
      });
    }
  }
  
  // Check endpoint integration with behavioral engine
  await checkEndpointEngineIntegration();
  
  // Check logging compliance
  await checkLoggingCompliance();
}

/**
 * Analyze behavioral engine module for intent vs implementation
 */
async function analyzeEngineModule(filePath, moduleName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract top comments to understand intended behavior
    const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    const topComment = commentMatch ? commentMatch[0] : '';
    
    console.log(colorize(`📄 ${moduleName} Intent Analysis:`, 'blue'));
    
    if (topComment) {
      const lines = topComment.split('\n').slice(1, -1).map(line => line.replace(/^\s*\*\s?/, '').trim()).filter(line => line);
      lines.slice(0, 3).forEach(line => {
        console.log(`  📝 ${line}`);
      });
    }
    
    // Check for specific functionality based on module
    if (moduleName === 'Voice Selector') {
      checkVoiceSelectionLogic(content);
    } else if (moduleName === 'Pressing Engine') {
      checkPressingLogic(content);
    } else if (moduleName === 'Behavioral Engine') {
      checkMainEngineLogic(content);
    }
    
  } catch (error) {
    console.log(colorize(`⚠️  Failed to analyze ${moduleName}: ${error.message}`, 'yellow'));
  }
}

/**
 * Check voice selection logic
 */
function checkVoiceSelectionLogic(content) {
  const voices = ['mirror', 'oracle', 'scientist', 'strategist'];
  const foundVoices = voices.filter(voice => content.includes(`'${voice}'`) || content.includes(`"${voice}"`));
  
  if (foundVoices.length === voices.length) {
    console.log(colorize(`  ✅ All voice types implemented: ${foundVoices.join(', ')}`, 'green'));
  } else {
    const missing = voices.filter(v => !foundVoices.includes(v));
    console.log(colorize(`  ⚠️  Missing voice types: ${missing.join(', ')}`, 'yellow'));
    auditResults.behavioralEngine.voiceSelection.push({
      issue: 'Missing voice types',
      missing: missing
    });
  }
  
  // Check for avoidance cues
  if (content.includes('avoidance') || content.includes('overwhelm')) {
    console.log(colorize(`  ✅ Avoidance/overwhelm detection implemented`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No avoidance/overwhelm detection found`, 'yellow'));
  }
}

/**
 * Check pressing logic
 */
function checkPressingLogic(content) {
  const hasEscalation = content.includes('pressLevel') && (content.includes('+ 1') || content.includes('++'));
  const hasDeescalation = content.includes('pressLevel') && (content.includes('- 1') || content.includes('--'));
  const hasOverwhelm = content.includes('overwhelm');
  
  if (hasEscalation && hasDeescalation) {
    console.log(colorize(`  ✅ Press level escalation/de-escalation logic found`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  Missing press level adjustment logic`, 'yellow'));
    auditResults.behavioralEngine.pressingLogic.push({
      issue: 'Missing escalation/de-escalation logic'
    });
  }
  
  if (hasOverwhelm) {
    console.log(colorize(`  ✅ Overwhelm detection integrated`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No overwhelm detection found`, 'yellow'));
  }
}

/**
 * Check main engine logic
 */
function checkMainEngineLogic(content) {
  const hasRunEngine = content.includes('runEngine') || content.includes('export async function runEngine');
  const hasVoiceIntegration = content.includes('selectVoice');
  const hasPressingIntegration = content.includes('nextPressLevel') || content.includes('pressLevel');
  const hasQuestionGeneration = content.includes('questions') || content.includes('generateQuestions');
  
  if (hasRunEngine) {
    console.log(colorize(`  ✅ Main engine function found`, 'green'));
  } else {
    console.log(colorize(`  ❌ Main engine function missing`, 'red'));
  }
  
  if (hasVoiceIntegration && hasPressingIntegration) {
    console.log(colorize(`  ✅ Voice and pressing integration found`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  Missing voice or pressing integration`, 'yellow'));
  }
  
  if (hasQuestionGeneration) {
    console.log(colorize(`  ✅ Question generation capability found`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No question generation found`, 'yellow'));
  }
}

/**
 * Check endpoint integration with behavioral engine
 */
async function checkEndpointEngineIntegration() {
  console.log(colorize('\n🔗 Endpoint Engine Integration Check:', 'blue'));
  
  const indexPath = path.join(rootDir, 'backend/index.js');
  if (!fs.existsSync(indexPath)) {
    console.log(colorize('❌ Main index.js not found', 'red'));
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Check specific endpoints that should use the engine
  const engineEndpoints = [
    { path: '/api/discovery/generate-inquiry', operation: 'generateDiscoveryInquiry' },
    { path: '/api/patterns/recognize', operation: 'recognizePatterns' },
    { path: '/api/somatic/session', operation: 'somaticHealingSession' }
  ];
  
  for (const endpoint of engineEndpoints) {
    const hasEngine = content.includes('runEngine') && content.includes(endpoint.operation);
    if (hasEngine) {
      console.log(colorize(`  ✅ ${endpoint.path} integrates with behavioral engine`, 'green'));
    } else {
      console.log(colorize(`  ⚠️  ${endpoint.path} does not use behavioral engine`, 'yellow'));
      auditResults.behavioralEngine.endpointIntegration.push({
        endpoint: endpoint.path,
        operation: endpoint.operation,
        issue: 'Does not integrate with behavioral engine'
      });
    }
  }
}

/**
 * Check logging compliance with metamorphic_logs schema
 */
async function checkLoggingCompliance() {
  console.log(colorize('\n📊 Logging Compliance Check:', 'blue'));
  
  const indexPath = path.join(rootDir, 'backend/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Check for proper logChatGPTAction usage
  const logCalls = content.match(/logChatGPTAction\([^)]+\)/g) || [];
  
  if (logCalls.length > 0) {
    console.log(colorize(`  ✅ Found ${logCalls.length} logChatGPTAction calls`, 'green'));
    
    // Check if canonical operation IDs are used
    const canonicalUsage = content.includes('toCanonical');
    if (canonicalUsage) {
      console.log(colorize(`  ✅ Canonical operation ID normalization found`, 'green'));
    } else {
      console.log(colorize(`  ⚠️  No canonical operation ID normalization found`, 'yellow'));
    }
    
    // Check for proper tagging
    const hasTagging = content.includes('standardTags') || content.includes('tags:');
    if (hasTagging) {
      console.log(colorize(`  ✅ Proper tagging system found`, 'green'));
    } else {
      console.log(colorize(`  ⚠️  No proper tagging system found`, 'yellow'));
    }
    
    // Check for stores array updates
    const hasStoresUpdate = content.includes('stores') && content.includes('array');
    if (hasStoresUpdate) {
      console.log(colorize(`  ✅ Stores array tracking found`, 'green'));
    } else {
      console.log(colorize(`  ⚠️  No stores array tracking found`, 'yellow'));
    }
    
  } else {
    console.log(colorize(`  ❌ No logChatGPTAction calls found`, 'red'));
    auditResults.behavioralEngine.loggingIssues.push({
      issue: 'No logChatGPTAction calls found'
    });
  }
}

/**
 * 3. Fail-Open Behavior Check
 */
async function checkFailOpenBehavior() {
  console.log(colorize('\n🛡️  3. FAIL-OPEN BEHAVIOR CHECK', 'cyan'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const files = [
    'backend/index.js',
    'backend/agent/engine.js',
    'backend/utils/metrics.js'
  ];
  
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      await analyzeFailOpenBehavior(filePath, file);
    }
  }
  
  await checkHealthEndpoints();
}

/**
 * Analyze file for fail-open behavior
 */
async function analyzeFailOpenBehavior(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(colorize(`\n🔍 Analyzing ${fileName}:`, 'blue'));
  
  // Check for try-catch blocks around optional features
  const tryCatchBlocks = (content.match(/try\s*{[\s\S]*?}\s*catch/g) || []).length;
  if (tryCatchBlocks > 0) {
    console.log(colorize(`  ✅ Found ${tryCatchBlocks} try-catch blocks`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No try-catch blocks found`, 'yellow'));
  }
  
  // Check for fail-open patterns
  const failOpenPatterns = [
    'fail-open',
    'fail open',
    'continue with default',
    'fallback',
    'default behavior',
    'silently fail',
    'ignore error'
  ];
  
  const foundPatterns = failOpenPatterns.filter(pattern => 
    content.toLowerCase().includes(pattern)
  );
  
  if (foundPatterns.length > 0) {
    console.log(colorize(`  ✅ Fail-open patterns found: ${foundPatterns.join(', ')}`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No explicit fail-open patterns found`, 'yellow'));
  }
  
  // Check for environment variable defaults
  const envDefaults = content.match(/env\.[A-Z_]+\s*\|\|\s*['"][^'"]*['"]/g) || [];
  if (envDefaults.length > 0) {
    console.log(colorize(`  ✅ Found ${envDefaults.length} environment variable defaults`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No environment variable defaults found`, 'yellow'));
  }
  
  // Check for missing store handling
  const storeChecks = [
    'AQUIL_DB',
    'AQUIL_MEMORIES', 
    'AQUIL_STORAGE',
    'AQUIL_CONTEXT'
  ];
  
  const hasStoreChecks = storeChecks.some(store => 
    content.includes(`env.${store}`) && content.includes('if')
  );
  
  if (hasStoreChecks) {
    console.log(colorize(`  ✅ Store availability checks found`, 'green'));
  } else {
    console.log(colorize(`  ⚠️  No store availability checks found`, 'yellow'));
  }
}

/**
 * Check health endpoints for fail-open behavior
 */
async function checkHealthEndpoints() {
  console.log(colorize('\n🏥 Health Endpoint Check:', 'blue'));
  
  const indexPath = path.join(rootDir, 'backend/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Look for health check endpoints
  const healthEndpoints = [
    '/api/system/health-check',
    '/api/system/readiness'
  ];
  
  for (const endpoint of healthEndpoints) {
    if (content.includes(endpoint)) {
      console.log(colorize(`  ✅ ${endpoint} endpoint found`, 'green'));
      
      // Check if it always returns 200
      const endpointPattern = new RegExp(`${endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?return[\\s\\S]*?200`, 'i');
      if (endpointPattern.test(content)) {
        console.log(colorize(`    ✅ Always returns 200 status`, 'green'));
      } else {
        console.log(colorize(`    ⚠️  May not always return 200 status`, 'yellow'));
        auditResults.failOpenBehavior.healthCheckIssues.push({
          endpoint,
          issue: 'May not always return 200 status'
        });
      }
    } else {
      console.log(colorize(`  ❌ ${endpoint} endpoint not found`, 'red'));
    }
  }
}

/**
 * 4. Custom GPT Functional Checks
 */
async function checkCustomGPTFunctionality() {
  console.log(colorize('\n🤖 4. CUSTOM GPT FUNCTIONAL CHECKS', 'cyan'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Load schema operations
  const schemaPath = path.join(rootDir, 'config/gpt-actions-schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  const schemaOperations = [];
  for (const [path, methods] of Object.entries(schema.paths || {})) {
    for (const [method, spec] of Object.entries(methods)) {
      if (spec.operationId) {
        schemaOperations.push(spec.operationId);
      }
    }
  }
  
  // Find implemented operations
  const implementedOps = await findImplementedOperations();
  const canonicalImplemented = new Set();
  
  for (const op of implementedOps) {
    canonicalImplemented.add(toCanonical(op));
  }
  
  // Check for unimplemented operations
  const unimplemented = schemaOperations.filter(op => !canonicalImplemented.has(op));
  
  auditResults.functionalChecks.unimplementedOperations = unimplemented;
  
  if (unimplemented.length > 0) {
    console.log(colorize(`❌ ${unimplemented.length} operations defined in schema but not implemented:`, 'red'));
    unimplemented.forEach(op => {
      console.log(colorize(`  ❌ ${op}`, 'red'));
    });
    console.log(colorize('\n📝 Recommendations:', 'yellow'));
    console.log('  • Implement missing handlers or remove from schema to stay ≤ 30 operations');
    console.log('  • Consider stubbing with basic responses for immediate GPT compatibility');
  } else {
    console.log(colorize('✅ All schema operations have implementations', 'green'));
  }
  
  // Check dynamic voice and pressing features
  await checkDynamicFeatures();
  
  // Check progressive enhancement
  await checkProgressiveEnhancement();
}

/**
 * Check dynamic voice and pressing features
 */
async function checkDynamicFeatures() {
  console.log(colorize('\n🎭 Dynamic Voice & Pressing Check:', 'blue'));
  
  const enginePath = path.join(rootDir, 'backend/agent/engine.js');
  if (fs.existsSync(enginePath)) {
    const content = fs.readFileSync(enginePath, 'utf8');
    
    const hasVoiceSelection = content.includes('selectVoice');
    const hasPressLevel = content.includes('pressLevel') || content.includes('nextPressLevel');
    const hasProgression = content.includes('avoidance') && content.includes('overwhelm');
    
    if (hasVoiceSelection) {
      console.log(colorize('  ✅ Dynamic voice selection implemented', 'green'));
    } else {
      console.log(colorize('  ❌ Dynamic voice selection missing', 'red'));
      auditResults.functionalChecks.dynamicFeatures.push('Missing voice selection');
    }
    
    if (hasPressLevel) {
      console.log(colorize('  ✅ Press level adjustment implemented', 'green'));
    } else {
      console.log(colorize('  ❌ Press level adjustment missing', 'red'));
      auditResults.functionalChecks.dynamicFeatures.push('Missing press level adjustment');
    }
    
    if (hasProgression) {
      console.log(colorize('  ✅ Avoidance/overwhelm progression logic found', 'green'));
    } else {
      console.log(colorize('  ⚠️  Avoidance/overwhelm progression logic unclear', 'yellow'));
    }
  } else {
    console.log(colorize('  ❌ Behavioral engine not found', 'red'));
    auditResults.functionalChecks.dynamicFeatures.push('Behavioral engine missing');
  }
}

/**
 * Check progressive enhancement features
 */
async function checkProgressiveEnhancement() {
  console.log(colorize('\n📈 Progressive Enhancement Check:', 'blue'));
  
  const indexPath = path.join(rootDir, 'backend/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Check for micro commitments
  const hasMicroCommitments = content.includes('micro') && content.includes('commitment');
  if (hasMicroCommitments) {
    console.log(colorize('  ✅ Micro commitments feature found', 'green'));
  } else {
    console.log(colorize('  ⚠️  Micro commitments feature not clearly implemented', 'yellow'));
  }
  
  // Check for follow-up questions
  const hasFollowUpQuestions = content.includes('questions') && content.includes('append');
  if (hasFollowUpQuestions) {
    console.log(colorize('  ✅ Follow-up questions feature found', 'green'));
  } else {
    console.log(colorize('  ⚠️  Follow-up questions feature not clearly implemented', 'yellow'));
  }
  
  // Check for context-aware responses
  const hasContextAware = content.includes('context') && content.includes('engine');
  if (hasContextAware) {
    console.log(colorize('  ✅ Context-aware response enhancement found', 'green'));
  } else {
    console.log(colorize('  ⚠️  Context-aware response enhancement unclear', 'yellow'));
  }
}

/**
 * Generate comprehensive audit report
 */
function generateAuditReport() {
  console.log(colorize('\n📋 COMPREHENSIVE AUDIT SUMMARY', 'magenta'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { schemaConsistency, behavioralEngine, failOpenBehavior, functionalChecks } = auditResults;
  
  // Schema Consistency Summary
  console.log(colorize('\n🔍 1. Schema vs. Code Synchronization:', 'cyan'));
  if (schemaConsistency.operationCount === 30) {
    console.log(colorize('  ✅ Operation count correct (30)', 'green'));
  } else {
    console.log(colorize(`  ❌ Operation count: ${schemaConsistency.operationCount}/30`, 'red'));
  }
  
  if (schemaConsistency.missingInCode.length === 0 && schemaConsistency.extraInCode.length === 0) {
    console.log(colorize('  ✅ All operations synchronized between schema and code', 'green'));
  } else {
    console.log(colorize(`  ❌ ${schemaConsistency.missingInCode.length} operations missing in code`, 'red'));
    console.log(colorize(`  ❌ ${schemaConsistency.extraInCode.length} extra operations in code`, 'red'));
  }
  
  // Behavioral Engine Summary
  console.log(colorize('\n🧠 2. Behavioral Engine Integration:', 'cyan'));
  const engineIssues = behavioralEngine.engineIntegration.length + 
                      behavioralEngine.endpointIntegration.length + 
                      behavioralEngine.loggingIssues.length;
  
  if (engineIssues === 0) {
    console.log(colorize('  ✅ Behavioral engine fully integrated', 'green'));
  } else {
    console.log(colorize(`  ⚠️  ${engineIssues} behavioral engine issues found`, 'yellow'));
  }
  
  // Fail-Open Summary
  console.log(colorize('\n🛡️  3. Fail-Open Behavior:', 'cyan'));
  const failOpenIssues = failOpenBehavior.unguardedOperations.length + 
                         failOpenBehavior.missingDefaults.length + 
                         failOpenBehavior.healthCheckIssues.length;
  
  if (failOpenIssues === 0) {
    console.log(colorize('  ✅ Fail-open behavior properly implemented', 'green'));
  } else {
    console.log(colorize(`  ⚠️  ${failOpenIssues} fail-open issues found`, 'yellow'));
  }
  
  // Functional Checks Summary
  console.log(colorize('\n🤖 4. Custom GPT Functionality:', 'cyan'));
  if (functionalChecks.unimplementedOperations.length === 0) {
    console.log(colorize('  ✅ All schema operations have implementations', 'green'));
  } else {
    console.log(colorize(`  ❌ ${functionalChecks.unimplementedOperations.length} operations not implemented`, 'red'));
  }
  
  // Overall Assessment
  console.log(colorize('\n🎯 OVERALL ASSESSMENT:', 'bold'));
  
  const totalIssues = schemaConsistency.missingInCode.length + 
                     schemaConsistency.extraInCode.length + 
                     engineIssues + 
                     failOpenIssues + 
                     functionalChecks.unimplementedOperations.length;
  
  if (totalIssues === 0) {
    console.log(colorize('✅ Schema and handlers are fully synchronized. All 30 operations have implementations, and behavioral engines are integrated with fail-open safety. Custom GPT calls will function as expected.', 'green'));
  } else {
    console.log(colorize(`⚠️  ${totalIssues} total issues found. Critical fixes needed to reach full synchronization and reliability:`, 'yellow'));
    
    if (schemaConsistency.missingInCode.length > 0) {
      console.log(colorize(`   • Implement ${schemaConsistency.missingInCode.length} missing operation handlers`, 'yellow'));
    }
    
    if (engineIssues > 0) {
      console.log(colorize(`   • Fix ${engineIssues} behavioral engine integration issues`, 'yellow'));
    }
    
    if (failOpenIssues > 0) {
      console.log(colorize(`   • Address ${failOpenIssues} fail-open behavior gaps`, 'yellow'));
    }
  }
  
  // Detailed recommendations
  if (totalIssues > 0) {
    console.log(colorize('\n📝 DETAILED RECOMMENDATIONS:', 'yellow'));
    
    if (schemaConsistency.missingInCode.length > 0) {
      console.log(colorize('\nMissing Operation Handlers:', 'yellow'));
      schemaConsistency.missingInCode.slice(0, 5).forEach(op => {
        console.log(colorize(`  • Implement handler for ${op} or remove from schema`, 'yellow'));
      });
      if (schemaConsistency.missingInCode.length > 5) {
        console.log(colorize(`  • ... and ${schemaConsistency.missingInCode.length - 5} more`, 'yellow'));
      }
    }
  }
  
  console.log(colorize('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  console.log(colorize('Audit completed. See details above for specific issues and recommendations.', 'cyan'));
}

/**
 * Main audit execution
 */
async function runComprehensiveAudit() {
  console.log(colorize('🚀 AQUIL SYMBOLIC ENGINE - COMPREHENSIVE SYNCHRONIZATION AUDIT', 'bold'));
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  try {
    await checkSchemaConsistency();
    await checkBehavioralEngineIntegration(); 
    await checkFailOpenBehavior();
    await checkCustomGPTFunctionality();
    generateAuditReport();
  } catch (error) {
    console.error(colorize(`❌ Audit failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Run the audit
runComprehensiveAudit();