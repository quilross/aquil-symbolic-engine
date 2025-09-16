/**
 * Logging Routes - All logging operations (D1, KV, and log management)
 */

import { Router } from 'itty-router';
import { writeLog } from '../actions/logging.js';
import { handleLog, handleRetrieveLogs } from '../ark/endpoints.js';
import { getRecentLogs } from '../actions/kv.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';

// Import helper functions from index.js
import { addEntry, getEntryById } from '../journalService.js';

// Import validation and helpers
import actions from '../../config/ark.actions.logging.json' with { type: 'json' };

// Validation constants from config
const LOG_TYPES = new Set(actions['x-ark-metadata'].enums?.logTypes ?? []);
const STORED_IN = new Set(actions['x-ark-metadata'].enums?.storedIn ?? []);
const UUID_V4 = new RegExp(actions['x-ark-metadata'].validation?.uuidV4 ?? '^[0-9a-fA-F-]{36}$');
const MAX_DETAIL = actions['x-ark-metadata'].validation?.maxDetailLength ?? 4000;

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}

// Helper functions (from index.js)
async function readJson(req) {
  try { return await req.json() } catch { return null }
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' }, ...init })
}

async function ensureSchema(env) {
  // idempotent
  await env.AQUIL_DB.exec?.(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      detail TEXT,
      timestamp TEXT NOT NULL,
      storedIn TEXT NOT NULL CHECK (storedIn IN ('KV','D1'))
    );
    CREATE TABLE IF NOT EXISTS retrieval_meta (
      id INTEGER PRIMARY KEY CHECK (id=1),
      lastRetrieved TEXT,
      retrievalCount INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO retrieval_meta (id,lastRetrieved,retrievalCount) VALUES (1,NULL,0);
  `)
}

function isIso(ts) {
  try {
    const d = new Date(ts)
    return !isNaN(d.getTime())
  } catch { return false }
}

function validateLog(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid body'
  const { id, type, detail, timestamp, storedIn } = payload
  if (!UUID_V4.test(id)) return 'id must be uuid v4'
  if (!LOG_TYPES.has(type)) return `type must be one of ${[...LOG_TYPES].join(',')}`
  if (detail != null && typeof detail !== 'string') return 'detail must be string'
  if (detail && detail.length > MAX_DETAIL) return `detail exceeds ${MAX_DETAIL} chars`
  if (!isIso(timestamp)) return 'timestamp must be ISO 8601'
  if (!STORED_IN.has(storedIn)) return `storedIn must be one of ${[...STORED_IN].join(',')}`
  return null
}

const loggingRouter = Router();

// Main logging endpoint
loggingRouter.post("/api/log", withErrorHandling(async (req, env) => {
  const result = await handleLog(req, env);
  const body = await req.clone().json();
  const data = await result.clone().json();
  
  await logChatGPTAction(env, 'logEntry', body, data);
  
  return addCORSToResponse(result);
}));

// Get logs with filtering
loggingRouter.get("/api/logs", withErrorHandling(async (req, env) => {
  const result = await handleRetrieveLogs(req, env);
  const data = await result.clone().json();
  
  await logChatGPTAction(env, 'retrieveLogs', { url: req.url }, data);
  
  return addCORSToResponse(result);
}));

// Post logs (alternative endpoint)
loggingRouter.post("/api/logs", withErrorHandling(async (req, env) => {
  const body = await req.json();
  
  // Validate required fields
  if (!body.session_id) {
    body.session_id = crypto.randomUUID();
  }
  
  const result = await writeLog(env, {
    session_id: body.session_id,
    voice: body.voice || body.who || 'user',
    level: body.level || 'info',
    type: body.type || 'user_action',
    payload: body.payload || body.content || body,
    autonomous: body.autonomous || false,
    tags: body.tags || []
  });
  
  await logChatGPTAction(env, 'writeLog', body, result);
  
  return addCORSToResponse(createSuccessResponse(result));
}));

// KV logging operations - Connected to main writeLog pipeline
loggingRouter.post("/api/logs/kv-write", withErrorHandling(async (req, env) => {
  const body = await readJson(req);
  const err = validateLog(body);
  if (err) return addCORSToResponse(json({ ok: false, error: err }, { status: 400 }));
  if (body.storedIn !== 'KV') return addCORSToResponse(json({ ok: false, error: 'storedIn must be KV' }, { status: 400 }));
  
  // Use main writeLog pipeline instead of direct addEntry
  const result = await writeLog(env, {
    type: body.type,
    payload: {
      id: body.id,
      type: body.type,
      detail: body.detail,
      timestamp: body.timestamp,
      storedIn: body.storedIn
    },
    session_id: body.session_id || crypto.randomUUID(),
    who: 'kv_write_api',
    level: 'info',
    tags: ['kv_write', 'api'],
    stores: ['kv'] // Explicitly target KV store
  });
  
  await logChatGPTAction(env, 'kvWrite', body, result);
  
  if (result.kv === "ok") {
    return addCORSToResponse(createSuccessResponse({ id: body.id, ...result }));
  } else {
    return addCORSToResponse(createErrorResponse(result.kv || 'Failed to write to KV', 500));
  }
}));

loggingRouter.post("/api/logs/d1-insert", withErrorHandling(async (req, env) => {
  await ensureSchema(env);
  const body = await readJson(req);
  const err = validateLog(body);
  if (err) return addCORSToResponse(json({ ok: false, error: err }, { status: 400 }));
  if (body.storedIn !== 'D1') return addCORSToResponse(json({ ok: false, error: 'storedIn must be D1' }, { status: 400 }));
  
  // Use main writeLog pipeline instead of direct D1 insert
  const result = await writeLog(env, {
    type: body.type,
    payload: {
      id: body.id,
      type: body.type,
      detail: body.detail,
      timestamp: body.timestamp,
      storedIn: body.storedIn
    },
    session_id: body.session_id || crypto.randomUUID(),
    who: 'd1_insert_api',
    level: 'info',
    tags: ['d1_insert', 'api'],
    stores: ['d1'] // Explicitly target D1 store
  });
  
  const finalResult = { 
    ok: result.d1 === "ok", 
    id: body.id,
    status: result 
  };
  await logChatGPTAction(env, 'd1Insert', body, finalResult);
  
  return addCORSToResponse(json(finalResult));
}));

loggingRouter.post("/api/logs/promote", withErrorHandling(async (req, env) => {
  await ensureSchema(env);
  const body = await readJson(req);
  const id = body?.id;
  if (!id || !UUID_V4.test(id)) return addCORSToResponse(json({ ok: false, error: 'invalid id' }, { status: 400 }));
  
  const result = await getEntryById(env, id);
  if (!result.success) {
    return addCORSToResponse(json({ ok: false, error: 'not found in KV' }, { status: 404 }));
  }
  
  const log = result.data;
  const err = validateLog(log);
  if (err) return addCORSToResponse(json({ ok: false, error: `invalid KV log: ${err}` }, { status: 400 }));
  
  // Use main writeLog pipeline to promote from KV to D1
  const promoteResult = await writeLog(env, {
    type: log.type,
    payload: {
      id: log.id,
      type: log.type,
      detail: log.detail,
      timestamp: log.timestamp,
      storedIn: 'D1',
      promoted_from: 'KV',
      original_kv_key: id
    },
    session_id: log.session_id || crypto.randomUUID(),
    who: 'promote_api',
    level: 'info',
    tags: ['promote', 'kv_to_d1', 'api'],
    stores: ['d1'] // Explicitly target D1 store for promotion
  });
  
  const finalResult = { 
    ok: promoteResult.d1 === "ok", 
    promotedId: id,
    status: promoteResult
  };
  await logChatGPTAction(env, 'promote', body, finalResult);
  
  return addCORSToResponse(json(finalResult));
}));

loggingRouter.post("/api/logs/retrieve", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = await handleRetrieveLogs(req, env);
  return addCORSToResponse(result);
}));

loggingRouter.get("/api/logs/latest", withErrorHandling(async (req, env) => {
  const logs = await getRecentLogs(env, { limit: 10 });
  await logChatGPTAction(env, 'getLatestLogs', {}, logs);
  return addCORSToResponse(createSuccessResponse(logs));
}));

loggingRouter.post("/api/logs/retrieval-meta", withErrorHandling(async (req, env) => {
  await ensureSchema(env);
  const body = await readJson(req);
  
  // Update retrieval metadata in D1
  const now = new Date().toISOString();
  await env.AQUIL_DB.prepare(
    'UPDATE retrieval_meta SET lastRetrieved = ?1, retrievalCount = retrievalCount + 1 WHERE id = 1'
  ).bind(now).run();
  
  const result = { ok: true, lastRetrieved: now, metadata: body };
  await logChatGPTAction(env, 'retrievalMeta', body, result);
  
  return addCORSToResponse(json(result));
}));

export { loggingRouter };