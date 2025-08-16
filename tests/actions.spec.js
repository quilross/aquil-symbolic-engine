import { describe, it, expect } from 'vitest';
import worker from '../worker/index.js';

async function call(path, init = {}) {
  const url = `https://example.test${path}`;
  const headers = new Headers(init.headers || {});
  if (!headers.get('authorization')) headers.set('authorization', `Bearer ${process.env.API_TOKEN || 'test-user-token'}`);
  const req = new Request(url, { method: init.method || 'GET', headers, body: init.body });
  const env = {
    USER_TOKEN: process.env.API_TOKEN || 'test-user-token',
    ADMIN_TOKEN: process.env.API_TOKEN_ADMIN || 'test-admin-token'
  };

  return worker.fetch(req, env, {});
}

describe('actions API', () => {
  it('lists available actions', async () => {
    const res = await call('/actions/list');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.actions.some((a) => a.name === 'chat')).toBe(true);
    expect(data.actions.some((a) => a.name === 'probe_identity')).toBe(true);
  });

  describe('chat', () => {
    it('echoes the provided prompt', async () => {
      const res = await call('/actions/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'hello' })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.reply.text).toBe('ACK: hello');
    });

    it('rejects requests without valid token', async () => {
      const res = await call('/actions/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer wrong' },
        body: JSON.stringify({ prompt: 'hi' })
      });
      expect(res.status).toBe(401);
    });
  });

  describe('probe_identity', () => {
    it('returns analysis for the given user', async () => {
      const res = await call('/actions/probe_identity', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user: 'alice' })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.probe).toBe('alice');
      expect(typeof data.timestamp).toBe('number');
      expect(data.analysis).toBeDefined();
      expect(typeof data.analysis.stability).toBe('number');
    });
  });
});

