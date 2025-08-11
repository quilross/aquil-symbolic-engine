import { describe, it, expect } from 'vitest'
import worker from '../worker/index.js'

async function call(path, init={}) {
  const headers = new Headers(init.headers || {});
  if (!headers.get('x-correlation-id')) headers.set('x-correlation-id', 'test-cid');
  const req = new Request('https://example.test'+path, { method: init.method||'GET', headers, body: init.body });
  const env = { USER_TOKEN: 'test-token', ADMIN_TOKEN: 'test-admin-token' };
  return worker.fetch(req, env, {});
}

describe('Routes', () => {
  it('health 200', async () => { const r = await call('/system/health'); expect(r.status).toBe(200) })
  it('version 200', async () => { const r = await call('/version'); expect(r.status).toBe(200) })
  it('spec 200', async () => { const r = await call('/openapi.yaml'); expect(r.status).toBe(200) })
  it('actions/list requires bearer', async () => { const r = await call('/actions/list'); expect(r.status).toBe(401) })
  it('actions/list 200 with bearer', async () => {
    const r = await call('/actions/list', { headers: { authorization: 'Bearer test-token' } });
    expect(r.status).toBe(200)
  })
})
