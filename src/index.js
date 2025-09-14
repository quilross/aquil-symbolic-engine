/**
 * Aquil Production - Main Entry Point (Restructured)
 * Personal AI Wisdom Builder optimized for ChatGPT integration
 * 
 * This is the primary worker that handles all API requests using modular routing
 */

import { Router } from 'itty-router';
import { handleCORSPreflight } from './utils/response-helpers.js';
import { handleScheduledTriggers } from './utils/autonomy.js';
import { createErrorResponse } from './utils/error-handler.js';
import { corsHeaders } from './utils/cors.js';

// Import modular route handlers
import { systemRouter } from './routes/system.js';
import { loggingRouter } from './routes/logging.js';
import { dataOpsRouter } from './routes/data-ops.js';
import { personalDevRouter } from './routes/personal-dev.js';
import { utilityRouter } from './routes/utility.js';

// Import ARK endpoints (already well-organized)
import {
  arkLog,
  arkRetrieve,
  arkMemories,
  arkVector,
  arkResonance,
  arkStatus,
  arkFilter,
  arkAutonomous
} from "./ark/ark-endpoints.js";

// Create main router
const router = Router();

// Add CORS headers helper
const addCORS = (res) => {
  if (res instanceof Response) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
  }
  return res;
};

// Handle CORS preflight requests
router.options("*", () => handleCORSPreflight());

// Register modular routes by importing handlers directly
// System routes
router.get("/api/session-init", (req, env, ctx) => systemRouter.fetch(req, env, ctx));
router.get("/api/system/health-check", (req, env, ctx) => systemRouter.fetch(req, env, ctx));
router.post("/api/system/health-check", (req, env, ctx) => systemRouter.fetch(req, env, ctx));
router.get("/api/system/readiness", (req, env, ctx) => systemRouter.fetch(req, env, ctx));

// Logging routes  
router.post("/api/log", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.get("/api/logs", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.post("/api/logs", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.post("/api/logs/kv-write", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.post("/api/logs/d1-insert", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.post("/api/logs/promote", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.post("/api/logs/retrieve", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.get("/api/logs/latest", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));
router.post("/api/logs/retrieval-meta", (req, env, ctx) => loggingRouter.fetch(req, env, ctx));

// Data operations routes
router.post("/api/d1/query", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.post("/api/kv/log", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.get("/api/kv/get", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.post("/api/r2/put", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.get("/api/r2/get", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.get("/api/r2/list", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.post("/api/vectorize/query", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.post("/api/vectorize/upsert", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));
router.get("/api/debug/vector-dimensions", (req, env, ctx) => dataOpsRouter.fetch(req, env, ctx));

// Personal development routes
router.post("/api/discovery/generate-inquiry", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/trust/check-in", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/somatic/session", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/media/extract-wisdom", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/patterns/recognize", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/standing-tall/practice", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/wisdom/synthesize", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.get("/api/wisdom/daily-synthesis", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/energy/optimize", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/values/clarify", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/creativity/unleash", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/abundance/cultivate", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/transitions/navigate", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));
router.post("/api/ancestry/heal", (req, env, ctx) => personalDevRouter.fetch(req, env, ctx));

// Utility routes
router.post("/api/feedback", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));
router.get("/api/insights", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));
router.post("/api/dreams/interpret", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));
router.get("/api/monitoring/metrics", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));
router.get("/api/analytics/insights", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));
router.post("/api/mood/track", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));
router.get("/api/export/conversation", (req, env, ctx) => utilityRouter.fetch(req, env, ctx));

// ARK endpoints (already well-organized)
router.post("/api/ark/log", arkLog);
router.get("/api/ark/retrieve", arkRetrieve);
router.get("/api/ark/memories", arkMemories);
router.post("/api/ark/vector", arkVector);
router.post("/api/ark/resonance", arkResonance);
router.get("/api/ark/status", arkStatus);
router.post("/api/ark/filter", arkFilter);
router.post("/api/ark/autonomous", arkAutonomous);

// Additional endpoints that may need implementation
// These are placeholders for endpoints that were in the original but not yet modularized

// Coaching endpoints
router.post("/api/coaching/comb-analysis", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Coaching analysis endpoint needs implementation" 
  }, 501));
});

// Goals and habits
router.post("/api/goals/set", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Goals setting endpoint needs implementation" 
  }, 501));
});

router.post("/api/habits/design", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Habits design endpoint needs implementation" 
  }, 501));
});

// Commitments
router.post("/api/commitments/create", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Commitments create endpoint needs implementation" 
  }, 501));
});

router.get("/api/commitments/active", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Active commitments endpoint needs implementation" 
  }, 501));
});

router.post("/api/commitments/:id/progress", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Commitment progress endpoint needs implementation" 
  }, 501));
});

// Rituals and contracts
router.post("/api/ritual/auto-suggest", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Ritual auto-suggest endpoint needs implementation" 
  }, 501));
});

router.post("/api/contracts/create", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Contracts create endpoint needs implementation" 
  }, 501));
});

// Socratic questioning
router.post("/api/socratic/question", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Socratic questioning endpoint needs implementation" 
  }, 501));
});

// Search endpoints
router.get("/api/search/logs", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Log search endpoint needs implementation" 
  }, 501));
});

router.get("/api/search/r2", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "R2 search endpoint needs implementation" 
  }, 501));
});

router.get("/api/search/resonance", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Resonance search endpoint needs implementation" 
  }, 501));
});

// RAG endpoints
router.post("/api/rag/memory", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "RAG memory endpoint needs implementation" 
  }, 501));
});

router.post("/api/rag/search", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "RAG search endpoint needs implementation" 
  }, 501));
});

// Autonomous pattern detection
router.post("/api/patterns/autonomous-detect", async (req, env) => {
  return addCORS(createErrorResponse({ 
    error: "endpoint_not_implemented", 
    message: "Autonomous pattern detection endpoint needs implementation" 
  }, 501));
});

// Catch-all 404 for API routes
router.all("/api/*", () => {
  return addCORS(createErrorResponse({
    error: "endpoint_not_found",
    message: "API endpoint not found",
    available_endpoints: [
      "/api/session-init",
      "/api/system/health-check",
      "/api/system/readiness", 
      "/api/log",
      "/api/logs",
      "/api/discovery/generate-inquiry",
      "/api/trust/check-in",
      "/api/somatic/session",
      "/api/media/extract-wisdom",
      "/api/patterns/recognize",
      "/api/standing-tall/practice",
      "/api/wisdom/synthesize",
      "/api/wisdom/daily-synthesis",
      "/api/energy/optimize",
      "/api/values/clarify",
      "/api/creativity/unleash",
      "/api/abundance/cultivate",
      "/api/transitions/navigate",
      "/api/ancestry/heal",
      "/api/feedback",
      "/api/insights",
      "/api/dreams/interpret",
      "/api/monitoring/metrics",
      "/api/analytics/insights",
      "/api/mood/track",
      "/api/export/conversation",
      "/api/d1/query",
      "/api/kv/log",
      "/api/kv/get",
      "/api/r2/put",
      "/api/r2/get",
      "/api/r2/list",
      "/api/vectorize/query",
      "/api/vectorize/upsert",
      "/api/ark/log",
      "/api/ark/retrieve",
      "/api/ark/memories",
      "/api/ark/vector",
      "/api/ark/resonance",
      "/api/ark/status",
      "/api/ark/filter",
      "/api/ark/autonomous"
    ]
  }, 404));
});

// =============================================================================
// WORKER ENTRY POINT
// =============================================================================

export default {
  async fetch(request, env, ctx) {
    try {
      return await router.fetch(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return addCORS(createErrorResponse({ 
        error: "Internal server error",
        message: error.message 
      }, 500));
    }
  },
  
  async scheduled(event, env, ctx) {
    // Handle scheduled autonomous actions
    try {
      await handleScheduledTriggers(env);
    } catch (error) {
      console.error('Scheduled trigger error:', error);
    }
  }
};