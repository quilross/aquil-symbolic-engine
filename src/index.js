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
// Behavioral engine
import { runEngine } from "./agent/engine.js";

// Logging and data persistence
import { 
  writeLog 
} from "./actions/logging.js";

// Dream interpretation utilities
import { buildInterpretation, maybeRecognizePatterns, safeTruncated } from "./utils/dream-interpreter.js";

// Insight generation
import { generateInsight } from "./insightEngine.js";
import * as journalService from "./journalService.js";

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
import { AquilCore } from "./src-core-aquil-core.js";

import { isGPTCompatMode, safeBinding, safeOperation } from "./utils/gpt-compat.js";

// Import actions metadata for validation constants
import actions from '../config/ark.actions.logging.json' with { type: 'json' };

// Pull routes + validation constants from JSON
const Routes = actions['x-ark-metadata'].routes
const MAX_DETAIL = actions['x-ark-metadata'].validation?.maxDetailLength ?? 4000

// Build sets/regex from JSON so the config owns the contract
const LOG_TYPES = new Set(actions['x-ark-metadata'].enums?.logTypes ?? [])
const STORED_IN = new Set(actions['x-ark-metadata'].enums?.storedIn ?? [])
const UUID_V4 = new RegExp(actions['x-ark-metadata'].validation?.uuidV4 ?? '^[0-9a-fA-F-]{36}$')

// ISO 8601 checker (lightweight; keeps your current semantics)
function isIso(ts) {
  try {
    const d = new Date(ts)
    return !isNaN(d.getTime())
  } catch { return false }
}

// Minimal shared helpers
async function readJson(req) {
  try { return await req.json() } catch { return null }
}
function json(data, init = {}) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' }, ...init })
}

async function ensureSchema(env) {
  // idempotent
  await env.AQUIL_DB.exec?.(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      detail TEXT,
      timestamp TEXT NOT NULL,
      storedIn TEXT NOT NULL CHECK (storedIn IN ('KV','D1'))
    );
    CREATE TABLE IF NOT EXISTS retrieval_meta (
      id INTEGER PRIMARY KEY CHECK (id=1),
      lastRetrieved TEXT,
      retrievalCount INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO retrieval_meta (id,lastRetrieved,retrievalCount) VALUES (1,NULL,0);
  `)
}

function validateLog(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid body'
  const { id, type, detail, timestamp, storedIn } = payload
  if (!UUID_V4.test(id)) return 'id must be uuid v4'
  if (!LOG_TYPES.has(type)) return `type must be one of ${[...LOG_TYPES].join(',')}`
  if (detail != null && typeof detail !== 'string') return 'detail must be string'
  if (detail && detail.length > MAX_DETAIL) return `detail exceeds ${MAX_DETAIL} chars`
  if (!isIso(timestamp)) return 'timestamp must be ISO 8601'
  if (!STORED_IN.has(storedIn)) return `storedIn must be one of ${[...STORED_IN].join(',')}`
  return null
}

async function handleKvWrite(env, req) {
  const { addEntry } = await import('./journalService.js');
  
  const body = await readJson(req)
  const err = validateLog(body)
  if (err) return json({ ok: false, error: err }, { status: 400 })
  if (body.storedIn !== 'KV') return json({ ok: false, error: 'storedIn must be KV' }, { status: 400 })
  
  const result = await addEntry(env, body);
  if (result.success) {
    return json({ ok: true, key: result.key, id: result.id })
  } else {
    return json({ ok: false, error: result.error }, { status: 500 })
  }
}

async function handleD1Insert(env, req) {
  await ensureSchema(env)
  const body = await readJson(req)
  const err = validateLog(body)
  if (err) return json({ ok: false, error: err }, { status: 400 })
  if (body.storedIn !== 'D1') return json({ ok: false, error: 'storedIn must be D1' }, { status: 400 })
  await env.AQUIL_DB.prepare(
    'INSERT INTO logs (id,type,detail,timestamp,storedIn) VALUES (?1,?2,?3,?4,?5)'
  ).bind(body.id, body.type, body.detail ?? null, body.timestamp, 'D1').run()
  return json({ ok: true, rowId: 1, id: body.id })
}

async function handlePromote(env, req) {
  await ensureSchema(env)
  const { getEntryById } = await import('./journalService.js');
  
  const body = await readJson(req)
  const id = body?.id
  if (!id || !UUID_V4.test(id)) return json({ ok: false, error: 'invalid id' }, { status: 400 })
  
  const result = await getEntryById(env, id);
  if (!result.success) {
    return json({ ok: false, error: 'not found in KV' }, { status: 404 })
  }
  
  const log = result.data;
  const err = validateLog(log)
  if (err) return json({ ok: false, error: `invalid KV log: ${err}` }, { status: 400 })
  
  await env.AQUIL_DB.prepare(
    'INSERT OR IGNORE INTO logs (id,type,detail,timestamp,storedIn) VALUES (?1,?2,?3,?4,?5)'
  ).bind(log.id, log.type, log.detail ?? null, log.timestamp, 'D1').run()
  return json({ ok: true, promotedId: id })
}

async function handleRetrieve(env, req) {
  await ensureSchema(env)
  const q = await readJson(req) || {}
  const { source = 'any', types, from, to, limit = 100, afterId, order = 'desc' } = q

  if (types && (!Array.isArray(types) || types.some(t => !LOG_TYPES.has(t)))) {
    return json({ ok: false, error: 'invalid types' }, { status: 400 })
  }
  if (from && !isIso(from)) return json({ ok: false, error: 'invalid from' }, { status: 400 })
  if (to && !isIso(to)) return json({ ok: false, error: 'invalid to' }, { status: 400 })
  const lim = Math.max(1, Math.min(Number(limit) || 100, 500))
  const ord = order === 'asc' ? 'ASC' : 'DESC'

  const clauses = []
  const params = []
  if (types?.length) { clauses.push(`type IN (${types.map(() => '?').join(',')})`); params.push(...types) }
  if (from) { clauses.push('timestamp >= ?'); params.push(from) }
  if (to)   { clauses.push('timestamp <= ?'); params.push(to) }
  if (afterId) { clauses.push('id > ?'); params.push(afterId) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const sql = `SELECT id,type,detail,timestamp,storedIn FROM logs ${where} ORDER BY timestamp ${ord} LIMIT ?`
  params.push(lim)
  const res = await env.AQUIL_DB.prepare(sql).bind(...params).all()
  let items = res.results || []

  return json({ ok: true, items })
}

async function handleRetrieveLatest(env, req) {
  await ensureSchema(env)
  const url = new URL(req.url)
  const n = Number(url.searchParams.get('limit') || '25')
  const limit = Math.max(1, Math.min(isFinite(n) ? n : 25, 200))
  const sql = `SELECT id,type,detail,timestamp,storedIn FROM logs ORDER BY timestamp DESC LIMIT ?`
  const res = await env.AQUIL_DB.prepare(sql).bind(limit).all()
  return json({ ok: true, items: res.results || [] })
}

async function handleRetrievalMeta(env, req) {
  await ensureSchema(env)
  let ts
  try { ts = (await req.json())?.timestamp } catch {}
  const timestamp = (ts && isIso(ts)) ? ts : new Date().toISOString()
  await env.AQUIL_DB.prepare(
    'UPDATE retrieval_meta SET lastRetrieved=?1, retrievalCount=retrievalCount+1 WHERE id=1'
  ).bind(timestamp).run()
  const res = await env.AQUIL_DB.prepare(
    'SELECT lastRetrieved, retrievalCount FROM retrieval_meta WHERE id=1'
  ).all()
  const row = (res.results && res.results[0]) || { lastRetrieved: null, retrievalCount: 0 }
  return json(row)
}
// === END EXTRACTION PATCH ===

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

// Data operations routes (D1, KV, R2, Vectorize)
router.all("/api/d1/*", dataOpsRouter.fetch);
router.all("/api/kv/*", dataOpsRouter.fetch);
router.all("/api/r2/*", dataOpsRouter.fetch);
router.all("/api/vectorize/*", dataOpsRouter.fetch);

// Personal development routes (discovery, wisdom, trust, energy)
router.all("/api/discovery/*", personalDevRouter.fetch);
router.all("/api/wisdom/*", personalDevRouter.fetch);
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
    await logChatGPTAction(env, 'generateInsight', {
      entryId: currentEntry.id || 'unknown',
      historyCount: userHistory.length
    }, { insight });
    
    // Return the insight as JSON
    return addCORS(createSuccessResponse({
      insight: insight
    }));
    
  } catch (error) {
    console.error('Error in /api/insight:', error);
    
    await logChatGPTAction(env, 'generateInsight', {}, null, error);
    
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

router.post("/api/ark/retrieve", async (req, env) => {
  const result = await arkRetrieve(req, env);
  return addCORS(result);
});

router.post("/api/ark/memories", async (req, env) => {
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

// =============================================================================
// REMAINING LEGACY ENDPOINTS (TO BE MOVED TO MODULES)
// =============================================================================

// Individual personal development type endpoints (replacing switch statements)
router.get("/api/personal-development/gratitude", async (req, env) => {
  try {
    const result = {
      type: 'gratitude',
      result: { message: "Gratitude practice guidance available via POST" },
      insights: ["Daily gratitude enhances well-being", "Focus on specific details", "Include body sensations"],
      next_steps: ["Use POST with gratitude_items array", "Include appreciation_depth"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'gratitude' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'gratitude' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/healing", async (req, env) => {
  try {
    const result = {
      type: 'healing',
      result: { message: "Emotional healing session available via POST" },
      insights: ["Emotions need space to be felt", "Healing is a process", "Support systems matter"],
      next_steps: ["Use POST with emotions_present array", "Include healing_intention"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'healing' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'healing' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/intuition", async (req, env) => {
  try {
    const result = {
      type: 'intuition',
      result: { message: "Intuition development available via POST" },
      insights: ["Trust your inner knowing", "Body wisdom speaks first", "Practice deep listening"],
      next_steps: ["Use POST with decision_context", "Include intuitive_experiences"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'intuition' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'intuition' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/purpose", async (req, env) => {
  try {
    const result = {
      type: 'purpose',
      result: { message: "Purpose alignment session available via POST" },
      insights: ["Purpose evolves over time", "Values guide direction", "Meaning emerges through action"],
      next_steps: ["Use POST with current_purpose_sense", "Include life_areas"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'purpose' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'purpose' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/relationships", async (req, env) => {
  try {
    const result = {
      type: 'relationships',
      result: { message: "Relationship deepening available via POST" },
      insights: ["Connection requires vulnerability", "Listen deeply", "Growth happens together"],
      next_steps: ["Use POST with relationship_type", "Include current_dynamics"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'relationships' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'relationships' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/shadow", async (req, env) => {
  try {
    const result = {
      type: 'shadow',
      result: { message: "Shadow integration work available via POST" },
      insights: ["Shadow holds gifts", "Integration creates wholeness", "Triggers show the way"],
      next_steps: ["Use POST with shadow_aspects", "Include integration_intention"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'shadow' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'shadow' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/socratic", async (req, env) => {
  try {
    const result = {
      type: 'socratic',
      result: { message: "Socratic questioning available via POST" },
      insights: ["Questions reveal assumptions", "Wisdom emerges through inquiry", "Truth unfolds gradually"],
      next_steps: ["Use POST with inquiry topic", "Include exploration goals"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'socratic' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'socratic' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/ritual", async (req, env) => {
  try {
    const result = {
      type: 'ritual',
      result: { message: "Ritual suggestions available via POST" },
      insights: ["Rituals create sacred space", "Intention shapes practice", "Consistency builds power"],
      next_steps: ["Use POST with ritual focus", "Include timing preferences"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'ritual' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'ritual' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Personal development session endpoints (POST handlers)
router.post("/api/personal-development/gratitude", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processGratitudeSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/healing", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processHealingSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/intuition", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processIntuitionSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/purpose", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processPurposeSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/relationships", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processRelationshipSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/shadow", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processShadowSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/socratic", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processSocraticSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/ritual", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processRitualSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Routes now handled by modular routers above
router.get("/api/personal-development/gratitude", async (req, env) => {
  try {
    const result = {
      type: 'gratitude',
      result: { message: "Gratitude practice guidance available via POST" },
      insights: ["Daily gratitude enhances well-being", "Focus on specific details", "Include body sensations"],
      next_steps: ["Use POST with gratitude_items array", "Include appreciation_depth"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'gratitude' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'gratitude' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/healing", async (req, env) => {
  try {
    const result = {
      type: 'healing',
      result: { message: "Emotional healing session available via POST" },
      insights: ["Emotions need space to be felt", "Healing is a process", "Support systems matter"],
      next_steps: ["Use POST with emotions_present array", "Include healing_intention"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'healing' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'healing' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/intuition", async (req, env) => {
  try {
    const result = {
      type: 'intuition',
      result: { message: "Intuition development available via POST" },
      insights: ["Trust your inner knowing", "Body wisdom speaks first", "Practice deep listening"],
      next_steps: ["Use POST with decision_context", "Include intuitive_experiences"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'intuition' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'intuition' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/purpose", async (req, env) => {
  try {
    const result = {
      type: 'purpose',
      result: { message: "Purpose alignment session available via POST" },
      insights: ["Purpose evolves over time", "Values guide direction", "Meaning emerges through action"],
      next_steps: ["Use POST with current_purpose_sense", "Include life_areas"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'purpose' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'purpose' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/relationships", async (req, env) => {
  try {
    const result = {
      type: 'relationships',
      result: { message: "Relationship deepening available via POST" },
      insights: ["Connection requires vulnerability", "Listen deeply", "Growth happens together"],
      next_steps: ["Use POST with relationship_type", "Include current_dynamics"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'relationships' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'relationships' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/shadow", async (req, env) => {
  try {
    const result = {
      type: 'shadow',
      result: { message: "Shadow integration work available via POST" },
      insights: ["Shadow holds gifts", "Integration creates wholeness", "Triggers show the way"],
      next_steps: ["Use POST with shadow_aspects", "Include integration_intention"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'shadow' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'shadow' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/socratic", async (req, env) => {
  try {
    const result = {
      type: 'socratic',
      result: { message: "Socratic questioning available via POST" },
      insights: ["Questions reveal assumptions", "Wisdom emerges through inquiry", "Truth unfolds gradually"],
      next_steps: ["Use POST with inquiry topic", "Include exploration goals"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'socratic' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'socratic' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.get("/api/personal-development/ritual", async (req, env) => {
  try {
    const result = {
      type: 'ritual',
      result: { message: "Ritual suggestions available via POST" },
      insights: ["Rituals create sacred space", "Intention shapes practice", "Consistency builds power"],
      next_steps: ["Use POST with ritual focus", "Include timing preferences"],
      timestamp: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'ritual' }, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'comprehensivePersonalDevelopment', { type: 'ritual' }, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

// Personal development session endpoints (POST handlers)
router.post("/api/personal-development/gratitude", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processGratitudeSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/healing", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processHealingSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/intuition", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processIntuitionSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/purpose", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processPurposeSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/relationships", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processRelationshipSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/shadow", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processShadowSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/socratic", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processSocraticSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});

router.post("/api/personal-development/ritual", async (req, env) => {
  try {
    const body = await req.json();
    const result = await processRitualSession(body.content, crypto.randomUUID(), env);
    await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'personalDevelopmentSession', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});
// FALLBACK AND ERROR HANDLING
// =============================================================================

// Catch-all for unmatched routes

// Analytics insights
router.get("/api/analytics/insights", async (req, env) => {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const type = url.searchParams.get('type') || 'all';
    
    const result = {
      insights: [],
      patterns: [],
      recommendations: [],
      timeframe: `${days} days`,
      analysis_type: type,
      generated_at: new Date().toISOString()
    };
    
    await logChatGPTAction(env, 'getConversationAnalytics', { days, type }, result);
    
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'getConversationAnalytics', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});
// Export conversation data
router.post("/api/export/conversation", async (req, env) => {
  try {
    const body = await req.json();
    const format = body.format || 'json';
    const timeframe = body.timeframe || '30d';
    
    const result = {
      export_id: crypto.randomUUID(),
      format,
      timeframe,
      status: "prepared",
      download_url: null, // Would be populated in real implementation
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    await logChatGPTAction(env, 'exportConversationData', body, result);
    
    return addCORS(createWisdomResponse(result));
  } catch (error) {
    await logChatGPTAction(env, 'exportConversationData', {}, null, error);
    return addCORS(createErrorResponse({ error: error.message }, 500));
  }
});
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
        "/api/personal-development/gratitude",
        "/api/personal-development/healing",
        "/api/personal-development/intuition",
        "/api/personal-development/purpose",
        "/api/personal-development/relationships",
        "/api/personal-development/shadow",
        "/api/personal-development/socratic",
        "/api/personal-development/ritual",
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