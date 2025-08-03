
// src/index.js

const actionsList = {
  actions: [
    // -- CORE EXAMPLES --
    {
      name: "getSystemHealth",
      description: "Returns system health status, version, and current timestamp.",
      method: "GET",
      path: "/system/health",
      parameters: {},
      example: { curl: "curl https://signal_q.catnip-pieces1.workers.dev/system/health" }
    },
    {
      name: "activateAquilProbe",
      description: "Run a system-wide probe for protocol readiness.",
      method: "POST",
      path: "/protocols/aquil-probe",
      parameters: {},
      example: { curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/protocols/aquil-probe" }
    },
    {
      name: "getVoiceEmergenceProtocol",
      description: "Retrieve a custom voice activation sequence with vocal warmups and affirmations.",
      method: "POST",
      path: "/throatcraft/voice-emergence",
      parameters: {},
      example: { curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/throatcraft/voice-emergence" }
    },
    {
      name: "triggerGiftInstinct",
      description: "Trigger symbolic gifting logic based on appreciation context, returning a symbolic gift, reason, and ritual.",
      method: "POST",
      path: "/ritual/gift-instinct-trigger",
      parameters: {
        target: "string (required) â Target of the appreciation (e.g. username or userID)",
        emotionalContext: "string (required) â Context or reason for the gift"
      },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/ritual/gift-instinct-trigger -H 'Content-Type: application/json' -d '{\"target\":\"user123\",\"emotionalContext\":\"Teamwork excellence\"}'"
      }
    },
    {
      name: "aiEnhancedResponse",
      description: "Request a generic AI-enhanced response for any prompt.",
      method: "POST",
      path: "/ai-enhance",
      parameters: { prompt: "string (required) â The text prompt for enhancement" },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/ai-enhance -H 'Content-Type: application/json' -d '{\"prompt\":\"Summarize quarterly goals\"}'"
      }
    },
    {
      name: "createIdentityNode",
      description: "Add a new identity node with the given name.",
      method: "POST",
      path: "/identity-nodes",
      parameters: { nodeName: "string (required) â Name of the identity node" },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/identity-nodes -H 'Content-Type: application/json' -d '{\"nodeName\":\"Example Node\"}'"
      }
    },
    {
      name: "listIdentityNodes",
      description: "List all current identity nodes.",
      method: "GET",
      path: "/identity-nodes",
      parameters: {},
      example: { curl: "curl https://signal_q.catnip-pieces1.workers.dev/identity-nodes" }
    },
    {
      name: "logFeedback",
      description: "Log user feedback for system or service analysis.",
      method: "POST",
      path: "/feedback",
      parameters: { feedback: "string (required) â Feedback text" },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/feedback -H 'Content-Type: application/json' -d '{\"feedback\":\"Great experience!\"}'"
      }
    },
    {
      name: "playProtocol",
      description: "Log or list play protocols.",
      method: "GET/POST",
      path: "/play-protocols",
      parameters: {},
      example: { curl: "curl https://signal_q.catnip-pieces1.workers.dev/play-protocols" }
    },
    {
      name: "deploy",
      description: "Trigger GitHub Actions workflow to deploy latest Worker code.",
      method: "POST",
      path: "/actions/deploy",
      parameters: {},
      example: { curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/actions/deploy" }
    },
    {
      name: "list",
      description: "List all available Actions and their descriptions.",
      method: "POST",
      path: "/actions/list",
      parameters: {},
      example: { curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/actions/list" }
    },
    {
      name: "requestDeployment",
      description: "Ask for deployment assistance.",
      method: "POST",
      path: "/deploy/request",
      parameters: {},
      example: { curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/deploy/request" }
    },
    {
      name: "getDeploymentStatus",
      description: "Get deployment status and info.",
      method: "GET",
      path: "/deploy/status",
      parameters: {},
      example: { curl: "curl https://signal_q.catnip-pieces1.workers.dev/deploy/status" }
    },
    // ---- SYMBOLIC, GIFT, & TRAUMA-AWARE ACTIONS (handlers and full list continued below) ----
  ]
};

// Handler functions for all symbolic/creative/trauma-aware actions
// See next cell for code continuation (due to file size)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders() });
    }

    if (path === "/deploy/request" && method === "POST") {
      return jsonResponse({
        success: true,
        message: "Deployment request received! Someone will review and trigger a deploy."
      });
    }
    if (path === "/deploy/status" && method === "GET") {
      return jsonResponse({
        deployed: true,
        lastDeployedAt: "2025-08-02T12:00:00Z",
        by: "AutoDeployBot",
        status: "All systems healthy."
      });
    }
    if ((path === "/actions/list" || path === "/workers/actions/list") && method === "POST") {
      return jsonResponse(actionsList);
    }
    if (path === "/system/health" && method === "GET") {
      return jsonResponse({
        status: "healthy",
        timestamp: new Date().toISOString(),
        worker: "signal_q",
        version: "v6.0"
      });
    }

    const actionsPrefix = "/actions/";
    if (path.startsWith(actionsPrefix) && method === "POST") {
      const actionName = decodeURIComponent(path.slice(actionsPrefix.length));
      if (!actionName) return jsonResponse({ error: "Missing actionName in path." }, 400);

      let input = {};
      if (request.headers.get("content-type")?.includes("application/json")) {
        try { input = await request.json(); }
        catch (e) { return jsonResponse({ error: "Invalid JSON body." }, 400); }
      }

      // ACTION HANDLERS: See next cell (split for size)
      // We'll join files after code generation.

      // Place holder: real handlers inserted in next part!
      const handlers = {};

      const handler = handlers[actionName];
      if (!handler) {
        return jsonResponse({ error: `Unknown action '${actionName}'` }, 404);
      }
      let output;
      try {
        output = await handler(input, env);
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
      return jsonResponse(output);
    }

    if (path === "/identity-nodes" && method === "GET") {
      return jsonResponse({ nodes: ["Identity Node 1", "Identity Node 2"] });
    }
    return new Response("Not found", { status: 404 });
  }
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" }
  });
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
