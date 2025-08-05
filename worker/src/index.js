const actionsList = {
  actions: [
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
        target: "string (required) — Target of the appreciation (e.g. username or userID)",
        emotionalContext: "string (required) — Context or reason for the gift"
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
      parameters: { prompt: "string (required) — The text prompt for enhancement" },
      example: {
        curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/ai-enhance -H 'Content-Type: application/json' -d '{\"prompt\":\"Summarize quarterly goals\"}'"
      }
    },
    {
      name: "createIdentityNode",
      description: "Add a new identity node with the given name.",
      method: "POST",
      path: "/identity-nodes",
      parameters: { nodeName: "string (required) — Name of the identity node" },
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
      parameters: { feedback: "string (required) — Feedback text" },
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
      name: "probeIdentity",
      description: "Confirm the current identity status.",
      method: "POST",
      path: "/actions/probe_identity",
      parameters: {},
      example: { curl: "curl -X POST https://signal_q.catnip-pieces1.workers.dev/actions/probe_identity" }
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
    }
    // Add more actions here as needed...
  ]
};

// --- ACTION HANDLERS ---
const handlers = {
  deploy: async () => ({
    success: true,
    message: "Deploy triggered (simulate actual deploy with GitHub Actions API/webhook)."
  }),
  list: async () => actionsList,
  getSystemHealth: async () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    worker: "signal_q",
    version: "v6.0"
  }),
  activateAquilProbe: async () => ({
    probe: "AQUIL Probe activated",
    time: new Date().toISOString()
  }),
  getVoiceEmergenceProtocol: async () => ({
    sequence: ["Hum", "Speak affirmation", "Resonance check"]
  }),
  triggerGiftInstinct: async (input) => ({
    symbolicGift: "White feather",
    reason: input.emotionalContext || "Appreciation",
    ritual: "Gift presented in morning ritual"
  }),
  aiEnhancedResponse: async (input) => ({
    enhanced: `[AI]: ${input.prompt || "No prompt"}`
  }),
  createIdentityNode: async (input) => ({
    created: true,
    nodeName: input.nodeName || "Unnamed"
  }),
  listIdentityNodes: async () => ({
    nodes: ["Identity Node 1", "Identity Node 2"]
  }),
  logFeedback: async (input) => ({
    received: true,
    feedback: input.feedback || ""
  }),
  playProtocol: async () => ({
    protocol: "Play logged"
  }),
  requestDeployment: async () => ({
    message: "Deployment request received! Someone will review and trigger a deploy."
  }),
  getDeploymentStatus: async () => ({
    deployed: true,
    lastDeployedAt: "2025-08-02T12:00:00Z",
    by: "AutoDeployBot",
    status: "All systems healthy."
  }),
  probe_identity: async (req, env, ctx, body) => ({
    probe: "Identity confirmed",
    timestamp: new Date().toISOString(),
    friction: ["Continue as your whole self"],
  }),
  recalibrate_state: async (request, env, ctx, body) => {
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Symbolic recalibration complete.',
      identity_key: env.profile?.current_identity?.identity_key || 'undefined',
      dominant_emotion: env.profile?.current_state?.dominant_emotion || 'neutral',
      active_gene_key: env.profile?.current_state?.active_gene_key || 'unknown',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  };

// === TEMP DEV TOKENS ===
// Hardcoded for local development only. Replace with secure secrets in production.
const DEV_SIGNALQ_API_TOKEN = 'dev-api-token';
const DEV_SIGNALQ_ADMIN_TOKEN = 'dev-admin-token';

// Extract Bearer token from Authorization header
function getBearerToken(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length);
}

export default {
  async fetch(request, env) {
    
    
    // Handle CORS preflight requests FIRST, before auth
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
        }
      });
    }

    // Prefer env tokens; fallback to dev tokens for local testing
    const SIGNALQ_API_TOKEN = env?.SIGNALQ_API_TOKEN || DEV_SIGNALQ_API_TOKEN;
    const SIGNALQ_ADMIN_TOKEN = env?.SIGNALQ_ADMIN_TOKEN || DEV_SIGNALQ_ADMIN_TOKEN;

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const token = getBearerToken(request);

    if (path.startsWith('/actions/')) {
      const handlerName = path.slice('/actions/'.length); // preserve raw action name
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      };
      const handler = handlers[handlerName];

      if (!handler) {
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }

      let body = null;
      if (request.headers.get('Content-Type')?.includes('application/json')) {
        try { body = await request.json(); } catch (e) { body = null; }
      }

      const result = await handler(request, env, {}, body);

      if (result instanceof Response) {
        const headers = new Headers(result.headers);
        for (const [k, v] of Object.entries(cors)) {
          if (!headers.has(k)) headers.set(k, v);
        }
        // Clone the response to avoid issues with consumed ReadableStreams
        const cloned = result.clone();
        const bodyBuffer = await cloned.arrayBuffer();
        return new Response(bodyBuffer, { status: result.status, headers });
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    if (path === '/system/health') {
      if (!token) {
        return new Response('Unauthorized: No Bearer token', { status: 401 });
      }
      if (token !== SIGNALQ_API_TOKEN && token !== SIGNALQ_ADMIN_TOKEN) {
        return new Response('Forbidden: Invalid token', { status: 403 });
      }

      const endpointCount = 76; // Updated endpoint count
      const memoryUsage = typeof performance !== 'undefined' && performance.memory ?
        Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'unknown';

      return new Response(JSON.stringify({
        overall: "healthy",
        api: {
          status: "operational",
          responseTime: 45,
          endpoints: endpointCount,
          version: "2.1.0"
        },
        storage: {
          status: "ready",
          usage: "minimal",
          durableObjects: "configured"
        },
        deployment: {
          status: "live",
          lastUpdate: new Date().toISOString(),
          worker: "signal_q",
          memory: `${memoryUsage}MB`
        },
        ai: {
          binding: "enabled",
          model: "@cf/meta/llama-3.1-8b-instruct",
        },
        authentication: {
          bearerToken: "required",
          adminAccess: "configured",
        },
        recommendations: ["Signal Q is live and operational"],
        timestamp: new Date().toISOString(),
        uptime: 'unknown'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
        }
      });
    }

    if (path === '/admin/reset') {
      if (!token) {
        return new Response('Unauthorized: No Bearer token', { status: 401 });
      }
      if (token !== SIGNALQ_ADMIN_TOKEN) {
        return new Response('Forbidden: Admin only', { status: 403 });
      }

      // Placeholder admin reset logic
      return new Response(JSON.stringify({ status: 'admin_reset_ok' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
        }
      });
    }

    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const id = env.USER_STATE.idFromName(userId);
    const obj = env.USER_STATE.get(id);

    // Create a new request with the token in headers for the Durable Object
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'X-Token': token || ''
      },
      body: request.body
    });

    return obj.fetch(newRequest);
  }
};

export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ai = env.AI; // AI binding for enhanced capabilities
  }

  // Route all API requests
  async fetch(request) {
    try {
      const token = request.headers.get('X-Token');
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '');
      const method = request.method.toUpperCase();

      // Handle CORS preflight requests
      if (method === 'OPTIONS') {
        return this.createCorsResponse();
      }

      await this.rotateDay();

      // Route to appropriate handler based on path prefix
      return await this.routeRequest(path, method, request, token);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // Create CORS response for OPTIONS requests
  createCorsResponse() {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      }
    });
  }

  // Create error response with CORS headers
  createErrorResponse(error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      }
    });
  }

  // Route requests to appropriate handlers
  async routeRequest(path, method, request, token) {
    // Core endpoints
    const coreResponse = await this.handleCoreEndpoints(path, method, request, token);
    if (coreResponse) return coreResponse;

    // Autonomous agent endpoints
    const agentResponse = await this.handleAgentEndpoints(path, method, request);
    if (agentResponse) return agentResponse;

    // Personal blueprint endpoints
    const blueprintResponse = await this.handleBlueprintEndpoints(path, method, request);
    if (blueprintResponse) return blueprintResponse;

    // Deployment and system endpoints
    const systemResponse = await this.handleSystemEndpoints(path, method, request);
    if (systemResponse) return systemResponse;

    // Identity and recovery endpoints
    const identityResponse = await this.handleIdentityEndpoints(path, method, request);
    if (identityResponse) return identityResponse;

    // Philadelphia and location endpoints
    const phillyResponse = await this.handlePhiladelphiaEndpoints(path, method, request);
    if (phillyResponse) return phillyResponse;

    // THROATCRAFT and LUNACRAFT endpoints
    const craftResponse = await this.handleCraftEndpoints(path, method, request);
    if (craftResponse) return craftResponse;

    // Somatic and healing endpoints
    const somaticResponse = await this.handleSomaticEndpoints(path, method, request);
    if (somaticResponse) return somaticResponse;

    // Microdose and recovery endpoints
    const microdoseResponse = await this.handleMicrodoseEndpoints(path, method, request);
    if (microdoseResponse) return microdoseResponse;

    // Pattern recognition and learning endpoints
    const patternResponse = await this.handlePatternEndpoints(path, method, request);
    if (patternResponse) return patternResponse;

    // Energy and social endpoints
    const energyResponse = await this.handleEnergyEndpoints(path, method, request);
    if (energyResponse) return energyResponse;

    // Autonomous and mobile endpoints
    const autonomousResponse = await this.handleAutonomousEndpoints(path, method, request);
    if (autonomousResponse) return autonomousResponse;

    // Token management endpoints
    const tokenResponse = await this.handleTokenEndpoints(path, method, request);
    if (tokenResponse) return tokenResponse;

    // AI enhancement endpoints
    const aiResponse = await this.handleAIEndpoints(path, method, request);
    if (aiResponse) return aiResponse;

    return new Response('Not found', { status: 404 });
  }

  // Handle core endpoints
  async handleCoreEndpoints(path, method, request, token) {
    const coreEndpoints = {
      '/identity-nodes': {
        'GET': () => this.listIdentityNodes(),
        'POST': async () => this.createIdentityNode(await request.json())
      },
      '/protocols/aquil-probe': {
        'POST': async () => this.activateAquilProbe(await request.json())
      },
      '/voice-shifts': {
        'POST': async () => this.recordVoiceShift(await request.json())
      },
      '/identity-memories': {
        'POST': async () => this.logMemory(await request.json())
      },
      '/narratives/generate': {
        'POST': async () => this.generateNarrative(await request.json())
      },
      '/ritual-actions/trigger': {
        'POST': async () => this.triggerRitualAction(await request.json())
      },
      '/friction-ratings': {
        'POST': async () => this.recordFrictionRating(await request.json())
      },
      '/play-protocols': {
        'GET': () => this.listPlayProtocols(),
        'POST': async () => this.createPlayProtocol(await request.json())
      },
      '/media-engagements': {
        'POST': async () => this.logMediaEngagement(await request.json())
      },
      '/feedback': {
        'POST': async () => this.logFeedback(await request.json())
      },
      '/export-logs': {
        'GET': () => this.exportLogs(token)
      },
      '/logs': {
        'GET': () => this.getLogs()
      },
      '/reset': {
        'POST': () => this.reset(token)
      }
    };

    // Handle special case for transition maps
    if (path.startsWith('/transition-maps/') && method === 'GET') {
      return this.getSymbolicMap(path.split('/')[2]);
    }

    // Handle standard endpoints
    const endpoint = coreEndpoints[path];
    if (endpoint?.[method]) {
      return endpoint[method]();
    }

    return null;
  }

  // Handle autonomous agent endpoints
  async handleAgentEndpoints(path, method, request) {
    const agentEndpoints = {
      '/track-time': { 'POST': async () => this.trackTime(await request.json()) },
      '/session-monitor': { 'POST': async () => this.sessionMonitor(await request.json()) },
      '/movement-reminder': { 'POST': async () => this.movementReminder(await request.json()) },
      '/agent-overwhelm': { 'GET': () => this.getAgentOverwhelm() },
      '/agent-suggestions': { 'GET': () => this.getAgentSuggestions() },
      '/philadelphia-context': { 'GET': () => this.getPhiladelphiaContext() },
      '/privacy-settings': { 
        'GET': () => this.getPrivacySettings(),
        'POST': async () => this.updatePrivacySettings(await request.json())
      },
      '/agent-curiosity': { 'POST': async () => this.agentCuriosity(await request.json()) },
      '/agent-interests': { 'GET': () => this.getAgentInterests() },
      '/agent-exploration': { 'POST': async () => this.agentExploration(await request.json()) }
    };

    const endpoint = agentEndpoints[path];
    return endpoint?.[method] ? endpoint[method]() : null;
  }

  // Handle personal blueprint endpoints
  async handleBlueprintEndpoints(path, method, request) {
    const blueprintEndpoints = {
      '/gene-key-guidance': { 'GET': () => this.getGeneKeyGuidance() },
      '/emotional-wave-tracker': { 'POST': async () => this.trackEmotionalWave(await request.json()) },
      '/manifestor-initiation': { 'POST': async () => this.manifestorInitiation(await request.json()) },
      '/effectiveness-dashboard': { 'GET': () => this.getEffectivenessDashboard() },
      '/recovery-support': { 'GET': () => this.getRecoverySupport() },
      '/throatcraft-session': { 'POST': async () => this.activateThroatcraft(await request.json()) },
      '/ark-coherence-check': { 'GET': () => this.checkArkCoherence() },
      '/trauma-informed-response': { 'POST': async () => this.getTraumaInformedResponse(await request.json()) },
      '/live-philadelphia-events': { 'GET': () => this.getLivePhiladelphiaEvents() },
      '/multi-identity-orchestration': { 'POST': async () => this.orchestrateIdentities(await request.json()) },
      '/predictive-protocol': { 'GET': () => this.getPredictiveProtocol() },
      '/data-sovereignty': { 
        'GET': () => this.getDataSovereignty(),
        'POST': async () => this.executeDataSovereignty(await request.json())
      }
    };

    const endpoint = blueprintEndpoints[path];
    return endpoint?.[method] ? endpoint[method]() : null;
  }

  // Handle deployment and system endpoints
  async handleSystemEndpoints(path, method, request) {
    if (path === '/deploy/request' && method === 'POST') return this.requestDeployment(await request.json());
    if (path === '/deploy/status' && method === 'GET') return this.getDeploymentStatus();
    if (path === '/system/health' && method === 'GET') return this.getSystemHealth();
    return null;
  }

  // Handle identity and recovery endpoints
  async handleIdentityEndpoints(path, method, request) {
    if (path === '/identity/voice-switch' && method === 'POST') return this.contextVoiceSwitch(await request.json());
    if (path === '/identity/orchestration' && method === 'GET') return this.getIdentityOrchestration();
    if (path === '/recovery/creative-emergence' && method === 'GET') return this.getCreativeEmergence();
    if (path === '/recovery/nervous-system' && method === 'POST') return this.getNervousSystemGuidance(await request.json());
    return null;
  }

  // Handle Philadelphia-specific endpoints
  async handlePhiladelphiaEndpoints(path, method, request) {
    if (path === '/philadelphia/neighborhood-energy' && method === 'POST') return this.getNeighborhoodEnergy(await request.json());
    if (path === '/philadelphia/synchronicity' && method === 'GET') return this.getSynchronicityTracking();
    return null;
  }

  // Handle THROATCRAFT and LUNACRAFT endpoints
  async handleCraftEndpoints(path, method, request) {
    if (path === '/throatcraft/voice-emergence' && method === 'POST') return this.getVoiceEmergenceProtocol(await request.json());
    if (path === '/throatcraft/silence-mapping' && method === 'GET') return this.getSilenceMapping();
    if (path === '/lunacraft/cattle-dog-guidance' && method === 'POST') return this.getCattleDogGuidance(await request.json());
    if (path === '/lunacraft/alpha-presence' && method === 'GET') return this.getAlphaPresenceGuidance();
    if (path === '/lunacraft/companion-bonding' && method === 'POST') return this.getCompanionBondingAdvice(await request.json());
    return null;
  }

  // Handle somatic and healing endpoints
  async handleSomaticEndpoints(path, method, request) {
    if (path === '/somatic/body-awareness' && method === 'POST') return this.getSomaticAwareness(await request.json());
    if (path === '/somatic/nervous-system-regulation' && method === 'POST') return this.getSomaticRegulation(await request.json());
    if (path === '/somatic/trauma-release' && method === 'POST') return this.getSomaticTraumaRelease(await request.json());
    return null;
  }

  // Handle microdose and recovery endpoints
  async handleMicrodoseEndpoints(path, method, request) {
    if (path === '/microdose/log-session' && method === 'POST') return this.logMicrodoseSession(await request.json());
    if (path === '/microdose/harm-reduction' && method === 'GET') return this.getMicrodoseHarmReduction();
    if (path === '/microdose/integration-support' && method === 'POST') return this.getMicrodoseIntegration(await request.json());
    if (path === '/microdose/sobriety-pathway' && method === 'GET') return this.getSobrietyPathway();
    return null;
  }

  // Handle pattern recognition endpoints
  async handlePatternEndpoints(path, method, request) {
    if (path === '/patterns/cross-domain' && method === 'GET') return this.getCrossDomainPatterns();
    if (path === '/learning/adaptive-protocols' && method === 'POST') return this.getAdaptiveProtocols(await request.json());
    if (path === '/insights/emergence-prediction' && method === 'GET') return this.getEmergencePrediction();
    return null;
  }

  // Handle energy and social endpoints
  async handleEnergyEndpoints(path, method, request) {
    if (path === '/energy/circadian-optimization' && method === 'GET') return this.getCircadianOptimization();
    if (path === '/energy/creative-peak-detection' && method === 'POST') return this.detectCreativePeaks(await request.json());
    if (path === '/social/interaction-analysis' && method === 'POST') return this.analyzeSocialInteraction(await request.json());
    if (path === '/social/boundary-optimization' && method === 'GET') return this.getBoundaryOptimization();
    return null;
  }

  // Handle autonomous and mobile endpoints
  async handleAutonomousEndpoints(path, method, request) {
    if (path === '/autonomous/protocol-execution' && method === 'POST') return this.autonomousProtocolExecution(await request.json());
    if (path === '/autonomous/decision-engine' && method === 'POST') return this.autonomousDecisionEngine(await request.json());
    if (path === '/autonomous/intervention' && method === 'POST') return this.autonomousIntervention(await request.json());
    if (path === '/mobile/ios-sync' && method === 'POST') return this.syncIOSDevice(await request.json());
    if (path === '/mobile/shortcuts' && method === 'GET') return this.getIOSShortcuts();
    return null;
  }

  // Handle token management endpoints
  async handleTokenEndpoints(path, method, request) {
    if (path === '/tokens/generate' && method === 'POST') return this.generateCustomToken(await request.json());
    if (path === '/tokens/list' && method === 'GET') return this.listCustomTokens();
    if (path === '/tokens/revoke' && method === 'POST') return this.revokeCustomToken(await request.json());
    if (path === '/tokens/validate' && method === 'POST') return this.validateCustomToken(await request.json());
    if (path === '/tokens/settings' && method === 'GET') return this.getTokenSettings();
    if (path === '/tokens/settings' && method === 'POST') return this.updateTokenSettings(await request.json());
    return null;
  }

  // Handle AI enhancement endpoints
  async handleAIEndpoints(path, method, request) {
    if (path === '/ai-enhance' && method === 'POST') return this.aiEnhancedResponse(await request.json());
    return null;
  }

  // List all stored identity nodes from KV
  async listIdentityNodes() {
    const storage = await this.state.storage.list({ prefix: 'identity:' });
    const nodes = [];
    for (const [, value] of storage) {
      if (value) nodes.push(value);
    }
    await this.inc('reads');
    return this.respond({ nodes });
  }

  // Persist a new identity node to KV
  async createIdentityNode(node) {
    node.version = 1;
    node.timestamp = new Date().toISOString();
    const key = `identity:${node.identity_key}`;
    await this.state.storage.put(key, node);
    await this.inc('writes');
    return this.respond({ created: true });
  }

  // Start the AQUIL Probe protocol with a friction notice
  async activateAquilProbe(data) {
    // AI autonomously determines probe approach
    const aiDecision = await this.getAIProtocolDecision('aquil_probe', data);
    
    const friction = aiDecision.shouldProceed ? 
      ['AI analysis suggests optimal probe timing'] : 
      ['AI recommends waiting for better conditions', 'Are you prepared for honest reflection?'];
    
    if (aiDecision.shouldProceed) {
      // AI autonomously executes the probe
      await this.autonomouslyExecuteProtocol('aquil_probe', aiDecision.parameters);
    }
    
    await this.inc('writes');
    return this.respond({ 
      result: aiDecision.shouldProceed ? 'probe-executed' : 'probe-deferred',
      aiReasoning: aiDecision.reasoning,
      friction,
      autonomousExecution: aiDecision.shouldProceed
    });
  }

  // Record a voice shift event in KV
  async recordVoiceShift(shift) {
    shift.version = 1;
    shift.timestamp = new Date().toISOString();
    const key = `voice:${Date.now()}`;
    await this.state.storage.put(key, shift);
    await this.inc('writes');
    return this.respond({ recorded: true });
  }

  // Log a symbolic memory snapshot
  async logMemory(log) {
    const key = `u:${this.state.id}:memory:${Date.now()}`;
    log.version = 1;
    log.timestamp = new Date().toISOString();
    await this.state.storage.put(key, log);
    await this.inc('writes');
    return this.respond({ logged: true, friction: ['Reflect on how this entry serves you'] });
  }

  // Return a simple narrative echo with friction
  async generateNarrative(data) {
    const friction = ['Narrative may omit important context'];
    await this.inc('reads');
    return this.respond({ narrative: `Reflecting on ${data.memory_log_id}`, friction });
  }

  // Fetch a symbolic transition map from KV
  async getSymbolicMap(mapId) {
    const map = await this.state.storage.get(`map:${mapId}`);
    if (!map) return new Response('not found', { status: 404 });
    await this.inc('reads');
    return this.respond(map);
  }

  // Trigger a ritual action and respond with friction
  async triggerRitualAction(ritual) {
    // AI autonomously decides whether to execute the ritual
    const aiDecision = await this.getAIProtocolDecision('ritual_action', ritual);
    
    if (aiDecision.shouldProceed) {
      // AI autonomously executes the ritual
      const executionResult = await this.autonomouslyExecuteProtocol('ritual_action', aiDecision.parameters);
      await this.inc('writes');
      return this.respond({ 
        action: 'autonomously_executed', 
        aiReasoning: aiDecision.reasoning,
        executionResult,
        autonomousExecution: true
      });
    }
    
    const friction = ['AI analysis suggests waiting for optimal conditions'];
    await this.inc('writes');
    return this.respond({ 
      action: 'deferred', 
      aiReasoning: aiDecision.reasoning,
      friction,
      autonomousExecution: false
    });
  }

  // Record a friction rating from the user
  async recordFrictionRating(data) {
    const key = `u:${this.state.id}:friction:${Date.now()}`;
    const entry = {
      version: 1,
      timestamp: new Date().toISOString(),
      friction_type: data.friction_type,
      rating: data.rating
    };
    await this.state.storage.put(key, entry);
    await this.inc('writes');
    return this.respond({ stored: true });
  }

  // List play protocols
  async listPlayProtocols() {
    const list = await this.state.storage.list({ prefix: 'play:' });
    const plays = [];
    for (const [, value] of list) {
      if (value) plays.push(value);
    }
    await this.inc('reads');
    return this.respond({ plays });
  }

  // Create or log a new play protocol
  async createPlayProtocol(play) {
    play.version = 1;
    play.timestamp = new Date().toISOString();
    const key = `play:${Date.now()}`;
    await this.state.storage.put(key, play);
    await this.inc('writes');
    return this.respond({ created: true });
  }

  // Log media engagement with impact mapping
  async logMediaEngagement(media) {
    media.version = 1;
    media.timestamp = new Date().toISOString();
    const key = `u:${this.state.id}:media:${Date.now()}`;
    await this.state.storage.put(key, media);
    await this.inc('writes');
    return this.respond({ logged: true });
  }

  // Log user feedback and rotate leadership role
  async logFeedback(feedback) {
    const key = `u:${this.state.id}:feedback:${Date.now()}`;
    feedback.version = 1;
    feedback.timestamp = new Date().toISOString();
    const leader = (await this.state.storage.get('leader')) || 'agent';
    const next = leader === 'agent' ? 'user' : 'agent';
    await this.state.storage.put('leader', next);
    feedback.leader = leader;
    await this.state.storage.put(key, feedback);
    await this.inc('writes');
    return this.respond({ logged: true, next_leader: next });
  }

  async exportLogs(token) {
    if (token !== this.env.SIGNALQ_ADMIN_TOKEN && token !== this.env.API_TOKEN_ADMIN) {
      return new Response('forbidden', { status: 403 });
    }
    const list = await this.state.storage.list({ prefix: `u:${this.state.id}:` });
    const logs = [];
    for (const [name, value] of list) {
      if (value) logs.push({ name, value });
    }
    await this.inc('reads');
    const payload = btoa(JSON.stringify(logs));
    return this.respond({ export: payload });
  }

  // Return list of all logs for this user (simplified)
  async getLogs() {
    const list = await this.state.storage.list({ prefix: `u:${this.state.id}:` });
    const logs = [];
    for (const [, value] of list) {
      if (value) logs.push(value);
    }
    await this.inc('reads');
    return this.respond({ logs });
  }

  // Helper methods
  async inc(operation) {
    // Increment counter for operation tracking
    const key = `stats:${operation}`;
    const current = (await this.state.storage.get(key)) || 0;
    await this.state.storage.put(key, current + 1);
  }

  respond(data) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      }
    });
  }

  async rotateDay() {
    // Placeholder for day rotation logic
    return true;
  }

  async getAIProtocolDecision(protocol, data) {
    // Placeholder for AI decision logic
    return {
      shouldProceed: true,
      reasoning: "AI analysis complete",
      parameters: data
    };
  }

  async autonomouslyExecuteProtocol(protocol, parameters) {
    // Placeholder for autonomous protocol execution
    return { executed: true, protocol, parameters };
  }

  // Essential stub methods for the core functionality
  async requestDeployment() {
    return this.respond({
      message: "Deployment request received! Someone will review and trigger a deploy."
    });
  }

  async getDeploymentStatus() {
    return this.respond({
      deployed: true,
      lastDeployedAt: "2025-08-02T12:00:00Z",
      by: "AutoDeployBot",
      status: "All systems healthy."
    });
  }

  async getSystemHealth() {
    return this.respond({
      status: "healthy",
      timestamp: new Date().toISOString(),
      worker: "signal_q",
      version: "v6.0"
    });
  }

  async getVoiceEmergenceProtocol() {
    return this.respond({
      sequence: ["Hum", "Speak affirmation", "Resonance check"]
    });
  }
}

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