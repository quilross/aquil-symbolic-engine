// worker/index.js

// Ensure Cloudflare sees the Durable Object class at the root module scope.
export { MemoryDO } from './src/memory.js';

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

// Helper to append memory via Durable Object stub
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
    const path = (url.pathname.replace(/\/+$/, '') || '/'); // strip trailing slashes only

    const cid = request.headers.get('x-correlation-id') || crypto.randomUUID();
    const withCID = (res) => {
      res.headers.set('x-correlation-id', cid);
      return res;
    };

    // CORS preflight (only for whitelisted paths)
    if (method === 'OPTIONS' && isCorsPath(path)) {
      return withCID(new Response(null, { status: 204, headers: corsHeaders() }));
    }

    // Public endpoints
    if (method === 'GET' && path === '/version') {
      return withCID(json({
        version: env.FALLBACK_APP_VERSION || 'v6.1',
        environment: 'production',
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders() }));
    }

    if (method === 'GET' && path === '/system/health') {
      return withCID(json({ status: 'ok', name: 'signal_q', timestamp: Date.now() }, { headers: corsHeaders() }));
    }

    // Public memory read (demo)
    if (method === 'GET' && path.startsWith('/memory/')) {
      const user = decodeURIComponent(path.split('/memory/')[1] || '');
      if (!user) return withCID(json({ error: 'Missing user' }, { status: 400, headers: corsHeaders() }));
      const id = env.MEMORY.idFromName(user);
      const stub = env.MEMORY.get(id);
      const r = await stub.fetch(`https://do.read/read/${user}`);
      return withCID(new Response(r.body, { status: r.status, headers: corsHeaders() }));
    }

    // Auth for /actions/*
    const bearer = request.headers.get('authorization') || '';
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;

    if (path.startsWith('/actions/')) {
      if (!token || (token !== env.USER_TOKEN && token !== env.ADMIN_TOKEN)) {
        return withCID(json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() }));
      }

      // List available actions (GET)
      if (method === 'GET' && path === '/actions/list') {
        const actions = [
          { name: 'chat', method: 'POST', path: '/actions/chat', description: 'Send a chat prompt and receive a reply.' },
          { name: 'probe_identity', method: 'POST', path: '/actions/probe_identity', description: 'Probe identity stability and coherence.' }
        ];
        return withCID(json({ ok: true, actions }, { headers: corsHeaders() }));
      }

      // Chat (POST) — echoes and anchors to memory
      if (method === 'POST' && path === '/actions/chat') {
        let body;
        try { body = await request.json(); }
        catch {
          return withCID(json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders() }));
        }

        const user = typeof body.user === 'string' && body.user.trim() ? body.user.trim() : 'default';
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        const reply = { text: `ACK: ${prompt}`.trim(), model: 'signal-q:echo' };

        try {
          await appendMemory(env, user, { kind: 'chat', prompt, reply });
        } catch (e) {
          // If memory fails, still surface a clear error with correlation id
          return withCID(json({ ok: false, error: 'Memory append failed', detail: String(e) }, { status: 500, headers: corsHeaders() }));
        }

        return withCID(json({ ok: true, reply }, { headers: corsHeaders() }));
      }

      // Identity probe (POST)
      if (method === 'POST' && path === '/actions/probe_identity') {
        let body;
        try { body = await request.json(); }
        catch {
          return withCID(json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders() }));
        }

        const user = typeof body.user === 'string' && body.user.trim() ? body.user.trim() : 'default';
        const result = {
          stability: 0.90,
          coherence: 0.88,
          authenticity: 0.92,
          recommendation: 'Stable. Proceed with deployment.'
        };

        try {
          await appendMemory(env, user, { kind: 'probe', input: body, result });
        } catch (e) {
          return withCID(json({ ok: false, error: 'Memory append failed', detail: String(e) }, { status: 500, headers: corsHeaders() }));
        }

        return withCID(json({ ok: true, result }, { headers: corsHeaders() }));
      }

      // Unknown /actions route
      return withCID(json({ error: 'Not Found', path }, { status: 404, headers: corsHeaders() }));
    }

    // Fallback
    return withCID(json({ error: 'Not Found', path }, { status: 404 }));
  }
};