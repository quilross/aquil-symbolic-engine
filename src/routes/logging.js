/**
 * Logging Routes - All logging operations (D1, KV, and log management)
 */

import { Router } from 'itty-router';
import { writeLog } from '../actions/logging.js';
import { handleLog, handleRetrieveLogs } from '../ark/endpoints.js';
import { getRecentLogs } from '../actions/kv.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';
import { LOG_TYPES, STORED_IN, UUID_V4, MAX_DETAIL, ensureSchema, validateLog } from '../utils/logging-validation.js';

// Import helper functions from index.js
import { getEntryById } from '../journalService.js';

// Validation constants imported from shared utility

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}

// Local JSON helpers for this router
async function readJson(req) { try { return await req.json() } catch { return null } }
function json(data, init = {}) { return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' }, ...init }) }

// ensureSchema imported from shared utility

// ISO validation is handled inside validateLog

// validateLog imported from shared utility

const loggingRouter = Router();

// Main logging endpoint
loggingRouter.post("/api/log", withErrorHandling(async (req, env) => {
  // Clone request to avoid ReadableStream lock
  const reqClone = req.clone();
  const result = await handleLog(reqClone, env);
  
  // Log the action with body from original request
  const body = await req.json().catch(() => ({}));
  const data = await result.clone().json().catch(() => ({}));
  
  await logChatGPTAction(env, 'logEntry', body, data);

  return addCORSToResponse(result);
}));

// Get logs with filtering
loggingRouter.get("/api/logs", withErrorHandling(async (req, env) => {
  const reqClone = req.clone();
  const result = await handleRetrieveLogs(reqClone, env);
  
  // Log the action
  const data = await result.clone().json().catch(() => ({}));
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
  
  const result = getEntryById(env, id);
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

// Session initialization endpoint for conversation context
loggingRouter.get("/api/session-init", withErrorHandling(async (req, env) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '7', 10), 200);
  
  const { readLogs } = await import('../actions/logging.js');
  const logs = await readLogs(env, { limit });
  
  // Generate session summary from recent logs
  const recentLogs = logs.kv || [];
  const sessionSummary = recentLogs.length > 0 
    ? `Found ${recentLogs.length} recent entries from various activities`
    : 'No recent activity found';
  
  const contextFlags = [];
  if (recentLogs.some(log => log.level === 'breakthrough')) {
    contextFlags.push('recent_breakthrough');
  }
  if (recentLogs.some(log => log.type === 'autonomous')) {
    contextFlags.push('autonomous_activity');
  }
  
  const result = {
    recent_logs: recentLogs,
    session_summary: sessionSummary,
    context_flags: contextFlags,
    total_entries: recentLogs.length,
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'retrieveRecentSessionLogs', { limit }, result);
  
  return addCORSToResponse(createSuccessResponse(result));
}));

export { loggingRouter };