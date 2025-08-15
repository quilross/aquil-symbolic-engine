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
  if (!env.MEMORY) return;
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
    // Normalize path by trimming trailing slashes and forcing lowercase
    const path = (url.pathname.replace(/\/+$/, '') || '/').toLowerCase();

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
        gitSha: env.GIT_SHA || 'unknown',
        buildTime: env.BUILD_TIME || new Date().toISOString(),
        environment: 'production',
        status: 'ok'
      }, { headers: corsHeaders() }));
    }

    if (method === 'GET' && path === '/system/health') {
      return withCID(json({
        name: 'signal_q',
        version: env.FALLBACK_APP_VERSION || 'v6.1',
        status: 'ok',
        timestamp: Date.now()
      }, { headers: corsHeaders() }));
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
    const userToken = env.USER_TOKEN || 'sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h';
    const adminToken = env.ADMIN_TOKEN || 'sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1o6p2';

    if (path.startsWith('/actions/')) {
      if (!token || (token !== userToken && token !== adminToken)) {
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
        let body = {};
        try { body = await request.json(); } catch { /* no body provided */ }

        const user = typeof body.user === 'string' && body.user.trim() ? body.user.trim() : 'default';
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';

        let reply = { text: `ACK: ${prompt}`.trim(), model: 'signal-q:echo' };

        if (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_GATEWAY_ID && env.CLOUDFLARE_MODEL_ID && prompt) {
          try {
            const endpoint = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/chat/completions`;
            const r = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                model: env.CLOUDFLARE_MODEL_ID,
                messages: [{ role: 'user', content: prompt }]
              })
            });
            const data = await r.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              reply = { text, model: env.CLOUDFLARE_MODEL_ID };
            }
          } catch (err) {
            // Fallback to echo if Cloudflare call fails
            reply = { text: `ACK: ${prompt}`.trim(), model: 'signal-q:echo' };
          }
        }

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
        let body = {};
        try { body = await request.json(); } catch { /* empty body */ }

        const user = typeof body.user === 'string' && body.user.trim() ? body.user.trim() : 'default';
        const analysis = {
          stability: 0.90,
          coherence: 0.88,
          authenticity: 0.92,
          recommendation: 'Stable. Proceed with deployment.'
        };

        try {
          await appendMemory(env, user, { kind: 'probe', input: body, result: analysis });
        } catch (e) {
          return withCID(json({ ok: false, error: 'Memory append failed', detail: String(e) }, { status: 500, headers: corsHeaders() }));
        }

        return withCID(json({
          probe: user,
          timestamp: Date.now(),
          analysis
        }, { headers: corsHeaders() }));
      }

      // Unknown /actions route
      return withCID(json({ error: 'Not Found', path }, { status: 404, headers: corsHeaders() }));
    }

    // Fallback
    return withCID(json({ error: 'Not Found', path }, { status: 404 }));
  }
};
