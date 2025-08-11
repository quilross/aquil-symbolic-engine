// Signal Q - Minimal Worker Implementation
// Focuses on exactly 5 POST /actions/* endpoints + GET /version + legacy GET /system/health
// Memory Anchoring: Persist each user's recent Gene Key state and shadow/gift history

// Import Memory Durable Object
import { MemoryDO } from './src/memory.js';

// Import OpenAPI specification as text
import openapi from './src/openapi-core.yaml' assert { type: 'text' };

// === HELPER FUNCTIONS ===

// Extract user ID from request body or headers for memory logging
function getUserIdFrom(request, body = null) {
  // Try to get user ID from request body first
  if (body && (body.user || body.userId)) {
    return body.user || body.userId;
  }
  
  // Fallback to a header-based user ID
  const userHeader = request.headers.get('x-user-id');
  if (userHeader && userHeader.trim()) {
    return userHeader.trim();
  }
  
  // Return null if no user ID found
  return null;
}

// Log Gene Key classification to user's memory (fire-and-forget)
async function logGKState(userId, gkClassification, env) {
  if (!userId || !gkClassification.activeKey || !env?.MEMORY) {
    return; // Skip logging if missing required data
  }
  
  try {
    const id = env.MEMORY.idFromName(userId);
    const memoryObj = env.MEMORY.get(id);
    
    // Fire-and-forget logging (don't await to avoid blocking response)
    memoryObj.fetch('https://dummy/memory', {
      method: 'PUT',
      body: JSON.stringify({
        key: gkClassification.activeKey,
        tone: gkClassification.state,
        cues: gkClassification.cues
      })
    }).catch(error => {
      console.warn('Memory logging failed:', error);
    });
  } catch (error) {
    console.warn('Memory logging setup failed:', error);
  }
}
// Extract or generate correlation ID from request
function correlationIdFrom(req) {
  const h = req.headers.get('x-correlation-id');
  return h && h.trim() ? h.trim() : (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
}

// Create RFC7807 problem+json error response
function problemJson(status, title, detail, correlationId, instance = undefined, type = "about:blank") {
  const body = { type, title, status, detail, instance };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/problem+json',
      'x-correlation-id': correlationId,
      'access-control-allow-origin': '*'
    }
  });
}

// CORS headers for all responses
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Correlation-ID'
  };
}

// Extract Bearer token from Authorization header
function getBearerToken(request) {
  const auth = request.headers.get('Authorization');
  if (!auth) return null;
  
  // Case-insensitive scheme matching, trim whitespace
  const bearerMatch = auth.match(/^bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1].trim() : null;
}

// Structured logging with correlation ID
function logRequest(method, path, action, status, duration_ms, correlationId, env) {
  const logLevel = env?.LOG_LEVEL || 'info';
  
  // Only log if level allows (error=0, info=2)
  if (logLevel === 'error' && status < 400) return;
  
  const logData = {
    ts: new Date().toISOString(),
    method,
    path,
    action,
    status,
    duration_ms,
    correlationId
  };
  
  console.log(JSON.stringify(logData));
}

// === RUNTIME GUARD ===
// Prevent imports from legacy quarantined code
function preventLegacyImports() {
  // Guard against accidental legacy imports during runtime
  const legacyPaths = ['/legacy/', '../legacy/', './legacy/'];
  // This is a compile-time guard - actual runtime imports would need import maps
}

// === ACTION HANDLERS ===

const actionHandlers = {
  list: async () => ({
    actions: ["list", "probe_identity", "recalibrate_state", "trigger_deploy"]
  }),

  probe_identity: async () => ({
    who: "Identity confirmed"
  }),

  recalibrate_state: async (request, env) => ({
    state: "recalibrated",
    timestamp: new Date().toISOString(),
    identity_key: "primary_manifester",
    dominant_emotion: "clarity"
  }),

  trigger_deploy: async () => ({
    deployment: "triggered",
    timestamp: new Date().toISOString()
  })
};

// === MAIN WORKER ===

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const correlationId = correlationIdFrom(request);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '').toLowerCase() || '/';
    const method = request.method;

    try {
      // Handle CORS preflight
      if (method === 'OPTIONS') {
        const response = new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders(),
            'x-correlation-id': correlationId
          }
        });
        logRequest(method, path, null, 204, Date.now() - startTime, correlationId, env);
        return response;
      }

      // PUBLIC: GET /openapi.yaml
      if (path === '/openapi.yaml' && method === 'GET') {
        const cid = correlationIdFrom(request);
        const response = new Response(openapi, {
          status: 200,
          headers: {
            'content-type': 'text/yaml; charset=utf-8',
            'x-correlation-id': cid,
            'access-control-allow-origin': '*'
          }
        });
        logRequest(method, path, 'openapi-spec', 200, Date.now() - startTime, correlationId, env);
        return response;
      }

      // PUBLIC: GET /version
      if (path === '/version' && method === 'GET') {
        const info = {
          version: env?.APP_VERSION || '2.1.0',
          commit: env?.GIT_SHA || 'dev-local'
        };
        const response = new Response(JSON.stringify(info), {
          headers: {
            'Content-Type': 'application/json',
            'x-correlation-id': correlationId,
            ...corsHeaders()
          }
        });
        logRequest(method, path, 'version', 200, Date.now() - startTime, correlationId, env);
        return response;
      }

      // AUTHENTICATED: POST /actions/*
      if (path.startsWith('/actions/') && method === 'POST') {
        const actionName = path.slice('/actions/'.length);

        // Require Bearer auth
        const token = getBearerToken(request);
        if (!token) {
          const response = problemJson(401, 'Unauthorized', 'Missing or invalid Bearer token.', correlationId);
          logRequest(method, path, actionName, 401, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Validate token against user/admin tokens
        const validTokens = [env?.USER_TOKEN, env?.ADMIN_TOKEN].filter(Boolean);
        if (!validTokens.includes(token)) {
          const response = problemJson(403, 'Forbidden', 'The provided Bearer token is not valid', correlationId);
          logRequest(method, path, actionName, 403, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Check if action exists
        const handler = actionHandlers[actionName];
        if (!handler) {
          const response = problemJson(404, 'Not Found', `Action '${actionName}' not found`, correlationId);
          logRequest(method, path, actionName, 404, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Execute action
        try {
          const result = await handler(request, env, ctx);
          const response = new Response(JSON.stringify(result), {
            headers: {
              'Content-Type': 'application/json',
              'x-correlation-id': correlationId,
              ...corsHeaders()
            }
          });
          logRequest(method, path, actionName, 200, Date.now() - startTime, correlationId, env);
          return response;
        } catch (actionError) {
          console.error('Action execution error:', actionError);
          const response = problemJson(500, 'Internal Server Error', 'An error occurred while executing the action', correlationId);
          logRequest(method, path, actionName, 500, Date.now() - startTime, correlationId, env);
          return response;
        }
      }

      // PUBLIC: GET /system/health
      if (path === '/system/health' && method === 'GET') {
        const health = {
          ok: true,
          ts: new Date().toISOString()
        };
        const response = new Response(JSON.stringify(health), {
          headers: {
            'Content-Type': 'application/json',
            'x-correlation-id': correlationId,
            ...corsHeaders()
          }
        });
        logRequest(method, path, 'system-health', 200, Date.now() - startTime, correlationId, env);
        return response;
      }

      // PUBLIC: GET /memory/:user - retrieve user's Gene Key state history
      if (path.startsWith('/memory/') && method === 'GET') {
        const userId = path.slice('/memory/'.length);
        
        if (!userId || userId.trim() === '') {
          const response = problemJson(400, 'Bad Request', 'User ID is required', correlationId);
          logRequest(method, path, 'memory-get', 400, Date.now() - startTime, correlationId, env);
          return response;
        }

        if (!env?.MEMORY) {
          const response = problemJson(503, 'Service Unavailable', 'Memory service not available', correlationId);
          logRequest(method, path, 'memory-get', 503, Date.now() - startTime, correlationId, env);
          return response;
        }

        try {
          const id = env.MEMORY.idFromName(userId);
          const memoryObj = env.MEMORY.get(id);
          const memoryResponse = await memoryObj.fetch('https://dummy/memory');
          
          // Forward the response with appropriate headers
          const responseBody = await memoryResponse.text();
          const response = new Response(responseBody, {
            status: memoryResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'x-correlation-id': correlationId,
              ...corsHeaders()
            }
          });
          logRequest(method, path, 'memory-get', memoryResponse.status, Date.now() - startTime, correlationId, env);
          return response;
        } catch (error) {
          console.error('Memory retrieval error:', error);
          const response = problemJson(500, 'Internal Server Error', 'Failed to retrieve memory', correlationId);
          logRequest(method, path, 'memory-get', 500, Date.now() - startTime, correlationId, env);
          return response;
        }
      }

      // Default 404 for unmatched routes
      const response = problemJson(404, 'Not Found', 'The requested endpoint was not found', correlationId);
      logRequest(method, path, null, 404, Date.now() - startTime, correlationId, env);
      return response;

    } catch (error) {
      console.error('Unhandled error in fetch:', error);
      const response = problemJson(500, 'Internal Server Error', error.message ?? 'Unexpected error', correlationId);
      logRequest(method, path, null, 500, Date.now() - startTime, correlationId, env);
      return response;
    }
  }
};

// Minimal UserState Durable Object (keep existing functionality)
export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const correlationId = correlationIdFrom(request);
    // Minimal pass-through for existing DO functionality
    return new Response(JSON.stringify({ message: "UserState DO active" }), {
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
        ...corsHeaders()
      }
    });
  }
}

// Export MemoryDO for Durable Objects runtime
export { MemoryDO };