#!/usr/bin/env node

/**
 * System Integration Test for Aquil Symbolic Engine
 * Tests API endpoints, authentication, and system health
 */

const API_BASE = 'https://signal_q.workers.dev';
const API_TOKEN = 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
const ADMIN_TOKEN = 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1i6o';

class SystemTester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async test(name, testFn) {
    this.totalTests++;
    console.log(`\n🧪 Testing: ${name}`);
    
    try {
      const result = await testFn();
      if (result.success) {
        this.passedTests++;
        console.log(`✅ PASS: ${name}`);
        if (result.data) {
          console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
        }
      } else {
        console.log(`❌ FAIL: ${name} - ${result.error}`);
      }
      this.results.push({ name, ...result });
    } catch (error) {
      console.log(`💥 ERROR: ${name} - ${error.message}`);
      this.results.push({ name, success: false, error: error.message });
    }
  }

  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${options.admin ? ADMIN_TOKEN : API_TOKEN}`,
      'Content-Type': 'application/json',
      'X-User-Id': 'test-user',
      ...options.headers
    };

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      ok: response.ok,
      data
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Aquil Symbolic Engine System Tests\n');
    console.log('=' * 60);

    // Test 1: System Health Check
    await this.test('System Health Check', async () => {
      const response = await this.apiCall('/system/health');
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    // Test 2: Authentication Test
    await this.test('Authentication (Valid Token)', async () => {
      const response = await this.apiCall('/identity-nodes');
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    // Test 3: Authentication Failure Test
    await this.test('Authentication (Invalid Token)', async () => {
      const response = await this.apiCall('/identity-nodes', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      return {
        success: response.status === 401,
        error: response.status !== 401 ? `Expected 401, got ${response.status}` : null
      };
    });

    // Test 4: Time Tracking
    await this.test('Time Tracking Endpoint', async () => {
      const response = await this.apiCall('/track-time', {
        method: 'POST',
        body: { userLocation: 'Philadelphia, PA' }
      });
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    // Test 5: Agent Overwhelm Check
    await this.test('Agent Overwhelm Status', async () => {
      const response = await this.apiCall('/agent-overwhelm');
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    // Test 6: Create Identity Node
    await this.test('Create Identity Node', async () => {
      const response = await this.apiCall('/identity-nodes', {
        method: 'POST',
        body: {
          identity_key: 'test-node-1',
          archetype: 'manifestor',
          notes: 'Test node for system verification'
        }
      });
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    // Test 7: List Identity Nodes
    await this.test('List Identity Nodes', async () => {
      const response = await this.apiCall('/identity-nodes');
      return {
        success: response.ok && Array.isArray(response.data.nodes),
        error: !response.ok ? `Status ${response.status}` : 
               !Array.isArray(response.data.nodes) ? 'Nodes is not an array' : null,
        data: response.data
      };
    });

    // Test 8: Philadelphia Context
    await this.test('Philadelphia Context', async () => {
      const response = await this.apiCall('/philadelphia-context');
      return {
        success: response.ok && response.data.culture,
        error: !response.ok ? `Status ${response.status}` : 
               !response.data.culture ? 'Missing culture data' : null,
        data: response.data
      };
    });

    // Test 9: Privacy Settings
    await this.test('Privacy Settings', async () => {
      const response = await this.apiCall('/privacy-settings');
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    // Test 10: Deployment Status
    await this.test('Deployment Status', async () => {
      const response = await this.apiCall('/deploy/status');
      return {
        success: response.ok,
        error: !response.ok ? `Status ${response.status}` : null,
        data: response.data
      };
    });

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '=' * 60);
    console.log('📊 TEST SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);

    if (this.passedTests === this.totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
    }

    console.log('\n🔧 Next Steps:');
    console.log('1. Deploy to Cloudflare: cd worker && npx wrangler deploy');
    console.log('2. Upload openapi.json to CustomGPT');
    console.log('3. Configure KV namespace for production use');
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SystemTester;