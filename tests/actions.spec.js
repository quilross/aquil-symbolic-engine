import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import worker from '../worker/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_PATH = path.join(__dirname, '..', 'memory', 'log.json');

async function call(path, init = {}) {
  const url = `https://example.test${path}`;
  const headers = new Headers(init.headers || {});
  if (!headers.get('authorization')) headers.set('authorization', 'Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h');
  const req = new Request(url, { method: init.method || 'GET', headers, body: init.body });
  const env = {
    USER_TOKEN: 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h',
    ADMIN_TOKEN: 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2'
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
    beforeEach(async () => {
      await fs.rm(LOG_PATH, { force: true });
    });

    it('echoes the provided prompt and logs interaction', async () => {
      const res = await call('/actions/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'hello' })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.reply.text).toBe('ACK: hello');
      const logRaw = await fs.readFile(LOG_PATH, 'utf8');
      const log = JSON.parse(logRaw);
      expect(log.length).toBe(1);
      expect(log[0].input).toBe('hello');
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

