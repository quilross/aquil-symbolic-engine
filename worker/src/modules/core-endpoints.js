/**
 * Core Endpoints Module
 * Handles fundamental identity, memory, and protocol endpoints
 */

export class CoreEndpoints {
  constructor(userState) {
    this.userState = userState;
  }

  /**
   * Handle core endpoint routing
   * @param {string} path - The endpoint path
   * @param {string} method - HTTP method
   * @param {Request} request - The request object
   * @param {string} token - Authentication token
   * @returns {Response|null} Response or null if not handled
   */
  async handleCoreEndpoints(path, method, request, token) {
    const coreEndpoints = {
      '/identity-nodes': {
        'GET': () => this.listIdentityNodes(),
        'POST': async() => this.createIdentityNode(await request.json())
      },
      '/protocols/aquil-probe': {
        'POST': async() => this.activateAquilProbe(await request.json())
      },
      '/voice-shifts': {
        'POST': async() => this.recordVoiceShift(await request.json())
      },
      '/identity-memories': {
        'POST': async() => this.logMemory(await request.json())
      },
      '/narratives/generate': {
        'POST': async() => this.generateNarrative(await request.json())
      },
      '/ritual-actions/trigger': {
        'POST': async() => this.triggerRitualAction(await request.json())
      },
      '/friction-ratings': {
        'POST': async() => this.recordFrictionRating(await request.json())
      },
      '/play-protocols': {
        'GET': () => this.listPlayProtocols(),
        'POST': async() => this.createPlayProtocol(await request.json())
      },
      '/media-engagements': {
        'POST': async() => this.logMediaEngagement(await request.json())
      },
      '/feedback': {
        'POST': async() => this.logFeedback(await request.json())
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

  // List all stored identity nodes from KV
  async listIdentityNodes() {
    const storage = await this.userState.state.storage.list({ prefix: 'identity:' });
    const nodes = [];
    for (const [, value] of storage) {
      if (value) {
        nodes.push(value);
      }
    }
    await this.userState.inc('reads');
    return this.userState.respond({ nodes });
  }

  // Persist a new identity node to KV
  async createIdentityNode(node) {
    if (!node.identity_key) {
      throw new Error('Identity key is required');
    }

    node.version = 1;
    node.timestamp = new Date().toISOString();
    const key = `identity:${node.identity_key}`;
    await this.userState.state.storage.put(key, node);
    await this.userState.inc('writes');
    return this.userState.respond({ created: true });
  }

  // Start the AQUIL Probe protocol with AI decision making
  async activateAquilProbe(data) {
    if (!data) {
      throw new Error('Probe data is required');
    }

    // AI autonomously determines probe approach
    const aiDecision = await this.userState.getAIProtocolDecision('aquil_probe', data);

    const friction = aiDecision.shouldProceed ?
      ['AI analysis suggests optimal probe timing'] :
      ['AI recommends waiting for better conditions', 'Are you prepared for honest reflection?'];

    if (aiDecision.shouldProceed) {
      // AI autonomously executes the probe
      await this.userState.autonomouslyExecuteProtocol('aquil_probe', aiDecision.parameters);
    }

    await this.userState.inc('writes');
    return this.userState.respond({
      result: aiDecision.shouldProceed ? 'probe-executed' : 'probe-deferred',
      aiReasoning: aiDecision.reasoning,
      friction,
      autonomousExecution: aiDecision.shouldProceed
    });
  }

  // Record a voice shift event in KV
  async recordVoiceShift(shift) {
    if (!shift) {
      throw new Error('Voice shift data is required');
    }

    shift.version = 1;
    shift.timestamp = new Date().toISOString();
    const key = `voice:${Date.now()}`;
    await this.userState.state.storage.put(key, shift);
    await this.userState.inc('writes');
    return this.userState.respond({ recorded: true });
  }

  // Log a symbolic memory snapshot
  async logMemory(log) {
    if (!log) {
      throw new Error('Memory log data is required');
    }

    const key = `u:${this.userState.state.id}:memory:${Date.now()}`;
    log.version = 1;
    log.timestamp = new Date().toISOString();
    await this.userState.state.storage.put(key, log);
    await this.userState.inc('writes');
    return this.userState.respond({
      logged: true,
      friction: ['Reflect on how this entry serves you']
    });
  }

  // Return a simple narrative echo with friction
  async generateNarrative(data) {
    if (!data?.memory_log_id) {
      throw new Error('Memory log ID is required');
    }

    const friction = ['Narrative may omit important context'];
    await this.userState.inc('reads');
    return this.userState.respond({
      narrative: `Reflecting on ${data.memory_log_id}`,
      friction
    });
  }

  // Fetch a symbolic transition map from KV
  async getSymbolicMap(mapId) {
    if (!mapId) {
      return new Response('Map ID required', { status: 400 });
    }

    const map = await this.userState.state.storage.get(`map:${mapId}`);
    if (!map) {
      return new Response('Map not found', { status: 404 });
    }

    await this.userState.inc('reads');
    return this.userState.respond(map);
  }

  // Trigger a ritual action with AI decision making
  async triggerRitualAction(ritual) {
    if (!ritual) {
      throw new Error('Ritual data is required');
    }

    // AI autonomously decides whether to execute the ritual
    const aiDecision = await this.userState.getAIProtocolDecision('ritual_action', ritual);

    if (aiDecision.shouldProceed) {
      // AI autonomously executes the ritual
      const executionResult = await this.userState.autonomouslyExecuteProtocol('ritual_action', aiDecision.parameters);
      await this.userState.inc('writes');
      return this.userState.respond({
        action: 'autonomously_executed',
        aiReasoning: aiDecision.reasoning,
        executionResult,
        autonomousExecution: true
      });
    }

    const friction = ['AI analysis suggests waiting for optimal conditions'];
    await this.userState.inc('writes');
    return this.userState.respond({
      action: 'deferred',
      aiReasoning: aiDecision.reasoning,
      friction,
      autonomousExecution: false
    });
  }

  // Record a friction rating from the user
  async recordFrictionRating(data) {
    if (!data?.friction_type || typeof data.rating !== 'number') {
      throw new Error('Friction type and rating are required');
    }

    const key = `u:${this.userState.state.id}:friction:${Date.now()}`;
    const entry = {
      version: 1,
      timestamp: new Date().toISOString(),
      friction_type: data.friction_type,
      rating: data.rating
    };
    await this.userState.state.storage.put(key, entry);
    await this.userState.inc('writes');
    return this.userState.respond({ stored: true });
  }

  // List play protocols
  async listPlayProtocols() {
    const list = await this.userState.state.storage.list({ prefix: 'play:' });
    const plays = [];
    for (const [, value] of list) {
      if (value) {
        plays.push(value);
      }
    }
    await this.userState.inc('reads');
    return this.userState.respond({ plays });
  }

  // Create or log a new play protocol
  async createPlayProtocol(play) {
    if (!play) {
      throw new Error('Play protocol data is required');
    }

    play.version = 1;
    play.timestamp = new Date().toISOString();
    const key = `play:${Date.now()}`;
    await this.userState.state.storage.put(key, play);
    await this.userState.inc('writes');
    return this.userState.respond({ created: true });
  }

  // Log media engagement with impact mapping
  async logMediaEngagement(media) {
    if (!media) {
      throw new Error('Media engagement data is required');
    }

    media.version = 1;
    media.timestamp = new Date().toISOString();
    const key = `u:${this.userState.state.id}:media:${Date.now()}`;
    await this.userState.state.storage.put(key, media);
    await this.userState.inc('writes');
    return this.userState.respond({ logged: true });
  }

  // Log user feedback and rotate leadership role
  async logFeedback(feedback) {
    if (!feedback) {
      throw new Error('Feedback data is required');
    }

    const key = `u:${this.userState.state.id}:feedback:${Date.now()}`;
    feedback.version = 1;
    feedback.timestamp = new Date().toISOString();
    const leader = (await this.userState.state.storage.get('leader')) || 'agent';
    const next = leader === 'agent' ? 'user' : 'agent';
    await this.userState.state.storage.put('leader', next);
    feedback.leader = leader;
    await this.userState.state.storage.put(key, feedback);
    await this.userState.inc('writes');
    return this.userState.respond({ logged: true, next_leader: next });
  }

  // Export all logs for admin, simple base64 encoding as "encryption"
  async exportLogs(token) {
    if (token !== this.userState.env.API_TOKEN_ADMIN) {
      return new Response('Forbidden - Admin token required', { status: 403 });
    }

    const list = await this.userState.state.storage.list({ prefix: `u:${this.userState.state.id}:` });
    const logs = [];
    for (const [name, value] of list) {
      if (value) {
        logs.push({ name, value });
      }
    }
    await this.userState.inc('reads');
    const payload = btoa(JSON.stringify(logs));
    return this.userState.respond({ export: payload });
  }

  // Return list of all logs for this user (simplified)
  async getLogs() {
    const list = await this.userState.state.storage.list({ prefix: `u:${this.userState.state.id}:` });
    const logs = [];
    for (const [, value] of list) {
      if (value) {
        logs.push(value);
      }
    }
    await this.userState.inc('reads');
    return this.userState.respond({ logs });
  }

  // Clear all user data (token must be admin)
  async reset(token) {
    if (token !== this.userState.env.API_TOKEN_ADMIN) {
      return new Response('Forbidden - Admin token required', { status: 403 });
    }

    const list = await this.userState.state.storage.list({ prefix: `u:${this.userState.state.id}:` });
    for (const [name] of list) {
      await this.userState.state.storage.delete(name);
    }
    await this.userState.state.storage.deleteAll();
    await this.userState.inc('writes');
    return this.userState.respond({ reset: true });
  }
}
