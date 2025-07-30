// Signalhaven Transcendence Agent Worker
// Provides basic REST endpoints with persistent memory using KV and Durable Objects.
// Designed for the free Cloudflare Workers plan.

export default {
  async fetch(request, env) {
    // Simple bearer token auth. Token configured in wrangler.toml as API_TOKEN
    const auth = request.headers.get('Authorization') || '';
    const [, token] = auth.split(' ');
    if (env.API_TOKEN && token !== env.API_TOKEN) {
      return new Response('unauthorized', { status: 401 });
    }

    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const id = env.USERSTATE.idFromName(userId);
    const obj = env.USERSTATE.get(id);
    return obj.fetch(request, token);
  }
};

export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  // Route all API requests
  async fetch(request, token) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const method = request.method.toUpperCase();
    await this.rotateDay();

    if (path === '/identity-nodes' && method === 'GET') return this.listIdentityNodes();
    if (path === '/identity-nodes' && method === 'POST') return this.createIdentityNode(await request.json());
    if (path === '/protocols/aquil-probe' && method === 'POST') return this.activateAquilProbe(await request.json());
    if (path === '/voice-shifts' && method === 'POST') return this.recordVoiceShift(await request.json());
    if (path === '/identity-memories' && method === 'POST') return this.logMemory(await request.json());
    if (path === '/narratives/generate' && method === 'POST') return this.generateNarrative(await request.json());
    if (path.startsWith('/transition-maps/') && method === 'GET') return this.getSymbolicMap(path.split('/')[2]);
    if (path === '/ritual-actions/trigger' && method === 'POST') return this.triggerRitualAction(await request.json());
    if (path === '/logs' && method === 'GET') return this.getLogs();
    if (path === '/reset' && method === 'POST') return this.reset(token);

    return new Response('Not found', { status: 404 });
  }

  // List all stored identity nodes from KV
  async listIdentityNodes() {
    const list = await this.env.SIGNAL_KV.list({ prefix: 'identity:' });
    const nodes = [];
    for (const { name } of list.keys) {
      const value = await this.env.SIGNAL_KV.get(name, 'json');
      if (value) nodes.push(value);
    }
    await this.inc('reads');
    return this.respond({ nodes });
  }

  // Persist a new identity node to KV
  async createIdentityNode(node) {
    const key = `identity:${node.identity_key}`;
    await this.env.SIGNAL_KV.put(key, JSON.stringify(node));
    await this.inc('writes');
    return this.respond({ created: true });
  }

  // Start the AQUIL Probe protocol with a friction notice
  async activateAquilProbe(data) {
    const friction = ['Is this the right time?', 'Are you prepared for honest reflection?'];
    await this.inc('writes');
    return this.respond({ result: 'probe-started', friction });
  }

  // Record a voice shift event in KV
  async recordVoiceShift(shift) {
    const key = `voice:${Date.now()}`;
    await this.env.SIGNAL_KV.put(key, JSON.stringify(shift));
    await this.inc('writes');
    return this.respond({ recorded: true });
  }

  // Log a symbolic memory snapshot
  async logMemory(log) {
    const key = `u:${this.state.id}:memory:${Date.now()}`;
    log.version = 1;
    log.timestamp = new Date().toISOString();
    await this.env.SIGNAL_KV.put(key, JSON.stringify(log));
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
    const map = await this.env.SIGNAL_KV.get(`map:${mapId}`, 'json');
    if (!map) return new Response('not found', { status: 404 });
    await this.inc('reads');
    return this.respond(map);
  }

  // Trigger a ritual action and respond with friction
  async triggerRitualAction(ritual) {
    const friction = ['Consider your energy level before starting'];
    await this.inc('writes');
    return this.respond({ action: 'triggered', friction });
  }

  // Return list of all logs for this user (simplified)
  async getLogs() {
    const list = await this.env.SIGNAL_KV.list({ prefix: `u:${this.state.id}:` });
    const logs = [];
    for (const { name } of list.keys) {
      const v = await this.env.SIGNAL_KV.get(name, 'json');
      if (v) logs.push(v);
    }
    await this.inc('reads');
    return this.respond({ logs });
  }

  // Clear all user data (token must be admin)
  async reset(token) {
    if (token !== this.env.API_TOKEN_ADMIN) {
      return new Response('forbidden', { status: 403 });
    }
    const list = await this.env.SIGNAL_KV.list({ prefix: `u:${this.state.id}:` });
    for (const { name } of list.keys) {
      await this.env.SIGNAL_KV.delete(name);
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
}
