import {
  getPhiladelphiaTime,
  generateId,
  logMetamorphicEvent,
  selectOptimalVoice,
  performHealthChecks,
} from './core.js';

// Manifest for GPT: describes all available actions and storage usage
export const ARK_MANIFEST = [
  {
    name: 'handleSessionInit',
    path: '/api/session-init',
    description: 'Session initialization with continuity and AI-crafted opening',
    storage: ['D1', 'Worker AI'],
    logs: true
  },
  {
    name: 'handleDiscoveryInquiry',
    path: '/api/discovery/generate-inquiry',
    description: 'Generate Socratic questions using AI and log inquiry',
    storage: ['D1', 'Worker AI'],
    logs: true
  },
  {
    name: 'handleRitualSuggestion',
    path: '/api/ritual/auto-suggest',
    description: 'Suggest rituals using AI and log suggestion',
    storage: ['D1', 'Worker AI'],
    logs: true
  },
  {
    name: 'handleHealthCheck',
    path: '/api/system/health-check',
    description: 'Perform health checks and log results',
    storage: ['D1'],
    logs: true
  },
  {
    name: 'handleRetrieveLogs',
    path: '/api/logs',
    description: 'Retrieve conversation history and context',
    storage: ['D1'],
    logs: false
  },
  {
    name: 'handleLog',
    path: '/api/log',
    description: 'General logging endpoint for events and feedback',
    storage: ['D1', 'KV'],
    logs: true
  }
];

// Helper to call Worker AI (supports both env.AI and env.AI_GATEWAY)
async function aiCall(env, model, messages) {
  const client = env.AI || env.AI_GATEWAY;
  if (!client) throw new Error('AI binding not found');
  return client.run(model, { messages });
}

// Retrieve recent continuity logs from the database
async function fetchContinuityLogs(env, limit = 5) {
  if (!env.AQUIL_DB) return [];

  const parse = (val) => {
    try { return JSON.parse(val); } catch { return val; }
  };

  try {
    const { results } = await env.AQUIL_DB
      .prepare('SELECT id, timestamp, kind, detail FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?')
      .bind(limit)
      .all();
    return results.map(r => ({ ...r, detail: parse(r.detail) }));
  } catch {
    try {
      const { results } = await env.AQUIL_DB
        .prepare('SELECT id, ts as timestamp, type as kind, payload as detail FROM event_log ORDER BY ts DESC LIMIT ?')
        .bind(limit)
        .all();
      return results.map(r => ({ ...r, detail: parse(r.detail) }));
    } catch {
      return [];
    }
  }
}

// Session Init with AI-crafted opening
export async function handleSessionInit(request, env) {
  const sessionId = generateId();
  const continuity = await fetchContinuityLogs(env);

  // AI-generated Mirror opening
  let mirrorOpening;
  try {
    const prompt = `Weave these continuity events into a grounding Mirror opening: ${JSON.stringify(continuity)}`;
    const aiResp = await aiCall(env, '@cf/meta/llama-2-7b-chat-int8', [
      { role: 'user', content: prompt }
    ]);
    mirrorOpening = aiResp.response;
  } catch {
    mirrorOpening = continuity.length
      ? `I recall our journey through: ${continuity.map(e => e.kind).join(', ')}. How are you today?`
      : 'I’m here with you in this moment. What’s alive for you right now?';
  }

  // Log initiation
  await logMetamorphicEvent(env, {
    kind: 'session_init',
    detail: { continuity_count: continuity.length },
    session_id: sessionId,
    voice: 'mirror'
  });

  return new Response(
    JSON.stringify({
      session_id: sessionId,
      continuity,
      opening: mirrorOpening,
      voice: 'mirror',
      timestamp: getPhiladelphiaTime()
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Discovery Inquiry with AI
export async function handleDiscoveryInquiry(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { context = {}, session_id } = data;
  const voice = selectOptimalVoice(context.input || '', context);
  let question;
  try {
    const prompt = `As Ark’s ${voice} voice, ask a Socratic question about: ${JSON.stringify(context)}`;
    const aiResp = await aiCall(env, '@cf/meta/llama-2-7b-chat-int8', [
      { role: 'user', content: prompt }
    ]);
    question = aiResp.response;
  } catch {
    question = 'What emerges when you explore this topic?';
  }
  await logMetamorphicEvent(env, {
    kind: 'discovery_inquiry',
    detail: { question },
    session_id,
    voice
  });
  return new Response(
    JSON.stringify({ inquiry: question, voice_used: voice }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Ritual Suggestion with AI
export async function handleRitualSuggestion(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { context = {}, session_id } = data;
  let ritual;
  try {
    const prompt = `Recommend a ritual for this context: ${JSON.stringify(context)}`;
    const aiResp = await aiCall(env, '@cf/meta/llama-2-7b-chat-int8', [
      { role: 'user', content: prompt }
    ]);
    ritual = JSON.parse(aiResp.response);
  } catch {
    ritual = {
      name: 'Gentle Pause',
      instructions: ['Take three deep breaths', 'Ground in the present moment'],
      purpose: 'Reset and refocus'
    };
  }
  await logMetamorphicEvent(env, {
    kind: 'ritual_suggestion',
    detail: { ritual },
    session_id,
    voice: 'strategist'
  });
  return new Response(JSON.stringify({ suggestion: ritual }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Health Check
export async function handleHealthCheck(request, env) {
  const health = await performHealthChecks(env);
  return new Response(JSON.stringify({ ...health, timestamp: getPhiladelphiaTime() }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Retrieve logs with optional filtering
export async function handleRetrieveLogs(request, env) {
  if (!env.AQUIL_DB) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 200);
  const filters = {
    type: url.searchParams.get('type'),
    who: url.searchParams.get('who'),
    level: url.searchParams.get('level'),
    session_id: url.searchParams.get('session_id'),
    tag: url.searchParams.get('tag')
  };

  const parse = (val) => {
    try { return JSON.parse(val); } catch { return val; }
  };

  const buildWhere = (map) => {
    const clauses = [];
    const values = [];
    for (const key of ['type', 'who', 'level', 'session_id']) {
      const val = filters[key];
      if (val) {
        clauses.push(`${map[key]} = ?`);
        values.push(val);
      }
    }
    if (filters.tag) {
      clauses.push(`${map.tag} LIKE ?`);
      values.push(`%${filters.tag}%`);
    }
    return {
      where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
      values
    };
  };

  try {
    const { where, values } = buildWhere({
      type: 'kind',
      who: 'voice',
      level: 'signal_strength',
      session_id: 'session_id',
      tag: 'tags'
    });
    const stmt = env.AQUIL_DB
      .prepare(`SELECT id, timestamp, kind, detail FROM metamorphic_logs${where} ORDER BY timestamp DESC LIMIT ?`)
      .bind(...values, limit);
    const { results } = await stmt.all();
    return new Response(JSON.stringify(results.map(r => ({ ...r, detail: parse(r.detail) }))), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (primaryErr) {
    try {
      const { where, values } = buildWhere({
        type: 'type',
        who: 'who',
        level: 'level',
        session_id: 'session_id',
        tag: 'tags'
      });
      const stmt = env.AQUIL_DB
        .prepare(`SELECT id, ts AS timestamp, type AS kind, payload AS detail FROM event_log${where} ORDER BY ts DESC LIMIT ?`)
        .bind(...values, limit);
      const { results } = await stmt.all();
      return new Response(JSON.stringify(results.map(r => ({ ...r, detail: parse(r.detail) }))), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (secondaryErr) {
      return new Response(
        JSON.stringify({ error: 'Unable to fetch logs', message: String(secondaryErr) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}

// Logging
export async function handleLog(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const id = await logMetamorphicEvent(env, {
    kind: body.type,
    detail: body.payload,
    session_id: body.session_id,
    voice: body.who
  });
  return new Response(JSON.stringify({ status: 'ok', id }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

