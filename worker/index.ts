import { Router } from 'itty-router'
import { v4 as uuidv4 } from 'uuid'

export interface Env {
  MEMORY_DO: DurableObjectNamespace
  AUTH_DISABLED: string
  ADMIN_TOKENS: string
  CORS_ORIGIN: string
  BASE_URL: string
}

export class MemoryDO {
  state: DurableObjectState
  constructor(state: DurableObjectState, _env: Env) { this.state = state }
  async fetch(req: Request) {
    const url = new URL(req.url)
    if (req.method === 'POST' && url.pathname === '/append') {
      const body = await req.json<any>().catch(() => ({}))
      const now = new Date().toISOString()
      const record = { id: crypto.randomUUID?.() ?? uuidv4(), ts: now, ...body }
      await this.state.storage.put(record.id, record)
      return json({ ok: true, id: record.id, ts: now })
    }
    if (req.method === 'GET' && url.pathname === '/dump') {
      const list = await this.state.storage.list()
      return json({ ok: true, count: list.size, items: Array.from(list.values()) })
    }
    return problem(404, 'Not Found', 'No such DO route')
  }
}

const router = Router()

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })
}
function text(data: string, init: ResponseInit = {}) {
  return new Response(data, { headers: { 'content-type': 'text/plain; charset=utf-8' }, ...init })
}
function yaml(data: string) {
  return new Response(data, { headers: { 'content-type': 'application/yaml; charset=utf-8' } })
}
function problem(status: number, title: string, detail?: string, cid?: string) {
  const correlation = cid || uuidv4()
  return new Response(
    JSON.stringify({ type: 'about:blank', title, detail: detail || title, status }),
    { status, headers: { 'content-type': 'application/problem+json', 'x-correlation-id': correlation } }
  )
}
function withCors(env: Env, res: Response) {
  const h = new Headers(res.headers)
  h.set('access-control-allow-origin', env.CORS_ORIGIN || '*')
  h.set('access-control-allow-headers', 'authorization, content-type, x-session-id')
  h.set('access-control-allow-methods', 'GET,POST,OPTIONS')
  return new Response(res.body, { status: res.status, headers: h })
}
async function requireAuth(request: Request, env: Env) {
  if (env.AUTH_DISABLED === 'true') return { ok: true, token: 'dev-mode' }
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return { ok: false, res: problem(401, 'Unauthorized', 'Missing Bearer token') }
  const token = auth.slice(7).trim()
  const allowed = (env.ADMIN_TOKENS || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!allowed.includes(token)) return { ok: false, res: problem(403, 'Forbidden', 'Invalid token') }
  return { ok: true, token }
}

/**********************
 * OpenAPI (inline for convenience)
 **********************/
const OPENAPI_YAML = `# Served at /openapi.yaml\n${OPENAPI_CORE_YAML()}`
function OPENAPI_CORE_YAML(): string {
  return `openapi: 3.1.0\ninfo:\n  title: Signalhaven Actions API\n  version: v1.0.1\nservers:\n  - url: https://signal-q.me\n  - url: https://signal_q.catnip-pieces1.workers.dev\n  - url: http://127.0.0.1:8787\npaths:\n  /version:\n    get:\n      summary: version\n      responses:\n        '200': { description: OK }\n  /system/health:\n    get:\n      summary: health\n      responses:\n        '200': { description: OK }\n  /actions/system_health:\n    post:\n      summary: health (auth)\n      responses:\n        '200': { description: OK }\n  /actions/list:\n    post:\n      summary: actions\n      responses:\n        '200': { description: OK }\n  /actions/echo:\n    post:\n      summary: echo\n      responses:\n        '200': { description: OK }\n  /actions/log_memory:\n    post:\n      summary: log memory\n      responses:\n        '200': { description: OK }\n  /memory/{id}:\n    get:\n      summary: fetch memory\n      parameters:\n        - in: path\n          name: id\n          required: true\n          schema: { type: string }\n      responses:\n        '200': { description: OK }\n` }

/**********************
 * Routes
 **********************/
router.options('*', (req, env: Env) => withCors(env, new Response(null, { headers: { 'content-length': '0' } })))
router.get('/version', () => json({ ok: true, message: 'Signalhaven Worker', ts: new Date().toISOString(), version: 'v1.0.1' }))
router.get('/system/health', () => json({ ok: true, worker: 'signalhaven-worker', ts: new Date().toISOString() }))
router.post('/actions/system_health', async (req, env: Env) => { const a = await requireAuth(req, env); if (!a.ok) return a.res!; return json({ ok: true, ts: new Date().toISOString(), auth: a.token }) })
router.post('/actions/list', async (req, env: Env) => { const a = await requireAuth(req, env); if (!a.ok) return a.res!; return json({ ok: true, actions: ['system_health', 'echo', 'log_memory'] }) })
router.post('/actions/echo', async (req, env: Env) => { const a = await requireAuth(req, env); if (!a.ok) return a.res!; const body = await req.json<any>().catch(() => ({})); if (!body.message) return problem(400, 'Bad Request', 'Missing message'); return json({ ok: true, message: String(body.message), ts: new Date().toISOString() }) })
router.post('/actions/log_memory', async (req, env: Env) => { const a = await requireAuth(req, env); if (!a.ok) return a.res!; const body = await req.json<any>().catch(() => ({})); if (!body || typeof body !== 'object' || !body.payload) return problem(400, 'Bad Request', 'payload required'); const headers = Object.fromEntries(req.headers); const sessionId = body.sessionId || headers['x-session-id'] || 'default'; const id = env.MEMORY_DO.idFromName(sessionId); const stub = env.MEMORY_DO.get(id); const r = await stub.fetch('https://do/append', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, payload: body.payload }) }); const data = await r.json<any>(); return json({ ok: true, sessionId, recordId: data.id, ts: data.ts }) })
router.get('/memory/:id', async (req, env: Env) => { const a = await requireAuth(req, env); if (!a.ok) return a.res!; const id = env.MEMORY_DO.idFromName(req.params!.id); const stub = env.MEMORY_DO.get(id); const r = await stub.fetch('https://do/dump'); const data = await r.json<any>(); return json({ ok: true, ...data }) })
router.get('/openapi.yaml', () => yaml(OPENAPI_YAML))
router.all('*', () => problem(404, 'Not Found'))

export default { async fetch(request: Request, env: Env, ctx: ExecutionContext) { try { const res = await router.handle(request, env, ctx); if (!res) return problem(404, 'Not Found'); return withCors(env, res) } catch (err: any) { const cid = uuidv4(); return problem(500, 'Internal Server Error', String(err?.message || err), cid) } } }
