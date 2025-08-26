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
    name: 'handleLog',
    path: '/api/log',
    description: 'General logging endpoint for events and feedback',
    storage: ['D1', 'KV'],
    logs: true
  }
];

// ...existing code...
// Unified handler for ARK endpoints (for src/index.js)
export async function handleArkEndpoints(request, env) {
  // Route based on request URL for all ARK endpoints
  const url = new URL(request.url);
  if (url.pathname === '/api/session-init' || url.pathname.startsWith('/api/voice')) {
    return handleSessionInit(request, env);
  }
  if (url.pathname === '/api/discovery/generate-inquiry' || url.pathname.startsWith('/api/discovery')) {
    return handleDiscoveryInquiry(request, env);
  }
  if (url.pathname === '/api/ritual/auto-suggest' || url.pathname.startsWith('/api/ritual')) {
    return handleRitualSuggestion(request, env);
  }
  if (url.pathname === '/api/system/health-check' || url.pathname.startsWith('/api/system/health-check')) {
    return handleHealthCheck(request, env);
  }
  if (url.pathname === '/api/log' || url.pathname.startsWith('/api/log')) {
    return handleLog(request, env);
  }
  return new Response('Not found', { status: 404 });
}
import {
  getPhiladelphiaTime,
  generateId,
  logMetamorphicEvent,
  selectOptimalVoice,
} from './core.js';

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
  const { context = {}, session_id } = await request.json();
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
  const { context = {}, session_id } = await request.json();
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

// Logging
export async function handleLog(request, env) {
  const body = await request.json();
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

// Main export
export default {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
  handleLog
};
// File: src/index.js

import { Router } from 'itty-router';

const router = Router();
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
const addCORS = res => (Object.entries(cors).forEach(([k,v])=>res.headers.set(k,v))||res);

// CORS preflight
router.options('*', () => new Response(null, { status: 200, headers: cors }));

// ARK endpoints
router.get('/api/session-init', (req, env) => addCORS(endpoints.handleSessionInit(req, env)));
router.post('/api/discovery/generate-inquiry', (req, env) => addCORS(endpoints.handleDiscoveryInquiry(req, env)));
router.post('/api/ritual/auto-suggest', (req, env) => addCORS(endpoints.handleRitualSuggestion(req, env)));
router.get('/api/system/health-check', (req, env) => addCORS(endpoints.handleHealthCheck(req, env)));
router.post('/api/log', (req, env) => addCORS(endpoints.handleLog(req, env)));

// Existing ARK and legacy endpoints follow...

