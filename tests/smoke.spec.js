import { describe, it, expect } from 'vitest'
// Adjust path if index.ts is default export; Workers modules export default { fetch }
import worker from '../worker/index.js'

// Helper to call the worker's fetch in-memory
async function call(path, init = {}) {
  const url = `https://example.test${path}`;
  const headers = new Headers(init.headers || {});
  if (!headers.get('authorization')) headers.set('authorization', `Bearer ${process.env.API_TOKEN || 'user-token'}`);
  if (!headers.get('x-correlation-id')) headers.set('x-correlation-id', 'test-cid');
  const req = new Request(url, { method: init.method || 'GET', headers, body: init.body });
  // Mock env with required tokens for testing
  const mockEnv = {
    API_TOKEN: process.env.API_TOKEN || 'user-token',
    API_TOKEN_ADMIN: process.env.API_TOKEN_ADMIN || 'admin-token'
  };
  return worker.fetch(req, mockEnv, {});
}

describe('Smoke', () => {
  it('GET /version -> 200', async () => {
    const res = await call('/version');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
  });

  it('GET /system/health -> 200', async () => {
    const res = await call('/system/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
  });

  it('POST /actions/list (if exists) -> 200', async () => {
    const res = await call('/actions/list', { method: 'POST' });
    // If not implemented, you may set this to expect 404 intentionally.
    expect([200, 404]).toContain(res.status);
  });
})