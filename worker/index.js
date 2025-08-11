import { MemoryDO } from './src/memory.js';
import openapi from './src/openapi-core.json' assert { type: 'json' };

async function OPENAPI_JSON() {
  return openapi;
}

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function corsHeaders() {
  const h = new Headers();
  h.set('access-control-allow-origin', '*');
  h.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  h.set('access-control-allow-headers', 'authorization,content-type');
  h.set('access-control-max-age', '86400');
  return h;
}

function isCorsPath(path) {
  return path === '/version' || path === '/system/health' || path.startsWith('/actions/');
}

// Helper to append memory via stub
async function appendMemory(env, user, payload) {
  const id = env.MEMORY.idFromName(user);
  const stub = env.MEMORY.get(id);
  await stub.fetch('https://do.append/append', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user, ...payload })
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = (url.pathname.replace(/\/+$/, '') || '/');

    const cid = request.headers.get('x-correlation-id') || crypto.randomUUID();

    if (method === 'OPTIONS' && isCorsPath(path)) {
      const headers = corsHeaders();
      headers.set('x-correlation-id', cid);
      return new Response(null, { status: 204, headers });
    }

    if (method === 'GET' && path === '/version') {
      const res = json({
        version: env.FALLBACK_APP_VERSION || 'v6.1',
        environment: 'production',
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders() });
      res.headers.set('x-correlation-id', cid);
      return res;
    }

    if (method === 'GET' && path === '/system/health') {
      const res = json({ status: 'ok', name: 'signal_q', timestamp: Date.now() }, { headers: corsHeaders() });
      res.headers.set('x-correlation-id', cid);
      return res;
    }

    const bearer = request.headers.get('authorization') || '';
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;

    if (path.startsWith('/actions/')) {
      if (
        !token ||
        (!safeCompare(token, env.USER_TOKEN) && !safeCompare(token, env.ADMIN_TOKEN))
      ) {
        const res = json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }

      if (method === 'GET' && path === '/actions/list') {
        const res = json({ actions: ['chat','probe_identity'] }, { headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }

      if (method === 'POST' && path === '/actions/chat') {
        const body = await request.json().catch(() => ({}));
        const user = body.user || 'default';
        const reply = { text: `ACK: ${body.prompt ?? ''}`.trim(), model: 'signal-q:echo' };
        await appendMemory(env, user, { kind: 'chat', prompt: body.prompt || '', reply });
        const res = json({ ok: true, reply }, { headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }

      if (method === 'POST' && path === '/actions/probe_identity') {
        const body = await request.json().catch(() => ({}));
        const result = {
          stability: 0.9, coherence: 0.88, authenticity: 0.92,
          recommendation: 'Stable. Proceed with deployment.'
        };
        await appendMemory(env, body.user || 'default', { kind: 'probe', input: body, result });
        const res = json({ ok: true, result }, { headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }
    }

    if (method === 'GET' && path.startsWith('/memory/')) {
      const user = path.split('/memory/')[1];
      const id = env.MEMORY.idFromName(user);
      const stub = env.MEMORY.get(id);
      const r = await stub.fetch(`https://do.read/read/${user}`);
      const headers = new Headers(r.headers);
      headers.set('x-correlation-id', cid);
      return new Response(r.body, { status: r.status, headers });
    }

    if (method === 'GET' && path === '/openapi.yaml') {
      const spec = await OPENAPI_JSON();
      const headers = corsHeaders();
      headers.set('content-type', 'application/yaml; charset=utf-8');
      headers.set('x-correlation-id', cid);
      const yaml = JSON.stringify(spec);
      return new Response(yaml, { status: 200, headers });
    }

    const res = json({ error: 'Not Found', path }, { status: 404 });
    res.headers.set('x-correlation-id', cid);
    return res;
  }
}

export { MemoryDO };
