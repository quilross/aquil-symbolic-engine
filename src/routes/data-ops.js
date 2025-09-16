/**
 * Data Operations Routes - Database operations (D1, KV, R2, Vectorize)
 */

import { Router } from 'itty-router';
import { exec as d1Exec } from '../actions/d1.js';
import { query as vectorQuery, upsert as vectorUpsert } from '../actions/vectorize.js';
import { put as r2Put, get as r2Get, listRecent as r2List } from '../actions/r2.js';
import { log as kvPut, get as kvGet } from '../actions/kv.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';

const dataOpsRouter = Router();

// D1 Database operations
dataOpsRouter.post("/api/d1/query", withErrorHandling(async (req, env) => {
  const result = await d1Exec(req, env);
  const body = await req.clone().json().catch(() => ({}));
  
  await logChatGPTAction(env, 'queryD1Database', body, result);
  
  return addCORSToResponse(result);
}));

// KV Store operations
dataOpsRouter.post("/api/kv/log", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = await kvPut(req, env);
  
  await logChatGPTAction(env, 'storeInKV', body, result);
  
  return addCORSToResponse(result);
}));

dataOpsRouter.get("/api/kv/get", withErrorHandling(async (req, env) => {
  const result = await kvGet(req, env);
  
  await logChatGPTAction(env, 'retrieveLogsOrDataEntries', { url: req.url }, result);
  
  return addCORSToResponse(result);
}));

// R2 Storage operations
dataOpsRouter.post("/api/r2/put", withErrorHandling(async (req, env) => {
  const result = await r2Put(req, env);
  const body = await req.clone().json().catch(() => ({}));
  
  await logChatGPTAction(env, 'logDataOrEvent', body, result);
  
  return addCORSToResponse(result);
}));

dataOpsRouter.get("/api/r2/get", withErrorHandling(async (req, env) => {
  const result = await r2Get(req, env);
  
  await logChatGPTAction(env, 'getKVStoredData', { url: req.url }, result);
  
  return addCORSToResponse(result);
}));

dataOpsRouter.get("/api/r2/list", withErrorHandling(async (req, env) => {
  const result = await r2List(env, {}); // Use default parameters
  
  await logChatGPTAction(env, 'listR2Objects', { url: req.url }, result);
  
  return addCORSToResponse(createSuccessResponse(result));
}));

// Vectorize operations
dataOpsRouter.post("/api/vectorize/query", withErrorHandling(async (req, env) => {
  const result = await vectorQuery(req, env);
  const body = await req.clone().json().catch(() => ({}));
  
  await logChatGPTAction(env, 'ragMemoryConsolidation', body, result);
  
  return addCORSToResponse(result);
}));

dataOpsRouter.post("/api/vectorize/upsert", withErrorHandling(async (req, env) => {
  const result = await vectorUpsert(req, env);
  const body = await req.clone().json().catch(() => ({}));
  
  await logChatGPTAction(env, 'upsertVectors', body, result);
  
  return addCORSToResponse(result);
}));

// Debug endpoint for vector dimensions
dataOpsRouter.get("/api/debug/vector-dimensions", withErrorHandling(async (req, env) => {
  const debugInfo = {
    status: "vector_debug_available",
    timestamp: new Date().toISOString(),
    vectorize_binding: env.AQUIL_CONTEXT ? "available" : "not_available"
  };
  
  return addCORSToResponse(createSuccessResponse(debugInfo));
}));

// Commitments operations
dataOpsRouter.post("/api/commitments/create", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = {
    success: true,
    commitment_created: true,
    commitment_id: `commitment_${Date.now()}`,
    message: "Commitment management system available but not fully implemented",
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'manageCommitment', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

dataOpsRouter.get("/api/commitments/active", withErrorHandling(async (req, env) => {
  const result = {
    success: true,
    active_commitments: [],
    message: "Commitment listing system available but not fully implemented",
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'listActiveCommitments', {}, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Goals operations
dataOpsRouter.post("/api/goals/set", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = {
    success: true,
    goal_set: true,
    goal_id: `goal_${Date.now()}`,
    message: "Goal setting system available but not fully implemented",
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'setPersonalGoals', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Habits operations
dataOpsRouter.post("/api/habits/design", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = {
    success: true,
    habit_designed: true,
    habit_id: `habit_${Date.now()}`,
    message: "Habit design system available but not fully implemented",
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'designHabits', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

export { dataOpsRouter };