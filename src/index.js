/**
 * Aquil Production - Main Entry Point (Restructured)
 * Personal AI Wisdom Builder optimized for ChatGPT integration
 * 
 * This is the primary worker that handles all API requests using modular routing
 */

import { Router } from 'itty-router';
import { handleScheduledTriggers } from './utils/autonomy.js';
import { createErrorResponse } from './utils/error-handler.js';
import { corsHeaders } from './utils/cors.js';

// Import modular route handlers
import { systemRouter } from './routes/system.js';
import { loggingRouter } from './routes/logging.js';
import { dataOpsRouter } from './routes/data-ops.js';
import { personalDevRouter } from './routes/personal-dev.js';
import { utilityRouter } from './routes/utility.js';
import { searchRouter } from './routes/search.js';

// Import ARK endpoints (already well-organized)
import {
  arkLog,
  arkRetrieve,
  arkMemories,
  arkVector,
  arkResonance,
  arkStatus,
  arkFilter,
  arkAutonomous,
  arkTestAI
} from "./ark/ark-endpoints.js";

import { isGPTCompatMode, safeBinding, safeOperation } from "./utils/gpt-compat.js";

// Import actions metadata for validation constants
import actions from '../config/ark.actions.logging.json' with { type: 'json' };
import { LOG_TYPES, STORED_IN, UUID_V4, MAX_DETAIL, ensureSchema } from './utils/logging-validation.js';

// Insight generation and journal service
import { generateInsight } from "./insightEngine.js";
import * as journalService from "./journalService.js";

// Logging action for the logChatGPTAction function
import { writeLog } from "./actions/logging.js";

// Pull routes from JSON (validation constants sourced from shared util)
const Routes = actions['x-ark-metadata'].routes

// Utilities
import { toCanonical } from "./ops/operation-aliases.js";

// Response utilities
import { 
  createSuccessResponse,
  handleCORSPreflight,
  extractSessionId,
  createWisdomResponse,
  createPatternResponse,
  createCommitmentResponse
} from "./utils/response-helpers.js";

// =============================================================================
// CHATGPT ACTION LOGGING
// =============================================================================

/**
 * Logs ChatGPT actions with proper tracking, metrics, and artifacts
 * This function ensures all ChatGPT interactions are properly logged for continuity
 */
async function logChatGPTAction(env, operationId, data, result, error = null) {
  try {
    const canonical = toCanonical(operationId);
    
    // Track successful store writes
    const stores = [];
    
    // Generate trace ID for this action
    const traceId = `gpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Collect metrics (fail-open)
    try {
      const { incrementActionSuccess, incrementActionError } = await import('./utils/metrics.js');
      if (error) {
        incrementActionError(env, canonical);
      } else {
        incrementActionSuccess(env, canonical);
      }
    } catch (metricsError) {
      console.warn('Metrics collection failed:', metricsError.message);
    }
    
    const payload = {
      action: operationId,
      input: data,
      result: error ? { 
        error: error.message,
        error_category: categorizeGPTError(error),
        error_severity: determineErrorSeverity(error)
      } : { 
        success: true, 
        processed: !!result 
      },
      // Enhanced observability metadata
      gpt_metadata: {
        action_type: 'chatgpt_interaction',
        canonical_operation: canonical,
        original_operation: operationId !== canonical ? operationId : null,
        trace_id: traceId,
        processing_timestamp: new Date().toISOString(),
        user_session: data?.session_id || 'unknown'
      }
    };
    
    // Generate R2 artifact for significant actions
    const r2Policy = getR2PolicyForAction(canonical);
    let binary = null;
    if (r2Policy !== 'n/a' && result && !error) {
      binary = generateArtifactForAction(canonical, result);
      if (binary) {
        stores.push('r2');
      }
    }
    
    // Standardized tags for ChatGPT actions
    const domain = getDomainForAction(canonical);
    const standardTags = [
      `action:${canonical}`,
      ...(canonical !== operationId ? [`alias:${operationId}`] : []),
      `domain:${domain}`,
      'source:gpt',
      `env:${env.ENVIRONMENT || 'production'}`,
      error ? 'error' : 'success',
      'chatgpt_action'
    ];
    
    // Create embedding text
    let textOrVector = error 
      ? `${canonical.replace(/_/g, ' ')} error: ${error.message}`
      : `${canonical.replace(/_/g, ' ')}: ${JSON.stringify(data).substring(0, 100)}...`;
    
    textOrVector = scrubAndTruncateForEmbedding(textOrVector);

    await writeLog(env, {
      type: error ? `${canonical}_error` : canonical,
      payload,
      session_id: data?.session_id || crypto.randomUUID(),
      who: 'system',
      level: error ? 'error' : 'info',
      tags: standardTags,
      binary,
      textOrVector,
      stores,  // Add stores tracking
      trace_id: traceId, // Pass trace ID for observability
      error_code: error ? generateErrorCode(canonical, error) : null // Structured error codes
    });
    
    // Track successful D1 write
    stores.push('d1');
    
  } catch (logError) {
    console.warn('Failed to log ChatGPT action:', logError);
  }
}

/**
 * Categorize GPT-specific errors for structured logging
 */
function categorizeGPTError(error) {
  if (error.message?.includes('database') || error.message?.includes('D1')) return 'database';
  if (error.message?.includes('KV') || error.message?.includes('storage')) return 'storage';
  if (error.message?.includes('timeout')) return 'timeout';
  if (error.message?.includes('validation') || error.message?.includes('schema')) return 'validation';
  if (error.message?.includes('auth') || error.message?.includes('permission')) return 'auth';
  if (error.message?.includes('network') || error.message?.includes('fetch')) return 'network';
  return 'unknown';
}

/**
 * Determine error severity for GPT actions
 */
function determineErrorSeverity(error) {
  const category = categorizeGPTError(error);
  if (category === 'database' || category === 'storage') return 'high';
  if (category === 'auth') return 'medium';
  if (category === 'validation' || category === 'timeout') return 'low';
  return 'medium';
}

/**
 * Generate structured error codes for observability
 */
function generateErrorCode(operation, error) {
  const category = categorizeGPTError(error);
  const severity = determineErrorSeverity(error);
  return `${operation.toUpperCase()}_${category.toUpperCase()}_${severity.toUpperCase()}`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Query metamorphic_logs with cursor pagination and stable sort
 */
async function queryMetamorphicLogs(env, { limit = 20, after = null, sessionId = null, since = null }) {
  try {
    const db = safeBinding(env, 'AQUIL_DB');
    if (!db) {
      return []; // Fail-open
    }

    let query = `
      SELECT id, timestamp, operationId, originalOperationId, kind, level, session_id, tags, stores, artifactKey, error_message, error_code, detail, env, source 
      FROM metamorphic_logs 
      WHERE 1=1
    `;
    const params = [];

    // Filter by session if provided
    if (sessionId) {
      query += ` AND session_id = ?`;
      params.push(sessionId);
    }

    // Filter by since timestamp if provided
    if (since) {
      query += ` AND timestamp >= ?`;
      params.push(since);
    }

    // Cursor pagination with stable sort
    if (after?.ts && after?.id) {
      query += ` AND (timestamp < ? OR (timestamp = ? AND id < ?))`;
      params.push(after.ts, after.ts, after.id);
    }

    query += ` ORDER BY timestamp DESC, id DESC LIMIT ?`;
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();
    
    // Transform to canonical format
    return results.map(toCanonicalLogItem);
  } catch (error) {
    console.warn('queryMetamorphicLogs error:', error);
    return []; // Fail-open
  }
}

/**
 * Gather readiness status for all systems
 */
async function gatherReadinessStatus(env) {
  const status = {
    ready: true,
    summary: "All systems operational",
    errors: [],
    flags: {
      conversationalEngine: env.ENABLE_CONVERSATIONAL_ENGINE === '1',
      gptCompatMode: !!(env.GPT_COMPAT_MODE || !env.AQUIL_DB)
    }
  };

  try {
    // Check D1 connection
    const db = safeBinding(env, 'AQUIL_DB');
    if (db) {
      await db.prepare('SELECT 1').first();
    } else {
      status.errors.push('D1 database not available');
      status.ready = false;
    }
  } catch (error) {
    status.errors.push(`D1 error: ${error.message}`);
    status.ready = false;
  }

  try {
    // Check KV connection
    const kv = safeBinding(env, 'AQUIL_CONTEXT');
    if (kv) {
      await kv.get('health-check', { type: 'text' });
    } else {
      status.errors.push('KV store not available');
      status.ready = false;
    }
  } catch (error) {
    status.errors.push(`KV error: ${error.message}`);
    status.ready = false;
  }

  // In fail-open mode, don't fail on store issues
  if (env.GPT_COMPAT_MODE === '1' && !status.ready) {
    status.ready = true;
    status.summary = "Running in fail-open mode with partial functionality";
  }

  return status;
}

/**
 * Transform database row to canonical log item format
 */
function toCanonicalLogItem(row) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    operationId: row.operationId,
    originalOperationId: row.originalOperationId,
    kind: row.kind,
    level: row.level || 'info',
    session_id: row.session_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    stores: row.stores ? JSON.parse(row.stores) : [],
    artifactKey: row.artifactKey,
    error: row.error_message ? {
      message: row.error_message,
      code: row.error_code
    } : null,
    detail: row.detail ? JSON.parse(row.detail) : null,
    env: row.env,
    source: row.source || 'gpt'
  };
}

/**
 * Scrub PII and truncate text for safe vector embedding
 */
function scrubAndTruncateForEmbedding(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  let scrubbed = text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\s+/g, ' ')
    .trim();
  
  return scrubbed.length > maxLength 
    ? scrubbed.substring(0, maxLength - 50) + '... [TRUNCATED FOR EMBEDDING]'
    : scrubbed;
}

/**
 * Determine R2 storage policy for an operation
 */
function getR2PolicyForAction(operationId) {
  const canonical = toCanonical(operationId);
  const r2Policies = {
    'somaticHealingSession': 'required',
    'extractMediaWisdom': 'required', 
    'interpretDream': 'required',
    'transformation_contract': 'required',
    'trustCheckIn': 'optional',
    'recognizePatterns': 'optional',
    'synthesizeWisdom': 'optional',
    'getWisdomAndInsights': 'optional',
    'optimizeEnergy': 'optional',
  };
  
  return r2Policies[canonical] || 'n/a';
}

/**
 * Determine domain category for tagging
 */
function getDomainForAction(operationId) {
  const canonical = toCanonical(operationId);
  const domains = {
    'trustCheckIn': 'trust',
    'somaticHealingSession': 'somatic',
    'extractMediaWisdom': 'wisdom',
    'recognizePatterns': 'patterns',
    'synthesizeWisdom': 'wisdom',
    'getWisdomAndInsights': 'wisdom',
    'systemHealthCheck': 'system',
    'logDataOrEvent': 'logging',
    'generateDiscoveryInquiry': 'discovery',
    'autoSuggestRitual': 'ritual'
  };
  
  return domains[canonical] || 'general';
}

/**
 * Generate R2 binary artifact for actions that need it
 */
function generateArtifactForAction(operationId, result) {
  try {
    const canonical = toCanonical(operationId);
    
    // Only generate artifacts for specific high-value operations
    const artifactOperations = ['somaticHealingSession', 'extractMediaWisdom', 'interpretDream'];
    if (!artifactOperations.includes(canonical)) {
      return null;
    }
    
    const artifact = {
      operation: canonical,
      timestamp: new Date().toISOString(),
      result: result,
      version: '2.0'
    };
    
    const jsonStr = JSON.stringify(artifact, null, 2);
    return btoa(jsonStr);
  } catch (error) {
    console.warn('Failed to generate artifact for', operationId, error.message);
    return null;
  }
}

// =============================================================================
// PERSONAL DEVELOPMENT SESSION PROCESSORS
// =============================================================================

// Individual session processors (used by dedicated router endpoints)
async function processGratitudeSession(content, sessionId, env) {
  const gratitudeItems = content.gratitude_items || [];
  return {
    session_type: 'gratitude',
    insights: [
      `Grateful for ${gratitudeItems.length} aspects of life`,
      "Gratitude shifts perspective toward abundance",
      "Regular practice strengthens appreciation"
    ],
    practices: [
      "Three daily gratitudes",
      "Gratitude journaling",
      "Appreciation meditation"
    ],
    next_steps: [
      "Notice small daily gifts",
      "Express gratitude to others",
      "Feel gratitude in your body"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processHealingSession(content, sessionId, env) {
  const emotions = content.emotions_present || [];
  return {
    session_type: 'healing',
    insights: [
      `Processing ${emotions.length} emotional states`,
      "Healing happens in layers",
      "Emotions carry important messages"
    ],
    practices: [
      "Emotional check-ins",
      "Feeling body awareness",
      "Compassionate self-talk"
    ],
    next_steps: [
      "Honor your emotional truth",
      "Seek support when needed",
      "Trust the healing process"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processIntuitionSession(content, sessionId, env) {
  return {
    session_type: 'intuition',
    insights: [
      "Your intuition is always available",
      "Body wisdom precedes mental analysis",
      "Trust develops through practice"
    ],
    practices: [
      "Daily intuition check-ins",
      "Body scanning",
      "Decision meditation"
    ],
    next_steps: [
      "Notice first impressions",
      "Track intuitive hits",
      "Honor subtle guidance"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processPurposeSession(content, sessionId, env) {
  return {
    session_type: 'purpose',
    insights: [
      "Purpose emerges through living",
      "Values provide direction",
      "Meaning is created, not found"
    ],
    practices: [
      "Values clarification",
      "Purpose journaling",
      "Meaningful action steps"
    ],
    next_steps: [
      "Align actions with values",
      "Notice what energizes you",
      "Contribute to something larger"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processRelationshipSession(content, sessionId, env) {
  return {
    session_type: 'relationships',
    insights: [
      "Connection requires vulnerability",
      "Growth happens in relationship",
      "Boundaries create safety"
    ],
    practices: [
      "Active listening",
      "Honest communication",
      "Empathy building"
    ],
    next_steps: [
      "Practice presence",
      "Share authentically",
      "Honor differences"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processShadowSession(content, sessionId, env) {
  return {
    session_type: 'shadow',
    insights: [
      "Shadow contains rejected parts",
      "Integration creates wholeness",
      "Triggers reveal shadow aspects"
    ],
    practices: [
      "Shadow dialogue",
      "Trigger exploration",
      "Self-compassion work"
    ],
    next_steps: [
      "Notice strong reactions",
      "Explore projections",
      "Embrace all parts of self"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processSocraticSession(content, sessionId, env) {
  return {
    session_type: 'socratic',
    insights: [
      "Questions reveal deeper truth",
      "Assumptions shape perception",
      "Inquiry opens possibilities"
    ],
    practices: [
      "Question assumptions",
      "Explore contradictions",
      "Seek multiple perspectives"
    ],
    next_steps: [
      "Ask 'What if?' questions",
      "Challenge beliefs",
      "Stay curious"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

async function processRitualSession(content, sessionId, env) {
  return {
    session_type: 'ritual',
    insights: [
      "Rituals create sacred time",
      "Intention shapes practice",
      "Consistency builds power"
    ],
    practices: [
      "Morning ritual design",
      "Transition ceremonies",
      "Evening reflection"
    ],
    next_steps: [
      "Create simple daily ritual",
      "Honor life transitions",
      "Practice with intention"
    ],
    session_id: sessionId,
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// ROUTER SETUP WITH ERROR HANDLING MIDDLEWARE
// =============================================================================
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

// =============================================================================
// INTEGRATE MODULAR ROUTERS
// =============================================================================

// System routes (health checks, session init, readiness)
router.all("/api/session-init", systemRouter.fetch);
router.all("/api/system/*", systemRouter.fetch);

// Logging routes (main logging, latest logs, retrieval meta)
router.all("/api/log", loggingRouter.fetch);
router.all("/api/logs/*", loggingRouter.fetch);
router.all("/api/session-init", loggingRouter.fetch);

// Data operations routes (D1, KV, R2, Vectorize)
router.all("/api/d1/*", dataOpsRouter.fetch);
router.all("/api/kv/*", dataOpsRouter.fetch);
router.all("/api/r2/*", dataOpsRouter.fetch);
router.all("/api/vectorize/*", dataOpsRouter.fetch);

// Search routes (vector similarity, RAG, content search)
router.all("/api/search/*", searchRouter.fetch);
router.all("/api/rag/*", searchRouter.fetch);
router.all("/api/analytics/*", searchRouter.fetch);
router.all("/api/export/*", searchRouter.fetch);

// Personal development routes (discovery, wisdom, trust, energy)
router.all("/api/discovery/*", personalDevRouter.fetch);
router.all("/api/trust/*", personalDevRouter.fetch);
router.all("/api/energy/*", personalDevRouter.fetch);
router.all("/api/somatic/*", personalDevRouter.fetch);
router.all("/api/patterns/*", personalDevRouter.fetch);

// Utility routes (feedback, insights, monitoring, dreams)
router.all("/api/feedback", utilityRouter.fetch);
router.all("/api/insights/*", utilityRouter.fetch);
router.all("/api/monitoring/*", utilityRouter.fetch);
router.all("/api/dreams/*", utilityRouter.fetch);
router.all("/api/conversation/*", utilityRouter.fetch);
router.all("/api/mood/*", utilityRouter.fetch);

// =============================================================================
// INSIGHT GENERATION ENDPOINT
// =============================================================================

// Generate insights from journal entries
router.post("/api/insight", async (req, env) => {
  try {
    const body = await req.json();
    
    // Extract current entry from request body
    const currentEntry = body.currentEntry || body.entry || body;
    
    // Retrieve user's history using journal service
    const historyResult = await journalService.listRecentEntries(env, { 
      limit: 50, // Get recent 50 entries for pattern analysis
      prefix: body.prefix || "log_" 
    });
    
    const userHistory = historyResult.success ? historyResult.entries : [];
    
    // Generate insight using the insight engine
    const insight = await generateInsight(currentEntry, userHistory);
    
    // Log the action for tracking
    await logChatGPTAction(env, 'generateJournalInsight', {
      entryId: currentEntry.id || 'unknown',
      historyCount: userHistory.length
    }, { insight });
    
    // Return the insight as JSON
    return addCORS(createSuccessResponse({
      insight: insight
    }));
    
  } catch (error) {
    console.error('Error in /api/insight:', error);
    
    await logChatGPTAction(env, 'generateJournalInsight', {}, null, error);
    
    return addCORS(createErrorResponse({
      error: 'insight_generation_failed',
      message: 'Failed to generate insight'
    }, 500));
  }
});

// =============================================================================
// ARK ENDPOINTS (CONSOLIDATED)
// =============================================================================

// ARK logging and retrieval
router.post("/api/ark/log", async (req, env) => {
  const result = await arkLog(req, env);
  return addCORS(result);
});

router.get("/api/ark/retrieve", async (req, env) => {
  const result = await arkRetrieve(req, env);
  return addCORS(result);
});

router.get("/api/ark/memories", async (req, env) => {
  const result = await arkMemories(req, env);
  return addCORS(result);
});

router.post("/api/ark/vector", async (req, env) => {
  const result = await arkVector(req, env);
  return addCORS(result);
});

router.post("/api/ark/resonance", async (req, env) => {
  const result = await arkResonance(req, env);
  return addCORS(result);
});

router.get("/api/ark/status", async (req, env) => {
  const result = await arkStatus(req, env);
  return addCORS(result);
});

router.post("/api/ark/filter", async (req, env) => {
  const result = await arkFilter(req, env);
  return addCORS(result);
});

router.post("/api/ark/autonomous", async (req, env) => {
  const result = await arkAutonomous(req, env);
  return addCORS(result);
});

router.post("/api/ark/test-ai", async (req, env) => {
  const result = await arkTestAI(env, req);
  return addCORS(result);
});

// =============================================================================
// ADDITIONAL ROUTER MOUNTS FOR COMPLETE SCHEMA COVERAGE
// =============================================================================

// Mount missing routers for schema operations
router.all("/api/media/*", personalDevRouter.fetch);
router.all("/api/standing-tall/*", personalDevRouter.fetch);
router.all("/api/creativity/*", personalDevRouter.fetch);
router.all("/api/abundance/*", personalDevRouter.fetch);
router.all("/api/transitions/*", personalDevRouter.fetch);
router.all("/api/ancestry/*", personalDevRouter.fetch);
router.all("/api/values/*", personalDevRouter.fetch);
router.all("/api/goals/*", dataOpsRouter.fetch);
router.all("/api/habits/*", dataOpsRouter.fetch);
router.all("/api/commitments/*", dataOpsRouter.fetch);

// Legacy endpoints - now handled by modular routers above (being removed)

// Personal development session endpoints (POST handlers)

// Routes now handled by modular routers above

// Personal development session endpoints (POST handlers)

// FALLBACK AND ERROR HANDLING
// =============================================================================

// Catch-all for unmatched routes

router.all("*", () => {
  const errorData = {
    errorId: 'ENDPOINT_NOT_FOUND',
    userMessage: 'Endpoint not found',
    technicalMessage: 'The requested API endpoint does not exist',
    category: 'routing',
    severity: 'low',
    additional_info: {
      available_endpoints: [
        "/api/session-init",
        "/api/discovery/generate-inquiry", 
        "/api/system/health-check",
        "/api/system/readiness",
        "/api/log",
        "/api/logs",
        "/api/logs/kv-write",
        "/api/logs/d1-insert", 
        "/api/logs/promote",
        "/api/logs/retrieve",
        "/api/logs/latest",
        "/api/logs/retrieval-meta",
        "/api/trust/check-in",
        "/api/somatic/session",
        "/api/media/extract-wisdom",
        "/api/patterns/recognize",
        "/api/patterns/autonomous-detect",
        "/api/standing-tall/practice",
        "/api/wisdom/synthesize",
        "/api/wisdom/daily-synthesis",
        "/api/feedback",
        "/api/dreams/interpret",
        "/api/energy/optimize",
        "/api/values/clarify",
        "/api/creativity/unleash",
        "/api/abundance/cultivate",
        "/api/transitions/navigate",
        "/api/ancestry/heal",
        "/api/mood/track",
        "/api/goals/set", 
        "/api/habits/design",
        "/api/commitments/create",
        "/api/commitments/active",
        "/api/commitments/:id/progress",
        "/api/ritual/auto-suggest",
        "/api/contracts/create",
        "/api/monitoring/metrics",
        "/api/socratic/question",
        "/api/coaching/comb-analysis",
        "/api/r2/put",
        "/api/r2/get",
        "/api/kv/log",
        "/api/kv/get",
        "/api/d1/query",
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
    }
  };
  
  return addCORS(createErrorResponse(errorData, 404));
});

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================

/**
 * Enhanced global error handler that catches any uncaught exceptions
 * and returns structured JSON error responses
 */
function createGlobalErrorHandler() {
  return async (request, env, ctx) => {
    try {
      return await router.fetch(request, env, ctx);
    } catch (error) {
      // Log the error for debugging
      console.error('Global error handler caught:', {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      });

      // Try to log the error using our logging system
      try {
        await logChatGPTAction(env, 'globalErrorHandler', {
          url: request.url,
          method: request.method,
          userAgent: request.headers.get('user-agent')
        }, null, error);
      } catch (logError) {
        console.warn('Failed to log global error:', logError.message);
      }

      // Return structured JSON error response
      const errorResponse = {
        error: "Internal server error",
        message: error.message,
        status: 500,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      };

      return addCORS(new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  };
}

// =============================================================================
// WORKER ENTRY POINT
// =============================================================================

export default {
  async fetch(request, env, ctx) {
    const globalHandler = createGlobalErrorHandler();
    return await globalHandler(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    // Handle scheduled autonomous actions
    try {
      await handleScheduledTriggers(env);
    } catch (error) {
      console.error('Scheduled trigger error:', error);
      
      // Try to log scheduled errors too
      try {
        await logChatGPTAction(env, 'scheduledTriggerError', {
          event: event.scheduledTime,
          cron: event.cron
        }, null, error);
      } catch (logError) {
        console.warn('Failed to log scheduled error:', logError.message);
      }
    }
  }
};