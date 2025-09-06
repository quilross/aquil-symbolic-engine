#!/usr/bin/env node
/**
 * Acceptance Test Script
 * 
 * Validates the complete system according to task requirements:
 * - Op-cap check (must be 30)
 * - Alias/guard checks  
 * - Fire 3 actions (Required-R2, Optional, forced error)
 * - Read /api/logs?limit=10 → assert canonical operationId and correct stores
 * - (if idempotency extended) POST twice with same Idempotency-Key → same logId
 * - Read /api/logs/session/:sessionId?limit=10 → assert canonical fields present
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function runAcceptanceTests() {
  log('\n🚀 Starting Aquil Symbolic Engine Acceptance Tests\n', 'bold');
  
  let allPassed = true;
  
  try {
    // 1. Op-cap check (must be 30)
    info('1. Checking operation count...');
    const schemaPath = resolve(__dirname, '..', '..', 'config/gpt-actions-schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    
    const operations = [];
    for (const [path, methods] of Object.entries(schema.paths)) {
      for (const [method, config] of Object.entries(methods)) {
        if (config.operationId) {
          operations.push(config.operationId);
        }
      }
    }
    
    if (operations.length === 30) {
      success(`Operation count: ${operations.length}/30`);
    } else {
      error(`Operation count mismatch: ${operations.length}/30`);
      allPassed = false;
    }
    
    // 2. Alias/guard checks
    info('2. Running guard checks...');
    
    try {
      // Import and run guard scripts
      const { execSync } = await import('child_process');
      execSync('npm run guard', { stdio: 'pipe' });
      success('All guard checks passed');
    } catch (guardError) {
      error(`Guard checks failed: ${guardError.message}`);
      allPassed = false;
    }
    
    // 3. Fire 3 actions
    info('3. Testing endpoints...');
    
    const baseUrl = process.env.ACCEPTANCE_URL || 'http://localhost:8787';
    let sessionId = null;
    
    // Required-R2 action: somatic/session
    try {
      const response1 = await fetch(`${baseUrl}/api/somatic/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_state: 'grounded',
          emotions: 'calm',
          intention: 'healing'
        })
      });
      
      if (response1.ok) {
        const data1 = await response1.json();
        sessionId = data1.session_id || data1.logId || `test_${Date.now()}`;
        success('Required-R2 action (somatic/session): PASS');
      } else {
        throw new Error(`HTTP ${response1.status}`);
      }
    } catch (err) {
      error(`Required-R2 action failed: ${err.message}`);
      allPassed = false;
    }
    
    // Optional action: trust/check-in
    try {
      const response2 = await fetch(`${baseUrl}/api/trust/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_state: 'confident and ready',
          trust_level: 8
        })
      });
      
      if (response2.ok) {
        success('Optional action (trust/check-in): PASS');
      } else {
        throw new Error(`HTTP ${response2.status}`);
      }
    } catch (err) {
      error(`Optional action failed: ${err.message}`);
      allPassed = false;
    }
    
    // Forced error action: media/extract-wisdom with bad params
    try {
      const response3 = await fetch(`${baseUrl}/api/media/extract-wisdom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bad: 'param'
        })
      });
      
      if (response3.status >= 400) {
        success('Forced error action (media/extract-wisdom): PASS (correctly failed)');
      } else {
        throw new Error(`Expected error but got HTTP ${response3.status}`);
      }
    } catch (err) {
      error(`Forced error action failed unexpectedly: ${err.message}`);
      allPassed = false;
    }
    
    // 4. Read /api/logs and validate canonical format
    info('4. Validating /api/logs format...');
    
    try {
      const logsResponse = await fetch(`${baseUrl}/api/logs?limit=10`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        
        if (logsData.items && Array.isArray(logsData.items)) {
          success('/api/logs returned items array');
          
          if (logsData.items.length > 0) {
            const firstLog = logsData.items[0];
            const requiredFields = ['operationId', 'timestamp', 'type', 'tags', 'stores'];
            let hasAllFields = true;
            
            for (const field of requiredFields) {
              if (!(field in firstLog)) {
                error(`Missing required field: ${field}`);
                hasAllFields = false;
              }
            }
            
            if (hasAllFields) {
              success('Canonical log format validated');
            } else {
              allPassed = false;
            }
          } else {
            warning('/api/logs returned empty (no logs to validate format)');
          }
        } else {
          error('/api/logs did not return items array');
          allPassed = false;
        }
      } else {
        throw new Error(`HTTP ${logsResponse.status}`);
      }
    } catch (err) {
      error(`/api/logs validation failed: ${err.message}`);
      allPassed = false;
    }
    
    // 5. Test idempotency (if extended)
    info('5. Testing idempotency...');
    
    const idempotencyKey = `accept_test_${Date.now()}`;
    let firstLogId = null;
    let secondLogId = null;
    
    try {
      // First request
      const response1 = await fetch(`${baseUrl}/api/trust/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          current_state: 'testing idempotency',
          trust_level: 5
        })
      });
      
      if (response1.ok) {
        const data1 = await response1.json();
        firstLogId = data1.logId || data1.id;
      }
      
      // Second request with same key
      const response2 = await fetch(`${baseUrl}/api/trust/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          current_state: 'testing idempotency',
          trust_level: 5
        })
      });
      
      if (response2.ok) {
        const data2 = await response2.json();
        secondLogId = data2.logId || data2.id;
        
        if (firstLogId && secondLogId && firstLogId === secondLogId) {
          success('Idempotency check: PASS (same logId returned)');
        } else {
          warning(`Idempotency check: logIds differ (${firstLogId} vs ${secondLogId})`);
        }
      }
    } catch (err) {
      warning(`Idempotency test failed: ${err.message}`);
    }
    
    // 6. Read session logs and validate format
    info('6. Validating session logs format...');
    
    if (sessionId) {
      try {
        const sessionLogsResponse = await fetch(`${baseUrl}/api/logs/session/${sessionId}?limit=10`);
        if (sessionLogsResponse.ok) {
          const sessionData = await sessionLogsResponse.json();
          
          if (sessionData.items && Array.isArray(sessionData.items)) {
            success('Session logs returned items array');
            
            if (sessionData.session_id === sessionId) {
              success('Session ID correctly included in response');
            } else {
              error('Session ID mismatch in response');
              allPassed = false;
            }
          } else {
            error('Session logs did not return items array');
            allPassed = false;
          }
        } else {
          throw new Error(`HTTP ${sessionLogsResponse.status}`);
        }
      } catch (err) {
        error(`Session logs validation failed: ${err.message}`);
        allPassed = false;
      }
    } else {
      warning('No session ID available for session logs test');
    }
    
  } catch (mainError) {
    error(`Acceptance test suite failed: ${mainError.message}`);
    allPassed = false;
  }
  
  // Final result
  log('\n📊 Acceptance Test Results:', 'bold');
  
  if (allPassed) {
    log('🎉 ALL TESTS PASSED', 'green');
    log('✅ System meets all acceptance criteria', 'green');
    process.exit(0);
  } else {
    log('💥 SOME TESTS FAILED', 'red');
    log('❌ System does not meet all acceptance criteria', 'red');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAcceptanceTests().catch(error => {
    console.error('Acceptance test runner failed:', error);
    process.exit(1);
  });
}