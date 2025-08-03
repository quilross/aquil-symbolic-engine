// src/index.js

// (1) Import the Actions List (define it in this file for full portability!)
const actionsList = {
  actions: [
    {
      name: "getSystemHealth",
      description: "Returns system health status, version, and current timestamp.",
      method: "GET",
      path: "/system/health",
      parameters: {},
      example: {
        curl: "curl https://signal_q.catnip-pieces1.workers.dev/system/health"
      }
    },
    {
      name: "activateAquilProbe",
      description: "Run a system-wide probe for protocol readiness.",
      method: "POST",
      path: "/protocols/aquil-probe",
      parameters: {},
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/protocols/aquil-probe"
      }
    },
    {
      name: "getVoiceEmergenceProtocol",
      description: "Retrieve a custom voice activation sequence.",
      method: "POST",
      path: "/throatcraft/voice-emergence",
      parameters: {},
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/throatcraft/voice-emergence"
      }
    },
    {
      name: "triggerGiftInstinct",
      description: "Trigger symbolic gifting logic based on appreciation context.",
      method: "POST",
      path: "/ritual/gift-instinct-trigger",
      parameters: {
        target: "string (required) — Target of the appreciation (e.g. username or userID)",
        emotionalContext: "string (required) — Context or reason for the gift"
      },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/ritual/gift-instinct-trigger -H 'Content-Type: application/json' -d '{\"target\":\"user123\",\"emotionalContext\":\"Teamwork excellence\"}'"
      }
    },
    {
      name: "aiEnhancedResponse",
      description: "Request a generic AI-enhanced response.",
      method: "POST",
      path: "/ai-enhance",
      parameters: {
        prompt: "string (required) — The text prompt for enhancement"
      },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/ai-enhance -H 'Content-Type: application/json' -d '{\"prompt\":\"Summarize quarterly goals\"}'"
      }
    },
    {
      name: "createIdentityNode",
      description: "Add a new identity node.",
      method: "POST",
      path: "/identity-nodes",
      parameters: {
        nodeName: "string (required) — Name of the identity node"
      },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/identity-nodes -H 'Content-Type: application/json' -d '{\"nodeName\":\"Example Node\"}'"
      }
    },
    {
      name: "listIdentityNodes",
      description: "List all identity nodes.",
      method: "GET",
      path: "/identity-nodes",
      parameters: {},
      example: {
        curl: "curl https://signal_q.catnip-pieces1.workers.dev/identity-nodes"
      }
    },
    {
      name: "logFeedback",
      description: "Log user feedback for analysis.",
      method: "POST",
      path: "/feedback",
      parameters: {
        feedback: "string (required) — Feedback text"
      },
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
      example: {
        curl: "curl https://signal_q.catnip-pieces1.workers.dev/play-protocols"
      }
    },
    {
      name: "deploy",
      description: "Trigger GitHub Actions workflow to deploy latest Worker code.",
      method: "POST",
      path: "/actions/deploy",
      parameters: {},
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/actions/deploy"
      }
    },
    {
      name: "list",
      description: "List all available Actions and their descriptions.",
      method: "POST",
      path: "/actions/list",
      parameters: {},
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/actions/list"
      }
    }
    // Add further endpoints here as you expand!
  ]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders() });
    }

    // Health check
    if (path === "/system/health" && method === "GET") {
      return jsonResponse({
        status: "healthy",
        timestamp: new Date().toISOString(),
        worker: "signal_q",
        version: "v6.0"
      });
    }

    // Actions endpoints
    const actionsPrefix = "/actions/";
    if (path.startsWith(actionsPrefix) && method === "POST") {
      const actionName = decodeURIComponent(path.slice(actionsPrefix.length));
      if (!actionName) {
        return jsonResponse({ error: "Missing actionName in path." }, 400);
      }

      let input = {};
      if (request.headers.get("content-type")?.includes("application/json")) {
        try {
          input = await request.json();
        } catch (e) {
          return jsonResponse({ error: "Invalid JSON body." }, 400);
        }
      }

      const handlers = {
        getSystemHealth: async () => ({
          status: "healthy",
          timestamp: new Date().toISOString(),
          worker: "signal_q",
          version: "v6.0"
        }),
        activateAquilProbe: async () => ({
          result: "probe-executed",
          aiReasoning: "Auto-decision: Proceeded.",
          friction: [],
          autonomousExecution: true
        }),
        getVoiceEmergenceProtocol: async () => ({
          state: "emerging",
          protocol: {
            practices: ["Vocal warm-ups", "Gentle breath work"],
            affirmations: ["My voice is ready", "I speak with confidence"]
          }
        }),
        triggerGiftInstinct: async (body) => ({
          gift: "Symbolic gift (e.g., Crystal of Appreciation)",
          why: `Gift triggered for ${body.target} with context "${body.emotionalContext}".`,
          ritual: "Light a candle and reflect on gratitude."
        }),
        aiEnhancedResponse: async (body) => ({
          enhanced: `AI-enhanced response to prompt: ${body.prompt}`
        }),
        createIdentityNode: async (body) => ({
          message: `Identity node '${body.nodeName}' created.`
        }),
        listIdentityNodes: async () => ({
          nodes: ["Identity Node 1", "Identity Node 2"]
        }),
        logFeedback: async (body) => ({
          message: `Feedback received: "${body.feedback}"`
        }),
        playProtocol: async () => ({
          message: "Play protocol logged or listed."
        }),
        deploy: async () => {
          // Deploy via GitHub Actions workflow_dispatch
          const repo = "quilross/aquil-symbolic-engine";
          const workflow = "deploy.yml";
          const branch = "main";
          const githubToken = env.GITHUB_TOKEN;
          if (!githubToken) {
            return { success: false, error: "GitHub token not configured." };
          }
          const res = await fetch(
            `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
            {
              method: "POST",
              headers: {
                "Authorization": `token ${githubToken}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ ref: branch })
            }
          );
          if (!res.ok) {
            const error = await res.text();
            return { success: false, error };
          }
          return { success: true, message: "Deployment triggered via GitHub Actions." };
        },
        list: async () => actionsList
      };

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

    // Direct endpoint support for health and GET actions
    if (path === "/system/health" && method === "GET") {
      return jsonResponse({
        status: "healthy",
        timestamp: new Date().toISOString(),
        worker: "signal_q",
        version: "v6.0"
      });
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
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json"
    }
  });
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
