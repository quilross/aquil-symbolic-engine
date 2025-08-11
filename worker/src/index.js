// Helper functions as specified in requirements

function correlationIdFrom(req) {
  const v = req.headers.get('x-correlation-id');
  return (v && v.trim()) || (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
}

function problemJson(status, title, detail, cid, instance, type="about:blank") {
  const body = JSON.stringify({ type, title, status, detail, instance, status });
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/problem+json',
      'access-control-allow-origin': '*',
      'x-correlation-id': cid
    }
  });
}

function withBaseHeaders(res, cid) {
  const h = new Headers(res.headers || {});
  h.set('access-control-allow-origin', '*');
  h.set('x-correlation-id', cid);
  return new Response(res.body, { status: res.status || 200, headers: h });
}

// Import OpenAPI specification
import { openapi } from './openapi.js';

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    const cid = correlationIdFrom(request);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'authorization, content-type, x-correlation-id',
          'access-control-max-age': '600',
          'x-correlation-id': cid
        }
      });
    }

    // Public GETs
    if (request.method === 'GET' && path === '/system/health') {
      const body = JSON.stringify({ ok: true, ts: new Date().toISOString() });
      return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
    }

    if (request.method === 'GET' && path === '/version') {
      const body = JSON.stringify({ version: env?.BUILD_TIME || 'dev', commit: env?.COMMIT || 'unknown' });
      return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
    }

    // Serve spec
    if (request.method === 'GET' && path === '/openapi.yaml') {
      try {
        return new Response(openapi, {
          status: 200,
          headers: {
            'content-type': 'text/yaml; charset=utf-8',
            'access-control-allow-origin': '*',
            'x-correlation-id': cid
          }
        });
      } catch (e) {
        return problemJson(500, 'Spec Serve Error', e.message || 'Cannot load openapi-core.yaml', cid);
      }
    }

    // Auth for /actions/*
    if (path.startsWith('/actions/')) {
      const auth = request.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) {
        return problemJson(401, 'Unauthorized', 'Missing or invalid Bearer token.', cid);
      }
      // Minimal list endpoint
      if (request.method === 'POST' && path === '/actions/list') {
        const body = JSON.stringify({ actions: ['probe_identity','recalibrate_state','trigger_deploy','list'] });
        return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
      }
      // Stub others to 200 for now; your real handlers can replace these
      if (request.method === 'POST' && path === '/actions/probe_identity') {
        return withBaseHeaders(new Response(JSON.stringify({ who: 'signal-q' }), { status: 200, headers: { 'content-type': 'application/json' } }), cid);
      }
      if (request.method === 'POST' && path === '/actions/recalibrate_state') {
        return withBaseHeaders(new Response(null, { status: 200 }), cid);
      }
      if (request.method === 'POST' && path === '/actions/trigger_deploy') {
        return withBaseHeaders(new Response(null, { status: 200 }), cid);
      }
    }

    // Fallthrough 404
    return problemJson(404, 'Not Found', 'The requested endpoint was not found', cid, url.pathname);
  }
};