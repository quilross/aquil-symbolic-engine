/**
 * System Routes - Health checks, session initialization, and system status
 */

import { Router } from 'itty-router';
import { handleSessionInit, handleHealthCheck } from '../ark/endpoints.js';
import { logChatGPTAction } from '../actions/logging.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';

const systemRouter = Router();

// Session initialization - ChatGPT entry point
systemRouter.get("/api/session-init", withErrorHandling(async (req, env) => {
  const result = await handleSessionInit(req, env);
  const resultData = await result.clone().json();
  
  await logChatGPTAction(env, 'sessionInit', {}, resultData);
  
  return addCORSToResponse(result);
}));

// Health check endpoints
systemRouter.get("/api/system/health-check", withErrorHandling(async (req, env) => {
  const result = await handleHealthCheck(req, env);
  const data = await result.clone().json();
  
  await logChatGPTAction(env, 'healthCheck', {}, data);
  
  return addCORSToResponse(result);
}));

systemRouter.post("/api/system/health-check", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const result = await handleHealthCheck(req, env);
  const data = await result.clone().json();
  
  await logChatGPTAction(env, 'healthCheckPost', body, data);
  
  return addCORSToResponse(result);
}));

// System readiness check
systemRouter.get("/api/system/readiness", withErrorHandling(async (req, env) => {
  const readinessData = {
    status: "ready",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    services: {
      database: env.AQUIL_DB ? "available" : "unavailable",
      kv: env.AQUIL_MEMORIES ? "available" : "unavailable",
      vectorize: env.AQUIL_CONTEXT ? "available" : "unavailable"
    }
  };
  
  await logChatGPTAction(env, 'readinessCheck', {}, readinessData);
  
  return addCORSToResponse(new Response(JSON.stringify(readinessData), {
    headers: { "Content-Type": "application/json" }
  }));
}));

export { systemRouter };