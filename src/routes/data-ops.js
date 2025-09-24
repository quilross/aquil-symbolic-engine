/**
 * Data Operations Routes - Database operations (D1, KV, R2, Vectorize)
 */

import { Router } from 'itty-router';
import { exec as d1Exec } from '../actions/d1.js';
import { query as vectorQuery, upsert as vectorUpsert } from '../actions/vectorize.js';
import { put as r2Put, get as r2Get, listRecent as r2List } from '../actions/r2.js';
import { log as kvPut, get as kvGet } from '../actions/kv.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';
import { z } from 'zod';

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}

// Schema validation for commitments
const commitmentSchema = z.object({
  action: z.enum(["create", "update"]),
  commitment: z.string().min(1),
  timeframe: z.string().optional(),
  micro_practice: z.boolean().optional(),
});

const dataOpsRouter = Router();

// D1 Database operations
dataOpsRouter.post("/api/d1/query", withErrorHandling(async (req, env) => {
  const reqClone = req.clone();
  const result = await d1Exec(reqClone, env);
  const body = await req.json().catch(() => ({}));
  
  await logChatGPTAction(env, 'queryD1Database', body, result);
  
  return addCORSToResponse(result);
}));

// KV Store operations
dataOpsRouter.post("/api/kv/log", withErrorHandling(async (req, env) => {
  // Clone request before passing to action to avoid consuming the body twice
  const reqClone = req.clone();
  const result = await kvPut(reqClone, env);
  // Read body from original for logging
  const body = await req.json().catch(() => ({}));
  
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
  const reqClone = req.clone();
  const result = await r2Put(reqClone, env);
  const body = await req.json().catch(() => ({}));
  
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
  // Clone the request before passing to action to avoid ReadableStream lock
  const reqClone = req.clone();
  const result = await vectorQuery(reqClone, env);
  
  // Read body from original request for logging
  const body = await req.json().catch(() => ({}));
  await logChatGPTAction(env, 'ragMemoryConsolidation', body, result);
  
  return addCORSToResponse(result);
}));

dataOpsRouter.post("/api/vectorize/upsert", withErrorHandling(async (req, env) => {
  // Clone the request before passing to action to avoid ReadableStream lock
  const reqClone = req.clone();
  const result = await vectorUpsert(reqClone, env);
  
  // Read body from original request for logging
  const body = await req.json().catch(() => ({}));
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

// Test endpoint for vector flow validation
dataOpsRouter.post("/api/test/vector-flow", withErrorHandling(async (req, env) => {
  try {
    const { testVectorFlow } = await import('../actions/vectorize.js');
    const result = await testVectorFlow(env);
    return addCORSToResponse(createSuccessResponse({
      status: "vector_flow_test_complete",
      timestamp: new Date().toISOString(),
      test_results: result,
      dimensions_validated: true
    }));
  } catch (e) {
    return addCORSToResponse(createErrorResponse(500, "vector_flow_test_failed", e.message));
  }
}));

// Commitments operations
dataOpsRouter.post("/api/commitments/create", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const validation = commitmentSchema.safeParse(body);
  
  if (!validation.success) {
    return addCORSToResponse(createErrorResponse(400, "validation_error", validation.error.message));
  }

  const { action, commitment, timeframe, micro_practice } = validation.data;
  const commitmentId = `commitment_${Date.now()}`;

  try {
    // Ensure the commitments table exists, create if not
    await env.AQUIL_DB.prepare(`
      CREATE TABLE IF NOT EXISTS commitments (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        commitment TEXT NOT NULL,
        timeframe TEXT,
        micro_practice BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Insert the commitment
    await env.AQUIL_DB.prepare(`
      INSERT INTO commitments (id, action, commitment, timeframe, micro_practice, status, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6, ?7)
    `).bind(
      commitmentId, 
      action, 
      commitment, 
      timeframe || null, 
      micro_practice || false,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    const result = {
      commitment_id: commitmentId,
      status: action === "create" ? "created" : "updated",
      commitment_details: { 
        commitment, 
        timeframe: timeframe || null, 
        micro_practice: micro_practice || false 
      },
      tracking_plan: ["Daily check-ins", "Weekly review"],
      next_steps: ["Set reminders", "Track progress"],
      session_id: crypto.randomUUID(),
    };

    await logChatGPTAction(env, 'manageCommitment', body, result);
    return addCORSToResponse(createSuccessResponse(result));
  } catch (error) {
    return addCORSToResponse(createErrorResponse(500, "database_error", error.message));
  }
}));

dataOpsRouter.get("/api/commitments/active", withErrorHandling(async (req, env) => {
  try {
    // Ensure the table exists first
    await env.AQUIL_DB.prepare(`
      CREATE TABLE IF NOT EXISTS commitments (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        commitment TEXT NOT NULL,
        timeframe TEXT,
        micro_practice BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const { results } = await env.AQUIL_DB.prepare(`
      SELECT * FROM commitments WHERE status = 'active' ORDER BY created_at DESC
    `).all();

    const result = {
      active_commitments: results,
      completion_summary: { 
        total: results.length, 
        completed: results.filter(c => c.status === 'completed').length 
      },
      upcoming_milestones: ["Weekly review", "Monthly reflection"],
      recommendations: results.length > 0 ? "Focus on consistency" : "Consider creating your first commitment",
      total_count: results.length,
    };

    await logChatGPTAction(env, 'listActiveCommitments', {}, result);
    return addCORSToResponse(createSuccessResponse(result));
  } catch (error) {
    return addCORSToResponse(createErrorResponse(500, "database_error", error.message));
  }
}));

// Goals operations
dataOpsRouter.post("/api/goals/set", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = {
    success: true,
    goal_set: true,
    goal_id: `goal_${Date.now()}`,
    message: "Goal setting system available but not fully implemented",
    implementation_status: 'mock',
    mock: true,
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
    implementation_status: 'mock',
    mock: true,
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'designHabits', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

export { dataOpsRouter };