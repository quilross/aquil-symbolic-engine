import { MemoryDO } from './src/memory.js';

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
      if (!token || (token !== env.USER_TOKEN && token !== env.ADMIN_TOKEN)) {
        const res = json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }

      if (method === 'GET' && path === '/actions/list') {
        const res = json({ error: 'Not Found', path }, { status: 404, headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }

      if (method === 'POST' && path === '/actions/chat') {
        const res = json({ error: 'Not Found', path }, { status: 404, headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }

      if (method === 'POST' && path === '/actions/probe_identity') {
        const res = json({ error: 'Not Found', path }, { status: 404, headers: corsHeaders() });
        res.headers.set('x-correlation-id', cid);
        return res;
      }
    }

    if (method === 'GET' && path.startsWith('/memory/')) {
      const res = json({ error: 'Not Found', path }, { status: 404 });
      res.headers.set('x-correlation-id', cid);
      return res;
    }

    const res = json({ error: 'Not Found', path }, { status: 404 });
    res.headers.set('x-correlation-id', cid);
    return res;
  }
}

export { MemoryDO };
