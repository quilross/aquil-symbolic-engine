import {
  getPhiladelphiaTime,
  generateId,
  logMetamorphicEvent,
  selectOptimalVoice,
  detectInterventionNeeds
} from './core.js';

// Helper to call Worker AI (supports both env.AI and env.AI_GATEWAY)
async function aiCall(env, model, messages) {
  const client = env.AI || env.AI_GATEWAY;
  if (!client) throw new Error('AI binding not found');
  return client.run(model, { messages });
}

// Session Init with AI-crafted opening
export async function handleSessionInit(request, env) {
  const sessionId = generateId();
  // Retrieve logs (omitted for brevity—use your existing logic)
  const continuity = /* fetched & merged logs */ [];

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

javascript
import { Router } from 'itty-router';
import endpoints from './ark/endpoints.js';

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

export default {
  async fetch(req, env, ctx) {
    try {
      return await router.handle(req, env, ctx);
    } catch (e) {
      return addCORS(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
    }
  }
};
