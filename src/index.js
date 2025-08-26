import { Router } from 'itty-router';
import {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
  handleLog,
} from './ark/endpoints.js';
import * as kv from './actions/kv.js';
import * as d1 from './actions/d1.js';
import * as r2 from './actions/r2.js';
import * as vectorize from './actions/vectorize.js';
import * as ai from './actions/ai.js';

const router = Router();
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
const addCORS = (res) => {
  Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
  return res;
};

// CORS preflight
router.options('*', () => new Response(null, { status: 200, headers: cors }));

// ARK endpoints
router.get('/api/session-init', async (req, env) => addCORS(await handleSessionInit(req, env)));
router.post('/api/discovery/generate-inquiry', async (req, env) => addCORS(await handleDiscoveryInquiry(req, env)));
router.post('/api/ritual/auto-suggest', async (req, env) => addCORS(await handleRitualSuggestion(req, env)));
router.get('/api/system/health-check', async (req, env) => addCORS(await handleHealthCheck(req, env)));
router.post('/api/log', async (req, env) => addCORS(await handleLog(req, env)));

// KV
router.post('/kv/log', async (req, env) => addCORS(await kv.log(req, env)));
router.get('/kv/get', async (req, env) => addCORS(await kv.get(req, env)));

// D1
router.post('/d1/exec', async (req, env) => addCORS(await d1.exec(req, env)));

// R2
router.post('/r2/put', async (req, env) => addCORS(await r2.put(req, env)));
router.get('/r2/get', async (req, env) => addCORS(await r2.get(req, env)));

// Vectorize
router.post('/vectorize/upsert', async (req, env) => addCORS(await vectorize.upsert(req, env)));
router.post('/vectorize/query', async (req, env) => addCORS(await vectorize.query(req, env)));

// Workers AI
router.post('/ai/embed', async (req, env) => addCORS(await ai.embed(req, env)));
router.post('/ai/generate', async (req, env) => addCORS(await ai.generate(req, env)));

// Fallback for unknown routes
router.all('*', () => addCORS(new Response('Not found', { status: 404 })));

export default {
  fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};
