// Signalhaven Transcendence Agent Worker
// Provides basic REST endpoints with persistent memory using KV and Durable Objects.
// Designed for the free Cloudflare Workers plan.

export default {
  async fetch(request, env) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const id = env.USERSTATE.idFromName(userId);
    const obj = env.USERSTATE.get(id);
    return obj.fetch(request);
  }
};

export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  // Route all API requests
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const method = request.method.toUpperCase();

    if (path === '/identity-nodes' && method === 'GET') return this.listIdentityNodes();
    if (path === '/identity-nodes' && method === 'POST') return this.createIdentityNode(await request.json());
    if (path === '/protocols/aquil-probe' && method === 'POST') return this.activateAquilProbe(await request.json());
    if (path === '/voice-shifts' && method === 'POST') return this.recordVoiceShift(await request.json());
    if (path === '/identity-memories' && method === 'POST') return this.logMemory(await request.json());
    if (path === '/narratives/generate' && method === 'POST') return this.generateNarrative(await request.json());
    if (path.startsWith('/transition-maps/') && method === 'GET') return this.getSymbolicMap(path.split('/')[2]);
    if (path === '/ritual-actions/trigger' && method === 'POST') return this.triggerRitualAction(await request.json());

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
    return this.respond({ nodes });
  }

  // Persist a new identity node to KV
  async createIdentityNode(node) {
    const key = `identity:${node.identity_key}`;
    await this.env.SIGNAL_KV.put(key, JSON.stringify(node));
    return this.respond({ created: true });
  }

  // Start the AQUIL Probe protocol with a friction notice
  async activateAquilProbe(data) {
    const friction = ['Is this the right time?', 'Are you prepared for honest reflection?'];
    return this.respond({ result: 'probe-started', friction });
  }

  // Record a voice shift event in KV
  async recordVoiceShift(shift) {
    const key = `voice:${Date.now()}`;
    await this.env.SIGNAL_KV.put(key, JSON.stringify(shift));
    return this.respond({ recorded: true });
  }

  // Log a symbolic memory snapshot
  async logMemory(log) {
    const key = `memory:${Date.now()}`;
    await this.env.SIGNAL_KV.put(key, JSON.stringify(log));
    return this.respond({ logged: true });
  }

  // Return a simple narrative echo with friction
  async generateNarrative(data) {
    const friction = ['Narrative may omit important context'];
    return this.respond({ narrative: `Reflecting on ${data.memory_log_id}`, friction });
  }

  // Fetch a symbolic transition map from KV
  async getSymbolicMap(mapId) {
    const map = await this.env.SIGNAL_KV.get(`map:${mapId}`, 'json');
    if (!map) return new Response('not found', { status: 404 });
    return this.respond(map);
  }

  // Trigger a ritual action and respond with friction
  async triggerRitualAction(ritual) {
    const friction = ['Consider your energy level before starting'];
    return this.respond({ action: 'triggered', friction });
  }

  // Standard JSON response helper with timestamp
  respond(obj) {
    obj.timestamp = new Date().toISOString();
    return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
  }
}
