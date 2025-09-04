/**
 * Aquil Symbolic Engine - Main Entry Point
 * Personal AI Wisdom Builder optimized for ChatGPT integration
 * 
 * This is the primary worker that handles all API requests for:
 * - Behavioral Intelligence Engine (conversational analysis)
 * - Personal growth tracking and insights
 * - Autonomous wisdom synthesis
 * - Multi-store logging (D1, KV, R2, Vector)
 */

import { Router } from 'itty-router';
import crypto from 'crypto';

// Core endpoint handlers
import {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
  handleReadinessCheck,
} from "./ark/endpoints.js";

// Behavioral engine
import { runEngine } from "./agent/engine.js";

// ARK endpoints for autonomous functionality
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

// Logging and data persistence
import { 
  writeLog, 
  readLogs, 
  writeAutonomousLog, 
  readAutonomousLogs, 
  getAutonomousStats, 
  readLogsWithFilters 
} from "./actions/logging.js";

// Dream interpretation utilities
import { buildInterpretation, maybeRecognizePatterns, safeTruncated } from "./utils/dream-interpreter.js";

// Core AI modules for personal growth
import { SomaticHealer } from "./src-core-somatic-healer.js";
import { TrustBuilder } from "./src-core-trust-builder.js";
import { MediaWisdomExtractor } from "./src-core-media-wisdom.js";
import { PatternRecognizer } from "./src-core-pattern-recognizer.js";
import { StandingTall } from "./src-core-standing-tall.js";
import { ValuesClarifier } from "./src-core-values-clarifier.js";
import { CreativityUnleasher } from "./src-core-creativity-unleasher.js";
import { AbundanceCultivator } from "./src-core-abundance-cultivator.js";
import { TransitionNavigator } from "./src-core-transition-navigator.js";
import { AncestryHealer } from "./src-core-ancestry-healer.js";
import { AquilCore } from "./src-core-aquil-core.js";

// Utilities
import { toCanonical } from "./ops/operation-aliases.js";
import { logMetamorphicEvent } from "./ark/core.js";
import { AquilDatabase } from "./utils/database.js";
import { AquilAI } from "./utils/ai-helpers.js";
import { safeBinding } from "./utils/gpt-compat.js";
import { 
  detectTriggers, 
  callAutonomousEndpoint, 
  handleScheduledTriggers,
  autoDetectTags,
  AUTONOMOUS_TRIGGERS 
} from "./utils/autonomy.js";

// Response utilities
import { 
  handleError, 
  createErrorResponse, 
  withErrorHandling,
  handleHealthCheckError 
} from "./utils/error-handler.js";
import { 
  createSuccessResponse,
  createSimpleErrorResponse,
  handleCORSPreflight,
  addCORSToResponse,
  createAutonomousResponse,
  createHealthResponse,
  extractSessionId,
  createWisdomResponse,
  createPatternResponse,
  createSessionInitResponse,
  createCommitmentResponse,
  createFallbackResponse
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
      result: error ? { error: error.message } : { success: true, processed: !!result }
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
      stores  // Add stores tracking
    });
    
    // Track successful D1 write
    stores.push('d1');
    
  } catch (logError) {
    console.warn('Failed to log ChatGPT action:', logError);
  }
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
    if (after && after.ts && after.id) {
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
    'getPersonalInsights': 'optional',
    'getDailySynthesis': 'optional',
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
// ROUTER SETUP
// =============================================================================

const router = Router();

// CORS headers for ChatGPT compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

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
// MAIN API ENDPOINTS
// =============================================================================

// Session initialization - ChatGPT entry point
router.get("/api/session-init", async (req, env) => {
  try {
    const result = await handleSessionInit(req, env);
    const resultData = await result.clone().json();
    
    await logChatGPTAction(env, 'sessionInit', {}, resultData);
    
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'sessionInit', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Discovery inquiry with Behavioral Intelligence Engine
router.post("/api/discovery/generate-inquiry", async (req, env) => {
  try {
    const result = await handleDiscoveryInquiry(req, env);
    const data = await result.clone().json();
    
    // Wire conversational engine if enabled
    if (env.ENABLE_CONVERSATIONAL_ENGINE === '1') {
      const body = await req.clone().json();
      const userText = body.prompt || body.text || '';
      const sessionId = data.session_id || extractSessionId(req) || crypto.randomUUID();
      
      try {
        const probe = await runEngine(env, sessionId, userText);
        // Blend engine output into existing response fields
        data.voice_used = probe.voice;
        data.press_level = probe.pressLevel;
        if (probe.questions && probe.questions.length > 0) {
          data.questions = probe.questions;
        }
        if (probe.micro) {
          data.micro_commitment = probe.micro;
        }
        // Add engine info to logging payload
        data.engine_probe = { questions: probe.questions, micro: probe.micro };
      } catch (engineError) {
        console.warn('Conversational engine failed:', engineError.message);
      }
    }
    
    await logChatGPTAction(env, 'generateDiscoveryInquiry', {}, data);
    
    return addCORS(new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    await logChatGPTAction(env, 'generateDiscoveryInquiry', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// System health check
router.get("/api/system/health-check", async (req, env) => {
  try {
    const result = await handleHealthCheck(req, env);
    const resultData = await result.clone().json();
    
    await logChatGPTAction(env, 'systemHealthCheck', {}, resultData);
    
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'systemHealthCheck', {}, null, error);
    // Always return 200 for health checks (fail-open)
    return addCORS(new Response(JSON.stringify({ 
      ready: false, 
      summary: "Health check failed", 
      errors: [error.message], 
      flags: {} 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
  }
});

// Readiness check endpoint (always returns 200)
router.get("/api/system/readiness", async (req, env) => {
  try {
    const status = await gatherReadinessStatus(env);
    await logChatGPTAction(env, 'systemHealthCheck', {}, status);
    return addCORS(new Response(JSON.stringify(status), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    await logChatGPTAction(env, 'systemHealthCheck', {}, null, error);
    return addCORS(new Response(JSON.stringify({ 
      ready: false, 
      summary: "Readiness check failed", 
      errors: [error.message], 
      flags: {} 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
  }
});

// General logging endpoint
router.post("/api/log", async (req, env) => {
  try {
    const body = await req.json();
    const result = await writeLog(env, {
      type: body.type || 'chat_message',
      payload: body.payload || body,
      session_id: body.session_id || crypto.randomUUID(),
      who: body.who || 'user',
      level: body.level || 'info',
      tags: body.tags || [],
      textOrVector: body.message || body.content || JSON.stringify(body.payload || body)
    });
    
    await logChatGPTAction(env, 'logDataOrEvent', body, result);
    
    return addCORS(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    await logChatGPTAction(env, 'logDataOrEvent', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Retrieve logs
router.get("/api/logs", async (req, env) => {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const cursor = url.searchParams.get('cursor');
    const sessionId = url.searchParams.get('sessionId') || url.searchParams.get('session_id');
    const since = url.searchParams.get('since');

    // Decode cursor → {ts,id}
    let after = null;
    if (cursor) {
      try {
        after = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      } catch {
        // Invalid cursor, ignore
      }
    }

    // Query metamorphic_logs with stable sort
    const items = await queryMetamorphicLogs(env, { limit, after, sessionId, since });
    
    // Generate next cursor if we have full page
    let nextCursor = null;
    if (items.length === limit && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ 
        ts: lastItem.timestamp, 
        id: lastItem.id 
      })).toString('base64');
    }

    // Log the retrieval (non-blocking)
    await logChatGPTAction(env, 'retrieveLogsOrDataEntries', 
      { limit, sessionId, since }, 
      { count: items.length, cursor: !!nextCursor }
    ).catch(() => {});

    return addCORS(new Response(JSON.stringify({
      items,
      cursor: nextCursor
    }), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    // Fail-open
    await logChatGPTAction(env, 'retrieveLogsOrDataEntries', {}, null, error).catch(() => {});
    return addCORS(new Response(JSON.stringify({
      items: [],
      cursor: null,
      warnings: ['fail-open: logs unavailable']
    }), {
      headers: { "Content-Type": "application/json" }
    }));
  }
});

// =============================================================================
// PERSONAL GROWTH ENDPOINTS
// =============================================================================

// Trust check-in with behavioral analysis
router.post("/api/trust/check-in", async (req, env) => {
  try {
    const body = await req.json();
    
    if (!body.current_state) {
      return addCORS(createErrorResponse({ error: "current_state required" }, 400));
    }
    
    const trustBuilder = new TrustBuilder();
    const analysis = await trustBuilder.checkIn(body);
    
    await logChatGPTAction(env, 'trustCheckIn', body, analysis);
    
    return addCORS(createWisdomResponse(analysis));
  } catch (error) {
    await logChatGPTAction(env, 'trustCheckIn', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Somatic healing session
router.post("/api/somatic/session", async (req, env) => {
  try {
    const body = await req.json();
    const somaticHealer = new SomaticHealer();
    const session = await somaticHealer.generateSession(body);
    
    // Wire conversational engine if enabled
    if (env.ENABLE_CONVERSATIONAL_ENGINE === '1') {
      const userText = body.text || body.description || '';
      const sessionId = body.session_id || crypto.randomUUID();
      
      try {
        const probe = await runEngine(env, sessionId, userText);
        // Blend engine output into existing response fields
        session.voice_used = probe.voice;
        session.press_level = probe.pressLevel;
        if (probe.questions && probe.questions.length > 0) {
          session.integration_questions = probe.questions;
        }
        if (probe.micro) {
          session.micro_commitment = probe.micro;
        }
        // Add engine info to logging payload
        session.engine_probe = { questions: probe.questions, micro: probe.micro };
      } catch (engineError) {
        console.warn('Conversational engine failed:', engineError.message);
      }
    }
    
    await logChatGPTAction(env, 'somaticHealingSession', body, session);
    
    return addCORS(createWisdomResponse(session));
  } catch (error) {
    await logChatGPTAction(env, 'somaticHealingSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Media wisdom extraction
router.post("/api/media/extract-wisdom", async (req, env) => {
  try {
    const body = await req.json();
    const extractor = new MediaWisdomExtractor();
    const wisdom = await extractor.extractWisdom(body);
    
    await logChatGPTAction(env, 'extractMediaWisdom', body, wisdom);
    
    return addCORS(createWisdomResponse(wisdom));
  } catch (error) {
    await logChatGPTAction(env, 'extractMediaWisdom', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Pattern recognition
router.post("/api/patterns/recognize", async (req, env) => {
  try {
    const body = await req.json();
    const recognizer = new PatternRecognizer();
    const patterns = await recognizer.recognizePatterns(body);
    
    // Wire conversational engine if enabled
    if (env.ENABLE_CONVERSATIONAL_ENGINE === '1') {
      const userText = body.text || body.prompt || '';
      const sessionId = body.session_id || crypto.randomUUID();
      
      try {
        const probe = await runEngine(env, sessionId, userText);
        // Blend engine output into existing response fields
        patterns.voice_used = probe.voice;
        patterns.press_level = probe.pressLevel;
        if (probe.questions && probe.questions.length > 0) {
          patterns.follow_up_questions = probe.questions;
        }
        if (probe.micro) {
          patterns.micro_commitment = probe.micro;
        }
        // Add engine info to logging payload
        patterns.engine_probe = { questions: probe.questions, micro: probe.micro };
      } catch (engineError) {
        console.warn('Conversational engine failed:', engineError.message);
      }
    }
    
    await logChatGPTAction(env, 'recognizePatterns', body, patterns);
    
    return addCORS(createPatternResponse(patterns));
  } catch (error) {
    await logChatGPTAction(env, 'recognizePatterns', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Standing tall practice
router.post("/api/standing-tall/practice", async (req, env) => {
  try {
    const body = await req.json();
    const standingTall = new StandingTall();
    const practice = await standingTall.generatePractice(body);
    
    await logChatGPTAction(env, 'standingTallPractice', body, practice);
    
    return addCORS(createWisdomResponse(practice));
  } catch (error) {
    await logChatGPTAction(env, 'standingTallPractice', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// MISSING OPERATION HANDLERS (STUBS)
// =============================================================================

// Wisdom synthesis
router.post("/api/wisdom/synthesize", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "synthesizeWisdom feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "synthesizeWisdom"
    };
    
    await logChatGPTAction(env, 'synthesizeWisdom', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'synthesizeWisdom', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Daily synthesis
router.get("/api/wisdom/daily-synthesis", async (req, env) => {
  try {
    const result = { 
      status: "coming_soon", 
      message: "getDailySynthesis feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "getDailySynthesis"
    };
    
    await logChatGPTAction(env, 'getDailySynthesis', {}, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'getDailySynthesis', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Personal insights
router.get("/api/insights", async (req, env) => {
  try {
    const result = { 
      status: "coming_soon", 
      message: "getPersonalInsights feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "getPersonalInsights"
    };
    
    await logChatGPTAction(env, 'getPersonalInsights', {}, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'getPersonalInsights', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Submit feedback
router.post("/api/feedback", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "submitFeedback feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "submitFeedback"
    };
    
    await logChatGPTAction(env, 'submitFeedback', body, result);
    return addCORS(createSuccessResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'submitFeedback', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Dream interpretation
router.post("/api/dreams/interpret", async (req, env) => {
  return await interpretDreamHandler(req, env);
});

/**
 * Production handler for dream interpretation
 * Parses input safely, runs interpretation, returns structured results
 */
async function interpretDreamHandler(req, env) {
  const started = Date.now();
  const warnings = [];
  let sessionId = undefined;
  
  try {
    // Parse input safely
    const body = await req.clone().json().catch(() => ({}));
    
    // Handle both schema formats (text vs dream_text)
    const text = (body?.text || body?.dream_text || '').toString().trim();
    const context = body?.context || {};
    
    // Extract or generate session ID
    sessionId = body?.sessionId || body?.session_id || extractSessionId(req, body) || crypto.randomUUID();
    
    // Handle idempotency
    const idempotencyKey = req.headers.get('idempotency-key');
    let stableId = sessionId;
    if (idempotencyKey) {
      // Create stable ID from sessionId + idempotency key for D1 INSERT OR IGNORE
      const hash = crypto.createHash('sha256').update(sessionId + idempotencyKey).digest('hex');
      stableId = `dream_${hash.substring(0, 16)}`;
    }

    // Preprocessing - guard against short input
    if (!text || text.length < 20) {
      const interpretation = {
        themes: [],
        symbols: [],
        tensions: [],
        invitations: [],
        summary: "Dream text too short to interpret meaningfully."
      };
      
      try {
        await logChatGPTAction(env, 'interpretDream', { sessionId, text: text || '' }, { interpretation, warnings: ['short_input'] });
      } catch (logError) {
        warnings.push('logging_fail');
      }
      
      return addCORS(new Response(JSON.stringify({ sessionId, interpretation, warnings: ['short_input'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // Normalize text
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    // Optional engine cues (fail-open)
    let engine;
    if (env.ENABLE_CONVERSATIONAL_ENGINE === '1') {
      try {
        engine = await runEngine(env, sessionId, normalizedText);
      } catch (e) {
        warnings.push('engine_fail');
        console.warn('Engine failed for dream interpretation:', e.message);
      }
    }

    // Optional motifs from pattern recognition (fail-open)
    let motifs = [];
    try {
      motifs = await maybeRecognizePatterns(env, normalizedText);
    } catch (e) {
      warnings.push('patterns_fail');
      console.warn('Pattern recognition failed for dream interpretation:', e.message);
    }

    // Build interpretation (deterministic + cues)
    const interpretation = buildInterpretation(normalizedText, motifs, engine);

    // Logging with R2 artifact (fail-open)
    try {
      await logChatGPTAction(
        env,
        'interpretDream',
        { sessionId: stableId, text: safeTruncated(normalizedText, 1000) },
        { interpretation, motifs: motifs.slice(0, 8) }
      );
    } catch (e) {
      warnings.push('logging_fail');
      console.warn('Logging failed for dream interpretation:', e.message);
    }

    // Build response payload
    const payload = { sessionId, interpretation };
    
    // Include engine data if available
    if (engine) {
      payload.engine = {
        voice: engine.voice,
        pressLevel: engine.pressLevel,
        questions: engine.questions,
        micro: engine.micro
      };
    }
    
    // Include warnings if any
    if (warnings.length) {
      payload.warnings = warnings;
    }

    return addCORS(new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

  } catch (err) {
    // Absolute fail-open - never crash
    console.error('Dream interpretation error:', err);
    
    try {
      await logChatGPTAction(env, 'interpretDream', { sessionId }, null, err);
    } catch (logError) {
      // Even logging can fail in fail-open mode
    }
    
    return addCORS(new Response(JSON.stringify({
      sessionId: sessionId || crypto.randomUUID(),
      interpretation: {
        themes: [],
        symbols: [],
        tensions: [],
        invitations: [],
        summary: "Unable to interpret at this time."
      },
      warnings: ['fail_open']
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}

// Energy optimization
router.post("/api/energy/optimize", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "optimizeEnergy feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "optimizeEnergy"
    };
    
    await logChatGPTAction(env, 'optimizeEnergy', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'optimizeEnergy', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Values clarification
router.post("/api/values/clarify", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "clarifyValues feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "clarifyValues"
    };
    
    await logChatGPTAction(env, 'clarifyValues', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'clarifyValues', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Creativity unleashing
router.post("/api/creativity/unleash", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "unleashCreativity feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "unleashCreativity"
    };
    
    await logChatGPTAction(env, 'unleashCreativity', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'unleashCreativity', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Abundance cultivation
router.post("/api/abundance/cultivate", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "cultivateAbundance feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "cultivateAbundance"
    };
    
    await logChatGPTAction(env, 'cultivateAbundance', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'cultivateAbundance', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Transition navigation
router.post("/api/transitions/navigate", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "navigateTransitions feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "navigateTransitions"
    };
    
    await logChatGPTAction(env, 'navigateTransitions', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'navigateTransitions', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Ancestry healing
router.post("/api/ancestry/heal", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "healAncestry feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "healAncestry"
    };
    
    await logChatGPTAction(env, 'healAncestry', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'healAncestry', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Commitment management
router.post("/api/commitments/create", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "manageCommitment feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "manageCommitment"
    };
    
    await logChatGPTAction(env, 'manageCommitment', body, result);
    return addCORS(createCommitmentResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'manageCommitment', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// List active commitments
router.get("/api/commitments/active", async (req, env) => {
  try {
    const result = { 
      status: "coming_soon", 
      message: "listActiveCommitments feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "listActiveCommitments",
      commitments: []
    };
    
    await logChatGPTAction(env, 'listActiveCommitments', {}, result);
    return addCORS(createCommitmentResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'listActiveCommitments', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Update commitment progress  
router.post("/api/commitments/:id/progress", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "updateCommitmentProgress feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "updateCommitmentProgress"
    };
    
    await logChatGPTAction(env, 'updateCommitmentProgress', body, result);
    return addCORS(createCommitmentResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'updateCommitmentProgress', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Auto-suggest ritual
router.post("/api/ritual/auto-suggest", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "autoSuggestRitual feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "autoSuggestRitual"
    };
    
    await logChatGPTAction(env, 'autoSuggestRitual', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'autoSuggestRitual', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Autonomous pattern detection
router.post("/api/patterns/autonomous-detect", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "autonomousPatternDetect feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "autonomousPatternDetect"
    };
    
    await logChatGPTAction(env, 'autonomousPatternDetect', body, result);
    return addCORS(createPatternResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'autonomousPatternDetect', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Transformation contract
router.post("/api/contracts/create", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "transformation_contract feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "transformation_contract"
    };
    
    await logChatGPTAction(env, 'transformation_contract', body, result);
    return addCORS(createCommitmentResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'transformation_contract', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Monitoring metrics
router.get("/api/monitoring/metrics", async (req, env) => {
  try {
    const result = { 
      status: "coming_soon", 
      message: "getMonitoringMetrics feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "getMonitoringMetrics",
      metrics: {}
    };
    
    await logChatGPTAction(env, 'getMonitoringMetrics', {}, result);
    return addCORS(createSuccessResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'getMonitoringMetrics', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Socratic questions
router.post("/api/socratic/question", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "socraticQuestions feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "socraticQuestions"
    };
    
    await logChatGPTAction(env, 'socraticQuestions', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'socraticQuestions', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// COM-B behavioral analysis
router.post("/api/coaching/comb-analysis", async (req, env) => {
  try {
    const body = await req.json();
    const result = { 
      status: "coming_soon", 
      message: "combBehavioralAnalysis feature is being implemented",
      timestamp: new Date().toISOString(),
      operation: "combBehavioralAnalysis"
    };
    
    await logChatGPTAction(env, 'combBehavioralAnalysis', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'combBehavioralAnalysis', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// FALLBACK AND ERROR HANDLING
// =============================================================================

// Catch-all for unmatched routes
router.all("*", () => {
  return addCORS(createErrorResponse({ 
    error: "Endpoint not found", 
    available_endpoints: [
      "/api/session-init",
      "/api/discovery/generate-inquiry", 
      "/api/system/health-check",
      "/api/system/readiness",
      "/api/log",
      "/api/logs",
      "/api/trust/check-in",
      "/api/somatic/session",
      "/api/media/extract-wisdom",
      "/api/patterns/recognize",
      "/api/patterns/autonomous-detect",
      "/api/standing-tall/practice",
      "/api/wisdom/synthesize",
      "/api/wisdom/daily-synthesis",
      "/api/insights",
      "/api/feedback",
      "/api/dreams/interpret",
      "/api/energy/optimize",
      "/api/values/clarify",
      "/api/creativity/unleash",
      "/api/abundance/cultivate",
      "/api/transitions/navigate",
      "/api/ancestry/heal",
      "/api/commitments/create",
      "/api/commitments/active",
      "/api/commitments/:id/progress",
      "/api/ritual/auto-suggest",
      "/api/contracts/create",
      "/api/monitoring/metrics",
      "/api/socratic/question",
      "/api/coaching/comb-analysis"
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
