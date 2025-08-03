// worker/src/index.js (Signal Q Hybrid: Actions + Durable Object + Clean Routing)

import { UserState } from './UserState.js'; // Durable Object class

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id"
};

// --- Actions List (self-documenting) ---
const actionsList = [
  { name: "getSystemHealth", description: "Returns system health status, version, and current timestamp.", method: "GET", path: "/system/health" },
  { name: "activateAquilProbe", description: "Run a system-wide probe for protocol readiness.", method: "POST", path: "/protocols/aquil-probe" },
  { name: "getVoiceEmergenceProtocol", description: "Retrieve a custom voice activation sequence with vocal warmups and affirmations.", method: "POST", path: "/throatcraft/voice-emergence" },
  { name: "aiEnhancedResponse", description: "Request a generic AI-enhanced response for any prompt.", method: "POST", path: "/ai-enhance" },
  { name: "listIdentityNodes", description: "List all current identity nodes.", method: "GET", path: "/identity-nodes" },
  { name: "logFeedback", description: "Log user feedback for system or service analysis.", method: "POST", path: "/feedback" },
  { name: "deploy", description: "Trigger GitHub Actions workflow to deploy latest Worker code.", method: "POST", path: "/actions/deploy" },
  { name: "list", description: "List all available Actions and their descriptions.", method: "POST", path: "/actions/list" },
  { name: "getDeploymentStatus", description: "Get deployment status and info.", method: "GET", path: "/deploy/status" }
];

// --- Handlers for each action ---
const handlers = {
  getSystemHealth: async () => ({
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  }),
  activateAquilProbe: async () => ({
    probe: "AQUIL Probe activated",
    time: new Date().toISOString()
  }),
  getVoiceEmergenceProtocol: async () => ({
    sequence: ["Hum", "Speak affirmation", "Resonance check"]
  }),
  aiEnhancedResponse: async (input) => ({
    enhanced: `[AI]: ${input.prompt || "No prompt"}`
  }),
  listIdentityNodes: async () => ({
    nodes: ["Identity Node 1", "Identity Node 2"]
  }),
  logFeedback: async (input) => ({
    received: true,
    feedback: input.feedback || ""
  }),
  deploy: async () => ({
    success: true,
    message: "Deploy triggered (simulate)."
  }),
  list: async () => ({ actions: actionsList }),
  getDeploymentStatus: async () => ({
    deployed: true,
    lastDeployedAt: "2025-08-02T12:00:00Z",
    by: "AutoDeployBot",
    status: "All systems healthy."
  })
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event) {
  try {
    const { method } = request;
    const url = new URL(request.url);
    const path = url.pathname;

    // --- CORS preflight ---
    if (method === 'OPTIONS') return corsPreflight();

    // --- Dynamic actions routing: /actions/{actionName} ---
    const actionsPrefix = "/actions/";
    if (path.startsWith(actionsPrefix) && method === "POST") {
      const actionName = decodeURIComponent(path.slice(actionsPrefix.length));
      if (!actionName) return jsonResponse({ error: "Missing actionName in path." }, 400);
      let input = {};
      if (request.headers.get("content-type")?.includes("application/json")) {
        try { input = await request.json(); }
        catch (e) { return jsonResponse({ error: "Invalid JSON body." }, 400); }
      }
      const handler = handlers[actionName];
      if (!handler) {
        return jsonResponse({ error: `Unknown action '${actionName}'` }, 404);
      }
      let output;
      try {
        output = await handler(input);
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
      return jsonResponse(output);
    }

    // --- Static action discovery endpoints ---
    if ((path === "/actions/list" || path === "/workers/actions/list") && method === "POST") {
      return jsonResponse(await handlers.list());
    }
    if (path === "/system/health" && method === "GET") {
      return jsonResponse(await handlers.getSystemHealth());
    }
    if (path === "/deploy/status" && method === "GET") {
      return jsonResponse(await handlers.getDeploymentStatus());
    }

    // --- Durable Object Routing ---
    // Example: routes all other requests through UserState DO based on X-User-Id header (or anonymous fallback)
    if (event && event.env && event.env.USER_STATE) {
      const userId = request.headers.get('X-User-Id') || 'anonymous';
      const id = event.env.USER_STATE.idFromName(userId);
      const obj = event.env.USER_STATE.get(id);
      // Proxy the request to the Durable Object (UserState)
      return obj.fetch(request);
    }

    // --- Fallback ---
    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function jsonResponse(obj, status = 200) {
  return new Response(
    JSON.stringify(obj),
    { status, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
}

function errorResponse(error) {
  return new Response(
    JSON.stringify({ error: error?.message || "Internal Server Error" }),
    { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
}

export { UserState };
export default handleRequest;
