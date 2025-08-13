import { describe, it, expect } from 'vitest'
import worker from '../worker/src/index'

async function call(path, init={}) {
  const req = new Request('https://example.test'+path, { method: init.method||'GET', headers: init.headers||{}, body: init.body })
  return worker.fetch(req, {}, {})
}

describe('Routes', () => {
  it('health 200', async () => { const r = await call('/system/health'); expect(r.status).toBe(200) })
  it('version 200', async () => { const r = await call('/version'); expect(r.status).toBe(200) })
  it('spec 200', async () => { const r = await call('/openapi.yaml'); expect(r.status).toBe(200) })
  it('actions/list requires bearer', async () => { const r = await call('/actions/list', { method:'POST' }); expect(r.status).toBe(401) })
  it('actions/list 200 with bearer', async () => {
    const r = await call('/actions/list', { method:'POST', headers: { authorization: 'Bearer test' } });
    expect(r.status).toBe(200)
  })
})