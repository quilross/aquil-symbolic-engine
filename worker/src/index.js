// Signal Q - Minimal Worker Implementation
// Focuses on exactly 5 POST /actions/* endpoints + GET /version + legacy GET /system/health

// === HELPER FUNCTIONS ===

// Generate correlation ID for error tracking
function generateCorrelationId() {
  return crypto.randomUUID();
}

// CORS headers for all responses
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type'
  };
}

// Create RFC7807 problem+json error response
function problemJSON({ title, detail, status }, correlationId) {
  const problemData = {
    type: "about:blank",
    title,
    detail,
    status,
    correlationId,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(problemData), {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Correlation-ID': correlationId,
      ...corsHeaders()
    }
  });
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

// === ACTION HANDLERS ===

const actionHandlers = {
  list: async () => ({
    actions: ["list", "system_health", "probe_identity", "recalibrate_state", "deploy"]
  }),

  system_health: async () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    worker: "signal_q",
    version: "v6.0"
  }),

  probe_identity: async () => ({
    probe: "Identity confirmed",
    timestamp: new Date().toISOString(),
    analysis: {
      stability: 0.92,
      coherence: "high",
      authenticity: 0.88,
      recommendation: "Identity integration optimal - proceed with confidence"
    }
  }),

  recalibrate_state: async (request, env) => ({
    state: "recalibrated",
    timestamp: new Date().toISOString(),
    identity_key: "primary_manifester",
    dominant_emotion: "clarity"
  }),

  deploy: async () => ({
    deployment: "triggered",
    timestamp: new Date().toISOString()
  })
};

// === MAIN WORKER ===

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const correlationId = request.headers.get('X-Correlation-ID') || generateCorrelationId();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, ''); // Remove trailing slash
    const method = request.method;

    try {
      // Handle CORS preflight for /actions/* and /version
      if (method === 'OPTIONS') {
        if (path.startsWith('/actions/') || path === '/version') {
          const response = new Response(null, {
            status: 204,
            headers: corsHeaders()
          });
          logRequest(method, path, null, 204, Date.now() - startTime, correlationId, env);
          return response;
        }
      }

      // PUBLIC: GET /version
      if (path === '/version' && method === 'GET') {
        const versionInfo = {
          version: "2.1.0",
          gitSha: env?.GIT_SHA || "local-development",
          buildTime: env?.BUILD_TIME || new Date().toISOString(),
          environment: env?.NODE_ENV || "development"
        };

        const response = new Response(JSON.stringify(versionInfo), {
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            ...corsHeaders()
          }
        });
        logRequest(method, path, "version", 200, Date.now() - startTime, correlationId, env);
        return response;
      }

      // AUTHENTICATED: POST /actions/*
      if (path.startsWith('/actions/') && method === 'POST') {
        const actionName = path.slice('/actions/'.length);
        
        // Require Bearer auth
        const token = getBearerToken(request);
        if (!token) {
          const response = problemJSON({
            title: 'Authentication Required',
            detail: 'Bearer token is required for action endpoints',
            status: 401
          }, correlationId);
          logRequest(method, path, actionName, 401, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Validate token
        const validTokens = [env?.SIGNALQ_API_TOKEN, env?.SIGNALQ_ADMIN_TOKEN].filter(Boolean);
        if (!validTokens.includes(token)) {
          const response = problemJSON({
            title: 'Invalid Credentials',
            detail: 'The provided Bearer token is not valid',
            status: 401
          }, correlationId);
          logRequest(method, path, actionName, 401, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Check for admin-only restrictions on deploy action
        if (actionName === 'deploy' && token === env?.SIGNALQ_API_TOKEN && env?.SIGNALQ_ADMIN_TOKEN) {
          // If admin token is configured and user is using regular token for deploy, deny access
          const response = problemJSON({
            title: 'Insufficient Permissions',
            detail: 'Deploy action requires administrative privileges',
            status: 403
          }, correlationId);
          logRequest(method, path, actionName, 403, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Check if action exists
        const handler = actionHandlers[actionName];
        if (!handler) {
          const response = problemJSON({
            title: 'Not Found',
            detail: `Action '${actionName}' not found`,
            status: 404
          }, correlationId);
          logRequest(method, path, actionName, 404, Date.now() - startTime, correlationId, env);
          return response;
        }

        // Execute action
        try {
          const result = await handler(request, env, ctx);
          const response = new Response(JSON.stringify(result), {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId,
              ...corsHeaders()
            }
          });
          logRequest(method, path, actionName, 200, Date.now() - startTime, correlationId, env);
          return response;
        } catch (actionError) {
          console.error('Action execution error:', actionError);
          const response = problemJSON({
            title: 'Internal Server Error',
            detail: 'An error occurred while executing the action',
            status: 500
          }, correlationId);
          logRequest(method, path, actionName, 500, Date.now() - startTime, correlationId, env);
          return response;
        }
      }

      // LEGACY: GET /system/health (with deprecation headers)
      if (path === '/system/health' && method === 'GET') {
        const token = getBearerToken(request);
        if (!token) {
          const response = problemJSON({
            title: 'Authentication Required',
            detail: 'Bearer token is required to access this endpoint',
            status: 401
          }, correlationId);
          logRequest(method, path, "legacy-system-health", 401, Date.now() - startTime, correlationId, env);
          return response;
        }

        const validTokens = [env?.SIGNALQ_API_TOKEN, env?.SIGNALQ_ADMIN_TOKEN].filter(Boolean);
        if (!validTokens.includes(token)) {
          const response = problemJSON({
            title: 'Invalid Credentials',
            detail: 'The provided Bearer token is not valid',
            status: 401
          }, correlationId);
          logRequest(method, path, "legacy-system-health", 401, Date.now() - startTime, correlationId, env);
          return response;
        }

        const healthData = await actionHandlers.system_health();
        const response = new Response(JSON.stringify(healthData), {
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            'Deprecation': 'true',
            'Sunset': '2025-12-31T00:00:00Z',
            'Link': 'https://github.com/quilross/aquil-symbolic-engine#actions_system_health; rel="replacement"',
            ...corsHeaders()
          }
        });
        logRequest(method, path, "legacy-system-health", 200, Date.now() - startTime, correlationId, env);
        return response;
      }

      // Default 404 for unmatched routes
      const response = problemJSON({
        title: 'Not Found',
        detail: 'The requested endpoint was not found',
        status: 404
      }, correlationId);
      logRequest(method, path, null, 404, Date.now() - startTime, correlationId, env);
      return response;

    } catch (error) {
      console.error('Unhandled error in fetch:', error);
      const response = problemJSON({
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred while processing your request',
        status: 500
      }, correlationId);
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
    // Minimal pass-through for existing DO functionality
    return new Response(JSON.stringify({ message: "UserState DO active" }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders()
      }
    });
  }
}