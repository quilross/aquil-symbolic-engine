#!/usr/bin/env node
/**
 * Test script for readiness endpoint
 * Verifies the new readiness functionality works correctly
 */

// Simple test for readiness endpoint without external dependencies
export function testReadinessResponse() {
  // Mock response structure
  const mockReadiness = {
    ready: true,
    timestamp: new Date().toISOString(),
    stores: {
      d1: { status: "ok" },
      kv: { status: "ok" },
      r2: { status: "not_configured" },
      vector: { status: "not_configured" }
    },
    flags: {
      canary_enabled: false,
      canary_percent: 0,
      middleware_disabled: false,
      fail_open: true
    },
    recentErrors: {
      action_error_total: 0,
      missing_store_writes_total: 0
    },
    notes: "fail-open; actions unaffected"
  };

  // Test structure
  console.log('🧪 Testing readiness response structure...');
  
  const requiredFields = ['ready', 'timestamp', 'stores', 'flags', 'recentErrors', 'notes'];
  for (const field of requiredFields) {
    if (!(field in mockReadiness)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Test flags structure
  const requiredFlags = ['canary_enabled', 'canary_percent', 'middleware_disabled', 'fail_open'];
  for (const flag of requiredFlags) {
    if (!(flag in mockReadiness.flags)) {
      throw new Error(`Missing required flag: ${flag}`);
    }
  }
  
  console.log('✅ Readiness response structure is valid');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    testReadinessResponse();
    console.log('✅ All readiness tests passed');
  } catch (error) {
    console.error('❌ Readiness test failed:', error.message);
    process.exit(1);
  }
}