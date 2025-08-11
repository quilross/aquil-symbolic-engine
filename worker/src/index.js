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

// Import symbolic processing functions
import { classifyGKState, shapeResponse } from './symbolic/index.js';

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/'; // Remove trailing slashes except for root
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
      const body = JSON.stringify({
        name: 'signal-q',
        version: env?.APP_VERSION || 'v6.1',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
      return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
    }

    if (request.method === 'GET' && path === '/version') {
      const body = JSON.stringify({
        version: env?.APP_VERSION || 'dev',
        gitSha: env?.COMMIT || 'unknown',
        buildTime: env?.BUILD_TIME || new Date().toISOString(),
        environment: env?.NODE_ENV || 'development'
      });
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

    // Memory retrieval endpoint (public)
    if (request.method === 'GET' && path.startsWith('/memory/')) {
      const userId = path.split('/')[2];
      if (!userId) {
        return problemJson(400, 'Bad Request', 'User ID is required', cid);
      }
      
      try {
        // Get memory for user from Durable Object
        if (env.MEMORY) {
          const id = env.MEMORY.idFromName(userId);
          const stub = env.MEMORY.get(id);
          const response = await stub.fetch(request);
          return response;
        } else {
          // Fallback when MEMORY DO not available
          return withBaseHeaders(new Response(JSON.stringify([]), { 
            status: 200, 
            headers: { 'content-type': 'application/json' } 
          }), cid);
        }
      } catch (error) {
        return problemJson(500, 'Memory Service Error', 'Failed to retrieve memory', cid);
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
        const body = JSON.stringify({ actions: ['probe_identity','recalibrate_state','trigger_deploy','list','chat'] });
        return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
      }
      
      // Chat endpoint with Gene Keys classification
      if (request.method === 'POST' && path === '/actions/chat') {
        try {
          let requestData = {};
          try {
            requestData = await request.json();
          } catch (e) {
            // Empty body is fine
          }
          
          const message = requestData.message || '';
          const userId = requestData.user || null;
          
          if (!message) {
            return problemJson(400, 'Bad Request', 'Message is required', cid);
          }
          
          // Classify using Gene Keys
          const gkClassification = classifyGKState(message);
          
          // Shape response using policy
          const rawResponse = `I understand you're saying: "${message}". Let me help you work through this.`;
          const shapedResponse = shapeResponse({
            activeKey: gkClassification.activeKey,
            state: gkClassification.state,
            draft: rawResponse,
            decisionPresent: /\b(choose|decide|option|pick)\b/i.test(message),
            symbolismHigh: /\b(cosmic|sacred|mystical|divine|universe)\b/i.test(message)
          });
          
          // Log to memory if user ID provided
          if (userId && env.MEMORY) {
            try {
              const id = env.MEMORY.idFromName(userId);
              const stub = env.MEMORY.get(id);
              const memoryRequest = new Request('https://memory/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  key: gkClassification.activeKey,
                  tone: gkClassification.state,
                  cues: gkClassification.cues
                })
              });
              // Fire and forget - don't wait for memory logging
              stub.fetch(memoryRequest).catch(e => console.error('Memory logging failed:', e));
            } catch (error) {
              console.error('Memory logging error:', error);
            }
          }
          
          const responseBody = JSON.stringify({
            response: shapedResponse,
            gk_classification: {
              activeKey: gkClassification.activeKey,
              state: gkClassification.state,
              cues: gkClassification.cues
            },
            timestamp: new Date().toISOString()
          });
          
          return withBaseHeaders(new Response(responseBody, { 
            status: 200, 
            headers: { 'content-type': 'application/json' } 
          }), cid);
          
        } catch (error) {
          console.error('Chat endpoint error:', error);
          return problemJson(500, 'Chat Processing Error', 'Failed to process chat message', cid);
        }
      }
      // Stub others to 200 for now; your real handlers can replace these
      if (request.method === 'POST' && path === '/actions/probe_identity') {
        const body = JSON.stringify({ 
          probe: 'Identity confirmed',
          timestamp: new Date().toISOString(),
          analysis: {
            stability: 0.92,
            coherence: 'high',
            authenticity: 0.88,
            recommendation: 'Identity integration optimal - proceed with confidence'
          }
        });
        return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
      }
      if (request.method === 'POST' && path === '/actions/recalibrate_state') {
        const body = JSON.stringify({
          state: 'recalibrated',
          timestamp: new Date().toISOString(),
          identity_key: 'primary_manifester',
          dominant_emotion: 'clarity'
        });
        return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
      }
      if (request.method === 'POST' && path === '/actions/trigger_deploy') {
        const body = JSON.stringify({
          deployment: 'triggered',
          timestamp: new Date().toISOString()
        });
        return withBaseHeaders(new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }), cid);
      }
    }

    // Fallthrough 404
    return problemJson(404, 'Not Found', 'The requested endpoint was not found', cid, url.pathname);
  }
};
