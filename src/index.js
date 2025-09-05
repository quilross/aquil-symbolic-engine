/**
 * Aquil Production - Main Entry Point
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
  handleHealthCheck,
} from "./ark/endpoints.js";

// ARK enhanced endpoints
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

// Behavioral engine
import { runEngine } from "./agent/engine.js";

// Logging and data persistence
import { 
  writeLog 
} from "./actions/logging.js";

// Dream interpretation utilities
import { buildInterpretation, maybeRecognizePatterns, safeTruncated } from "./utils/dream-interpreter.js";

// D1 and Vector database actions
import { exec as d1Exec } from "./actions/d1.js";
import { query as vectorQuery, upsert as vectorUpsert } from "./actions/vectorize.js";

// R2 storage actions
import { put as r2Put, get as r2Get } from "./actions/r2.js";

// KV storage actions
import { log as kvLog, get as kvGet } from "./actions/kv.js";

// Core AI modules for personal growth
import { SomaticHealer } from "./src-core-somatic-healer.js";
import { ValuesClarifier } from "./src-core-values-clarifier.js";
import { CreativityUnleasher } from "./src-core-creativity-unleasher.js";
import { AbundanceCultivator } from "./src-core-abundance-cultivator.js";
import { TransitionNavigator } from "./src-core-transition-navigator.js";
import { AncestryHealer } from "./src-core-ancestry-healer.js";
import { TrustBuilder } from "./src-core-trust-builder.js";
import { MediaWisdomExtractor } from "./src-core-media-wisdom.js";
import { PatternRecognizer } from "./src-core-pattern-recognizer.js";
import { StandingTall } from "./src-core-standing-tall.js";

// Utilities
import { toCanonical } from "./ops/operation-aliases.js";
import { safeBinding } from "./utils/gpt-compat.js";
import { handleScheduledTriggers } from "./utils/autonomy.js";

// Response utilities
import { 
  createErrorResponse
} from "./utils/error-handler.js";
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
// PERSONAL DEVELOPMENT CONSOLIDATION HANDLERS
// =============================================================================

// Handle GET requests for personal development types
async function handlePersonalDevelopmentGet(type, req, env) {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'gratitude':
      return {
        type: 'gratitude',
        result: { message: "Gratitude practice guidance available via POST" },
        insights: ["Daily gratitude enhances well-being", "Focus on specific details", "Include body sensations"],
        next_steps: ["Use POST with gratitude_items array", "Include appreciation_depth"],
        timestamp
      };
      
    case 'healing':
      return {
        type: 'healing',
        result: { message: "Emotional healing session available via POST" },
        insights: ["Emotions need space to be felt", "Healing is a process", "Support systems matter"],
        next_steps: ["Use POST with emotions_present array", "Include healing_intention"],
        timestamp
      };
      
    case 'intuition':
      return {
        type: 'intuition',
        result: { message: "Intuition development available via POST" },
        insights: ["Trust your inner knowing", "Body wisdom speaks first", "Practice deep listening"],
        next_steps: ["Use POST with decision_context", "Include intuitive_experiences"],
        timestamp
      };
      
    case 'purpose':
      return {
        type: 'purpose',
        result: { message: "Purpose alignment session available via POST" },
        insights: ["Purpose evolves over time", "Values guide direction", "Meaning emerges through action"],
        next_steps: ["Use POST with current_purpose_sense", "Include life_areas"],
        timestamp
      };
      
    case 'relationships':
      return {
        type: 'relationships',
        result: { message: "Relationship deepening available via POST" },
        insights: ["Connection requires vulnerability", "Listen deeply", "Growth happens together"],
        next_steps: ["Use POST with relationship_type", "Include current_dynamics"],
        timestamp
      };
      
    case 'shadow':
      return {
        type: 'shadow',
        result: { message: "Shadow integration work available via POST" },
        insights: ["Shadow holds gifts", "Integration creates wholeness", "Triggers show the way"],
        next_steps: ["Use POST with shadow_aspects", "Include integration_intention"],
        timestamp
      };
      
    case 'discovery':
      // Redirect to actual discovery endpoint
      return {
        type: 'discovery',
        result: { message: "Use /api/discovery/generate-inquiry for full discovery features" },
        insights: ["Deep inquiry reveals truth", "Questions open possibilities", "Curiosity heals"],
        next_steps: ["Use discovery endpoint with prompt", "Include behavioral context"],
        timestamp
      };
      
    case 'socratic':
      return {
        type: 'socratic',
        result: { message: "Socratic questioning available via POST" },
        insights: ["Questions reveal assumptions", "Wisdom emerges through inquiry", "Truth unfolds gradually"],
        next_steps: ["Use POST with inquiry topic", "Include exploration goals"],
        timestamp
      };
      
    case 'ritual':
      return {
        type: 'ritual',
        result: { message: "Ritual suggestions available via POST" },
        insights: ["Rituals create sacred space", "Intention shapes practice", "Consistency builds power"],
        next_steps: ["Use POST with ritual focus", "Include timing preferences"],
        timestamp
      };
      
    default:
      return {
        type: 'unknown',
        result: { error: `Unknown type: ${type}` },
        insights: ["Available types: gratitude, healing, intuition, purpose, relationships, shadow, discovery, socratic, ritual"],
        next_steps: ["Use valid type parameter"],
        timestamp
      };
  }
}

// Handle POST requests for personal development sessions
async function handlePersonalDevelopmentSession(type, data, req, env) {
  const { content, focus, context, goals } = data;
  const sessionId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  try {
    switch (type) {
      case 'gratitude':
        return await processGratitudeSession(content, sessionId, env);
        
      case 'healing':
        return await processHealingSession(content, sessionId, env);
        
      case 'intuition':
        return await processIntuitionSession(content, sessionId, env);
        
      case 'purpose':
        return await processPurposeSession(content, sessionId, env);
        
      case 'relationships':
        return await processRelationshipSession(content, sessionId, env);
        
      case 'shadow':
        return await processShadowSession(content, sessionId, env);
        
      case 'discovery':
        // Delegate to discovery endpoint logic
        const discoveryResult = await handleDiscoveryInquiry(req, env);
        return await discoveryResult.json();
        
      case 'socratic':
        return await processSocraticSession(content, sessionId, env);
        
      case 'ritual':
        return await processRitualSession(content, sessionId, env);
        
      default:
        throw new Error(`Unsupported session type: ${type}`);
    }
  } catch (error) {
    console.error(`Personal development session error (${type}):`, error);
    return {
      session_type: type,
      insights: [`Error in ${type} session: ${error.message}`],
      practices: ["Try again with different parameters"],
      next_steps: ["Check request format", "Verify content structure"],
      session_id: sessionId,
      timestamp
    };
  }
}

// Individual session processors (simplified versions)
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
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    
    // If type parameter provided, handle personal development requests
    if (type && type !== 'health') {
      const personalDevResult = await handlePersonalDevelopmentGet(type, req, env);
      await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type }, personalDevResult);
      return addCORS(new Response(JSON.stringify(personalDevResult), {
        headers: { "Content-Type": "application/json" }
      }));
    }
    
    // Default health check behavior
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

// Personal Development POST handler for consolidated functionality
router.post("/api/system/health-check", async (req, env) => {
  try {
    const body = await req.json();
    const { type, content, focus, context, goals } = body;
    
    if (!type) {
      return addCORS(createErrorResponse({ error: "Type parameter required for personal development sessions" }, 400));
    }
    
    const result = await handlePersonalDevelopmentSession(type, { content, focus, context, goals }, req, env);
    
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    
    return addCORS(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
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

    // Return array format for ChatGPT compatibility
    return addCORS(new Response(JSON.stringify(items), {
      headers: { 
        "Content-Type": "application/json",
        "X-Next-Cursor": nextCursor || "",
        "X-Total-Count": items.length.toString()
      }
    }));
  } catch (error) {
    // Fail-open with array format
    await logChatGPTAction(env, 'retrieveLogsOrDataEntries', {}, null, error).catch(() => {});
    return addCORS(new Response(JSON.stringify([]), {
      headers: { 
        "Content-Type": "application/json",
        "X-Warning": "fail-open: logs unavailable"
      }
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
    
    // Use MediaWisdomExtractor to extract wisdom from the input
    const wisdom = new MediaWisdomExtractor(env);
    const result = await wisdom.extractWisdom({
      media_type: "synthesis_request",
      title: "Wisdom Synthesis",
      your_reaction: body.reflection || body.input || "Synthesis request",
      content_summary: body.content || body.text || "User requested wisdom synthesis"
    });
    
    await logChatGPTAction(env, 'synthesizeWisdom', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'synthesizeWisdom', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Daily synthesis
// Consolidated wisdom and insights endpoint
router.get("/api/wisdom/insights", async (req, env) => {
  try {
    const { type = 'both', focus_area } = req.query;
    const wisdom = new MediaWisdomExtractor(env);
    
    let result;
    
    if (type === 'daily' || type === 'both') {
      const dailyResult = await wisdom.extractWisdom({
        media_type: "daily_synthesis",
        title: "Daily Wisdom Synthesis",
        your_reaction: "Reflecting on today's insights and learnings",
        content_summary: `Daily synthesis of wisdom and insights${focus_area ? ` focused on ${focus_area}` : ''}`
      });
      
      if (type === 'daily') {
        result = dailyResult;
      } else {
        result = { daily: dailyResult };
      }
    }
    
    if (type === 'accumulated' || type === 'both') {
      const insightsResult = await wisdom.extractWisdom({
        media_type: "personal_insights", 
        title: "Personal Growth Insights",
        your_reaction: "Seeking personal insights and guidance",
        content_summary: `Personal insights based on current life patterns${focus_area ? ` in ${focus_area}` : ''}`
      });
      
      if (type === 'accumulated') {
        result = insightsResult;
      } else if (type === 'both') {
        result.accumulated = insightsResult;
      }
    }
    
    await logChatGPTAction(env, 'getWisdomAndInsights', { type, focus_area }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'getWisdomAndInsights', { type, focus_area }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/wisdom/daily-synthesis", async (req, env) => {
  try {
    // Create a daily synthesis by extracting wisdom from recent activities
    const wisdom = new MediaWisdomExtractor(env);
    const result = await wisdom.extractWisdom({
      media_type: "daily_synthesis",
      title: "Daily Wisdom Synthesis",
      your_reaction: "Reflecting on today's insights and learnings",
      content_summary: "Daily synthesis of wisdom and insights for personal growth"
    });
    
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
    // Generate personal insights by extracting wisdom
    const wisdom = new MediaWisdomExtractor(env);
    const result = await wisdom.extractWisdom({
      media_type: "personal_insights",
      title: "Personal Growth Insights",
      your_reaction: "Seeking personal insights and guidance",
      content_summary: "Request for personalized insights based on current life patterns and growth areas"
    });
    
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
    
    // Store feedback in logs for analysis
    const feedbackLog = {
      type: 'user_feedback',
      feedback: body.feedback || body.message || body.text,
      rating: body.rating,
      context: body.context,
      timestamp: new Date().toISOString(),
      user_id: body.user_id,
      session_id: body.session_id
    };
    
    await logChatGPTAction(env, 'submitFeedback', body, feedbackLog);
    
    const result = {
      status: "success",
      message: "Feedback received and logged for analysis",
      timestamp: new Date().toISOString(),
      operation: "submitFeedback",
      feedback_id: crypto.randomUUID()
    };
    
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
  const warnings = [];
  let sessionId;
  
  try {
    // Parse input safely
    const body = await req.clone().json().catch(() => ({}));
    
    // Handle both schema formats (text vs dream_text)
    const text = (body?.text || body?.dream_text || '').toString().trim();
    
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
    const healer = new SomaticHealer(env);
    
    // Use generateSession to create an energy optimization session
    const sessionData = {
      body_sensation: body.energy_level || "low energy",
      emotional_state: body.context || "seeking energy optimization",
      physical_description: body.focus_area || "general energy improvement",
      context: `Energy optimization request: ${JSON.stringify(body)}`
    };
    
    const result = await healer.generateSession(sessionData);
    
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
    const valuesClarifier = new ValuesClarifier(env);
    const result = await valuesClarifier.clarify(body);
    
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
    const creativityUnleasher = new CreativityUnleasher(env);
    const result = await creativityUnleasher.unleash(body);
    
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
    const abundanceCultivator = new AbundanceCultivator(env);
    const result = await abundanceCultivator.cultivate(body);
    
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
    const transitionNavigator = new TransitionNavigator(env);
    const result = await transitionNavigator.navigate(body);
    
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
    const ancestryHealer = new AncestryHealer(env);
    const result = await ancestryHealer.heal(body);
    
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
// R2 STORAGE ENDPOINTS
// =============================================================================

// R2 List endpoint for ChatGPT retrieval
router.get("/api/r2/list", async (req, env) => {
  try {
    const url = new URL(req.url);
    const prefix = url.searchParams.get('prefix');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
    
    const listOptions = { limit };
    if (prefix) {
      listOptions.prefix = prefix;
    }
    
    const r2Objects = await env.AQUIL_STORAGE.list(listOptions);
    const results = [];
    
    for (const obj of r2Objects.objects || []) {
      let objectType;
      if (obj.key.startsWith('resonance/')) {
        objectType = 'resonance_thread';
      } else if (obj.key.startsWith('logbin_')) {
        objectType = 'logbin_data';
      } else {
        objectType = 'stored_content';
      }
      
      results.push({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        type: objectType
      });
    }
    
    await logChatGPTAction(env, 'retrieveR2StoredContent', { prefix, limit }, { count: results.length });
    
    return addCORS(new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error('R2 list error:', error);
    await logChatGPTAction(env, 'retrieveR2StoredContent', {}, null, error);
    return addCORS(new Response(JSON.stringify([]), {
      headers: { 
        "Content-Type": "application/json",
        "X-Warning": "fail-open: R2 list unavailable"
      }
    }));
  }
});

// R2 Put endpoint
router.post("/api/r2/put", async (req, env) => {
  try {
    return await r2Put(req, env);
  } catch (error) {
    console.error('R2 put error:', error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// R2 Get endpoint
router.get("/api/r2/get", async (req, env) => {
  try {
    const result = await r2Get(req, env);
    await logChatGPTAction(env, 'getR2StoredContent', { url: req.url }, result);
    return result;
  } catch (error) {
    console.error('R2 get error:', error);
    await logChatGPTAction(env, 'getR2StoredContent', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// D1 DATABASE ENDPOINTS
// =============================================================================

// D1 Query endpoint
router.post("/api/d1/query", async (req, env) => {
  try {
    return await d1Exec(req, env);
  } catch (error) {
    console.error('D1 query error:', error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// VECTORIZE ENDPOINTS  
// =============================================================================

// Vector query endpoint
router.post("/api/vectorize/query", async (req, env) => {
  try {
    return await vectorQuery(req, env);
  } catch (error) {
    console.error('Vector query error:', error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Vector upsert endpoint
router.post("/api/vectorize/upsert", async (req, env) => {
  try {
    return await vectorUpsert(req, env);
  } catch (error) {
    console.error('Vector upsert error:', error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// KV STORAGE ENDPOINTS
// =============================================================================

// KV Put endpoint
router.post("/api/kv/log", async (req, env) => {
  try {
    return await kvLog(req, env);
  } catch (error) {
    console.error('KV log error:', error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// KV Get endpoint
router.get("/api/kv/get", async (req, env) => {
  try {
    const result = await kvGet(req, env);
    await logChatGPTAction(env, 'getKVStoredData', { url: req.url }, result);
    return result;
  } catch (error) {
    console.error('KV get error:', error);
    await logChatGPTAction(env, 'getKVStoredData', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// RAG (RETRIEVAL-AUGMENTED GENERATION) ENDPOINTS
// =============================================================================

// Semantic search and retrieval endpoint
router.post("/api/rag/search", async (req, env) => {
  try {
    const body = await req.json();
    const { 
      query, 
      text = query, 
      mode = "semantic_recall", 
      topK = 5, 
      threshold = 0.7 
    } = body;
    
    if (!text) {
      return addCORS(createErrorResponse({ error: "Query text is required" }, 400));
    }
    
    // Import the semantic recall functions
    const { semanticRecall, transformativeInquiry } = await import("./actions/vectorize.js");
    
    let result;
    if (mode === "transformative_inquiry") {
      result = await transformativeInquiry(env, { text, topK });
    } else {
      result = await semanticRecall(env, { text, topK, threshold });
    }
    
    await logChatGPTAction(env, 'ragSearch', body, result);
    
    return addCORS({
      success: true,
      query: text,
      mode,
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error) {
    await logChatGPTAction(env, 'ragSearch', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Memory retrieval endpoint - get logs with context
router.post("/api/rag/memory", async (req, env) => {
  try {
    const body = await req.json();
    const { 
      query, 
      text = query, 
      include_insights = true, 
      topK = 10,
      threshold = 0.6 
    } = body;
    
    if (!text) {
      return addCORS(createErrorResponse({ error: "Query text is required" }, 400));
    }
    
    // Use semantic recall to find relevant memories
    const { semanticRecall } = await import("./actions/vectorize.js");
    const memories = await semanticRecall(env, { text, topK, threshold });
    
    // Also get recent logs from D1 for additional context
    const recentLogs = await queryMetamorphicLogs(env, { limit: 5 });
    
    const result = {
      query: text,
      semantic_memories: memories,
      recent_context: recentLogs,
      total_memories: memories.matches?.length || 0,
      search_mode: "memory_retrieval",
      insights: include_insights ? {
        message: "These memories and logs represent your journey of growth and self-discovery",
        guidance: "Look for patterns, themes, and evolution in your thoughts and experiences"
      } : null
    };
    
    await logChatGPTAction(env, 'ragMemoryConsolidation', body, result);
    
    return addCORS({
      success: true,
      timestamp: new Date().toISOString(),
      data: result
    });
    
  } catch (error) {
    await logChatGPTAction(env, 'ragMemoryConsolidation', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Debug endpoint to check vector dimensions  
router.post("/api/debug/vector-dimensions", async (req, env) => {
  try {
    const body = await req.json();
    const { text = "test" } = body;
    
    // Test with the large model that should produce 1024 dimensions
    const embedding = await env.AQUIL_AI.run("@cf/baai/bge-large-en-v1.5", { text });
    
    return addCORS({
      success: true,
      text,
      model: "@cf/baai/bge-large-en-v1.5",
      dimensions: embedding?.data?.length || "unknown",
      has_data: !!embedding?.data,
      sample: embedding?.data?.slice(0, 3) || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// RAG (RETRIEVAL-AUGMENTED GENERATION) ENDPOINTS
// =============================================================================

// Simple vector search that works like logging
router.post("/api/search/logs", async (req, env) => {
  try {
    const body = await req.json();
    const { query, limit = 5 } = body;
    
    if (!query) {
      return addCORS(createErrorResponse({ error: "Query text is required" }, 400));
    }
    
    // Create embedding using exact same pattern as logging.js
    const embedding = await env.AQUIL_AI.run("@cf/baai/bge-large-en-v1.5", {
      text: query,
    });
    const values = embedding.data?.[0] || embedding;
    
    if (!Array.isArray(values)) {
      return addCORS(createErrorResponse({ error: "Failed to create embedding" }, 500));
    }
    
    // Query vector database
    const results = await env.AQUIL_CONTEXT.query({
      vector: values,
      topK: limit,
      includeMetadata: true,
    });
    
    // Get full log content for matches
    const matches = [];
    for (const match of results.matches || []) {
      try {
        const logKey = match.id.replace('logvec_', 'log_');
        const logContent = await env.AQUIL_MEMORIES.get(logKey);
        if (logContent) {
          const parsedLog = JSON.parse(logContent);
          matches.push({
            id: match.id,
            score: match.score,
            log_text: parsedLog.detail?.content || parsedLog.detail?.message || "No content",
            timestamp: parsedLog.timestamp,
            operation: parsedLog.operationId,
            metadata: match.metadata,
            full_log: parsedLog
          });
        }
      } catch (e) {
        // Skip failed log retrievals
      }
    }
    
    await logChatGPTAction(env, 'searchLogs', body, { query, matches: matches.length });
    
    return addCORS({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        query,
        matches,
        total: matches.length,
        message: `Found ${matches.length} relevant logs for "${query}"`
      }
    });
    
  } catch (error) {
    await logChatGPTAction(env, 'searchLogs', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// R2 Content Search endpoint - Search through resonance threads and stored artifacts
router.post("/api/search/r2", async (req, env) => {
  try {
    const body = await req.json();
    const { query, type = "all", limit = 5 } = body;
    
    if (!query) {
      return addCORS(createErrorResponse({ error: "Query text is required" }, 400));
    }
    
    // Start with a simple listing approach to avoid timeouts
    let listOptions = { limit: Math.min(limit * 2, 20) }; // Get more than needed, filter later
    if (type === "resonance") {
      listOptions.prefix = "resonance/";
    } else if (type === "logbin") {
      listOptions.prefix = "logbin_";
    }
    
    const r2Objects = await env.AQUIL_STORAGE.list(listOptions);
    const results = [];
    
    // Return metadata first, content search can be a separate endpoint
    for (const obj of r2Objects.objects || []) {
      results.push({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        type: obj.key.startsWith('resonance/') ? 'resonance_thread' : 'logbin_data'
      });
      
      if (results.length >= limit) break;
    }
    
    await logChatGPTAction(env, 'searchR2Storage', body, { query, results: results.length });
    
    return addCORS({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        query,
        type,
        objects: results,
        total: results.length,
        message: `Found ${results.length} R2 objects (use /api/r2/get to retrieve content)`,
        note: "This endpoint lists R2 objects. Use /api/r2/get?key=<key> to retrieve specific content."
      }
    });
    
  } catch (error) {
    await logChatGPTAction(env, 'searchR2Storage', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Helper function for simple relevance scoring
function calculateSimpleRelevance(content, query) {
  const matches = (content.match(new RegExp(query, 'gi')) || []).length;
  const density = matches / content.length * 1000; // matches per 1000 chars
  return matches + density;
}

// R2 Resonance Weaving Search - Find patterns and threads
router.post("/api/search/resonance", async (req, env) => {
  try {
    const body = await req.json();
    const { theme, timeframe = "7d", session_id } = body;
    
    if (!theme) {
      return addCORS(createErrorResponse({ error: "Theme or pattern to search for is required" }, 400));
    }
    
    // Use the progressive weaving function to find resonance patterns
    const { progressiveWeaving } = await import("./actions/r2.js");
    const resonanceData = await progressiveWeaving(env, { session_id, timeframe });
    
    // Filter resonance data based on theme
    const matches = [];
    if (resonanceData?.threads) {
      for (const thread of resonanceData.threads) {
        const threadContent = JSON.stringify(thread).toLowerCase();
        const themeLower = theme.toLowerCase();
        
        if (threadContent.includes(themeLower)) {
          matches.push({
            ...thread,
            relevance: calculateSimpleRelevance(threadContent, themeLower)
          });
        }
      }
    }
    
    // Sort by relevance
    matches.sort((a, b) => b.relevance - a.relevance);
    
    await logChatGPTAction(env, 'searchResonance', body, { theme, matches: matches.length });
    
    return addCORS({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        theme,
        timeframe,
        session_id,
        resonance_threads: matches,
        total: matches.length,
        full_weaving: resonanceData,
        message: `Found ${matches.length} resonance patterns related to "${theme}"`
      }
    });
    
  } catch (error) {
    await logChatGPTAction(env, 'searchResonance', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// =============================================================================
// ARK ENHANCED ENDPOINTS
// =============================================================================

// Enhanced unified logging with multi-store status tracking
router.post("/api/ark/log", async (req, env) => {
  try {
    const result = await arkLog(req, env);
    await logChatGPTAction(env, 'arkEnhancedLog', await req.clone().json(), result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkEnhancedLog', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Enhanced unified retrieval with resonance weaving support
router.get("/api/ark/retrieve", async (req, env) => {
  try {
    const result = await arkRetrieve(req, env);
    await logChatGPTAction(env, 'arkEnhancedRetrieve', { url: req.url }, result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkEnhancedRetrieve', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Enhanced KV operations with full content support
router.get("/api/ark/memories", async (req, env) => {
  try {
    const result = await arkMemories(req, env);
    await logChatGPTAction(env, 'arkEnhancedMemories', { url: req.url }, result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkEnhancedMemories', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Enhanced vector operations with dual-mode support
router.post("/api/ark/vector", async (req, env) => {
  try {
    const result = await arkVector(req, env);
    await logChatGPTAction(env, 'arkEnhancedVector', await req.clone().json(), result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkEnhancedVector', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Enhanced R2 resonance weaving operations
router.post("/api/ark/resonance", async (req, env) => {
  try {
    const result = await arkResonance(req, env);
    await logChatGPTAction(env, 'arkEnhancedResonance', await req.clone().json(), result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkEnhancedResonance', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// ARK system status and health check
router.get("/api/ark/status", async (req, env) => {
  try {
    const result = await arkStatus(req, env);
    await logChatGPTAction(env, 'arkSystemStatus', { url: req.url }, result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkSystemStatus', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Advanced log filtering
router.post("/api/ark/filter", async (req, env) => {
  try {
    const result = await arkFilter(req, env);
    await logChatGPTAction(env, 'arkAdvancedFilter', await req.clone().json(), result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkAdvancedFilter', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Autonomous action logging
router.post("/api/ark/autonomous", async (req, env) => {
  try {
    const result = await arkAutonomous(req, env);
    await logChatGPTAction(env, 'arkAutonomousLog', await req.clone().json(), result);
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'arkAutonomousLog', {}, null, error);
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
      "/api/wisdom/insights",
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
