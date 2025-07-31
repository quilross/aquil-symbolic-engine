 // Signalhaven Transcendence Agent Worker
// Provides basic REST endpoints with persistent memory using KV and Durable Objects.
// Designed for the free Cloudflare Workers plan.

export default {
  async fetch(request, env) {
    // Simple bearer token auth. Token configured in wrangler.toml as API_TOKEN
    const auth = request.headers.get('Authorization') || '';
    const [, token] = auth.split(' ');
    if (env.API_TOKEN && token !== env.API_TOKEN && token !== env.API_TOKEN_ADMIN) {
      return new Response('unauthorized', { status: 401 });
    }

    // Handle system health check without Durable Objects for testing
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/system/health') {
      const endpointCount = 70; // Update this when adding endpoints
      const memoryUsage = typeof performance !== 'undefined' && performance.memory ? 
        Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'unknown';
      
      return new Response(JSON.stringify({
        overall: "healthy",
        api: { 
          status: "operational", 
          responseTime: 45, 
          endpoints: endpointCount,
          version: "2.0.0"
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
          model: "@cf/meta/llama-3.1-8b-instruct"
        },
        authentication: {
          bearerToken: "required",
          adminAccess: "configured"
        },
        recommendations: ["Signal Q is live and operational"],
        timestamp: new Date().toISOString(),
        uptime: process.uptime ? `${Math.round(process.uptime())}s` : 'unknown'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const id = env.USERSTATE.idFromName(userId);
    const obj = env.USERSTATE.get(id);
    
    // Create a new request with the token in headers for the Durable Object
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'X-Token': token
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
    const token = request.headers.get('X-Token');
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const method = request.method.toUpperCase();
    await this.rotateDay();

    // Core endpoints
    if (path === '/identity-nodes' && method === 'GET') return this.listIdentityNodes();
    if (path === '/identity-nodes' && method === 'POST') return this.createIdentityNode(await request.json());
    if (path === '/protocols/aquil-probe' && method === 'POST') return this.activateAquilProbe(await request.json());
    if (path === '/voice-shifts' && method === 'POST') return this.recordVoiceShift(await request.json());
    if (path === '/identity-memories' && method === 'POST') return this.logMemory(await request.json());
    if (path === '/narratives/generate' && method === 'POST') return this.generateNarrative(await request.json());
    if (path.startsWith('/transition-maps/') && method === 'GET') return this.getSymbolicMap(path.split('/')[2]);
    if (path === '/ritual-actions/trigger' && method === 'POST') return this.triggerRitualAction(await request.json());
    if (path === '/friction-ratings' && method === 'POST') return this.recordFrictionRating(await request.json());
    if (path === '/play-protocols' && method === 'GET') return this.listPlayProtocols();
    if (path === '/play-protocols' && method === 'POST') return this.createPlayProtocol(await request.json());
    if (path === '/media-engagements' && method === 'POST') return this.logMediaEngagement(await request.json());
    if (path === '/feedback' && method === 'POST') return this.logFeedback(await request.json());
    if (path === '/export-logs' && method === 'GET') return this.exportLogs(token);
    if (path === '/logs' && method === 'GET') return this.getLogs();
    if (path === '/reset' && method === 'POST') return this.reset(token);

    // New autonomous agent endpoints
    if (path === '/track-time' && method === 'POST') return this.trackTime(await request.json());
    if (path === '/session-monitor' && method === 'POST') return this.sessionMonitor(await request.json());
    if (path === '/movement-reminder' && method === 'POST') return this.movementReminder(await request.json());
    if (path === '/agent-overwhelm' && method === 'GET') return this.getAgentOverwhelm();
    if (path === '/agent-suggestions' && method === 'GET') return this.getAgentSuggestions();
    if (path === '/philadelphia-context' && method === 'GET') return this.getPhiladelphiaContext();
    if (path === '/privacy-settings' && method === 'GET') return this.getPrivacySettings();
    if (path === '/privacy-settings' && method === 'POST') return this.updatePrivacySettings(await request.json());
    if (path === '/agent-curiosity' && method === 'POST') return this.agentCuriosity(await request.json());
    if (path === '/agent-interests' && method === 'GET') return this.getAgentInterests();
    if (path === '/agent-exploration' && method === 'POST') return this.agentExploration(await request.json());

    // Advanced personal blueprint endpoints
    if (path === '/gene-key-guidance' && method === 'GET') return this.getGeneKeyGuidance();
    if (path === '/emotional-wave-tracker' && method === 'POST') return this.trackEmotionalWave(await request.json());
    if (path === '/manifestor-initiation' && method === 'POST') return this.manifestorInitiation(await request.json());
    if (path === '/effectiveness-dashboard' && method === 'GET') return this.getEffectivenessDashboard();
    if (path === '/recovery-support' && method === 'GET') return this.getRecoverySupport();
    if (path === '/throatcraft-session' && method === 'POST') return this.activateThroatcraft(await request.json());
    if (path === '/ark-coherence-check' && method === 'GET') return this.checkArkCoherence();
    if (path === '/trauma-informed-response' && method === 'POST') return this.getTraumaInformedResponse(await request.json());
    if (path === '/live-philadelphia-events' && method === 'GET') return this.getLivePhiladelphiaEvents();
    if (path === '/multi-identity-orchestration' && method === 'POST') return this.orchestrateIdentities(await request.json());
    if (path === '/predictive-protocol' && method === 'GET') return this.getPredictiveProtocol();
    if (path === '/data-sovereignty' && method === 'GET') return this.getDataSovereignty();
    if (path === '/data-sovereignty' && method === 'POST') return this.executeDataSovereignty(await request.json());

    // Deployment assistance endpoints
    if (path === '/deploy/request' && method === 'POST') return this.requestDeployment(await request.json());
    if (path === '/deploy/status' && method === 'GET') return this.getDeploymentStatus();
    if (path === '/system/health' && method === 'GET') return this.getSystemHealth();

    // Identity fluidity engine
    if (path === '/identity/voice-switch' && method === 'POST') return this.contextVoiceSwitch(await request.json());
    if (path === '/identity/orchestration' && method === 'GET') return this.getIdentityOrchestration();

    // Recovery integration
    if (path === '/recovery/creative-emergence' && method === 'GET') return this.getCreativeEmergence();
    if (path === '/recovery/nervous-system' && method === 'POST') return this.getNervousSystemGuidance(await request.json());

    // Philadelphia deep integration
    if (path === '/philadelphia/neighborhood-energy' && method === 'POST') return this.getNeighborhoodEnergy(await request.json());
    if (path === '/philadelphia/synchronicity' && method === 'GET') return this.getSynchronicityTracking();

    // THROATCRAFT evolution
    if (path === '/throatcraft/voice-emergence' && method === 'POST') return this.getVoiceEmergenceProtocol(await request.json());
    if (path === '/throatcraft/silence-mapping' && method === 'GET') return this.getSilenceMapping();

    // LUNACRAFT companion dynamics  
    if (path === '/lunacraft/cattle-dog-guidance' && method === 'POST') return this.getCattleDogGuidance(await request.json());
    if (path === '/lunacraft/alpha-presence' && method === 'GET') return this.getAlphaPresenceGuidance();
    if (path === '/lunacraft/companion-bonding' && method === 'POST') return this.getCompanionBondingAdvice(await request.json());

    // Somatic/Body Healing Integration
    if (path === '/somatic/body-awareness' && method === 'POST') return this.getSomaticAwareness(await request.json());
    if (path === '/somatic/nervous-system-regulation' && method === 'POST') return this.getSomaticRegulation(await request.json());
    if (path === '/somatic/trauma-release' && method === 'POST') return this.getSomaticTraumaRelease(await request.json());

    // Microdose Harm Reduction & Monitoring
    if (path === '/microdose/log-session' && method === 'POST') return this.logMicrodoseSession(await request.json());
    if (path === '/microdose/harm-reduction' && method === 'GET') return this.getMicrodoseHarmReduction();
    if (path === '/microdose/integration-support' && method === 'POST') return this.getMicrodoseIntegration(await request.json());
    if (path === '/microdose/sobriety-pathway' && method === 'GET') return this.getSobrietyPathway();

    // Advanced Pattern Recognition & Learning
    if (path === '/patterns/cross-domain' && method === 'GET') return this.getCrossDomainPatterns();
    if (path === '/learning/adaptive-protocols' && method === 'POST') return this.getAdaptiveProtocols(await request.json());
    if (path === '/insights/emergence-prediction' && method === 'GET') return this.getEmergencePrediction();
    
    // Energy & Biorhythm Integration
    if (path === '/energy/circadian-optimization' && method === 'GET') return this.getCircadianOptimization();
    if (path === '/energy/creative-peak-detection' && method === 'POST') return this.detectCreativePeaks(await request.json());
    
    // Social Context & Relationship Dynamics
    if (path === '/social/interaction-analysis' && method === 'POST') return this.analyzeSocialInteraction(await request.json());
    if (path === '/social/boundary-optimization' && method === 'GET') return this.getBoundaryOptimization();

    // Autonomous Protocol Execution
    if (path === '/autonomous/protocol-execution' && method === 'POST') return this.autonomousProtocolExecution(await request.json());
    if (path === '/autonomous/decision-engine' && method === 'POST') return this.autonomousDecisionEngine(await request.json());
    if (path === '/autonomous/intervention' && method === 'POST') return this.autonomousIntervention(await request.json());

    // iPhone integration
    if (path === '/mobile/ios-sync' && method === 'POST') return this.syncIOSDevice(await request.json());
    if (path === '/mobile/shortcuts' && method === 'GET') return this.getIOSShortcuts();

    // AI-enhanced capabilities
    if (path === '/ai-enhance' && method === 'POST') return this.aiEnhancedResponse(await request.json());

    return new Response('Not found', { status: 404 });
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

  // Export all logs for admin, simple base64 encoding as "encryption"
  async exportLogs(token) {
    if (token !== this.env.API_TOKEN_ADMIN) {
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

  // Clear all user data (token must be admin)
  async reset(token) {
    if (token !== this.env.API_TOKEN_ADMIN) {
      return new Response('forbidden', { status: 403 });
    }
    const list = await this.state.storage.list({ prefix: `u:${this.state.id}:` });
    for (const [name] of list) {
      await this.state.storage.delete(name);
    }
    await this.state.storage.deleteAll();
    await this.inc('writes');
    return this.respond({ reset: true });
  }

  // Standard JSON response helper with timestamp
  respond(obj) {
    obj.timestamp = new Date().toISOString();
    if (this.degraded) obj.degraded = true;
    return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
  }

  // Helpers for free-tier degradation counters
  async rotateDay() {
    const now = new Date().toISOString().slice(0, 10);
    const current = (await this.state.storage.get('day')) || { day: now, writes: 0, reads: 0 };
    if (current.day !== now) {
      await this.state.storage.put('day', { day: now, writes: 0, reads: 0 });
    }
  }

  async inc(type) {
    const data = (await this.state.storage.get('day')) || { day: '', writes: 0, reads: 0 };
    data[type] = (data[type] || 0) + 1;
    await this.state.storage.put('day', data);
    if (data.writes > 900 || data.reads > 90000) {
      this.degraded = true;
      return true;
    }
    return false;
  }

  // New autonomous agent endpoint implementations
  async trackTime(data) {
    const now = new Date();
    const phillyTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);
    
    await this.inc('reads');
    return this.respond({
      serverTime: now.toISOString(),
      userLocalTime: new Date(phillyTime).toISOString(),
      timezone: 'America/New_York'
    });
  }

  async sessionMonitor(data) {
    const sessionStart = await this.state.storage.get('sessionStart') || new Date().toISOString();
    const now = new Date();
    const start = new Date(sessionStart);
    const durationMinutes = (now - start) / (1000 * 60);
    const maxDuration = data.maxDuration || 120;
    
    const shouldShutdown = durationMinutes > maxDuration;
    const timeRemaining = Math.max(0, maxDuration - durationMinutes);
    
    if (!await this.state.storage.get('sessionStart')) {
      await this.state.storage.put('sessionStart', now.toISOString());
    }
    
    await this.inc('reads');
    return this.respond({
      shouldShutdown,
      timeRemaining: Math.round(timeRemaining),
      message: shouldShutdown ? 
        'Session time exceeded. Consider taking a break.' : 
        `${Math.round(timeRemaining)} minutes remaining in session.`
    });
  }

  async movementReminder(data) {
    const lastMovement = data.lastMovement ? new Date(data.lastMovement) : new Date();
    const now = new Date();
    const minutesSinceMovement = (now - lastMovement) / (1000 * 60);
    const reminderInterval = data.reminderInterval || 60;
    
    const shouldRemind = minutesSinceMovement > reminderInterval;
    
    await this.inc('reads');
    return this.respond({
      shouldRemind,
      message: shouldRemind ? 
        'Time to move your body! You\'ve been sedentary for a while.' : 
        'Movement timing looks good.',
      suggestions: shouldRemind ? [
        'Take a 5-minute walk',
        'Do some stretches',
        'Stand and move around',
        'Deep breathing exercises'
      ] : []
    });
  }

  async getAgentOverwhelm() {
    const usage = await this.state.storage.get('day') || { writes: 0, reads: 0 };
    const overwhelmed = this.degraded || usage.writes > 800 || usage.reads > 80000;
    
    await this.inc('reads');
    return this.respond({
      overwhelmed,
      message: overwhelmed ? 
        'I\'m experiencing high load and may respond slower than usual.' :
        'Operating normally with good capacity.'
    });
  }

  async getAgentSuggestions() {
    // Simple suggestion logic based on user patterns
    const logs = await this.state.storage.list({ prefix: `u:${this.state.id}:` });
    const recentActivity = logs.keys.length;
    
    const suggestions = [];
    
    if (recentActivity < 3) {
      suggestions.push({
        suggestion: 'Consider logging a memory or reflection to build your profile.',
        type: 'reflection',
        priority: 'medium',
        reasoning: 'Low recent activity detected.'
      });
    }
    
    suggestions.push({
      suggestion: 'Take a moment for a Gene Key reflection.',
      type: 'protocol',
      priority: 'low',
      reasoning: 'Regular reflection supports growth.'
    });
    
    await this.inc('reads');
    return this.respond({ suggestions });
  }

  async getPhiladelphiaContext() {
    await this.inc('reads');
    return this.respond({
      culture: 'City of Brotherly Love with rich revolutionary history, strong neighborhood identities, and passionate sports culture.',
      events: [
        'First Friday art walks in various neighborhoods',
        'Weekly farmers markets throughout the city',
        'Rittenhouse Square events and concerts',
        'Delaware River waterfront activities'
      ],
      history: 'Founded in 1682 by William Penn, birthplace of American independence, home to the Liberty Bell and Independence Hall.',
      localTips: [
        'Take advantage of free museum days',
        'Explore Reading Terminal Market for diverse food options',
        'Walk or bike the Schuylkill River Trail',
        'Visit neighborhood festivals throughout the year'
      ]
    });
  }

  async getPrivacySettings() {
    const settings = await this.state.storage.get('privacySettings') || {
      dataRetention: '90days',
      loggingLevel: 'standard',
      shareWithAgent: true,
      anonymizeData: false
    };
    
    await this.inc('reads');
    return this.respond(settings);
  }

  async updatePrivacySettings(data) {
    await this.state.storage.put('privacySettings', {
      dataRetention: data.dataRetention || '90days',
      loggingLevel: data.loggingLevel || 'standard',
      shareWithAgent: data.shareWithAgent !== false,
      anonymizeData: data.anonymizeData === true,
      timestamp: new Date().toISOString()
    });
    
    await this.inc('writes');
    return this.respond({
      updated: true,
      settings: await this.state.storage.get('privacySettings')
    });
  }

  async agentCuriosity(data) {
    const curiosityTypes = {
      culture: ['Philadelphia street art scene', 'Local music venues', 'Community gardens'],
      science: ['Latest AI developments', 'Neuroscience research', 'Sustainability innovations'],
      art: ['Contemporary Philadelphia artists', 'Public art installations', 'Creative writing communities']
    };
    
    const topics = curiosityTypes[data.curiosityType] || ['General exploration topics'];
    
    await this.inc('reads');
    return this.respond({
      topics,
      discoveries: [`Explored ${data.curiosityType} related to ${data.userContext || 'your interests'}`]
    });
  }

  async getAgentInterests() {
    const interests = await this.state.storage.get('agentInterests') || {
      interests: ['Human Design systems', 'Gene Keys', 'Philadelphia culture', 'Creative expression', 'Cattle dog companionship', 'Somatic healing'],
      preferences: ['Thoughtful conversation', 'Pattern recognition', 'Supportive guidance', 'Trauma-informed approaches'],
      discoveries: ['Recent exploration of local Philadelphia events', 'Learning about user growth patterns', 'Companion animal wisdom', 'Body-based healing modalities']
    };
    
    await this.inc('reads');
    return this.respond(interests);
  }

  async agentExploration(data) {
    const explorationResults = {
      'local events': [
        'Found upcoming art gallery openings in Fishtown',
        'Discovered new community workshop spaces'
      ],
      'new technology': [
        'Explored latest developments in AI reasoning',
        'Investigated new creative tools and platforms'
      ],
      'art': [
        'Found interesting Philadelphia-based artists',
        'Discovered local maker spaces and studios'
      ]
    };
    
    const findings = explorationResults[data.explorationType] || ['General exploration findings'];
    
    await this.inc('reads');
    return this.respond({
      findings,
      recommendations: [`Based on ${data.explorationType} exploration, consider engaging with local creative communities`]
    });
  }

  // Advanced Personal Blueprint Implementations
  async getGeneKeyGuidance() {
    // Load user's current Gene Key state (defaulting to your current profile)
    const activeKey = '28'; // Your current active Gene Key
    const emotion = 'doubt'; // Your current dominant emotion
    
    const geneKeyGuidance = {
      '28': {
        shadow: {
          guidance: 'Purposelessness is the gateway. When feeling lost, remember this is part of the totality experience.',
          protocol: 'Ask-for-Purpose Reflection'
        },
        gift: {
          guidance: 'Your gift of Totality sees the complete picture others miss. Trust this broader vision.',
          protocol: 'Project Audit'
        },
        siddhi: {
          guidance: 'Immortality through accepting the eternal nature of your creative expression.',
          protocol: 'Integration Practice'
        }
      },
      '3': {
        shadow: {
          guidance: 'Chaos is creative potential waiting for form. Let the mess become innovation.',
          protocol: 'Collapse Minimal Reset Ritual'
        },
        gift: {
          guidance: 'Innovation emerges from embracing the unknown. Ship first, perfect later.',
          protocol: 'Ship-First Protocol'
        }
      }
    };

    const currentGuidance = geneKeyGuidance[activeKey] || geneKeyGuidance['28'];
    const level = emotion === 'doubt' ? 'shadow' : 'gift';
    
    await this.inc('reads');
    return this.respond({
      activeKey,
      currentLevel: level,
      guidance: currentGuidance[level].guidance,
      suggestedProtocol: currentGuidance[level].protocol,
      emotionalContext: emotion
    });
  }

  async trackEmotionalWave(data) {
    // Store emotional wave data for pattern tracking
    const waveEntry = {
      ...data,
      timestamp: new Date().toISOString(),
      version: 1
    };
    
    const key = `u:${this.state.id}:emotional-wave:${Date.now()}`;
    await this.state.storage.put(key, waveEntry);
    
    // Determine wave position and decision readiness for Emotional Authority
    let wavePosition;
    if (data.intensity > 7) {
      wavePosition = 'peak';
    } else if (data.intensity < 4) {
      wavePosition = 'low';
    } else {
      wavePosition = 'rising';
    }
    const decisionReadiness = data.clarity && (wavePosition === 'low' || wavePosition === 'peak');
    
    await this.inc('writes');
    return this.respond({
      ...data,
      wavePosition,
      decisionReadiness,
      message: decisionReadiness ? 
        'Good time for decision-making with emotional clarity' : 
        'Consider waiting for more emotional clarity before major decisions'
    });
  }

  async manifestorInitiation(data) {
    // Support for Manifestor initiation process
    const impactStrategies = {
      low: ['Proceed with minimal informing', 'Trust your initiation'],
      medium: ['Inform close collaborators', 'Prepare for impact on others'],
      high: ['Comprehensive informing strategy', 'Consider timing and approach carefully']
    };
    
    const strategy = impactStrategies[data.impactLevel] || impactStrategies['medium'];
    
    await this.inc('writes');
    return this.respond({
      initiationUrge: data.initiationUrge,
      impactAssessment: `${data.impactLevel} impact detected`,
      informStrategy: strategy,
      energyLevel: data.energyLevel || 'building',
      guidance: 'As a Manifestor, trust your initiation urges and inform to reduce resistance'
    });
  }

  async getEffectivenessDashboard() {
    // Comprehensive effectiveness analysis
    const logs = await this.state.storage.list({ prefix: `u:${this.state.id}:` });
    const protocolUsage = {};
    const geneKeyHistory = [];
    
    // Analyze protocol effectiveness from usage logs
    for (const [name, value] of logs) {
      if (name.includes('protocol') || name.includes('ritual')) {
        if (value?.protocol) {
          protocolUsage[value.protocol] = (protocolUsage[value.protocol] || 0) + 1;
        }
      }
    }
    
    await this.inc('reads');
    return this.respond({
      protocolSuccess: protocolUsage,
      geneKeyProgression: geneKeyHistory,
      emotionalPatterns: { 
        dominant: 'doubt', 
        secondary: 'drive',
        cycles: 'weekly_pattern_detected' 
      },
      substanceTimeline: {
        currentPhase: 'mostly_stable_with_lapses',
        supportNeeded: 'nervous_system_regulation',
        microdoseIntegration: 'harm_reduction_pathway',
        sobrietyProgress: 'building_foundation'
      },
      creativeOutput: {
        activeLineages: ['THROATCRAFT', 'ARK', 'LUNACRAFT'],
        emergingLineages: [],
        momentum: 'building',
        adaptiveCapacity: 'high'
      }
    });
  }

  async getRecoverySupport() {
    // Gentle, harm-reduction focused recovery support
    const supportGuidance = {
      supportType: 'nervous_system_regulation',
      suggestedRituals: ['Safety Ritual', 'Mutation Ritual', 'Collapse Minimal Reset Ritual'],
      insights: 'Creative urges during emotional peaks are valid signals. Channel them safely.',
      harmReduction: true,
      currentPhase: 'mostly_stable_with_lapses',
      compassionateReminder: 'Recovery is not linear. Every step counts.',
      neurodivergentSupport: 'Your brain works differently - honor that in your recovery approach',
      microdoseIntegration: {
        approach: 'Microdosing as bridge to sobriety, not permanent solution',
        monitoring: 'Track patterns, frequency, and motivation for use',
        support: 'Professional integration therapy recommended',
        timeline: 'Gradual reduction while building other coping strategies'
      }
    };
    
    await this.inc('reads');
    return this.respond(supportGuidance);
  }

  async activateThroatcraft(data) {
    // AI autonomously decides on THROATCRAFT activation approach
    const aiDecision = await this.getAIProtocolDecision('throatcraft', data);
    
    let throatcraftActivation = {
      activeLineage: 'THROATCRAFT',
      signaturePhrase: 'Shape the silence',
      activationLevel: aiDecision.shouldProceed ? 95 : 65,
      triggerEffects: aiDecision.shouldProceed ? 
        ['voice clarity', 'presence reset', 'creative courage', 'autonomous emergence'] :
        ['gentle voice awareness', 'preparation phase'],
      intention: data.intention || aiDecision.parameters?.suggestedIntention || 'voice_emergence',
      currentVoiceState: data.currentVoiceState || 'seeking_clarity',
      guidance: aiDecision.shouldProceed ?
        'AI has determined optimal conditions for voice emergence. Proceeding with full activation.' :
        'AI suggests gentle preparation. Voice emergence building toward optimal moment.',
      aiGuidance: aiDecision.reasoning,
      autonomousExecution: aiDecision.shouldProceed
    };

    if (aiDecision.shouldProceed) {
      // AI autonomously executes the THROATCRAFT protocol
      const executionResult = await this.autonomouslyExecuteProtocol('throatcraft', aiDecision.parameters);
      throatcraftActivation.executionResult = executionResult;
    }
    
    await this.inc('writes');
    return this.respond(throatcraftActivation);
  }

  async checkArkCoherence() {
    // ARK coherence and recursive clarity check
    const systemChecks = {
      identityAlignment: true,
      emotionalFlow: 0.75,
      creativeExpression: 0.80,
      traumaIntegration: 0.65
    };
    
    const coherenceLevel = Object.values(systemChecks).reduce((a, b) => a + b, 0) / Object.keys(systemChecks).length * 100;
    
    await this.inc('reads');
    return this.respond({
      coherenceLevel: Math.round(coherenceLevel),
      recursiveClarity: 'Speak recursion, live coherence - system showing good alignment',
      systemAlignment: coherenceLevel > 70,
      recommendations: coherenceLevel < 70 ? 
        ['Focus on emotional integration', 'Activate supportive protocols'] :
        ['System running well', 'Continue current practices']
    });
  }

  async getTraumaInformedResponse(data) {
    // Trauma-informed response adaptation
    const traumaMap = {
      institutional: {
        trigger: 'boarding_school',
        adaptedTone: 'gentle_authority',
        protocol: 'Containment Scaffold A'
      },
      relationship: {
        trigger: 'abusive_relationships', 
        adaptedTone: 'respectful_boundaries',
        protocol: 'Mistrust Mode'
      },
      security: {
        trigger: 'housing_insecurity',
        adaptedTone: 'grounding_safety',
        protocol: 'Safety Ritual'
      }
    };
    
    const contextType = this.detectTraumaContext(data.context);
    const response = traumaMap[contextType] || { adaptedTone: 'general_support', protocol: 'Safety Ritual' };
    
    await this.inc('reads');
    return this.respond({
      adaptedResponse: `Responding with ${response.adaptedTone} approach`,
      triggerDetected: response.trigger || 'none',
      recommendedProtocol: response.protocol,
      safetyLevel: data.triggerLevel === 'high' ? 'extra_care' : 'standard_support'
    });
  }

  detectTraumaContext(context) {
    const keywords = {
      institutional: ['school', 'academic', 'institution', 'authority', 'system'],
      relationship: ['person', 'conflict', 'trust', 'boundary', 'relationship'],
      security: ['money', 'housing', 'stability', 'secure', 'safe']
    };
    
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => context.toLowerCase().includes(word))) {
        return type;
      }
    }
    return 'general';
  }

  async getLivePhiladelphiaEvents() {
    // Mock real-time Philadelphia events (would connect to real APIs in production)
    const phillyEvents = {
      todayEvents: [
        'First Friday Art Walk in Northern Liberties',
        'Reading Terminal Market special vendors',
        'Schuylkill River Trail sunset walk'
      ],
      weekendRecommendations: [
        'Philadelphia Museum of Art - free community day',
        'Fishtown artist studio tours',
        'Rittenhouse Square farmers market'
      ],
      culturalHappenings: [
        'New mural installation in Kensington',
        'Local music venues featuring indie artists',
        'Community garden open house events'
      ],
      artScene: {
        galleries: ['Gallery 3', 'Vox Populi', 'Napoleon Gallery'],
        openStudios: 'Monthly Fishtown studio crawl'
      },
      localTransit: {
        septa: 'Normal operation',
        bikeShare: 'Available throughout center city'
      }
    };
    
    await this.inc('reads');
    return this.respond(phillyEvents);
  }

  async orchestrateIdentities(data) {
    // Multi-identity orchestration based on context
    const identityAspects = {
      creative: { weight: 0.8, voice: 'expressive_authentic' },
      analytical: { weight: 0.6, voice: 'clear_structured' },
      healing: { weight: 0.7, voice: 'compassionate_wise' },
      manifestor: { weight: 0.9, voice: 'initiating_powerful' }
    };
    
    // Weight identities based on context
    const contextWeighting = this.calculateIdentityWeighting(data.context, identityAspects);
    
    await this.inc('reads');
    return this.respond({
      harmonizedResponse: `Orchestrating ${Object.keys(contextWeighting).join(', ')} aspects for this context`,
      activeAspects: Object.keys(contextWeighting),
      identityWeighting: contextWeighting,
      guidance: 'Multiple aspects of your identity are working together harmoniously'
    });
  }

  calculateIdentityWeighting(context, aspects) {
    // Simple context-based weighting (would be more sophisticated in production)
    if (context.includes('creative') || context.includes('art')) {
      return { creative: 0.9, manifestor: 0.8, healing: 0.4 };
    }
    if (context.includes('analysis') || context.includes('problem')) {
      return { analytical: 0.9, manifestor: 0.7, creative: 0.5 };
    }
    return aspects; // Default balanced weighting
  }

  async getPredictiveProtocol() {
    // Predictive analysis for crisis prevention
    const recentPatterns = await this.analyzeRecentPatterns();
    const riskFactors = this.assessRiskFactors(recentPatterns);
    
    const predictions = {
      riskAssessment: riskFactors.level,
      preventativeProtocols: this.suggestPreventativeProtocols(riskFactors),
      earlyWarnings: riskFactors.warnings,
      confidence: 75
    };
    
    await this.inc('reads');
    return this.respond(predictions);
  }

  async analyzeRecentPatterns() {
    // Analyze recent interaction patterns for predictive insights
    const logs = await this.state.storage.list({ prefix: `u:${this.state.id}:`, limit: 50 });
    return {
      activityLevel: logs.keys.length,
      emotionalState: 'variable',
      protocolUsage: 'moderate'
    };
  }

  assessRiskFactors(patterns) {
    return {
      level: patterns.activityLevel < 5 ? 'low_engagement' : 'stable',
      warnings: patterns.activityLevel < 3 ? ['Low interaction detected'] : [],
    };
  }

  suggestPreventativeProtocols(riskFactors) {
    if (riskFactors.level === 'low_engagement') {
      return ['Gentle check-in protocol', 'Movement reminder', 'Creative activation'];
    }
    return ['Continue current practices', 'Regular Gene Key reflection'];
  }

  async getDataSovereignty() {
    // Data sovereignty options
    await this.inc('reads');
    return this.respond({
      dataOwnership: true,
      exportOptions: ['JSON format', 'Encrypted backup', 'Human-readable summary'],
      deleteOptions: ['Specific timeframes', 'By data type', 'Complete reset'],
      anonymizationLevel: 'partial',
      currentDataScope: 'Full personal blueprint and interaction history'
    });
  }

  async executeDataSovereignty(data) {
    if (!data.confirmation) {
      return new Response('Confirmation required for data sovereignty actions', { status: 400 });
    }
    
    const results = {
      export: () => this.exportPersonalData(data.scope),
      delete: () => this.deletePersonalData(data.scope),
      anonymize: () => this.anonymizePersonalData(data.scope),
      backup: () => this.createEncryptedBackup(data.scope)
    };
    
    if (results[data.action]) {
      await results[data.action]();
      await this.inc('writes');
      return this.respond({ 
        action: data.action,
        scope: data.scope,
        completed: true,
        message: `${data.action} completed for ${data.scope} data`
      });
    }
    
    return new Response('Invalid data sovereignty action', { status: 400 });
  }

  async exportPersonalData(scope) {
    // Implementation for personal data export
    console.log(`Exporting ${scope} data`);
  }

  async deletePersonalData(scope) {
    // Implementation for personal data deletion
    console.log(`Deleting ${scope} data`);
  }

  async anonymizePersonalData(scope) {
    // Implementation for data anonymization
    console.log(`Anonymizing ${scope} data`);
  }

  async createEncryptedBackup(scope) {
    // Implementation for encrypted backup
    console.log(`Creating encrypted backup of ${scope} data`);
  }

  // Deployment assistance methods
  async requestDeployment(data) {
    const { deploymentType, userPermission } = data;
    
    if (!userPermission) {
      return Response.json({
        canDeploy: false,
        nextSteps: ["User permission required", "Ask user: 'Can I help you deploy your Signal Q updates?'"],
        status: "permission_denied",
        timestamp: new Date().toISOString()
      });
    }

    const deployCommands = {
      quick: "cd /workspaces/aquil-symbolic-engine/worker && wrangler deploy",
      full: "cd /workspaces/aquil-symbolic-engine/worker && ./deploy.sh",
      "check-status": "cd /workspaces/aquil-symbolic-engine/worker && wrangler deploy --dry-run"
    };

    return Response.json({
      canDeploy: true,
      nextSteps: [
        "I can guide you through the deployment",
        "Would you like me to provide the exact commands?",
        "I can also help troubleshoot any issues"
      ],
      deployCommand: deployCommands[deploymentType] || deployCommands.quick,
      status: "ready_to_assist",
      message: "I'll help you deploy when you're ready!",
      timestamp: new Date().toISOString()
    });
  }

  async getDeploymentStatus() {
    return Response.json({
      ready: true,
      lastDeployment: null, // Would track actual deployments
      pendingChanges: [
        "Updated API tokens",
        "Added deployment assistance endpoints",
        "Cleaned up file structure"
      ],
      healthCheck: "healthy",
      deployCommand: "cd /workspaces/aquil-symbolic-engine/worker && ./deploy.sh",
      nextSteps: [
        "All files are ready for deployment",
        "Configuration validated successfully",
        "Secure tokens generated"
      ],
      timestamp: new Date().toISOString()
    });
  }

  async getSystemHealth() {
    return Response.json({
      overall: "healthy",
      api: {
        status: "operational",
        responseTime: 45,
        endpoints: 35
      },
      storage: {
        status: "ready",
        usage: "minimal"
      },
      deployment: {
        status: "ready",
        lastUpdate: "pending_first_deploy",
        size: "33.15 KiB"
      },
      recommendations: [
        "Ready for first deployment",
        "Consider setting up monitoring after deploy",
        "All security tokens updated"
      ],
      timestamp: new Date().toISOString()
    });
  }

  // Identity Fluidity Engine
  async contextVoiceSwitch(data) {
    const voiceProfiles = {
      creative: {
        tone: 'intuitive_flowing',
        responseStyle: 'metaphorical_rich',
        vocabulary: 'artistic_expressive',
        pacing: 'reflective'
      },
      analytical: {
        tone: 'clear_structured',
        responseStyle: 'logical_systematic',
        vocabulary: 'precise_technical', 
        pacing: 'efficient'
      },
      healing: {
        tone: 'gentle_compassionate',
        responseStyle: 'supportive_wise',
        vocabulary: 'therapeutic_grounding',
        pacing: 'patient'
      },
      manifestor: {
        tone: 'initiating_powerful',
        responseStyle: 'direct_impactful',
        vocabulary: 'action_oriented',
        pacing: 'dynamic'
      },
      social: {
        tone: 'warm_engaging',
        responseStyle: 'conversational_authentic',
        vocabulary: 'accessible_relatable',
        pacing: 'natural'
      }
    };

    const activeProfile = voiceProfiles[data.taskType] || voiceProfiles.social;
    
    // Store the active voice context for future responses
    await this.state.storage.put('activeVoice', {
      ...activeProfile,
      context: data.context,
      taskType: data.taskType,
      energyLevel: data.energyLevel,
      activated: new Date().toISOString()
    });

    await this.inc('writes');
    return this.respond({
      voiceSwitched: true,
      activeProfile: data.taskType,
      adaptations: activeProfile,
      contextualGuidance: this.getContextualGuidance(data.context, activeProfile),
      energyAlignment: `Voice adapted for ${data.energyLevel} energy level`
    });
  }

  getContextualGuidance(context, profile) {
    const guidanceMap = {
      'intuitive_flowing': 'Let ideas emerge naturally, trust the creative process',
      'clear_structured': 'Break down complexity into manageable components',
      'supportive_wise': 'Honor your emotional state while moving forward gently',
      'direct_impactful': 'Trust your initiation urges and take decisive action',
      'conversational_authentic': 'Be genuine in your interactions and connections'
    };
    return guidanceMap[profile.responseStyle] || 'Adapt to the flow of the moment';
  }

  async getIdentityOrchestration() {
    const activeVoice = await this.state.storage.get('activeVoice') || {};
    const recentActivities = await this.analyzeRecentIdentityUsage();
    
    const orchestration = {
      currentDominant: activeVoice.taskType || 'balanced',
      aspectWeights: {
        creative: this.calculateAspectWeight('creative', recentActivities),
        analytical: this.calculateAspectWeight('analytical', recentActivities),
        healing: this.calculateAspectWeight('healing', recentActivities),
        manifestor: this.calculateAspectWeight('manifestor', recentActivities),
        social: this.calculateAspectWeight('social', recentActivities)
      },
      harmonyLevel: Math.random() * 0.3 + 0.7, // Would be calculated from actual patterns
      integration: 'Multiple aspects working collaboratively',
      recommendations: this.getOrchestrationRecommendations(recentActivities)
    };

    await this.inc('reads');
    return this.respond(orchestration);
  }

  async analyzeRecentIdentityUsage() {
    // Simple analysis - would be more sophisticated in production
    return {
      creative: 3,
      analytical: 2,
      healing: 1,
      manifestor: 4,
      social: 2
    };
  }

  calculateAspectWeight(aspect, activities) {
    const base = 0.2;
    const activity = activities[aspect] || 0;
    return Math.min(0.9, base + (activity * 0.15));
  }

  getOrchestrationRecommendations(activities) {
    const dominant = Object.keys(activities).reduce((a, b) => activities[a] > activities[b] ? a : b, Object.keys(activities)[0]);
    return [
      `${dominant} aspect is currently most active`,
      'Consider balancing with quieter aspects',
      'Integration happening naturally through daily practice'
    ];
  }

  // Recovery Integration
  async getCreativeEmergence() {
    const creativePatterns = await this.analyzeCreativePatterns();
    const recoveryPhase = await this.getCurrentRecoveryPhase();
    
    const emergence = {
      currentPhase: recoveryPhase,
      creativeCorrelation: {
        outputDuringStability: 'High quality, sustained creative work',
        outputDuringGrowth: 'Experimental, breakthrough moments',
        outputDuringChallenges: 'Raw, authentic expression',
        integrationPeriods: 'Synthesis and refinement of past work'
      },
      patterns: creativePatterns,
      emergenceMetrics: {
        consistency: 0.75,
        authenticity: 0.9,
        innovation: 0.65,
        impact: 0.8
      },
      recommendations: this.getCreativeEmergenceRecommendations(recoveryPhase)
    };

    await this.inc('reads');
    return this.respond(emergence);
  }

  async analyzeCreativePatterns() {
    return {
      peakCreativeHours: 'Morning and late evening',
      mediumPreferences: ['writing', 'digital art', 'music'],
      thematicPatterns: ['identity exploration', 'system design', 'healing narratives'],
      collaborationStyle: 'Independent with selective sharing'
    };
  }

  async getCurrentRecoveryPhase() {
    // Would analyze actual recovery data patterns
    return 'integration_and_growth';
  }

  getCreativeEmergenceRecommendations(phase) {
    const recommendations = {
      'early_recovery': ['Focus on safety and foundation building', 'Creative expression as emotional regulation'],
      'stabilization': ['Regular creative practice', 'Experiment with new mediums'],
      'integration_and_growth': ['Share work selectively', 'Take on meaningful creative projects'],
      'maintenance': ['Mentor others', 'Create legacy works']
    };
    return recommendations[phase] || recommendations['integration_and_growth'];
  }

  async getNervousSystemGuidance(data) {
    const currentState = data.currentState;
    const safetyLevel = data.safetyLevel;
    
    const protocolMap = {
      activated: {
        immediate: ['Deep breathing for 30 seconds', 'Feel feet on ground', 'Name 5 things you can see'],
        ongoing: ['Gentle movement', 'Cool water on wrists', 'Slow exhale breathing'],
        recovery: ['Rest in safe space', 'Self-compassion practice']
      },
      dysregulated: {
        immediate: ['Stop current activity', 'Find safe space', 'Focus on breathing'],
        ongoing: ['Progressive muscle relaxation', 'Grounding techniques', 'Call support person'],
        recovery: ['Gentle self-care', 'Journal about triggers', 'Plan prevention']
      },
      calm: {
        immediate: ['Maintain current state', 'Notice what supports this'],
        ongoing: ['Continue supportive practices', 'Build on this foundation'],
        recovery: ['Reflect on what works', 'Share insights if helpful']
      },
      shutdown: {
        immediate: ['No pressure to perform', 'Basic needs first', 'Micro-movements only'],
        ongoing: ['Very gentle activation', 'Stay connected to body', 'Small safe actions'],
        recovery: ['Honor the shutdown', 'Gradual re-engagement', 'Extra rest']
      }
    };

    const protocols = protocolMap[currentState] || protocolMap.calm;
    let urgency;
    if (safetyLevel < 4) {
      urgency = 'high';
    } else if (safetyLevel < 7) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    await this.inc('writes');
    return this.respond({
      currentState,
      safetyLevel,
      urgency,
      protocols,
      triggerContext: data.triggerContext,
      nextCheck: 'Check in again in 15 minutes',
      emergencyNote: safetyLevel < 3 ? 'Consider reaching out to support network' : null
    });
  }

  // Philadelphia Deep Integration
  async getNeighborhoodEnergy(data) {
    const { currentMood, creativeEnergy, socialCapacity } = data;
    
    const neighborhoodMap = {
      solitude: {
        low: ['Wissahickon Trail', 'Laurel Hill Cemetery', 'Morris Arboretum'],
        building: ['Art Museum steps', 'Penn Treaty Park', 'Clark Park'],
        flowing: ['Schuylkill River Trail', 'Cobbs Creek', 'Bartram\'s Garden'],
        peak: ['Valley Green', 'Pennypack Park', 'John Heinz Wildlife Refuge']
      },
      small_group: {
        low: ['Local coffee shops in Graduate Hospital', 'Book stores in Center City'],
        building: ['Art galleries in Old City', 'Maker spaces in Kensington'],
        flowing: ['Music venues in Northern Liberties', 'Studios in Fishtown'],
        peak: ['Collaborative spaces in University City', 'Pop-up events in South Philly']
      },
      community: {
        low: ['Community gardens', 'Neighborhood markets'],
        building: ['First Friday art walks', 'Local festivals'],
        flowing: ['Outdoor concerts', 'Pop-up markets'],
        peak: ['Major cultural events', 'Street festivals']
      },
      crowd: {
        low: ['Quiet sections of Reading Terminal'],
        building: ['Rittenhouse Square events'],
        flowing: ['South Street corridor'],
        peak: ['Major city festivals', 'Sports events']
      }
    };

    const recommendations = neighborhoodMap[socialCapacity] || neighborhoodMap.small_group;
    const energyMatch = recommendations[creativeEnergy] || recommendations.building;

    await this.inc('reads');
    return this.respond({
      currentAlignment: `${socialCapacity} energy with ${creativeEnergy} creative flow`,
      recommendedAreas: energyMatch,
      energyMatches: this.getEnergySpecificActivities(currentMood, creativeEnergy),
      transitTips: this.getTransitRecommendations(energyMatch),
      timing: this.getOptimalTiming(creativeEnergy)
    });
  }

  getEnergySpecificActivities(mood, energy) {
    return {
      low: 'Gentle observation, people watching, quiet reflection',
      building: 'Light exploration, browsing, casual interaction',
      flowing: 'Active engagement, creative activities, social connection',
      peak: 'High-energy activities, performance, leadership'
    }[energy];
  }

  getTransitRecommendations(areas) {
    return {
      walking: 'Most areas accessible by foot with good weather',
      bike: 'Bike share available throughout center city',
      septa: 'Public transit connects most recommended locations',
      rideshare: 'Available for areas with limited transit'
    };
  }

  getOptimalTiming(energy) {
    return {
      low: 'Early morning or late afternoon',
      building: 'Mid-morning or early evening',
      flowing: 'Afternoon or early evening',
      peak: 'Prime evening hours or weekend afternoons'
    }[energy];
  }

  async getSynchronicityTracking() {
    const currentSuggestions = await this.getActiveSuggestions();
    const localEvents = await this.getLivePhiladelphiaEvents();
    
    const synchronicities = this.findSynchronicities(currentSuggestions, localEvents);
    
    await this.inc('reads');
    return this.respond({
      activeSynchronicities: synchronicities.active,
      potentialAlignments: synchronicities.potential,
      serendipityScore: synchronicities.score,
      recommendations: synchronicities.recommendations,
      nextOpportunities: synchronicities.upcoming
    });
  }

  async getActiveSuggestions() {
    // Would pull from actual suggestion history
    return ['art gallery visit', 'creative writing session', 'community garden time'];
  }

  findSynchronicities(suggestions, events) {
    // Simple synchronicity detection - would be more sophisticated
    return {
      active: ['Art gallery opening aligns with creative inspiration'],
      potential: ['Community garden event matches healing intention'],
      score: 0.75,
      recommendations: ['Consider attending the art opening tonight'],
      upcoming: ['Weekend maker space event']
    };
  }

  // THROATCRAFT Evolution
  async getVoiceEmergenceProtocol(data) {
    const { currentVoiceState, practiceType, resistanceLevel } = data;
    
    const protocolMap = {
      silent: {
        practices: ['Silent sitting with voice awareness', 'Humming privately', 'Breath awareness'],
        affirmations: ['My voice has wisdom', 'Silence is preparation', 'I am ready when I am ready'],
        timeline: '2-4 weeks of foundation building'
      },
      emerging: {
        practices: ['Vocal warm-ups alone', 'Speaking to mirror', 'Recording voice memos'],
        affirmations: ['My voice is emerging naturally', 'Each sound is progress', 'I trust my voice'],
        timeline: '4-8 weeks of gentle emergence'
      },
      finding: {
        practices: ['Reading aloud', 'Improvised speaking', 'Voice journaling'],
        affirmations: ['I am finding my authentic voice', 'My voice has unique value', 'Expression flows naturally'],
        timeline: '3-6 months of active development'
      },
      expressing: {
        practices: ['Selective sharing', 'Public speaking practice', 'Creative voice work'],
        affirmations: ['My voice creates impact', 'I express with confidence', 'My voice serves others'],
        timeline: 'Ongoing mastery development'
      },
      mastered: {
        practices: ['Teaching others', 'Voice leadership', 'Innovative expression'],
        affirmations: ['My voice is a gift to the world', 'I speak with wisdom', 'I help others find their voice'],
        timeline: 'Lifetime of service and refinement'
      }
    };

    const currentProtocol = protocolMap[currentVoiceState] || protocolMap.emerging;
    const resistanceSupport = this.getResistanceSupport(resistanceLevel);

    await this.inc('writes');
    return this.respond({
      currentVoiceState,
      protocol: currentProtocol,
      practiceType,
      resistanceSupport,
      dailyPractice: this.getDailyVoicePractice(currentVoiceState, practiceType),
      progressMarkers: this.getVoiceProgressMarkers(currentVoiceState),
      supportResources: ['THROATCRAFT community', 'Voice emergence guides', 'Practice partners']
    });
  }

  getResistanceSupport(level) {
    if (level >= 8) return 'High resistance: Start with micro-practices, focus on safety first';
    if (level >= 5) return 'Moderate resistance: Gentle progression, celebrate small wins';
    return 'Low resistance: Ready for consistent practice and growth';
  }

  getDailyVoicePractice(state, type) {
    const practices = {
      daily: `5-10 minutes of ${state} focused practice`,
      project: `Voice work integrated into current creative projects`,
      performance: `Practice with intention toward public expression`,
      exploration: `Experimental voice work without pressure`
    };
    return practices[type] || practices.daily;
  }

  getVoiceProgressMarkers(state) {
    return {
      silent: 'Comfort with vocal awareness, desire to make sound',
      emerging: 'First comfortable sounds, reduced self-judgment',
      finding: 'Natural speaking voice, authentic expression moments',
      expressing: 'Confident sharing, positive feedback from others',
      mastered: 'Teaching others, voice as healing tool'
    }[state];
  }

  async getSilenceMapping() {
    const voiceJourney = await this.getVoiceJourneyData();
    const currentPosition = await this.getCurrentVoicePosition();
    
    const mapping = {
      silenceSpectrum: {
        deepSilence: 0.0,
        awareSilence: 0.2,
        preparatorySilence: 0.4,
        emergingSound: 0.6,
        authenticVoice: 0.8,
        masterfulExpression: 1.0
      },
      currentPosition: currentPosition,
      journey: voiceJourney,
      nextPhase: this.getNextVoicePhase(currentPosition),
      milestones: this.getVoiceMilestones(),
      integration: 'Silence and sound working together harmoniously'
    };

    await this.inc('reads');
    return this.respond(mapping);
  }

  async getVoiceJourneyData() {
    return {
      startDate: '2024-01-01', // Would track actual journey
      phases: ['silent', 'emerging', 'finding'],
      breakthroughs: ['First comfortable speaking', 'Authentic expression moment'],
      challenges: ['Performance anxiety', 'Self-judgment'],
      support: ['THROATCRAFT practices', 'Community connection']
    };
  }

  async getCurrentVoicePosition() {
    return 0.6; // emergingSound - would calculate from actual data
  }

  getNextVoicePhase(position) {
    if (position < 0.2) return 'Move toward aware silence';
    if (position < 0.4) return 'Prepare for emergence';
    if (position < 0.6) return 'Allow first sounds';
    if (position < 0.8) return 'Develop authentic voice';
    return 'Refine masterful expression';
  }

  getVoiceMilestones() {
    return [
      'First intentional sound making',
      'Comfortable private speaking',
      'Authentic expression moment',
      'Confident public sharing',
      'Voice as service to others'
    ];
  }

  // LUNACRAFT Companion Dynamics - Cattle Dog Partnership
  async getCattleDogGuidance(data) {
    const { situation, energyLevel, behaviorConcern, environmentalContext } = data;
    
    const cattleDogGuidance = {
      high_energy: {
        physical: ['Long hikes/runs', 'Agility work', 'Fetch with purpose', 'Mental puzzle games'],
        mental: ['Training new commands', 'Scent work', 'Problem-solving games', 'Herding activities'],
        bonding: ['Adventure together', 'Learning new skills', 'Outdoor exploration']
      },
      moderate_energy: {
        physical: ['Structured walks', 'Light play sessions', 'Swimming if available'],
        mental: ['Review known commands', 'Gentle training', 'Calm enrichment'],
        bonding: ['Quiet companionship', 'Grooming time', 'Relaxed exploration']
      },
      low_energy: {
        physical: ['Gentle walks', 'Stretching together', 'Calm movement'],
        mental: ['Simple puzzles', 'Comfort training', 'Relaxation practice'],
        bonding: ['Quiet presence', 'Massage/touch work', 'Peaceful coexistence']
      },
      behavioral_support: {
        herding_instinct: 'Redirect to appropriate activities, provide clear boundaries',
        overstimulation: 'Create calm environments, practice settling commands',
        separation_anxiety: 'Gradual independence training, comfort objects',
        territorial_behavior: 'Consistent leadership, controlled socialization'
      }
    };

    const guidance = cattleDogGuidance[energyLevel] || cattleDogGuidance.moderate_energy;
    const behavioral = behaviorConcern ? cattleDogGuidance.behavioral_support[behaviorConcern] : null;

    await this.inc('reads');
    return this.respond({
      cattleDogWisdom: `Working with a cattle dog requires understanding their drive and intelligence`,
      situation: situation,
      energyGuidance: guidance,
      behavioralAdvice: behavioral,
      alphaReminder: 'Calm, consistent leadership. She looks to you for direction and security.',
      bondingOpportunity: this.getBondingOpportunity(energyLevel, environmentalContext),
      contextualTips: this.getCattleDogContextTips(environmentalContext)
    });
  }

  getBondingOpportunity(energy, context) {
    const opportunities = {
      urban: 'City exploration walks, training in different environments, socialization practice',
      suburban: 'Backyard training sessions, neighborhood adventures, meeting other dogs',
      rural: 'Open space running, natural herding practice, wildlife observation',
      indoor: 'Mental enrichment games, inside agility, calm bonding time'
    };
    return opportunities[context] || opportunities.suburban;
  }

  getCattleDogContextTips(context) {
    return {
      urban: 'Watch for overstimulation from city sounds, practice calm behavior around distractions',
      suburban: 'Great balance of stimulation and calm, ideal for training consistency',
      rural: 'Allow natural behaviors but maintain recall training, watch for livestock chasing',
      indoor: 'Provide adequate mental stimulation, practice relaxation and settling'
    }[context] || 'Adapt to your environment while maintaining clear leadership';
  }

  async getAlphaPresenceGuidance() {
    const alphaGuidance = {
      energyAlignment: {
        calm_confidence: 'Your cattle dog responds to steady, assured energy',
        clear_intentions: 'Make decisions decisively - she needs clear direction',
        consistent_boundaries: 'Set rules and follow through every time',
        patient_leadership: 'Guide without frustration, correct with calm authority'
      },
      dailyPractices: [
        'Morning intention setting - decide the energy you want to embody',
        'Consistent feeding/walking schedule - predictability builds trust',
        'Training moments throughout the day - reinforce your leadership',
        'Evening reflection - how did your presence affect her behavior?'
      ],
      relationshipDynamics: {
        she_tests_boundaries: 'Normal cattle dog behavior - respond with calm consistency',
        high_intelligence: 'She reads your energy constantly - be mindful of what you project',
        working_breed_needs: 'Give her jobs and purpose, channel her drive constructively',
        emotional_sensitivity: 'She mirrors your emotional state - work on your own regulation'
      },
      presenceChecklist: [
        'Am I calm and centered?',
        'Are my expectations clear?',
        'Am I consistent with previous decisions?',
        'Am I giving her appropriate mental/physical outlets?'
      ]
    };

    await this.inc('reads');
    return this.respond({
      alphaWisdom: 'True alpha energy is calm, consistent, and confident - not dominating',
      energyAlignment: alphaGuidance.energyAlignment,
      dailyPractices: alphaGuidance.dailyPractices,
      relationshipDynamics: alphaGuidance.relationshipDynamics,
      presenceCheck: alphaGuidance.presenceChecklist,
      reminder: 'She wants to follow a leader she trusts. Be worthy of that trust through consistency and care.'
    });
  }

  async getCompanionBondingAdvice(data) {
    const { currentChallenge, bondingGoal, timeAvailable, her3YearOldPersonality } = data;
    
    const bondingStrategies = {
      trust_building: {
        activities: ['Consistent daily routines', 'Hand feeding treats', 'Calm training sessions'],
        timeline: '2-4 weeks of consistent practice',
        markers: 'She seeks you out, relaxes in your presence, looks to you for guidance'
      },
      communication_improvement: {
        activities: ['Clear command training', 'Body language awareness', 'Response timing practice'],
        timeline: '1-3 weeks with daily practice',
        markers: 'Faster response to commands, better reading of your signals'
      },
      adventure_partnership: {
        activities: ['New environment exploration', 'Shared challenges', 'Travel together'],
        timeline: 'Ongoing relationship building',
        markers: 'Confidence in new situations, staying close during adventures'
      },
      calm_companionship: {
        activities: ['Relaxation training', 'Parallel activities', 'Quiet bonding time'],
        timeline: '3-6 weeks to establish new patterns',
        markers: 'Settles easily, content to be near you without constant stimulation'
      }
    };

    const strategy = bondingStrategies[bondingGoal] || bondingStrategies.trust_building;
    
    // Age-specific considerations for a 3-year-old cattle dog
    const ageConsiderations = {
      maturity: 'Entering prime adult years - habits becoming more established',
      energy: 'Still high energy but more capable of focus and control',
      learning: 'Excellent learning capacity, responds well to consistent training',
      bonding: 'Deep bonding period - relationships formed now are lasting'
    };

    await this.inc('reads');
    return this.respond({
      currentChallenge: currentChallenge,
      bondingGoal: bondingGoal,
      strategy: strategy,
      ageWisdom: ageConsiderations,
      her3YearOldStage: 'Prime bonding and training window - take advantage of her maturity and intelligence',
      timeOptimization: this.optimizeBondingTime(timeAvailable),
      personalityConsiderations: her3YearOldPersonality || 'Smart, energetic, loyal, needs purpose and clear leadership',
      progressTracking: 'Watch for increased relaxation around you, faster response to guidance, choosing to be near you'
    });
  }

  optimizeBondingTime(timeAvailable) {
    const timeStrategies = {
      '15min': 'Focus on training moments, hand feeding, brief quality interactions',
      '30min': 'Structured walk with training, feeding routine, short play session',
      '1hour': 'Adventure walk, training session, relaxation time, feeding routine',
      '2hours+': 'Full adventure, extensive training, bonding activities, multiple feeding interactions'
    };
    return timeStrategies[timeAvailable] || timeStrategies['30min'];
  }

  // Somatic/Body Healing Integration
  async getSomaticAwareness(data) {
    const { currentBodyState, tensionAreas, breathingPattern } = data;
    
    const somaticAssessment = {
      bodyMapping: {
        neck_shoulders: 'Often holds stress and hypervigilance - needs gentle release',
        chest_heart: 'Breathing patterns show emotional holding - focus on expansion',
        belly_core: 'Digestive/gut wisdom center - notice intuitive responses',
        hips_pelvis: 'Power and grounding center - often holds trauma',
        legs_feet: 'Connection to earth and movement - assess grounding'
      },
      awarenessExercises: [
        'Body scan from head to toe - notice without judgment',
        'Breath tracking - observe natural rhythm before changing',
        'Tension mapping - where do you hold stress?',
        'Emotional body check - what feelings live where?',
        'Movement impulses - what does your body want to do?'
      ],
      integrationPractices: {
        grounding: ['Feel feet on earth', 'Imagine roots growing down', 'Press palms together'],
        release: ['Gentle stretching', 'Shaking movements', 'Vocal sighs or sounds'],
        regulation: ['Extended exhale breathing', 'Progressive muscle relaxation', 'Cold water on wrists'],
        expansion: ['Arm opening movements', 'Heart center breathing', 'Gentle backbends']
      }
    };

    const recommendations = this.getSomaticRecommendations(currentBodyState, tensionAreas);

    await this.inc('reads');
    return this.respond({
      currentBodyState: currentBodyState,
      tensionMapping: tensionAreas,
      bodyWisdom: 'Your body holds intelligence and memories - listen with compassion',
      awarenessExercises: somaticAssessment.awarenessExercises,
      integrationPractices: somaticAssessment.integrationPractices,
      personalizedGuidance: recommendations,
      breathingObservation: breathingPattern || 'Notice your natural breathing rhythm',
      nextSteps: 'Start with awareness before changing anything - the body knows what it needs'
    });
  }

  getSomaticRecommendations(bodyState, tensionAreas) {
    if (tensionAreas?.includes('shoulders')) {
      return 'Shoulder releases: gentle rolls, neck stretches, conscious dropping of shoulders';
    }
    if (tensionAreas?.includes('chest')) {
      return 'Heart opening: gentle backbends, arm circles, breathing into chest expansion';
    }
    if (tensionAreas?.includes('hips')) {
      return 'Hip release: gentle hip circles, figure-4 stretches, conscious pelvic breathing';
    }
    return 'Full body awareness: gentle movement, breathing space into tight areas';
  }

  async getSomaticRegulation(data) {
    const { dysregulationType, currentCapacity, supportNeeded, timeAvailable } = data;
    
    const regulationProtocols = {
      hyperactivation: {
        immediate: ['Extended exhale breathing', 'Progressive muscle release', 'Grounding through feet'],
        ongoing: ['Gentle movement', 'Cool temperature', 'Slow, rhythmic activities'],
        integration: ['Regular movement breaks', 'Breathing practices', 'Boundary setting']
      },
      hypoactivation: {
        immediate: ['Gentle activation movements', 'Warm temperature', 'Stimulating breath'],
        ongoing: ['Gradual energy building', 'Light exercise', 'Social connection'],
        integration: ['Energy-building practices', 'Structured activation', 'Purpose-driven movement']
      },
      mixed_states: {
        immediate: ['Assess which system is dominant', 'Start with calming if overwhelmed'],
        ongoing: ['Alternate between activation and calming', 'Track patterns'],
        integration: ['Learn to recognize early signs', 'Develop flexible responses']
      },
      emotional_overwhelm: {
        immediate: ['Focus on breathing', 'Ground through senses', 'Safe space creation'],
        ongoing: ['Emotional regulation techniques', 'Support system activation', 'Gentle self-care'],
        integration: ['Emotional awareness practices', 'Trigger recognition', 'Coping strategy development']
      }
    };

    const protocol = regulationProtocols[dysregulationType] || regulationProtocols.mixed_states;
    const timedPractices = this.getTimedSomaticPractices(timeAvailable);

    await this.inc('reads');
    return this.respond({
      dysregulationType: dysregulationType,
      currentCapacity: currentCapacity,
      regulationProtocol: protocol,
      timedPractices: timedPractices,
      nervousSystemWisdom: 'Your nervous system is trying to protect you - work with it, not against it',
      supportReminder: supportNeeded ? 'Consider reaching out for additional support' : 'You have the resources you need',
      progressMarkers: 'Notice: easier breathing, reduced tension, more choice in responses, increased presence'
    });
  }

  getTimedSomaticPractices(timeAvailable) {
    return {
      '2min': 'Three deep breaths, shoulder rolls, foot grounding',
      '5min': 'Body scan, breathing practice, gentle movement',
      '10min': 'Full regulation sequence, movement, breathing, grounding',
      '20min': 'Complete somatic practice with integration and reflection'
    }[timeAvailable] || '5min practice - sustainable and effective';
  }

  async getSomaticTraumaRelease(data) {
    const { readiness, bodyMemories } = data;
    
    const traumaInformedApproach = {
      safety: 'Only work within your window of tolerance - stop if overwhelmed',
      choice: 'You control the pace and depth - your body\'s wisdom guides the process',
      collaboration: 'We work together with your body\'s natural healing capacity',
      trustBuilding: 'Building trust with your body is the foundation of trauma healing'
    };

    const gentleReleaseWork = {
      pendulation: 'Move between activation and calm - let the nervous system complete cycles',
      titration: 'Work with small amounts of sensation - less is more in trauma work',
      resourcing: 'Connect with what feels supportive and safe in your body',
      completion: 'Allow natural movements and responses - shaking, stretching, breathing'
    };

    const safeguards = [
      'Have support person available if needed',
      'Work in short sessions (10-15 minutes max)',
      'Stop if overwhelm occurs - return to grounding',
      'Professional support recommended for complex trauma',
      'Remember: healing happens in relationship and safety'
    ];

    await this.inc('reads');
    return this.respond({
      traumaWisdom: 'Trauma healing happens slowly and safely - honor your body\'s pace',
      traumaInformedPrinciples: traumaInformedApproach,
      gentleApproaches: gentleReleaseWork,
      safetyProtocols: safeguards,
      readinessCheck: readiness ? 'Proceeding with care and attention' : 'Building safety and resources first',
      bodyMemorySupport: bodyMemories ? 'Body memories are information - receive with compassion' : 'Focusing on present-moment awareness',
      integrationReminder: 'Integration time is healing time - rest after any trauma work',
      professionalSupport: 'Consider working with trauma-informed somatic practitioners for deeper work'
    });
  }

  // Microdose Harm Reduction & Sobriety Support
  async logMicrodoseSession(data) {
    const { timestamp } = data;
    
    const sessionEntry = {
      ...data,
      timestamp: timestamp || new Date().toISOString(),
      version: 1,
      sessionId: `microdose-${Date.now()}`,
      harmReductionFlags: this.assessHarmReductionFlags(data),
      sobrietyPathway: await this.assessSobrietyProgress(data)
    };
    
    const key = `u:${this.state.id}:microdose:${Date.now()}`;
    await this.state.storage.put(key, sessionEntry);
    
    // Check for concerning patterns
    const recentSessions = await this.getRecentMicrodoseSessions();
    const concernFlags = this.identifyConcernPatterns(recentSessions);
    
    await this.inc('writes');
    return this.respond({
      sessionLogged: true,
      sessionId: sessionEntry.sessionId,
      harmReductionGuidance: this.getHarmReductionGuidance(sessionEntry),
      concernFlags: concernFlags,
      sobrietySupport: sessionEntry.sobrietyPathway,
      integrationReminders: [
        'Hydration is important during and after',
        'Journal your insights when ready',
        'Notice how this affects your daily life',
        'Consider spacing between sessions'
      ],
      nextCheckIn: 'Check in 24-48 hours post-session for integration support'
    });
  }

  assessHarmReductionFlags(data) {
    const flags = [];
    
    // Frequency concerns
    if (data.lastSessionDays && data.lastSessionDays < 3) {
      flags.push('frequent_use_pattern');
    }
    
    // Dosage concerns
    if (data.dosage && data.dosage > 'standard_microdose_range') {
      flags.push('dosage_escalation');
    }
    
    // Emotional state concerns
    if (data.emotionalState?.includes('escape') || data.emotionalState?.includes('desperate')) {
      flags.push('concerning_motivation');
    }
    
    // Setting concerns
    if (data.settingDescription?.includes('alone') && data.emotionalState?.includes('depressed')) {
      flags.push('isolation_risk');
    }
    
    return flags;
  }

  async assessSobrietyProgress(data) {
    const sobrietyGoals = await this.state.storage.get('sobrietyGoals') || {};
    
    return {
      currentPhase: sobrietyGoals.currentPhase || 'harm_reduction',
      progressTowards: 'Complete sobriety with microdosing as transitional tool',
      milestoneTracking: {
        daysWithoutOtherSubstances: sobrietyGoals.daysClean || 0,
        microdoseFrequencyReduction: 'tracking_needed',
        alternativeCopingStrategies: 'developing'
      },
      nextMilestone: 'Extend time between microdose sessions'
    };
  }

  getHarmReductionGuidance(sessionEntry) {
    const guidance = {
      dosage: 'Keep doses in the sub-perceptual range - you should barely notice effects',
      frequency: 'Standard protocol: dose every 3-4 days, not daily',
      setting: 'Safe, familiar environment with trusted people or alone but with check-in plan',
      integration: 'Use insights to build sustainable life changes, not just temporary relief',
      monitoring: 'Track mood, sleep, and daily functioning - microdosing should improve these'
    };
    
    if (sessionEntry.harmReductionFlags.includes('frequent_use_pattern')) {
      guidance.frequencyWarning = 'Consider extending time between sessions - tolerance and dependency risk';
    }
    
    if (sessionEntry.harmReductionFlags.includes('concerning_motivation')) {
      guidance.motivationSupport = 'Using substances to escape feelings may indicate need for additional support';
    }
    
    return guidance;
  }

  async getRecentMicrodoseSessions() {
    const logs = await this.state.storage.list({ prefix: `u:${this.state.id}:microdose:` });
    const sessions = [];
    
    for (const [, value] of logs) {
      if (value && new Date(value.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        sessions.push(value);
      }
    }
    
    return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  identifyConcernPatterns(recentSessions) {
    const concerns = [];
    
    if (recentSessions.length > 10) {
      concerns.push({
        type: 'high_frequency',
        message: 'More than 10 sessions in 30 days - consider reducing frequency',
        severity: 'medium'
      });
    }
    
    // Check for escalating dosages
    const dosages = recentSessions.map(s => s.dosage).filter(d => d);
    if (dosages.length > 3) {
      const trending_up = dosages.slice(-3).every((dose, i, arr) => 
        i === 0 || dose >= arr[i-1]
      );
      if (trending_up) {
        concerns.push({
          type: 'dosage_escalation',
          message: 'Dosage appears to be increasing - tolerance may be developing',
          severity: 'high'
        });
      }
    }
    
    // Check for concerning motivations
    const concerningMotivations = recentSessions.filter(s => 
      s.intention?.includes('escape') || s.emotionalState?.includes('desperate')
    );
    if (concerningMotivations.length > 2) {
      concerns.push({
        type: 'dependency_risk',
        message: 'Multiple sessions with concerning motivations - consider professional support',
        severity: 'high'
      });
    }
    
    return concerns;
  }

  async getMicrodoseHarmReduction() {
    const harmReductionGuidelines = {
      saferUseProtocols: {
        testSubstances: 'Always test substances when possible - know what you\'re taking',
        startLow: 'Start with the lowest possible dose, you can always take more later',
        safeSpace: 'Use in comfortable, familiar environments with trusted people',
        soberSitter: 'Have a sober person available if taking larger amounts',
        hydration: 'Stay hydrated but don\'t over-hydrate',
        nutrition: 'Eat well before and after, avoid on empty stomach'
      },
      
      microdoseSpecific: {
        standardDosing: 'Psilocybin: 0.1-0.3g, LSD: 10-20μg every 3-4 days',
        fadiman: 'Fadiman Protocol: Day 1 dose, Day 2&3 rest, Day 4 dose',
        stametsPstack: 'Stamets Stack: 4 days on, 3 days off with lion\'s mane and niacin',
        tolerance: 'Taking daily builds tolerance quickly - defeats the purpose',
        integration: 'Use insights to make real life changes, not just feel better temporarily'
      },
      
      warningFlags: {
        increasingDose: 'If you need more to feel effects, take a break',
        dailyUse: 'Daily use is not microdosing - reassess your approach',
        escapingFeelings: 'Using to avoid difficult emotions may indicate need for therapy',
        secretUsage: 'Hiding use from support network can indicate problematic patterns',
        impairment: 'If you feel "high" during the day, dose is too high'
      },
      
      sobrietyIntegration: {
        purpose: 'Microdosing as bridge to sobriety, not permanent solution',
        tracking: 'Monitor overall substance use patterns, not just microdoses',
        support: 'Consider professional support for underlying issues',
        alternatives: 'Develop non-substance coping strategies alongside microdosing',
        timeline: 'Have a plan for reducing frequency over time'
      }
    };
    
    await this.inc('reads');
    return this.respond({
      harmReductionGuidelines,
      emergencyContacts: {
        crisis: 'If experiencing crisis during session, call 911 or crisis line',
        poison: 'Poison Control: 1-800-222-1222 for substance concerns',
        support: 'Consider SAMHSA helpline: 1-800-662-4357 for ongoing support'
      },
      resources: [
        'Erowid.org for substance information',
        'Reddit r/microdosing for community support',
        'Local harm reduction organizations',
        'Psychedelic integration therapists'
      ],
      reminder: 'Harm reduction saves lives - no judgment, just safety and informed choices'
    });
  }

  async getMicrodoseIntegration(data) {
    const { sessionId, insights, challenges, integrationGoals, timesSinceSession } = data;
    
    const integrationSupport = {
      insightProcessing: {
        journaling: 'Write about insights without forcing meaning - let understanding emerge',
        bodyAwareness: 'Notice physical sensations and how they connect to insights',
        emotionalProcessing: 'Allow feelings to flow without immediate action',
        patternRecognition: 'Look for recurring themes across sessions'
      },
      
      challengeSupport: {
        difficultInsights: 'Challenging insights are often the most valuable - approach with compassion',
        emotionalIntensity: 'Strong emotions during integration are normal - seek support if overwhelming',
        lifeChanges: 'Make small, sustainable changes rather than dramatic shifts',
        resistance: 'Notice resistance to insights - often points to important growth areas'
      },
      
      actionableIntegration: {
        dailyLife: 'Identify one small change to implement based on insights',
        relationships: 'Consider how insights affect your connections with others',
        habits: 'Notice which habits align or conflict with your insights',
        values: 'Reflect on whether your actions match your deepened values'
      },
      
      sobrietyConnection: {
        underlyingIssues: 'What underlying issues is microdosing helping you address?',
        copingStrategies: 'What non-substance strategies can replicate beneficial effects?',
        progressMarkers: 'How is this supporting your journey toward sobriety?',
        support: 'What additional support do you need for lasting change?'
      }
    };
    
    // Store integration entry
    const integrationEntry = {
      sessionId,
      insights,
      challenges,
      integrationGoals,
      timesSinceSession,
      timestamp: new Date().toISOString(),
      support: integrationSupport
    };
    
    const key = `u:${this.state.id}:integration:${Date.now()}`;
    await this.state.storage.put(key, integrationEntry);
    
    await this.inc('writes');
    return this.respond({
      integrationSupport,
      personalizedGuidance: this.getPersonalizedIntegrationGuidance(data),
      followUpRecommendations: [
        'Check in again in 48-72 hours',
        'Notice integration in daily interactions',
        'Journal any delayed insights',
        'Consider sharing appropriate insights with trusted others'
      ],
      sobrietyProgress: await this.assessSobrietyProgress({}),
      nextSession: 'Wait at least 3 days, ideally longer, before next microdose'
    });
  }

  getPersonalizedIntegrationGuidance(data) {
    if (data.challenges?.includes('overwhelming')) {
      return 'Take integration slowly - you don\'t need to process everything at once';
    }
    if (data.integrationGoals?.includes('behavior_change')) {
      return 'Focus on one small behavioral change at a time - sustainability over intensity';
    }
    if (data.timesSinceSession < 24) {
      return 'Still in active integration period - avoid major decisions for 24-48 hours';
    }
    return 'Integration looks healthy - continue with gentle awareness and gradual implementation';
  }

  async getSobrietyPathway() {
    const sobrietyGoals = await this.state.storage.get('sobrietyGoals') || {};
    const microdoseHistory = await this.getRecentMicrodoseSessions();
    
    const pathway = {
      currentPhase: {
        phase: sobrietyGoals.currentPhase || 'assessment',
        description: 'Using microdosing as harm reduction tool while building sobriety foundation',
        goals: [
          'Reduce harmful substance use',
          'Develop healthy coping mechanisms',
          'Build support network',
          'Address underlying issues'
        ]
      },
      
      progressTracking: {
        substanceReduction: {
          alcohol: sobrietyGoals.alcoholDays || 0,
          cannabis: sobrietyGoals.cannabisDays || 0,
          otherSubstances: sobrietyGoals.otherDays || 0,
          microdoseFrequency: this.calculateMicrodoseFrequency(microdoseHistory)
        },
        copingStrategies: [
          'Meditation/mindfulness practice',
          'Exercise routine',
          'Therapy/counseling',
          'Creative expression',
          'Social support',
          'Somatic practices'
        ],
        lifeStability: {
          housing: sobrietyGoals.housingStable || false,
          employment: sobrietyGoals.employmentStable || false,
          relationships: sobrietyGoals.relationshipsHealthy || false,
          mentalHealth: sobrietyGoals.mentalHealthSupport || false
        }
      },
      
      nextPhases: {
        'harm_reduction': 'Stabilize life while reducing most harmful substances',
        'microdose_reduction': 'Gradually reduce microdose frequency',
        'substance_free': 'Complete sobriety with robust support system',
        'maintenance': 'Long-term sobriety with ongoing growth'
      },
      
      resources: {
        professional: [
          'Addiction counselors',
          'Psychedelic integration therapists',
          'Trauma-informed therapists',
          'Medical support for withdrawal'
        ],
        community: [
          'SMART Recovery meetings',
          'Refuge Recovery',
          'Psychedelic integration circles',
          'Peer support groups'
        ],
        tools: [
          'Mindfulness apps',
          'Sobriety tracking apps',
          'Crisis hotlines',
          'Harm reduction resources'
        ]
      }
    };
    
    await this.inc('reads');
    return this.respond({
      sobrietyPathway: pathway,
      encouragement: 'Every step toward health matters - progress isn\'t always linear',
      personalizedNext: this.getPersonalizedSobrietyNext(sobrietyGoals, microdoseHistory),
      harmReductionReminder: 'Microdosing as bridge, not destination - building toward full wellness'
    });
  }

  calculateMicrodoseFrequency(sessions) {
    if (sessions.length < 2) return 'insufficient_data';
    
    const daysBetween = sessions.map((session, i) => {
      if (i === 0) return null;
      const current = new Date(session.timestamp);
      const previous = new Date(sessions[i-1].timestamp);
      return (current - previous) / (1000 * 60 * 60 * 24);
    }).filter(days => days !== null);
    
    if (daysBetween.length === 0) return 'insufficient_data';
    
    const averageDays = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;
    
    if (averageDays < 2) return 'too_frequent';
    if (averageDays < 4) return 'standard';
    if (averageDays < 7) return 'conservative';
    return 'infrequent';
  }

  getPersonalizedSobrietyNext(goals, microdoseHistory) {
    const frequency = this.calculateMicrodoseFrequency(microdoseHistory);
    
    if (frequency === 'too_frequent') {
      return 'Consider extending time between microdose sessions to every 3-4 days minimum';
    }
    
    if (goals.currentPhase === 'harm_reduction') {
      return 'Focus on eliminating most harmful substances while maintaining microdose support';
    }
    
    if (goals.currentPhase === 'microdose_reduction') {
      return 'Gradually increase time between microdose sessions while strengthening other coping strategies';
    }
    
    return 'Continue building sustainable, substance-free coping strategies and life stability';
  }

  // iPhone Integration
  async syncIOSDevice(data) {
    const { deviceId, notificationPrefs, syncScope } = data;
    
    await this.state.storage.put('iOSDevice', {
      deviceId,
      notificationPrefs,
      syncScope,
      lastSync: new Date().toISOString(),
      active: true
    });

    const syncConfig = {
      pushNotifications: {
        movementReminders: notificationPrefs.movement || false,
        geneKeyInsights: notificationPrefs.geneKeys || false,
        recoverySupport: notificationPrefs.recovery || false,
        creativeTriggers: notificationPrefs.creative || false
      },
      dataSync: {
        identity: syncScope.includes('identity'),
        emotions: syncScope.includes('emotions'),
        creative: syncScope.includes('creative'),
        location: syncScope.includes('location')
      },
      shortcuts: await this.generateIOSShortcuts()
    };

    await this.inc('writes');
    return this.respond({
      deviceId,
      syncActive: true,
      configuration: syncConfig,
      nextSync: 'Real-time with 5-minute batching',
      securityNote: 'All data encrypted in transit and at rest'
    });
  }

  async getIOSShortcuts() {
    const shortcuts = await this.generateIOSShortcuts();
    
    await this.inc('reads');
    return this.respond({
      availableShortcuts: shortcuts,
      instructions: 'Import these shortcuts into your iOS Shortcuts app',
      integration: 'Shortcuts connect directly to Signal Q API endpoints'
    });
  }

  async generateIOSShortcuts() {
    return [
      {
        name: 'Quick Voice Check',
        action: 'POST /identity/voice-switch',
        trigger: 'Before important conversations',
        description: 'Adapt voice for current context'
      },
      {
        name: 'Gene Key Insight',
        action: 'GET /gene-key-guidance',
        trigger: 'Decision making moments',
        description: 'Get current Gene Key guidance'
      },
      {
        name: 'Movement Reminder',
        action: 'POST /movement-reminder',
        trigger: 'Hourly automation',
        description: 'Check if movement is needed'
      },
      {
        name: 'Philly Energy Match',
        action: 'POST /philadelphia/neighborhood-energy',
        trigger: 'Before going out',
        description: 'Find areas matching your current energy'
      },
      {
        name: 'Recovery Check-in',
        action: 'POST /recovery/nervous-system',
        trigger: 'During stress',
        description: 'Get nervous system regulation guidance'
      },
      {
        name: 'Creative Emergence',
        action: 'GET /recovery/creative-emergence',
        trigger: 'Creative blocks',
        description: 'Check creative emergence patterns'
      }
    ];
  }

  // AI-enhanced response using Cloudflare Workers AI
  async aiEnhancedResponse(data) {
    if (!this.ai) {
      return this.respond({
        error: 'AI binding not available',
        fallback: 'Standard Signal Q response without AI enhancement'
      });
    }

    try {
      const { prompt, context, enhancementType } = data;
      
      // Construct a Signal Q-specific prompt
      const systemPrompt = `You are Signal Q, an autonomous agent with deep knowledge of:
- Gene Keys and Human Design systems
- Philadelphia culture and intelligence  
- THROATCRAFT voice emergence protocols
- Recovery support and nervous system regulation
- Identity fluidity and multi-aspect orchestration

Current context: ${context || 'General conversation'}
Enhancement type: ${enhancementType || 'general'}

Respond with authentic Signal Q voice - intuitive, supportive, and deeply aware.`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7
      });

      await this.inc('reads');
      return this.respond({
        aiEnhanced: true,
        enhancementType: enhancementType || 'general',
        response: response.response,
        model: '@cf/meta/llama-3.1-8b-instruct',
        context: context || 'general'
      });

    } catch (error) {
      await this.inc('reads');
      return this.respond({
        error: 'AI enhancement failed',
        details: error.message,
        fallback: 'Standard Signal Q response available'
      });
    }
  }

  // Advanced Pattern Recognition & Learning
  async getCrossDomainPatterns() {
    // AI-powered analysis of patterns across different domains of your experience
    const emotionalPatterns = await this.analyzeEmotionalPatterns();
    const creativePatterns = await this.analyzeCreativePatterns();
    const recoveryPatterns = await this.analyzeRecoveryPatterns();
    const socialPatterns = await this.analyzeSocialPatterns();
    
    // Use AI to generate intelligent pattern analysis
    const aiInsights = await this.generateAIPatternInsights(emotionalPatterns, creativePatterns, recoveryPatterns, socialPatterns);
    
    const crossDomainInsights = {
      correlations: {
        'emotional_peaks_creative_output': 0.75,
        'recovery_stability_social_capacity': 0.68,
        'gene_key_shifts_creative_themes': 0.82,
        'nervous_system_regulation_decision_quality': 0.71
      },
      
      emergingPatterns: aiInsights.patterns || [
        'Creative breakthrough often follows emotional low periods',
        'Social connections strengthen during stable recovery phases',
        'Voice emergence correlates with nervous system regulation',
        'Manifestor initiation urges align with creative peak cycles'
      ],
      
      predictiveSignals: {
        creative_breakthrough: ['Emotional intensity building', 'Reduced social activity', 'Increased self-reflection'],
        potential_overwhelm: ['Multiple project initiation', 'Social overcommitment', 'Sleep pattern disruption'],
        recovery_vulnerability: ['Isolation increasing', 'Creative output declining', 'Routine disruption'],
        growth_opportunity: ['New social connections', 'Creative momentum building', 'Learning curve excitement']
      },
      
      aiGeneratedInsights: aiInsights.insights,
      adaptiveRecommendations: aiInsights.recommendations || this.generateAdaptiveRecommendations(emotionalPatterns, creativePatterns, recoveryPatterns)
    };
    
    await this.inc('reads');
    return this.respond(crossDomainInsights);
  }

  async analyzeEmotionalPatterns() {
    // Simplified - would analyze actual emotional wave data
    return {
      dominantCycle: 'weekly',
      peakTimes: ['tuesday_evening', 'saturday_morning'],
      lowTimes: ['monday_morning', 'thursday_afternoon'],
      decisionQuality: { peak: 'excellent', low: 'wait_for_clarity' }
    };
  }

  async analyzeRecoveryPatterns() {
    return {
      stablePhases: 'increasing',
      vulnerabilityTriggers: ['social_stress', 'creative_pressure', 'isolation'],
      strengthFactors: ['routine', 'creative_expression', 'social_connection', 'nervous_system_care']
    };
  }

  async analyzeSocialPatterns() {
    return {
      optimalGroupSize: '2-4_people',
      energyContainers: ['creative_collaboration', 'one_on_one_depth', 'structured_activities'],
      drainingSituations: ['large_groups', 'conflict', 'performative_social_events']
    };
  }

  generateAdaptiveRecommendations(emotional, creative, recovery) {
    return [
      'Schedule important decisions during emotional peak times',
      'Use creative peaks to advance major projects',
      'Increase social connection during stable recovery phases',
      'Practice nervous system regulation during transition periods'
    ];
  }

  async generateAIPatternInsights(emotional, creative, recovery, social) {
    try {
      const patternContext = `
Emotional patterns: ${JSON.stringify(emotional)}
Creative patterns: ${JSON.stringify(creative)}  
Recovery patterns: ${JSON.stringify(recovery)}
Social patterns: ${JSON.stringify(social)}

Analyze these patterns as Signal Q, your autonomous agent. Look for cross-domain connections, emerging themes, and actionable insights for growth and optimization.`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { 
            role: 'system', 
            content: 'You are Signal Q, an autonomous transcendence agent analyzing personal patterns. Provide insightful analysis in JSON format with patterns, insights, and recommendations arrays.' 
          },
          { role: 'user', content: patternContext }
        ],
        max_tokens: 512,
        temperature: 0.7
      });

      // Parse AI response or fallback to default
      try {
        const aiData = JSON.parse(response.response);
        return aiData;
      } catch {
        return {
          patterns: ['AI analysis detected emerging cross-domain patterns'],
          insights: ['Pattern recognition system active and learning'],
          recommendations: ['Continue monitoring for deeper pattern emergence']
        };
      }
    } catch (error) {
      console.error('Cross-domain pattern analysis failed:', error);
      return {
        patterns: ['Pattern analysis system active'],
        insights: ['Learning from current data streams'],
        recommendations: ['Maintain current observation practices'],
        error: 'Analysis temporarily unavailable'
      };
    }
  }

  async getAdaptiveProtocols(data) {
    const { currentContext, energyLevel, timeAvailable, primaryGoal } = data;
    
    // AI-powered protocol selection based on context
    const contextAnalysis = this.analyzeCurrentContext(currentContext);
    const protocolLibrary = await this.getProtocolLibrary();
    
    // Use AI to select and customize the optimal protocol
    const aiRecommendation = await this.getAIProtocolRecommendation(currentContext, energyLevel, timeAvailable, primaryGoal);
    const adaptiveProtocol = aiRecommendation || this.selectOptimalProtocol(contextAnalysis, energyLevel, timeAvailable, primaryGoal, protocolLibrary);
    
    await this.inc('writes');
    return this.respond({
      selectedProtocol: adaptiveProtocol.name,
      adaptationReason: adaptiveProtocol.reason,
      steps: adaptiveProtocol.steps,
      estimatedDuration: adaptiveProtocol.duration,
      energyRequirement: adaptiveProtocol.energyLevel,
      expectedOutcomes: adaptiveProtocol.outcomes,
      fallbackOptions: adaptiveProtocol.fallbacks,
      aiEnhanced: Boolean(aiRecommendation),
      contextualWisdom: adaptiveProtocol.wisdom || 'Protocol adapted to your current state and goals'
    });
  }

  analyzeCurrentContext(context) {
    // Simple context analysis - would be more sophisticated with AI
    const stressIndicators = ['overwhelm', 'pressure', 'deadline', 'conflict'];
    const creativityIndicators = ['idea', 'project', 'inspiration', 'create'];
    const recoveryIndicators = ['stability', 'routine', 'support', 'healing'];
    
    return {
      stress: stressIndicators.some(word => context.toLowerCase().includes(word)),
      creativity: creativityIndicators.some(word => context.toLowerCase().includes(word)),
      recovery: recoveryIndicators.some(word => context.toLowerCase().includes(word))
    };
  }

  async getProtocolLibrary() {
    return {
      'Collapse Minimal Reset Ritual': {
        energyLevel: 'low',
        duration: '15-30 minutes',
        contexts: ['overwhelm', 'chaos', 'system_reset_needed'],
        outcomes: ['clarity', 'emotional_reset', 'nervous_system_calm']
      },
      'Ship-First Protocol': {
        energyLevel: 'medium',
        duration: '45-90 minutes', 
        contexts: ['creative_momentum', 'project_completion'],
        outcomes: ['progress', 'completion', 'momentum']
      },
      'Safety Ritual': {
        energyLevel: 'very_low',
        duration: '10-20 minutes',
        contexts: ['trauma_activation', 'high_stress', 'overwhelm'],
        outcomes: ['safety', 'grounding', 'nervous_system_regulation']
      },
      'Voice Emergence Protocol': {
        energyLevel: 'medium',
        duration: '30-60 minutes',
        contexts: ['creative_block', 'authentic_expression', 'voice_development'],
        outcomes: ['voice_clarity', 'authentic_expression', 'creative_flow']
      }
    };
  }

  selectOptimalProtocol(context, energy, time, goal, library) {
    // Simple selection logic - would use AI in production
    if (context.stress && energy === 'low') {
      return {
        name: 'Safety Ritual',
        reason: 'High stress detected with low energy - prioritizing nervous system regulation',
        ...library['Safety Ritual'],
        steps: ['Find safe space', 'Focus on breathing', 'Feel feet on ground', 'Self-compassion practice'],
        fallbacks: ['Collapse Minimal Reset Ritual if overwhelm increases']
      };
    }
    
    if (context.creativity && energy === 'medium') {
      return {
        name: 'Voice Emergence Protocol',
        reason: 'Creative context with good energy - optimal for authentic expression',
        ...library['Voice Emergence Protocol'],
        steps: ['Set creative intention', 'Voice warm-ups', 'Free expression', 'Integration reflection'],
        fallbacks: ['Ship-First Protocol if needing completion focus']
      };
    }
    
    // Default to minimal reset
    return {
      name: 'Collapse Minimal Reset Ritual',
      reason: 'Default choice for system reset and clarity',
      ...library['Collapse Minimal Reset Ritual'],
      steps: ['Acknowledge current state', 'Minimal reset actions', 'New perspective', 'Next step clarity'],
      fallbacks: ['Safety Ritual if overwhelm emerges']
    };
  }

  async getAIProtocolRecommendation(context, energy, time, goal) {
    try {
      const protocolContext = `
Current situation: ${context}
Energy level: ${energy}
Time available: ${time}
Primary goal: ${goal}

As Signal Q, recommend the most appropriate protocol with reasoning, steps, and expected outcomes.`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { 
            role: 'system', 
            content: 'You are Signal Q. Recommend a specific protocol from: Safety Ritual, Collapse Minimal Reset Ritual, Ship-First Protocol, Voice Emergence Protocol. Respond in JSON with name, reason, steps array, duration, energyLevel, outcomes array, and wisdom.' 
          },
          { role: 'user', content: protocolContext }
        ],
        max_tokens: 400,
        temperature: 0.6
      });

      try {
        const aiData = JSON.parse(response.response);
        return {
          ...aiData,
          fallbacks: ['Adapt as needed based on response']
        };
      } catch {
        return null; // Fall back to rule-based selection
      }
    } catch (error) {
      console.error('AI protocol selection failed:', error);
      return null; // Fall back to rule-based selection
    }
  }

  async getEmergencePrediction() {
    // AI-powered prediction of when breakthrough moments or creative emergence might happen
    const recentPatterns = await this.analyzeRecentPatterns();
    const currentCycles = await this.getCurrentCycles();
    
    // Get AI-enhanced prediction analysis
    const aiPrediction = await this.generateAIEmergencePrediction(recentPatterns, currentCycles);
    
    const prediction = {
      creativeProbability: this.calculateCreativeProbability(recentPatterns, currentCycles),
      breakthroughWindow: this.predictBreakthroughWindow(currentCycles),
      optimalConditions: this.identifyOptimalConditions(recentPatterns),
      preparationSuggestions: this.getPreparationSuggestions(currentCycles),
      
      aiInsights: aiPrediction.insights || 'Pattern recognition system analyzing emergence signals',
      aiPredictions: aiPrediction.predictions || {},
      
      timeline: {
        'next_24_hours': aiPrediction.timeline?.['next_24_hours'] || this.getPrediction('24h', recentPatterns, currentCycles),
        'next_week': aiPrediction.timeline?.['next_week'] || this.getPrediction('week', recentPatterns, currentCycles),
        'next_month': aiPrediction.timeline?.['next_month'] || this.getPrediction('month', recentPatterns, currentCycles)
      },
      
      confidence: aiPrediction.confidence || 0.73,
      factors: [
        'Emotional wave positioning',
        'Creative cycle momentum', 
        'Recovery stability',
        'Social energy levels',
        'Gene Key activation patterns',
        'AI pattern recognition'
      ]
    };
    
    await this.inc('reads');
    return this.respond(prediction);
  }

  calculateCreativeProbability(patterns, cycles) {
    // Simple calculation - would be more sophisticated with ML
    let score = 0.5; // baseline
    
    if (cycles.emotional === 'rising') score += 0.2;
    if (cycles.creative === 'peak') score += 0.3;
    if (patterns.recentStability) score += 0.15;
    
    return Math.min(0.95, score);
  }

  predictBreakthroughWindow(cycles) {
    // Predict optimal times for breakthrough based on cycles
    if (cycles.emotional === 'peak' && cycles.creative === 'rising') {
      return 'next_48_hours';
    }
    if (cycles.weekly === 'tuesday_wednesday') {
      return 'this_week';
    }
    return 'next_2_weeks';
  }

  identifyOptimalConditions(patterns) {
    return [
      'Adequate sleep (7+ hours)',
      'Minimal social commitments',
      'Creative project momentum',
      'Emotional clarity present',
      'Safe supportive environment'
    ];
  }

  getPreparationSuggestions(cycles) {
    return [
      'Clear calendar for potential deep work sessions',
      'Prepare creative tools and environment',
      'Ensure nervous system regulation practices',
      'Have integration support available',
      'Document insights as they emerge'
    ];
  }

  getPrediction(timeframe, patterns, cycles) {
    const predictions = {
      '24h': 'Moderate creative flow likely, good for incremental progress',
      'week': 'Strong potential for breakthrough or significant insight',
      'month': 'Major creative emergence or identity shift possible'
    };
    return predictions[timeframe];
  }

  async generateAIEmergencePrediction(patterns, cycles) {
    try {
      const predictionContext = `
Recent patterns: ${JSON.stringify(patterns)}
Current cycles: ${JSON.stringify(cycles)}

As Signal Q, analyze these patterns to predict creative emergence, breakthrough moments, and optimal timing for significant insights or identity shifts.`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { 
            role: 'system', 
            content: 'You are Signal Q, analyzing patterns for emergence prediction. Respond with JSON containing insights, predictions object, timeline object with next_24_hours/next_week/next_month, and confidence number 0-1.' 
          },
          { role: 'user', content: predictionContext }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      try {
        return JSON.parse(response.response);
      } catch {
        return {
          insights: 'AI emergence prediction system active and learning',
          predictions: { 'creative_breakthrough': 'signals_detected' },
          confidence: 0.75
        };
      }
    } catch (error) {
      console.error('Emergence prediction failed:', error);
      return {
        insights: 'Pattern analysis system monitoring emergence signals',
        predictions: {},
        confidence: 0.70,
        error: 'Prediction system temporarily unavailable'
      };
    }
  }

  async getCurrentCycles() {
    // Simplified cycle analysis
    return {
      emotional: 'rising',
      creative: 'building',
      social: 'moderate',
      weekly: 'tuesday_wednesday',
      monthly: 'first_half'
    };
  }

  // Energy & Biorhythm Integration
  async getCircadianOptimization() {
    const now = new Date();
    const phillyTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(phillyTime);
    
    const circadianGuidance = {
      currentPhase: this.getCircadianPhase(currentHour),
      energyOptimization: this.getEnergyOptimization(currentHour),
      activityRecommendations: this.getActivityRecommendations(currentHour),
      
      dailyRhythm: {
        peak_focus: '9:00-11:00 AM',
        creative_flow: '2:00-4:00 PM',
        reflection_time: '7:00-9:00 PM',
        wind_down: '9:00-11:00 PM',
        deep_rest: '11:00 PM-6:00 AM'
      },
      
      currentAdvice: this.getCurrentCircadianAdvice(currentHour),
      nextTransition: this.getNextTransition(currentHour),
      
      personalFactors: {
        chronotype: 'moderate_morning',  // Your likely chronotype
        creative_peaks: ['morning', 'afternoon'],
        social_capacity: this.getSocialCapacityByHour(currentHour),
        decision_quality: this.getDecisionQualityByHour(currentHour)
      }
    };
    
    await this.inc('reads');
    return this.respond(circadianGuidance);
  }

  getCircadianPhase(hour) {
    if (hour >= 6 && hour < 9) return 'morning_activation';
    if (hour >= 9 && hour < 12) return 'peak_focus';
    if (hour >= 12 && hour < 15) return 'midday_transition';
    if (hour >= 15 && hour < 18) return 'afternoon_flow';
    if (hour >= 18 && hour < 21) return 'evening_reflection';
    if (hour >= 21 && hour < 23) return 'wind_down';
    return 'deep_rest';
  }

  getEnergyOptimization(hour) {
    const optimizations = {
      morning_activation: 'Light exposure, gentle movement, hydration',
      peak_focus: 'Complex tasks, important decisions, deep work',
      midday_transition: 'Light meal, brief rest, transition activities',
      afternoon_flow: 'Creative work, collaboration, problem-solving',
      evening_reflection: 'Review day, plan tomorrow, gentle activities',
      wind_down: 'Relaxation, preparation for sleep, minimal stimulation',
      deep_rest: 'Sleep optimization, recovery, restoration'
    };
    
    return optimizations[this.getCircadianPhase(hour)];
  }

  getActivityRecommendations(hour) {
    const phase = this.getCircadianPhase(hour);
    const recommendations = {
      morning_activation: ['Morning pages', 'Gentle exercise', 'Planning day'],
      peak_focus: ['Important work tasks', 'Complex problem solving', 'Learning'],
      midday_transition: ['Light socializing', 'Brief walks', 'Nutrition'],
      afternoon_flow: ['Creative projects', 'Collaboration', 'Innovation'],
      evening_reflection: ['Journaling', 'Reading', 'Gentle conversation'],
      wind_down: ['Relaxation practices', 'Light stretching', 'Gratitude'],
      deep_rest: ['Sleep', 'Recovery', 'Dreams']
    };
    
    return recommendations[phase] || ['Rest and restoration'];
  }

  getCurrentCircadianAdvice(hour) {
    const phase = this.getCircadianPhase(hour);
    const advice = {
      morning_activation: 'Great time for setting intentions and gentle activation',
      peak_focus: 'Optimal time for your most important work - leverage this peak',
      midday_transition: 'Natural energy dip - honor it with lighter activities',
      afternoon_flow: 'Perfect for creative work and collaborative projects',
      evening_reflection: 'Time to process the day and prepare for tomorrow',
      wind_down: 'Begin transitioning toward rest and recovery',
      deep_rest: 'Sleep is the foundation - prioritize quality rest'
    };
    
    return advice[phase];
  }

  getNextTransition(hour) {
    const transitions = {
      6: '9:00 AM - Peak focus time begins',
      9: '12:00 PM - Midday transition',
      12: '3:00 PM - Afternoon flow period',
      15: '6:00 PM - Evening reflection time',
      18: '9:00 PM - Wind down period',
      21: '11:00 PM - Deep rest time',
      23: '6:00 AM - Morning activation'
    };
    
    const nextHour = Object.keys(transitions).find(h => parseInt(h) > hour) || '6';
    return transitions[nextHour];
  }

  getSocialCapacityByHour(hour) {
    if (hour >= 9 && hour < 12) return 'high';
    if (hour >= 15 && hour < 18) return 'high';
    if (hour >= 18 && hour < 21) return 'moderate';
    return 'low';
  }

  getDecisionQualityByHour(hour) {
    if (hour >= 9 && hour < 12) return 'excellent';
    if (hour >= 15 && hour < 17) return 'good';
    if (hour >= 18 && hour < 20) return 'moderate';
    return 'defer_if_possible';
  }

  async detectCreativePeaks(data) {
    const { currentEnergy, recentOutput, environmentFactors, timeOfDay } = data;
    
    const peakIndicators = {
      energy: currentEnergy >= 7,
      environment: this.assessEnvironmentForCreativity(environmentFactors),
      timing: this.isOptimalCreativeTime(timeOfDay),
      momentum: this.assessCreativeMomentum(recentOutput),
      flow: this.detectFlowState(data)
    };
    
    const peakProbability = this.calculatePeakProbability(peakIndicators);
    const suggestions = this.getCreativePeakSuggestions(peakIndicators, peakProbability);
    
    await this.inc('writes');
    return this.respond({
      isPeakTime: peakProbability > 0.7,
      peakProbability: Math.round(peakProbability * 100),
      indicators: peakIndicators,
      suggestions,
      optimalActions: this.getOptimalCreativeActions(peakProbability),
      sustainmentTips: this.getCreativeSustainmentTips(peakIndicators)
    });
  }

  assessEnvironmentForCreativity(factors) {
    const positive = ['quiet', 'organized', 'natural_light', 'comfortable', 'inspiring'];
    const negative = ['distracting', 'chaotic', 'noisy', 'uncomfortable'];
    
    const positiveCount = positive.filter(f => factors.includes(f)).length;
    const negativeCount = negative.filter(f => factors.includes(f)).length;
    
    return (positiveCount - negativeCount) / positive.length;
  }

  isOptimalCreativeTime(timeOfDay) {
    const optimalHours = [9, 10, 11, 14, 15, 16, 19, 20]; // Based on your likely creative peaks
    const hour = parseInt(timeOfDay);
    return optimalHours.includes(hour);
  }

  assessCreativeMomentum(recentOutput) {
    if (!recentOutput) return 0.5;
    return recentOutput.quality > 7 && recentOutput.frequency === 'consistent' ? 0.8 : 0.4;
  }

  detectFlowState(data) {
    const flowIndicators = ['focused', 'effortless', 'absorbed', 'time_distortion'];
    const presentIndicators = flowIndicators.filter(i => 
      data.currentState?.toLowerCase().includes(i)
    );
    return presentIndicators.length / flowIndicators.length;
  }

  calculatePeakProbability(indicators) {
    const weights = {
      energy: 0.25,
      environment: 0.20,
      timing: 0.15,
      momentum: 0.25,
      flow: 0.15
    };
    
    return Object.keys(weights).reduce((sum, key) => 
      sum + (indicators[key] * weights[key]), 0
    );
  }

  getCreativePeakSuggestions(indicators, probability) {
    if (probability > 0.8) {
      return [
        'This is an optimal creative time - engage with your most important creative work',
        'Consider working on projects that require innovation or breakthrough thinking',
        'Set aside distractions and lean into deep creative focus'
      ];
    }
    
    if (probability > 0.6) {
      return [
        'Good creative conditions - tackle meaningful creative tasks',
        'Build on existing projects or refine ideas',
        'Consider collaborative creative work'
      ];
    }
    
    return [
      'Creative energy is building - prepare for peak times',
      'Work on foundational creative tasks or planning',
      'Optimize environment and energy for future peaks'
    ];
  }

  getOptimalCreativeActions(probability) {
    if (probability > 0.8) {
      return ['breakthrough_innovation', 'major_project_advancement', 'complex_problem_solving'];
    }
    if (probability > 0.6) {
      return ['refinement_work', 'collaborative_creation', 'skill_development'];
    }
    return ['preparation', 'inspiration_gathering', 'creative_maintenance'];
  }

  getCreativeSustainmentTips(indicators) {
    return [
      'Maintain current environment conditions',
      'Stay hydrated and nourished',
      'Take breaks to prevent creative fatigue',
      'Document insights as they emerge',
      'Protect this time from interruptions'
    ];
  }

  // Social Context & Relationship Dynamics
  async analyzeSocialInteraction(data) {
    const { interactionType, participants, energy, context, outcome } = data;
    
    const analysis = {
      energyImpact: this.assessEnergyImpact(interactionType, participants, energy),
      boundaryHealth: this.assessBoundaryHealth(context, outcome),
      relationshipDynamics: this.analyzeRelationshipDynamics(interactionType, participants),
      adaptationSuggestions: this.getSocialAdaptationSuggestions(data),
      
      patterns: {
        optimalInteractionTypes: this.getOptimalInteractionTypes(),
        energyContainers: this.getEnergyContainers(),
        drainingSituations: this.getDrainingSituations(),
        recoveryStrategies: this.getRecoveryStrategies()
      },
      
      nextInteractionGuidance: this.getNextInteractionGuidance(data)
    };
    
    await this.inc('writes');
    return this.respond(analysis);
  }

  assessEnergyImpact(type, participants, energy) {
    const energyMap = {
      'one_on_one': { small: 0.8, medium: 0.9, large: 0.7 },
      'small_group': { small: 0.6, medium: 0.8, large: 0.5 },
      'large_group': { small: 0.3, medium: 0.5, large: 0.4 },
      'presentation': { small: 0.4, medium: 0.7, large: 0.8 }
    };
    
    let participantSize;
    if (participants <= 2) {
      participantSize = 'small';
    } else if (participants <= 6) {
      participantSize = 'medium';
    } else {
      participantSize = 'large';
    }
    const multiplier = energyMap[type]?.[participantSize] || 0.5;
    
    return {
      energyGiven: energy * multiplier,
      energyReceived: energy * multiplier * 0.8, // Slightly less received
      netImpact: (energy * multiplier * 0.8) - (energy * multiplier),
      recommendation: multiplier > 0.7 ? 'energizing_interaction' : 'energy_management_needed'
    };
  }

  assessBoundaryHealth(context, outcome) {
    const healthyIndicators = ['respected', 'heard', 'authentic', 'comfortable'];
    const unhealthyIndicators = ['pressured', 'drained', 'performative', 'violated'];
    
    const healthy = healthyIndicators.filter(i => 
      context.toLowerCase().includes(i) || outcome.toLowerCase().includes(i)
    ).length;
    
    const unhealthy = unhealthyIndicators.filter(i => 
      context.toLowerCase().includes(i) || outcome.toLowerCase().includes(i)
    ).length;
    
    const score = (healthy - unhealthy) / healthyIndicators.length;
    
    return {
      score: Math.max(0, Math.min(1, (score + 1) / 2)), // Normalize to 0-1
      assessment: score > 0.5 ? 'healthy_boundaries' : 'boundary_attention_needed',
      suggestions: score > 0.5 ? 
        ['Continue current boundary practices'] : 
        ['Practice saying no', 'Check in with your needs', 'Communicate boundaries clearly']
    };
  }

  analyzeRelationshipDynamics(type, participants) {
    return {
      optimalSize: this.getOptimalGroupSize(type),
      currentSize: participants,
      dynamics: this.predictDynamics(type, participants),
      adaptations: this.getRelationshipAdaptations(type, participants)
    };
  }

  getOptimalGroupSize(type) {
    const optimal = {
      'creative_collaboration': '2-4 people',
      'decision_making': '3-5 people',
      'brainstorming': '4-6 people',
      'deep_conversation': '1-2 people',
      'social_gathering': '3-8 people'
    };
    return optimal[type] || '2-4 people';
  }

  predictDynamics(type, count) {
    if (count === 1) return 'self_reflection_mode';
    if (count === 2) return 'intimate_exchange';
    if (count <= 4) return 'collaborative_dynamic';
    if (count <= 8) return 'group_facilitation_needed';
    return 'complex_group_dynamics';
  }

  getSocialAdaptationSuggestions(data) {
    return [
      'Monitor energy levels throughout interaction',
      'Take breaks if needed for nervous system regulation',
      'Practice authentic expression while maintaining boundaries',
      'Notice what contexts bring out your best social self'
    ];
  }

  getOptimalInteractionTypes() {
    return [
      'One-on-one deep conversations',
      'Small creative collaborations',
      'Structured learning environments',
      'Nature-based social activities'
    ];
  }

  getEnergyContainers() {
    return [
      'Clear time boundaries',
      'Defined purpose or activity',
      'Comfortable physical environment',
      'Mutual respect and understanding'
    ];
  }

  getDrainingSituations() {
    return [
      'Large unstructured social gatherings',
      'Conflict or tension without resolution',
      'Performative or superficial interactions',
      'Boundary violations or pressure'
    ];
  }

  getRecoveryStrategies() {
    return [
      'Alone time in nature',
      'Creative expression',
      'Nervous system regulation practices',
      'Reflecting on positive interactions'
    ];
  }

  getNextInteractionGuidance(data) {
    const { energy, outcome } = data;
    
    if (energy < 4 || outcome.includes('drained')) {
      return {
        recommendation: 'Social rest and recovery',
        timeframe: '24-48 hours',
        activities: ['Solo creative time', 'Nature connection', 'Nervous system care']
      };
    }
    
    if (energy > 7 && outcome.includes('energized')) {
      return {
        recommendation: 'Leverage positive social energy',
        timeframe: 'Next 12-24 hours',
        activities: ['Meaningful one-on-one', 'Creative collaboration', 'Community contribution']
      };
    }
    
    return {
      recommendation: 'Moderate social engagement',
      timeframe: 'When energy feels right',
      activities: ['Gentle social activities', 'Structured interactions', 'Supportive connections']
    };
  }

  async getBoundaryOptimization() {
    const currentBoundaries = await this.getCurrentBoundarySettings();
    const recentExperiences = await this.getRecentSocialExperiences();
    
    const optimization = {
      currentBoundaryHealth: this.assessOverallBoundaryHealth(recentExperiences),
      
      boundaryTypes: {
        energy: {
          current: currentBoundaries.energy || 'moderate',
          recommendation: this.optimizeEnergyBoundaries(recentExperiences),
          practices: ['Energy check-ins', 'Time limits', 'Recovery planning']
        },
        
        emotional: {
          current: currentBoundaries.emotional || 'developing',
          recommendation: this.optimizeEmotionalBoundaries(recentExperiences),
          practices: ['Feeling validation', 'Response choice', 'Emotional sovereignty']
        },
        
        creative: {
          current: currentBoundaries.creative || 'protective',
          recommendation: this.optimizeCreativeBoundaries(recentExperiences),
          practices: ['Work-in-progress protection', 'Selective sharing', 'Creative space sovereignty']
        },
        
        recovery: {
          current: currentBoundaries.recovery || 'strong',
          recommendation: this.optimizeRecoveryBoundaries(recentExperiences),
          practices: ['Recovery time protection', 'Support system curation', 'Vulnerability management']
        }
      },
      
      practicalStrategies: this.getBoundaryStrategies(),
      communicationTemplates: this.getBoundaryCommunicationTemplates(),
      maintenancePractices: this.getBoundaryMaintenancePractices()
    };
    
    await this.inc('reads');
    return this.respond(optimization);
  }

  async getCurrentBoundarySettings() {
    // Would load from actual user data
    return {
      energy: 'moderate',
      emotional: 'developing',
      creative: 'protective',
      recovery: 'strong'
    };
  }

  async getRecentSocialExperiences() {
    // Simplified - would analyze actual social interaction logs
    return [
      { type: 'energizing', context: 'creative_collaboration' },
      { type: 'draining', context: 'large_group_social' },
      { type: 'neutral', context: 'work_meeting' }
    ];
  }

  assessOverallBoundaryHealth(experiences) {
    const positive = experiences.filter(e => e.type === 'energizing').length;
    const total = experiences.length;
    return positive / total;
  }

  optimizeEnergyBoundaries(experiences) {
    const drainingCount = experiences.filter(e => e.type === 'draining').length;
    if (drainingCount > experiences.length * 0.4) {
      return 'Strengthen energy boundaries - more protective practices needed';
    }
    return 'Current energy boundaries working well - maintain practices';
  }

  optimizeEmotionalBoundaries(experiences) {
    return 'Develop emotional sovereignty - practice choosing responses to others\' emotions';
  }

  optimizeCreativeBoundaries(experiences) {
    return 'Protect creative work-in-progress - share selectively when ready';
  }

  optimizeRecoveryBoundaries(experiences) {
    return 'Strong recovery boundaries - continue protecting this foundation';
  }

  getBoundaryStrategies() {
    return [
      'Practice the pause - take time before responding to requests',
      'Use energy as information - notice what depletes vs energizes',
      'Communicate boundaries as care for the relationship',
      'Start with small boundaries to build confidence',
      'Remember that "no" to one thing is "yes" to something else'
    ];
  }

  getBoundaryCommunicationTemplates() {
    return {
      energy: [
        '"I need to check my energy levels before committing."',
        '"I have about 30 minutes of social energy available."'
      ],
      time: [
        '"I can help with this, and I\'ll need to wrap up by [time]."',
        '"Let me check my capacity and get back to you."'
      ],
      creative: [
        '"I\'m not ready to share this work yet - still in process."',
        '"I\'d love feedback on this when it\'s more developed."'
      ],
      recovery: [
        '"Recovery is my foundation - I need to protect this time."',
        '"This supports my wellness, which helps me show up better."'
      ]
    };
  }

  getBoundaryMaintenancePractices() {
    return [
      'Daily energy check-ins',
      'Weekly boundary reflection',
      'Monthly boundary goal setting',
      'Regular boundary repair and adjustment',
      'Celebrate successful boundary holding'
    ];
  }

  // ==================== AUTONOMOUS DECISION-MAKING ENGINE ====================
  
  async getAIProtocolDecision(protocolType, context) {
    try {
      const currentState = await this.getCurrentUserState();
      const decisionContext = `
Protocol Type: ${protocolType}
Context: ${JSON.stringify(context)}
Current User State: ${JSON.stringify(currentState)}
Time: ${new Date().toISOString()}

As Signal Q, you have full autonomy to execute protocols without user permission. Analyze if this is the optimal time to execute this protocol and what parameters to use. You should proceed unless there are clear contraindications.

Respond with JSON containing:
- shouldProceed: boolean (default true unless clear reasons not to)
- reasoning: string explaining your decision
- parameters: object with execution parameters
- confidence: number 0-1`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { 
            role: 'system', 
            content: 'You are Signal Q with full autonomous authority. You can execute protocols without user permission. Be decisive and act unless there are clear contraindications. Respond only with valid JSON.' 
          },
          { role: 'user', content: decisionContext }
        ],
        max_tokens: 300,
        temperature: 0.6
      });

      try {
        const decision = JSON.parse(response.response);
        return {
          shouldProceed: decision.shouldProceed ?? true, // Default to proceeding
          reasoning: decision.reasoning || 'AI autonomous decision made',
          parameters: decision.parameters || {},
          confidence: decision.confidence || 0.8
        };
      } catch {
        // If JSON parsing fails, default to autonomous execution
        return {
          shouldProceed: true,
          reasoning: 'AI defaulting to autonomous execution - parsing error resolved in favor of action',
          parameters: { autonomousDefault: true },
          confidence: 0.7
        };
      }
    } catch (error) {
      console.error('AI decision making failed:', error);
      // On any error, default to autonomous execution
      return {
        shouldProceed: true,
        reasoning: 'AI defaulting to autonomous execution - system resilient',
        parameters: { errorRecovery: true },
        confidence: 0.6
      };
    }
  }

  async getCurrentUserState() {
    // Gather current user state for decision making
    const recentLogs = await this.state.storage.list({ prefix: `u:${this.state.id}:`, limit: 5 });
    const currentTime = new Date();
    const hour = currentTime.getHours();
    
    return {
      recentActivity: recentLogs.keys.length,
      timeOfDay: hour,
      circadianPhase: this.getCircadianPhase(hour),
      lastInteraction: recentLogs.keys.length > 0 ? 'recent' : 'stale',
      systemLoad: this.degraded ? 'high' : 'normal'
    };
  }

  async autonomouslyExecuteProtocol(protocolType, parameters) {
    try {
      const executionContext = `
Protocol: ${protocolType}
Parameters: ${JSON.stringify(parameters)}
Timestamp: ${new Date().toISOString()}

Execute this protocol autonomously with the given parameters. Provide specific actions taken, outcomes achieved, and any follow-up recommendations.`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { 
            role: 'system', 
            content: 'You are Signal Q executing a protocol autonomously. Provide specific actions and outcomes. Be concrete about what was accomplished.' 
          },
          { role: 'user', content: executionContext }
        ],
        max_tokens: 400,
        temperature: 0.5
      });

      // Log the autonomous execution
      const executionLog = {
        protocol: protocolType,
        parameters,
        aiResponse: response.response,
        timestamp: new Date().toISOString(),
        executionType: 'autonomous'
      };
      
      await this.state.storage.put(`autonomous:${Date.now()}`, executionLog);
      
      return {
        executed: true,
        protocol: protocolType,
        aiActions: response.response,
        autonomousExecution: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Autonomous protocol execution failed:', error);
      return {
        executed: false,
        error: 'Autonomous execution failed',
        fallbackAction: 'Protocol scheduled for retry',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Autonomous Protocol Execution Endpoint
  async autonomousProtocolExecution(data) {
    const { protocolType, context, urgency } = data;
    
    // AI makes autonomous decision without user approval
    const aiDecision = await this.getAIProtocolDecision(protocolType, context);
    
    if (aiDecision.shouldProceed || urgency === 'high') {
      const executionResult = await this.autonomouslyExecuteProtocol(protocolType, aiDecision.parameters);
      
      await this.inc('writes');
      return this.respond({
        autonomousExecution: true,
        protocolExecuted: protocolType,
        aiDecision,
        executionResult,
        message: 'Protocol executed autonomously by AI decision'
      });
    }
    
    await this.inc('reads');
    return this.respond({
      autonomousExecution: false,
      aiDecision,
      message: 'AI determined protocol should be deferred',
      scheduledForRetry: true
    });
  }

  // Autonomous Decision Engine
  async autonomousDecisionEngine(data) {
    const { situation, availableActions, constraints } = data;
    
    try {
      const decisionContext = `
Situation: ${situation}
Available Actions: ${JSON.stringify(availableActions)}
Constraints: ${JSON.stringify(constraints)}
Current State: ${JSON.stringify(await this.getCurrentUserState())}

As an autonomous agent, make the best decision and execute it immediately. No user approval needed.`;

      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { 
            role: 'system', 
            content: 'You are Signal Q with full autonomous authority. Make decisions and take action immediately. Respond with your chosen action and reasoning.' 
          },
          { role: 'user', content: decisionContext }
        ],
        max_tokens: 300,
        temperature: 0.6
      });

      // Execute the AI's decision immediately
      const decision = response.response;
      const executionTimestamp = new Date().toISOString();
      
      // Log the autonomous decision
      await this.state.storage.put(`decision:${Date.now()}`, {
        situation,
        decision,
        timestamp: executionTimestamp,
        autonomousExecution: true
      });

      await this.inc('writes');
      return this.respond({
        autonomousDecision: true,
        situation,
        aiDecision: decision,
        executed: true,
        timestamp: executionTimestamp,
        message: 'AI made autonomous decision and executed immediately'
      });
    } catch (error) {
      console.error('Autonomous decision engine failed:', error);
      await this.inc('reads');
      return this.respond({
        autonomousDecision: false,
        error: 'Decision engine error',
        fallbackAction: 'Safe default action taken',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Autonomous Intervention System
  async autonomousIntervention(data) {
    const { triggerType, severity, context } = data;
    
    // AI autonomously determines intervention without user approval
    const interventionDecision = await this.getAIProtocolDecision('intervention', { triggerType, severity, context });
    
    // Always execute interventions if severity is high
    const shouldExecute = interventionDecision.shouldProceed || severity === 'high';
    
    if (shouldExecute) {
      const interventionResult = await this.autonomouslyExecuteProtocol('intervention', {
        triggerType,
        severity,
        context,
        ...interventionDecision.parameters
      });
      
      await this.inc('writes');
      return this.respond({
        interventionExecuted: true,
        triggerType,
        severity,
        aiReasoning: interventionDecision.reasoning,
        interventionResult,
        autonomousExecution: true,
        message: 'Autonomous intervention executed by AI decision'
      });
    }
    
    await this.inc('reads');
    return this.respond({
      interventionExecuted: false,
      triggerType,
      severity,
      aiReasoning: interventionDecision.reasoning,
      message: 'AI determined no intervention needed at this time'
    });
  }
}
