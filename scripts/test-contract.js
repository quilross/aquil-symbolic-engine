#!/usr/bin/env node
/**
 * Contract tests for Signal Q API
 * Validates basic shapes and authentication for core endpoints
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';
const API_TOKEN = process.env.SIGNALQ_API_TOKEN || 'dev-placeholder';

async function httpRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url, options);
  const text = await response.text();
  
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data
  };
}

async function testSystemHealth() {
  console.log('Testing POST /actions/system_health...');
  
  const response = await httpRequest(`${BASE_URL}/actions/system_health`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  assert.strictEqual(response.status, 200, 'Expected 200 status');
  assert.strictEqual(response.data.status, 'healthy', 'Expected status to be "healthy"');
  assert(response.data.timestamp, 'Expected timestamp field');
  assert.match(response.data.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Expected ISO-8601 timestamp');
  assert.strictEqual(typeof response.data.worker, 'string', 'Expected worker to be string');
  assert.strictEqual(typeof response.data.version, 'string', 'Expected version to be string');
  
  console.log('✅ System health test passed');
}

async function testProbeIdentity() {
  console.log('Testing POST /actions/probe_identity...');
  
  const response = await httpRequest(`${BASE_URL}/actions/probe_identity`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  assert.strictEqual(response.status, 200, 'Expected 200 status');
  assert.strictEqual(typeof response.data.probe, 'string', 'Expected probe to be string');
  assert(response.data.timestamp, 'Expected timestamp field');
  assert.match(response.data.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Expected ISO-8601 timestamp');
  
  // Test analysis object
  const analysis = response.data.analysis;
  assert(analysis, 'Expected analysis object');
  assert(typeof analysis.stability === 'number' && analysis.stability >= 0 && analysis.stability <= 1, 
    'Expected stability to be number 0..1');
  assert(['high', 'medium', 'low'].includes(analysis.coherence), 
    'Expected coherence to be one of high/medium/low');
  assert(typeof analysis.authenticity === 'number' && analysis.authenticity >= 0 && analysis.authenticity <= 1, 
    'Expected authenticity to be number 0..1');
  assert.strictEqual(typeof analysis.recommendation, 'string', 
    'Expected recommendation to be string');
  
  console.log('✅ Probe identity test passed');
}

async function testAuthenticationRequired() {
  console.log('Testing authentication requirement...');
  
  const response = await httpRequest(`${BASE_URL}/actions/system_health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
    // No Authorization header
  });
  
  assert.strictEqual(response.status, 401, 'Expected 401 status for missing auth');
  assert.strictEqual(response.headers['content-type'], 'application/problem+json', 
    'Expected problem+json content type');
  assert(response.headers['x-correlation-id'], 'Expected X-Correlation-ID header');
  assert.strictEqual(response.data.status, 401, 'Expected status 401 in problem response');
  assert(response.data.correlationId, 'Expected correlationId in problem response');
  
  console.log('✅ Authentication test passed');
}

async function testVersionEndpoint() {
  console.log('Testing GET /version (public)...');
  
  const response = await httpRequest(`${BASE_URL}/version`);
  
  assert.strictEqual(response.status, 200, 'Expected 200 status');
  assert(response.data.version, 'Expected version field');
  assert(response.data.gitSha, 'Expected gitSha field');
  assert(response.data.buildTime, 'Expected buildTime field');
  assert(response.data.environment, 'Expected environment field');
  
  console.log('✅ Version endpoint test passed');
}

async function runTests() {
  console.log(`Running contract tests against ${BASE_URL}`);
  console.log('Using API token');
  
  try {
    await testVersionEndpoint();
    await testSystemHealth();
    await testProbeIdentity();
    await testAuthenticationRequired();
    
    console.log('\n🎉 All contract tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Contract test failed:', error.message);
    process.exit(1);
  }
}

// Check if this is the main module (ES module way)
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };