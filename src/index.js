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
      textOrVector
    });
  } catch (logError) {
    console.warn('Failed to log ChatGPT action:', logError);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
    const resultData = await result.clone().json();
    
    await logChatGPTAction(env, 'generateDiscoveryInquiry', {}, resultData);
    
    return addCORS(result);
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
    return addCORS(createErrorResponse({ error: error.message }, 500));
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
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const session_id = url.searchParams.get('session_id');
    
    const results = await readLogs(env, { limit, session_id });
    
    return addCORS(new Response(JSON.stringify({
      logs: results.d1 || results.kv || results.r2 || [],
      session_id
    }), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    return addCORS(createErrorResponse({ error: error.message }, 500));
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
      "/api/log",
      "/api/logs",
      "/api/trust/check-in",
      "/api/somatic/session",
      "/api/media/extract-wisdom",
      "/api/patterns/recognize",
      "/api/standing-tall/practice"
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
