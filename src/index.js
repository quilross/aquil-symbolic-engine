import { Router } from 'itty-router';
import {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
  handleLog,
} from './ark/endpoints.js';

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

// Fallback for unknown routes
router.all('*', () => addCORS(new Response('Not found', { status: 404 })));

export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx),
};

