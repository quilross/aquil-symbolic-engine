import { describe, it, expect } from 'vitest'
import worker from '../worker/index.js'

// Helper to call the worker's fetch in-memory
async function call(path, init = {}) {
  const url = `https://example.test${path}`;
  const headers = new Headers(init.headers || {});
  if (!headers.get('authorization')) headers.set('authorization', 'Bearer test-token');
  if (!headers.get('x-correlation-id')) headers.set('x-correlation-id', 'test-cid');
  const req = new Request(url, { method: init.method || 'GET', headers, body: init.body });
  // Mock env with required tokens for testing
  const mockEnv = {
    USER_TOKEN: 'test-token',
    ADMIN_TOKEN: 'test-admin-token'
  };
  return worker.fetch(req, mockEnv, {});
}

describe('Gene Keys Chat Integration', () => {
  it('chat action returns Gene Keys shaped response', async () => {
    const message = JSON.stringify({ message: 'I feel overwhelm and too many directions' });
    const res = await call('/actions/chat', { 
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: message 
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.response).toBeDefined();
    expect(data.gk_classification).toBeDefined();
    expect(data.gk_classification.activeKey).toBe('gk_03'); // Should detect GK3 chaos
    expect(data.response).toMatch(/Intervention:/);
    expect(data.response).toMatch(/Next Action:/);
  });

  it('chat action detects GK49 reaction patterns', async () => {
    const message = JSON.stringify({ message: 'I want to burn it down' });
    const res = await call('/actions/chat', { 
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: message 
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.gk_classification.activeKey).toBe('gk_49'); // Should detect GK49 reaction
  });

  it('chat action handles decision scenarios', async () => {
    const message = JSON.stringify({ message: 'We need to choose between option A and option B' });
    const res = await call('/actions/chat', { 
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: message 
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.response).toMatch(/Decision memo:/);
  });

  it('chat action applies persona dynamics for Projector with Emotional authority', async () => {
    const message = JSON.stringify({ 
      message: 'I feel overwhelm and too many directions',
      userId: 'user123'
    });
    const res = await call('/actions/chat', { 
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-user-id': 'user123' // Configured as Projector/Emotional
      },
      body: message 
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Should contain Gene Keys guidance
    expect(data.gk_classification.activeKey).toBe('gk_03');
    expect(data.gk_classification.state).toBe('shadow');
    
    // Should contain Projector guidance
    expect(data.response).toMatch(/as a Projector/);
    expect(data.response).toMatch(/wait for the right invitation/);
    
    // Should contain Emotional authority guidance
    expect(data.response).toMatch(/Emotional authority/);
    expect(data.response).toMatch(/feel things out/);
  });

  it('chat action applies persona dynamics for Generator with Sacral authority', async () => {
    const message = JSON.stringify({ 
      message: 'I need to make a decision',
      userId: 'user456'
    });
    const res = await call('/actions/chat', { 
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-user-id': 'user456' // Configured as Generator/Sacral
      },
      body: message 
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Should contain Sacral authority guidance
    expect(data.response).toMatch(/Sacral authority/);
    expect(data.response).toMatch(/gut responses/);
    
    // Should NOT contain Projector guidance
    expect(data.response).not.toMatch(/wait for the right invitation/);
  });

  it('chat action works without persona configuration', async () => {
    const message = JSON.stringify({ 
      message: 'Hello there',
      userId: 'unknown-user'
    });
    const res = await call('/actions/chat', { 
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-user-id': 'unknown-user' // No persona configuration
      },
      body: message 
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Should work normally without persona content
    expect(data.response).not.toMatch(/authority/);
    expect(data.response).not.toMatch(/Projector/);
    expect(data.response).not.toMatch(/Generator/);
  });
});