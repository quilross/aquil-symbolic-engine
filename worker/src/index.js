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

    // Dynamic Actions endpoint
    const actionsPrefix = "/actions/";
    if (path.startsWith(actionsPrefix) && method === "POST") {
      const actionName = decodeURIComponent(path.slice(actionsPrefix.length));
      if (!actionName) {
        return jsonResponse({ error: "Missing actionName in path." }, 400);
      }

      // Parse JSON body if present
      let input = {};
      if (request.headers.get("content-type")?.includes("application/json")) {
        try {
          input = await request.json();
        } catch (e) {
          return jsonResponse({ error: "Invalid JSON body." }, 400);
        }
      }

      // Map of all supported actions
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
        list: async () => ({
          actions: [
            {
              name: "getSystemHealth",
              description: "Returns system status and timestamp."
            },
            {
              name: "activateAquilProbe",
              description: "Runs a system-wide probe for protocol readiness."
            },
            {
              name: "getVoiceEmergenceProtocol",
              description: "Retrieves a custom voice activation sequence."
            },
            {
              name: "deploy",
              description: "Triggers a GitHub Actions workflow to deploy the Worker."
            },
            {
              name: "list",
              description: "Lists all available actions and their descriptions."
            }
          ]
        }),
        deploy: async () => {
          // Trigger GitHub Actions workflow_dispatch event
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
              body: JSON.stringify({
                ref: branch
              })
            }
          );
          if (!res.ok) {
            const error = await res.text();
            return { success: false, error };
          }
          return { success: true, message: "Deployment triggered via GitHub Actions." };
        }
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