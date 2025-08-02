#!/usr/bin/env node

/**
 * Simple Unit Tests for Signal Q Modules
 * Basic testing without external dependencies
 */

import { Utils } from '../src/modules/utils.js';
import { Config } from '../src/modules/config.js';
import { Security } from '../src/modules/security.js';

// Simple test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running Signal Q Unit Tests\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }

  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value should not be null or undefined');
    }
  }
}

const runner = new TestRunner();

// Utils Tests
runner.test('Utils.sanitizeInput removes script tags', () => {
  const input = '<script>alert("xss")</script>Hello';
  const result = Utils.sanitizeInput(input);
  runner.assert(!result.includes('<script'), 'Script tag should be removed');
  runner.assert(result.includes('Hello'), 'Safe content should remain');
});

runner.test('Utils.isEmpty correctly identifies empty values', () => {
  runner.assert(Utils.isEmpty(''), 'Empty string should be empty');
  runner.assert(Utils.isEmpty([]), 'Empty array should be empty');
  runner.assert(Utils.isEmpty({}), 'Empty object should be empty');
  runner.assert(Utils.isEmpty(null), 'Null should be empty');
  runner.assert(!Utils.isEmpty('hello'), 'Non-empty string should not be empty');
  runner.assert(!Utils.isEmpty([1]), 'Non-empty array should not be empty');
});

runner.test('Utils.generateSecureToken creates valid tokens', () => {
  const token = Utils.generateSecureToken(16);
  runner.assertEqual(token.length, 16, 'Token should be correct length');
  
  const token2 = Utils.generateSecureToken(16);
  runner.assert(token !== token2, 'Tokens should be unique');
});

runner.test('Utils.createResponse creates valid response', () => {
  const response = Utils.createResponse({ test: 'data' });
  runner.assertNotNull(response, 'Response should not be null');
  runner.assertEqual(response.status, 200, 'Default status should be 200');
});

// Config Tests
runner.test('Config loads with defaults', () => {
  const config = new Config({});
  runner.assertNotNull(config.config, 'Config should be loaded');
  runner.assertEqual(config.get('api.version'), '2.1.0', 'Version should be set');
  runner.assertEqual(config.get('auth.requireAuth'), true, 'Auth should be required by default');
});

runner.test('Config validates correctly', () => {
  const config = new Config({ API_TOKEN: 'test_token' });
  const validation = config.validate();
  runner.assert(validation.valid || validation.warnings.length > 0, 'Config should validate');
});

runner.test('Config handles environment variables', () => {
  const config = new Config({ 
    API_TOKEN: 'sq_test_token',
    RATE_LIMIT_MAX: '50'
  });
  runner.assertEqual(config.get('auth.userToken'), 'sq_test_token', 'Should read from env vars');
  runner.assertEqual(config.get('rateLimit.maxRequests'), 50, 'Should parse numeric env vars');
});

// Security Tests
runner.test('Security validates token format', () => {
  const security = new Security();
  runner.assert(security.validateTokenFormat('sq_abcd1234567890123456789012345678'), 'Valid token should pass');
  runner.assert(!security.validateTokenFormat('invalid'), 'Invalid token should fail');
  runner.assert(!security.validateTokenFormat(''), 'Empty token should fail');
});

runner.test('Security generates secure tokens', () => {
  const security = new Security();
  const token = security.generateSecureToken('test', 32);
  runner.assert(token.startsWith('test_'), 'Token should have correct prefix');
  runner.assert(token.length > 32, 'Token should be correct length');
});

runner.test('Security rate limiting works', () => {
  const security = new Security();
  const mockRequest = {
    url: 'https://example.com/test',
    headers: {
      get: (header) => {
        if (header === 'CF-Connecting-IP') return '127.0.0.1';
        if (header === 'User-Agent') return 'test-agent';
        if (header === 'X-User-Id') return 'test-user';
        return null;
      }
    }
  };
  
  // Should allow first request
  const result1 = security.checkRateLimit(mockRequest, 2, 60000);
  runner.assert(result1.allowed, 'First request should be allowed');
  
  // Should allow second request
  const result2 = security.checkRateLimit(mockRequest, 2, 60000);
  runner.assert(result2.allowed, 'Second request should be allowed');
  
  // Should block third request
  const result3 = security.checkRateLimit(mockRequest, 2, 60000);
  runner.assert(!result3.allowed, 'Third request should be blocked');
});

runner.test('Security authentication works', () => {
  const security = new Security();
  const mockRequest = {
    headers: {
      get: (header) => {
        if (header === 'Authorization') return 'Bearer test_token';
        return null;
      }
    }
  };
  const env = { API_TOKEN: 'test_token' };
  
  const result = security.authenticateRequest(mockRequest, env);
  runner.assert(result.authenticated, 'Valid token should authenticate');
  runner.assert(result.isUser, 'Should identify as user token');
});

// Integration Tests
runner.test('Config and Security integration', () => {
  const config = new Config({ API_TOKEN: 'sq_test_token' });
  const security = new Security();
  
  const mockRequest = {
    headers: {
      get: (header) => {
        if (header === 'Authorization') return 'Bearer sq_test_token';
        return null;
      }
    }
  };
  
  const authResult = security.authenticateRequest(mockRequest, { API_TOKEN: config.get('auth.userToken') });
  runner.assert(authResult.authenticated, 'Config and Security should work together');
});

// Run all tests
runner.run().catch(console.error);