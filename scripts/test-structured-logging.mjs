#!/usr/bin/env node
/**
 * Integration test for enhanced structured logging
 * 
 * This script validates:
 * 1. Structured log format with observability metadata
 * 2. Error logging with structured error codes
 * 3. Trace correlation across log entries
 * 4. Autonomous action logging enhancements
 */

import fetch from 'node-fetch';

const BASE = "http://127.0.0.1:8787";

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

// Generate a unique trace ID for this test session
const traceId = `integration_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const sessionId = `test_session_${Date.now()}`;

async function testStructuredLogging() {
  info("Testing structured logging format...");
  
  try {
    const response = await fetch(`${BASE}/api/log`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Trace-ID": traceId,
        "X-Session-ID": sessionId
      },
      body: JSON.stringify({
        type: "structured_test",
        payload: { 
          message: "Testing enhanced structured logging",
          test_type: "integration",
          observability_test: true
        },
        who: "test_system",
        level: "info",
        tags: ["integration_test", "structured_logging", "observability"],
        textOrVector: "Integration test for structured logging with observability metadata"
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      success("Structured logging test passed");
      return true;
    } else {
      error(`Structured logging test failed: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (err) {
    error(`Structured logging test error: ${err.message}`);
    return false;
  }
}

async function testErrorLogging() {
  info("Testing enhanced error logging...");
  
  try {
    // Test with a known endpoint that should handle errors gracefully
    const response = await fetch(`${BASE}/api/log`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Trace-ID": traceId,
        "X-Session-ID": sessionId
      },
      body: JSON.stringify({
        type: "error_test",
        payload: { 
          message: "Testing error logging with structured codes",
          error_category: "validation",
          error_severity: "medium",
          simulate_error: true
        },
        who: "test_system",
        level: "error",
        tags: ["integration_test", "error_logging"],
        error_code: "INTEGRATION_TEST_VALIDATION_MEDIUM"
      }),
    });
    
    const result = await response.json();
    
    // Even if there's an "error" in the payload, the logging should succeed
    if (result.success || result.status) {
      success("Error logging test passed");
      return true;
    } else {
      error(`Error logging test failed: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (err) {
    error(`Error logging test error: ${err.message}`);
    return false;
  }
}

async function testTraceCorrelation() {
  info("Testing trace correlation across log entries...");
  
  try {
    // Create multiple log entries with the same trace ID
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(
        fetch(`${BASE}/api/log`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Trace-ID": traceId,
            "X-Session-ID": sessionId
          },
          body: JSON.stringify({
            type: "trace_correlation_test",
            payload: { 
              message: `Trace correlation test entry ${i + 1}`,
              sequence: i + 1,
              total_entries: 3
            },
            who: "test_system",
            level: "info",
            tags: ["integration_test", "trace_correlation", `sequence:${i + 1}`]
          }),
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const results = await Promise.all(responses.map(r => r.json()));
    
    const allSuccessful = results.every(result => result.success);
    
    if (allSuccessful) {
      success("Trace correlation test passed");
      return true;
    } else {
      error(`Trace correlation test failed: ${JSON.stringify(results)}`);
      return false;
    }
  } catch (err) {
    error(`Trace correlation test error: ${err.message}`);
    return false;
  }
}

async function testObservabilityMetadata() {
  info("Testing observability metadata in logs...");
  
  try {
    // Retrieve logs and check for observability metadata
    const response = await fetch(`${BASE}/api/logs?source=all&limit=10&session_id=${sessionId}`);
    const logsResult = await response.json();
    
    if (logsResult.results && logsResult.results.d1 && Array.isArray(logsResult.results.d1)) {
      // Check if any of our test logs contain observability metadata
      const testLogs = logsResult.results.d1.filter(log => 
        log.detail && JSON.parse(log.detail).observability
      );
      
      if (testLogs.length > 0) {
        success(`Observability metadata test passed - found ${testLogs.length} logs with metadata`);
        return true;
      } else {
        error("No logs found with observability metadata");
        return false;
      }
    } else {
      error("Could not retrieve logs for observability metadata test");
      return false;
    }
  } catch (err) {
    error(`Observability metadata test error: ${err.message}`);
    return false;
  }
}

async function runIntegrationTests() {
  log(`\n🔥 Starting Enhanced Structured Logging Integration Tests`, 'bold');
  log(`Trace ID: ${traceId}`, 'yellow');
  log(`Session ID: ${sessionId}\n`, 'yellow');
  
  const results = [];
  
  results.push(await testStructuredLogging());
  results.push(await testErrorLogging());
  results.push(await testTraceCorrelation());
  results.push(await testObservabilityMetadata());
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  log(`\n📊 Integration Test Results:`, 'bold');
  if (passedTests === totalTests) {
    success(`All ${totalTests} enhanced structured logging tests PASSED`);
    process.exit(0);
  } else {
    error(`${totalTests - passedTests} out of ${totalTests} enhanced structured logging tests FAILED`);
    process.exit(1);
  }
}

// Check if we can reach the local server
async function checkServerAvailability() {
  try {
    const response = await fetch(`${BASE}/api/health`, { 
      method: 'GET',
      timeout: 5000 
    });
    return response.ok || response.status < 500;
  } catch (err) {
    return false;
  }
}

// Main execution
(async () => {
  const serverAvailable = await checkServerAvailability();
  
  if (!serverAvailable) {
    error("Local server not available at http://127.0.0.1:8787");
    error("Please start the worker with: wrangler dev --port 8787");
    process.exit(1);
  }
  
  await runIntegrationTests();
})().catch((err) => {
  error(`Integration test failed: ${err.message}`);
  process.exit(1);
});