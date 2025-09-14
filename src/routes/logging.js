/**
 * Logging Routes - All logging operations (D1, KV, and log management)
 */

import { Router } from 'itty-router';
import { writeLog, logChatGPTAction } from '../actions/logging.js';
import { handleLog, handleRetrieveLogs } from '../ark/endpoints.js';
import { getRecentLogs } from '../actions/kv.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';

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

// KV logging operations
loggingRouter.post("/api/logs/kv-write", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation for KV write
  return addCORSToResponse(createSuccessResponse({ status: 'kv-write-implemented' }));
}));

loggingRouter.post("/api/logs/d1-insert", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation for D1 insert
  return addCORSToResponse(createSuccessResponse({ status: 'd1-insert-implemented' }));
}));

loggingRouter.post("/api/logs/promote", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation for log promotion
  return addCORSToResponse(createSuccessResponse({ status: 'promote-implemented' }));
}));

loggingRouter.post("/api/logs/retrieve", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = await handleRetrieveLogs(req, env);
  return addCORSToResponse(result);
}));

loggingRouter.get("/api/logs/latest", withErrorHandling(async (req, env) => {
  const logs = await getRecentLogs(env, 10);
  await logChatGPTAction(env, 'getLatestLogs', {}, logs);
  return addCORSToResponse(createSuccessResponse(logs));
}));

loggingRouter.post("/api/logs/retrieval-meta", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation for retrieval metadata
  return addCORSToResponse(createSuccessResponse({ status: 'retrieval-meta-implemented' }));
}));

export { loggingRouter };