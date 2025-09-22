import { Router } from 'itty-router';

import { handleScheduledTriggers } from './utils/autonomy.js';
import { corsHeaders } from './utils/cors.js';
import { handleError, createErrorResponse } from './utils/error-handler.js';
import { createSuccessResponse, createWisdomResponse } from './utils/response-helpers.js';
import { toCanonical } from './ops/operation-aliases.js';

import { writeLog, readLogs } from './actions/logging.js';
import { exec as d1Exec } from './actions/d1.js';
import { log as kvLog, get as kvGet } from './actions/kv.js';
import { put as r2Put, get as r2Get, listRecent as r2List, progressiveWeaving } from './actions/r2.js';
import {
  query as vectorQueryRequest,
  upsert as vectorUpsertRequest,
  testVectorFlow,
  queryVector,
} from './actions/vectorize.js';

import { generateInsight } from './insightEngine.js';
import * as journalService from './journalService.js';

import { SomaticHealer } from './src-core-somatic-healer.js';
import { TrustBuilder } from './src-core-trust-builder.js';
import { MediaWisdomExtractor } from './src-core-media-wisdom.js';
import { PatternRecognizer } from './src-core-pattern-recognizer.js';
import { StandingTall } from './src-core-standing-tall.js';
import { AquilCore } from './src-core-aquil-core.js';
import { ValuesClarifier } from './src-core-values-clarifier.js';
import { CreativityUnleasher } from './src-core-creativity-unleasher.js';
import { AbundanceCultivator } from './src-core-abundance-cultivator.js';
import { TransitionNavigator } from './src-core-transition-navigator.js';
import { AncestryHealer } from './src-core-ancestry-healer.js';

import {
  LOG_TYPES,
  UUID_V4,
  ensureSchema,
} from './utils/logging-validation.js';
import {
  buildInterpretation,
  maybeRecognizePatterns,
  safeTruncated,
} from './utils/dream-interpreter.js';

import {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
  handleReadinessCheck,
  handleRetrieveLogs,
  handleLog as arkHandleLog,
  handleTrustCheckIn,
} from './ark/endpoints.js';

import {
  arkLog,
  arkRetrieve,
  arkMemories,
  arkVector,
  arkResonance,
  arkStatus,
  arkFilter,
  arkAutonomous,
  arkTestAI,
} from './ark/ark-endpoints.js';

import actions from '../config/ark.actions.logging.json' with { type: 'json' };
import gptSchema from '../gpt-actions-schema.json' with { type: 'json' };

const router = Router();

const coverage = createCoverageTracker({
  schemaPaths: Object.keys(gptSchema.paths ?? {}),
  arkPaths: Object.keys(actions.paths ?? {}),
  arkRouteHints: Object.values(actions['x-ark-metadata']?.routes ?? {}),
});

const schemaOperations = buildSchemaOperationLookup();

function buildSchemaOperationLookup() {
  const lookup = new Map();
  for (const [path, methods] of Object.entries(gptSchema.paths ?? {})) {
    const normalizedPath = normalizePath(path);
    for (const [method, details] of Object.entries(methods)) {
      if (details?.operationId) {
        lookup.set(`${method.toUpperCase()} ${normalizedPath}`, details.operationId);
      }
    }
  }
  return lookup;
}

function normalizePath(path) {
  if (!path) return '/';
  let normalized = path.trim();
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\*$/, '');
  normalized = normalized.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function createCoverageTracker({ schemaPaths = [], arkPaths = [], arkRouteHints = [] } = {}) {
  const documented = new Set([
    ...schemaPaths.map(normalizePath),
    ...arkPaths.map(normalizePath),
    ...arkRouteHints.map(normalizePath),
  ]);
  const exact = new Set();
  const wildcardPatterns = new Set();
  const wildcardPrefixes = new Set();

  function markDocumented(path) {
    if (!path) return;
    documented.add(normalizePath(path));
  }

  function track(path) {
    if (!path) return;
    if (path.endsWith('/*')) {
      const prefix = normalizePath(path.slice(0, -2));
      wildcardPatterns.add(`${prefix}/*`);
      wildcardPrefixes.add(`${prefix}/`);
    } else {
      exact.add(normalizePath(path));
    }
  }

  function isCovered(path) {
    const normalized = normalizePath(path);
    if (exact.has(normalized)) {
      return true;
    }
    for (const prefix of wildcardPrefixes) {
      if (normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  function report() {
    const missing = [];
    for (const path of documented) {
      if (!isCovered(path)) {
        missing.push(path);
      }
    }

    const extra = [];
    for (const path of exact) {
      if (!documented.has(path)) {
        extra.push(path);
      }
    }

    return { missing: missing.sort(), extra: extra.sort() };
  }

  function available() {
    const combined = new Set([...documented, ...exact, ...wildcardPatterns]);
    return [...combined].sort();
  }

  return { track, markDocumented, report, available };
}

function applyCors(response, fallbackStatus = 200) {
  if (response instanceof Response) {
    const res = new Response(response.body, response);
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.headers.set(key, value);
    }
    return res;
  }

  if (response === undefined || response === null) {
    return new Response(null, { status: fallbackStatus, headers: corsHeaders });
  }

  const body = typeof response === 'string' ? response : JSON.stringify(response);
  const headers = new Headers(corsHeaders);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return new Response(body, { status: fallbackStatus, headers });
}

async function extractRequestPayload(request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams.entries());
  }

  try {
    const clone = request.clone();
    return await clone.json();
  } catch {
    try {
      const clone = request.clone();
      const text = await clone.text();
      return text?.length ? text : null;
    } catch {
      return null;
    }
  }
}

async function extractResponsePayload(response) {
  if (!(response instanceof Response)) {
    return response;
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.clone().json();
    } catch {
      return null;
    }
  }
  if (contentType.startsWith('text/')) {
    try {
      return await response.clone().text();
    } catch {
      return null;
    }
  }
  return null;
}

function statusFromCategory(category) {
  const map = {
    validation: 400,
    parsing: 400,
    not_found: 404,
    auth: 401,
    rate_limit: 429,
    timeout: 408,
    database: 503,
    network: 503,
  };
  return map[category] ?? 500;
}

function resolveOperationId(method, path, explicit) {
  if (explicit) {
    return explicit;
  }
  const key = `${method.toUpperCase()} ${normalizePath(path)}`;
  return schemaOperations.get(key) ?? toCanonical(path.replace(/^\/api\//, ''));
}

function mountEndpoint({ method, path, handler, operationId }) {
  const lower = method.toLowerCase();
  if (typeof router[lower] !== 'function') {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  router[lower](path, async (request, env, ctx) => {
    const resolvedOperation = resolveOperationId(method, path, operationId);
    const requestPayload = await extractRequestPayload(request);
    try {
      const result = await handler({ request, env, ctx, input: requestPayload });
      const response = applyCors(result);
      const responsePayload = await extractResponsePayload(response);
      await logChatGPTAction(env, resolvedOperation, requestPayload, responsePayload);
      return response;
    } catch (error) {
      await logChatGPTAction(env, resolvedOperation, requestPayload, null, error);
      const errorData = await handleError(error, {
        endpoint: normalizePath(path),
        method: method.toUpperCase(),
        requestBody: requestPayload,
      }, env);
      const status = statusFromCategory(errorData.category);
      return applyCors(createErrorResponse(errorData, status), status);
    }
  });

  coverage.track(path);
}

const operationHandlers = {
  manageCommitment: async ({ env, input }) => {
    const commitmentId = input?.id ?? `commitment_${crypto.randomUUID()}`;
    const payload = {
      id: commitmentId,
      action: input?.action ?? 'create',
      commitment: input?.commitment ?? input?.description ?? null,
      focus_area: input?.focus_area ?? null,
      due_date: input?.due_date ?? null,
      created_at: new Date().toISOString(),
    };

    await writeLog(env, {
      type: 'manage_commitment',
      payload,
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'system',
      level: 'info',
      tags: ['commitment'],
      textOrVector: payload.commitment ?? 'commitment update',
    });

    return createSuccessResponse({
      commitment_id: commitmentId,
      status: 'recorded',
      details: payload,
    }, { sessionId: input?.session_id ?? null });
  },

  listActiveCommitments: async ({ env }) => {
    const records = await journalService.listRecentEntries(env, {
      prefix: 'commitment_',
      limit: 50,
    });

    const commitments = records.success
      ? records.entries.map((entry) => ({
          id: entry.key,
          created_at: entry.content?.created_at ?? entry.content?.timestamp ?? null,
          commitment: entry.content?.commitment ?? entry.content?.detail ?? null,
          status: entry.content?.status ?? 'active',
        }))
      : [];

    return createSuccessResponse({
      commitments,
      total: commitments.length,
      source: records.success ? 'kv' : 'none',
    });
  },

  queryD1Database: async ({ request, env }) => d1Exec(request, env),

  storeInKV: async ({ request, env }) => kvLog(request, env),

  upsertVectors: async ({ request, env }) => vectorUpsertRequest(request, env),

  trustCheckIn: async ({ request, env }) => handleTrustCheckIn(request, env),

  somaticHealingSession: async ({ env, input }) => {
    const healer = new SomaticHealer(env);
    const result = await healer.generateSession(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  extractMediaWisdom: async ({ env, input }) => {
    const extractor = new MediaWisdomExtractor(env);
    const result = await extractor.extractWisdom(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  recognizePatterns: async ({ env, input }) => {
    const recognizer = new PatternRecognizer(env);
    const result = await recognizer.analyzePatterns(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  standingTallPractice: async ({ env, input }) => {
    const coach = new StandingTall(env);
    const result = await coach.generatePractice(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  synthesizeWisdom: async ({ env, input }) => {
    const core = new AquilCore(env);
    await core.initialize();
    const result = await core.synthesizeWisdom(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  getDailySynthesis: async ({ env }) => {
    const core = new AquilCore(env);
    await core.initialize();
    const synthesis = await core.runDailySynthesis();
    if (!synthesis) {
      return createSuccessResponse({
        message: 'No daily synthesis available yet.',
      });
    }
    return createSuccessResponse(synthesis);
  },

  getPersonalInsights: async ({ env }) => {
    const core = new AquilCore(env);
    await core.initialize();
    const insights = await core.generateInsights();
    return createSuccessResponse(insights ?? { insights: [] });
  },

  generateJournalInsight: async ({ env, input }) => {
    const currentEntry = input?.currentEntry ?? input?.entry ?? input;

    const historyResult = await journalService.listRecentEntries(env, {
      limit: 50,
      prefix: input?.prefix ?? 'log_',
    });
    const history = historyResult.success ? historyResult.entries : [];
    const insight = await generateInsight(currentEntry, history);

    return createWisdomResponse({ insight }, { sessionId: input?.session_id });
  },

  submitFeedback: async ({ env, input }) => {
    await writeLog(env, {
      type: 'feedback',
      payload: input ?? {},
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'participant',
      level: 'info',
      tags: ['feedback'],
      textOrVector: input?.message ?? 'feedback submission',
    });

    return createSuccessResponse({ acknowledged: true }, {
      sessionId: input?.session_id ?? null,
      message: 'Feedback captured. Thank you for sharing.',
    });
  },

  generateDiscoveryInquiry: async ({ request, env }) => handleDiscoveryInquiry(request, env),

  generateRitualSuggestion: async ({ request, env }) => handleRitualSuggestion(request, env),

  interpretDream: async ({ env, input }) => {
    const text = typeof input === 'string' ? input : input?.text ?? input?.dream ?? '';
    const motifs = input?.motifs ?? [];
    const interpretation = buildInterpretation(text, motifs);
    const patterns = maybeRecognizePatterns(text);

    await writeLog(env, {
      type: 'dream_interpretation',
      payload: { text: safeTruncated(text, 2000), motifs, interpretation, patterns },
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'dreamer',
      level: 'info',
      tags: ['dream'],
      textOrVector: text,
    });

    return createSuccessResponse({ interpretation, patterns });
  },

  optimizeEnergy: async ({ env, input }) => {
    const baseline = Number(input?.current_energy ?? input?.baseline ?? 5);
    const energy = Math.min(10, Math.max(1, Number.isFinite(baseline) ? baseline : 5));
    const result = {
      energy_level: energy,
      optimization_suggestions: [
        'Take restorative breaks every 90 minutes',
        'Practice three rounds of deep breathing',
        'Stay hydrated throughout the day',
        'Step outside for natural light when possible',
      ],
      personalized_tips: input?.focus === 'evening'
        ? ['Create a calming pre-sleep ritual', 'Limit screens 60 minutes before rest']
        : ['Schedule focused work blocks in your peak energy window'],
      timestamp: new Date().toISOString(),
    };

    await writeLog(env, {
      type: 'energy_optimize',
      payload: { ...result, input },
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'system',
      level: 'info',
      tags: ['energy'],
      textOrVector: `energy optimize ${energy}`,
    });

    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  clarifyValues: async ({ env, input }) => {
    const clarifier = new ValuesClarifier(env);
    const result = await clarifier.clarify(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  unleashCreativity: async ({ env, input }) => {
    const unleasher = new CreativityUnleasher(env);
    const result = await unleasher.unleash(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  cultivateAbundance: async ({ env, input }) => {
    const cultivator = new AbundanceCultivator(env);
    const result = await cultivator.cultivate(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  navigateTransitions: async ({ env, input }) => {
    const navigator = new TransitionNavigator(env);
    const result = await navigator.navigate(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  healAncestry: async ({ env, input }) => {
    const healer = new AncestryHealer(env);
    const result = await healer.heal(input ?? {});
    return createSuccessResponse(result, { sessionId: input?.session_id ?? null });
  },

  ragMemoryConsolidation: async ({ env, input }) => {
    const text = input?.query ?? input?.text ?? '';
    if (!text) {
      throw new Error('query text is required');
    }

    const mode = input?.mode ?? 'semantic_recall';
    const topK = Math.min(Number(input?.topK ?? 5) || 5, 20);
    const threshold = Number.isFinite(input?.threshold) ? input.threshold : 0.7;

    const result = await queryVector(env, {
      text,
      mode,
      topK,
      threshold,
      model: input?.model ?? '@cf/baai/bge-large-en-v1.5',
    });

    return createSuccessResponse(result);
  },

  trackMoodAndEmotions: async ({ env, input }) => {
    const entry = {
      mood: input?.mood ?? 'neutral',
      intensity: input?.intensity ?? 'moderate',
      emotions: input?.emotions ?? [],
      notes: input?.notes ?? null,
      timestamp: new Date().toISOString(),
    };

    await writeLog(env, {
      type: 'mood_tracking',
      payload: entry,
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'participant',
      level: 'info',
      tags: ['mood'],
      textOrVector: `${entry.mood} ${entry.intensity}`,
    });

    return createSuccessResponse({ recorded: true, entry });
  },

  setPersonalGoals: async ({ env, input }) => {
    const goalId = input?.id ?? `goal_${crypto.randomUUID()}`;
    const entry = {
      id: goalId,
      goal: input?.goal ?? input?.description ?? null,
      timeframe: input?.timeframe ?? null,
      created_at: new Date().toISOString(),
    };

    await writeLog(env, {
      type: 'goal_setting',
      payload: entry,
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'participant',
      level: 'info',
      tags: ['goal'],
      textOrVector: entry.goal ?? 'goal setting',
    });

    return createSuccessResponse({ goal_id: goalId, status: 'recorded' });
  },

  designHabits: async ({ env, input }) => {
    const habitId = input?.id ?? `habit_${crypto.randomUUID()}`;
    const entry = {
      id: habitId,
      habit: input?.habit ?? input?.description ?? null,
      cadence: input?.cadence ?? 'daily',
      created_at: new Date().toISOString(),
    };

    await writeLog(env, {
      type: 'habit_design',
      payload: entry,
      session_id: input?.session_id ?? null,
      who: input?.who ?? 'participant',
      level: 'info',
      tags: ['habit'],
      textOrVector: entry.habit ?? 'habit design',
    });

    return createSuccessResponse({ habit_id: habitId, status: 'recorded' });
  },

  systemHealthCheck: async ({ request, env }) => handleHealthCheck(request, env),

  logDataOrEvent: async ({ request, env }) => arkHandleLog(request, env),

  retrieveLogsOrDataEntries: async ({ request, env }) => handleRetrieveLogs(request, env),
};

const SUPPLEMENTAL_ROUTES = [
  {
    method: 'GET',
    path: '/api/session-init',
    operationId: 'sessionInit',
    handler: ({ request, env }) => handleSessionInit(request, env),
  },
  {
    method: 'POST',
    path: '/api/ritual/auto-suggest',
    operationId: 'generateRitualSuggestion',
    handler: ({ request, env }) => handleRitualSuggestion(request, env),
  },
  {
    method: 'POST',
    path: '/api/system/health-check',
    operationId: 'systemHealthCheck',
    handler: ({ request, env }) => handleHealthCheck(request, env),
  },
  {
    method: 'GET',
    path: '/api/system/readiness',
    operationId: 'systemReadiness',
    handler: ({ request, env }) => handleReadinessCheck(request, env),
  },
  {
    method: 'GET',
    path: '/api/logs/latest',
    operationId: 'retrieveLatestLogs',
    handler: async ({ env, input }) => {
      await ensureSchema(env);
      const limit = Math.min(Number(input?.limit ?? 25) || 25, 200);
      const { results } = await env.AQUIL_DB.prepare(
        'SELECT id, type, detail, timestamp FROM logs ORDER BY timestamp DESC LIMIT ?1',
      )
        .bind(limit)
        .all();
      return createSuccessResponse({ items: results ?? [] });
    },
  },
  {
    method: 'POST',
    path: '/api/logs/kv-write',
    operationId: 'storeInKV',
    handler: async ({ env, input }) => {
      if (!input || typeof input !== 'object') {
        throw new Error('Request body is required');
      }
      if (input.storedIn && input.storedIn !== 'KV') {
        throw new Error('storedIn must be KV');
      }

      const sessionId = input.session_id ?? crypto.randomUUID();
      const payload = {
        type: input.type ?? 'kv_log',
        payload: input.payload ?? input.detail ?? input,
        session_id: sessionId,
        who: input.who ?? 'kv_writer',
        level: input.level ?? 'info',
        tags: ['kv_write'],
        stores: ['kv'],
      };

      const result = await writeLog(env, payload);
      return createSuccessResponse({ result, session_id: sessionId });
    },
  },
  {
    method: 'POST',
    path: '/api/logs/d1-insert',
    operationId: 'd1Insert',
    handler: async ({ env, input }) => {
      if (!input || typeof input !== 'object') {
        throw new Error('Request body is required');
      }
      if (!UUID_V4.test(input.id ?? '')) {
        throw new Error('id must be a UUIDv4');
      }
      if (!LOG_TYPES.has(input.type)) {
        throw new Error('Invalid log type');
      }
      if (input.storedIn && input.storedIn !== 'D1') {
        throw new Error('storedIn must be D1');
      }

      await ensureSchema(env);
      await env.AQUIL_DB.prepare(
        'INSERT OR REPLACE INTO logs (id, type, detail, timestamp, storedIn) VALUES (?1, ?2, ?3, ?4, ?5)',
      )
        .bind(
          input.id,
          input.type,
          input.detail ?? JSON.stringify(input.payload ?? {}),
          input.timestamp ?? new Date().toISOString(),
          'D1',
        )
        .run();

      return createSuccessResponse({ inserted: true, id: input.id });
    },
  },
  {
    method: 'POST',
    path: '/api/logs/promote',
    operationId: 'promoteLog',
    handler: async ({ env, input }) => {
      if (!UUID_V4.test(input?.id ?? '')) {
        throw new Error('id must be a UUIDv4');
      }
      await ensureSchema(env);
      const kvResult = await journalService.getEntryById(env, input.id, { keyPrefix: '' });
      if (!kvResult.success) {
        throw new Error('Log not found in KV');
      }
      const log = kvResult.data;
      await env.AQUIL_DB.prepare(
        'INSERT OR IGNORE INTO logs (id, type, detail, timestamp, storedIn) VALUES (?1, ?2, ?3, ?4, ?5)',
      )
        .bind(
          log.id ?? input.id,
          log.type ?? 'kv_log',
          log.detail ?? JSON.stringify(log.content ?? {}),
          log.timestamp ?? new Date().toISOString(),
          'D1',
        )
        .run();

      return createSuccessResponse({ promoted: true, id: input.id });
    },
  },
  {
    method: 'POST',
    path: '/api/logs/retrieve',
    operationId: 'retrieveLogsOrDataEntries',
    handler: ({ request, env }) => handleRetrieveLogs(request, env),
  },
  {
    method: 'POST',
    path: '/api/logs/retrieval-meta',
    operationId: 'updateRetrievalMetadata',
    handler: async ({ env }) => {
      await ensureSchema(env);
      const timestamp = new Date().toISOString();
      await env.AQUIL_DB.prepare(
        'UPDATE retrieval_meta SET lastRetrieved = ?1, retrievalCount = retrievalCount + 1 WHERE id = 1',
      )
        .bind(timestamp)
        .run();

      return createSuccessResponse({ ok: true, lastRetrieved: timestamp });
    },
  },
  {
    method: 'POST',
    path: '/api/vectorize/query',
    operationId: 'vectorQuery',
    handler: ({ request, env }) => vectorQueryRequest(request, env),
  },
  {
    method: 'GET',
    path: '/api/debug/vector-dimensions',
    operationId: 'vectorDebug',
    handler: async ({ env }) =>
      createSuccessResponse({
        status: 'vector_debug_available',
        timestamp: new Date().toISOString(),
        vectorize_binding: env.AQUIL_CONTEXT ? 'available' : 'not_available',
      }),
  },
  {
    method: 'POST',
    path: '/api/test/vector-flow',
    operationId: 'vectorFlowTest',
    handler: async ({ env }) => {
      const result = await testVectorFlow(env);
      return createSuccessResponse({
        status: 'vector_flow_test_complete',
        timestamp: new Date().toISOString(),
        test_results: result,
      });
    },
  },
  {
    method: 'POST',
    path: '/api/search/logs',
    operationId: 'searchLogs',
    handler: async (context) => {
      const input = context.input ?? {};
      const query = input.query ?? input.text;
      if (!query) {
        throw new Error('query is required');
      }
      return operationHandlers.ragMemoryConsolidation({
        ...context,
        input: { ...input, text: query, mode: 'semantic_recall' },
      });
    },
  },
  {
    method: 'POST',
    path: '/api/rag/search',
    operationId: 'ragSearch',
    handler: async (context) => {
      const input = context.input ?? {};
      const query = input.query ?? input.text;
      if (!query) {
        throw new Error('query is required');
      }
      return operationHandlers.ragMemoryConsolidation({
        ...context,
        input: { ...input, text: query, mode: 'transformative_inquiry' },
      });
    },
  },
  {
    method: 'POST',
    path: '/api/search/r2',
    operationId: 'searchR2',
    handler: async ({ env, input }) => {
      const query = input?.query;
      if (!query) {
        throw new Error('query is required');
      }
      const timeframe = input?.timeframe ?? '24h';
      const result = await progressiveWeaving(env, {
        timeframe,
        query,
        limit: Math.min(Number(input?.limit ?? 10) || 10, 50),
      });
      return createSuccessResponse(result);
    },
  },
  {
    method: 'GET',
    path: '/api/analytics/insights',
    operationId: 'getConversationAnalytics',
    handler: async ({ env, input }) => {
      const timeframe = input?.timeframe ?? 'week';
      const logs = await readLogs(env, { limit: 200 });
      const total = logs.kv?.length ?? 0;

      const patterns = [];
      if (Array.isArray(logs.kv)) {
        const counts = logs.kv.reduce((acc, log) => {
          const type = log.type ?? 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        for (const [type, count] of Object.entries(counts)) {
          if (count >= 3) {
            patterns.push({ type, count });
          }
        }
      }

      return createSuccessResponse({
        timeframe,
        total_logs: total,
        patterns,
        generated_at: new Date().toISOString(),
      });
    },
  },
  {
    method: 'POST',
    path: '/api/export/conversation',
    operationId: 'exportConversation',
    handler: async ({ env, input }) => {
      const limit = Math.min(Number(input?.limit ?? 500) || 500, 2000);
      const logs = await readLogs(env, { limit });
      const exportId = `export_${Date.now()}`;

      await writeLog(env, {
        type: 'conversation_export',
        payload: { exportId, limit, filters: input ?? {} },
        who: 'system',
        level: 'info',
        tags: ['export'],
        textOrVector: `export ${exportId}`,
      });

      return createSuccessResponse({
        export_id: exportId,
        record_count: logs.kv?.length ?? 0,
        logs,
      });
    },
  },
  {
    method: 'GET',
    path: '/api/export/conversation',
    operationId: 'exportConversationGet',
    handler: async ({ env, input }) => {
      const limit = Math.min(Number(input?.limit ?? 200) || 200, 1000);
      const logs = await readLogs(env, { limit });
      return createSuccessResponse({
        export_id: `export_${Date.now()}`,
        record_count: logs.kv?.length ?? 0,
        logs,
      });
    },
  },
  {
    method: 'GET',
    path: '/api/kv/get',
    operationId: 'getKVStoredData',
    handler: ({ request, env }) => kvGet(request, env),
  },
  {
    method: 'POST',
    path: '/api/r2/put',
    operationId: 'putR2Object',
    handler: ({ request, env }) => r2Put(request, env),
  },
  {
    method: 'GET',
    path: '/api/r2/get',
    operationId: 'getR2Object',
    handler: ({ request, env }) => r2Get(request, env),
  },
  {
    method: 'GET',
    path: '/api/r2/list',
    operationId: 'listR2Objects',
    handler: async ({ env, input }) => {
      const limit = Math.min(Number(input?.limit ?? 20) || 20, 200);
      const result = await r2List(env, { limit });
      return createSuccessResponse({ objects: result });
    },
  },
];

const ARK_ROUTES = [
  {
    method: 'POST',
    path: '/api/ark/log',
    operationId: 'logDataOrEvent',
    handler: ({ request, env }) => arkLog(request, env),
  },
  {
    method: 'GET',
    path: '/api/ark/retrieve',
    operationId: 'retrieveLogsOrDataEntries',
    handler: ({ request, env }) => arkRetrieve(request, env),
  },
  {
    method: 'GET',
    path: '/api/ark/memories',
    operationId: 'retrieveLogsOrDataEntries',
    handler: ({ request, env }) => arkMemories(request, env),
  },
  {
    method: 'POST',
    path: '/api/ark/vector',
    operationId: 'ragMemoryConsolidation',
    handler: ({ request, env }) => arkVector(request, env),
  },
  {
    method: 'POST',
    path: '/api/ark/resonance',
    operationId: 'ragMemoryConsolidation',
    handler: ({ request, env }) => arkResonance(request, env),
  },
  {
    method: 'GET',
    path: '/api/ark/status',
    operationId: 'systemHealthCheck',
    handler: ({ request, env }) => arkStatus(request, env),
  },
  {
    method: 'POST',
    path: '/api/ark/filter',
    operationId: 'retrieveLogsOrDataEntries',
    handler: ({ request, env }) => arkFilter(request, env),
  },
  {
    method: 'POST',
    path: '/api/ark/autonomous',
    operationId: 'logDataOrEvent',
    handler: ({ request, env }) => arkAutonomous(request, env),
  },
  {
    method: 'POST',
    path: '/api/ark/test-ai',
    operationId: 'systemHealthCheck',
    handler: ({ request, env }) => arkTestAI(env, request),
  },
];

function registerSchemaRoutes() {
  for (const [path, methods] of Object.entries(gptSchema.paths ?? {})) {
    const normalizedPath = normalizePath(path);
    coverage.markDocumented(normalizedPath);
    for (const [method, definition] of Object.entries(methods)) {
      const operationId = definition?.operationId;
      const handler = operationHandlers[operationId];
      if (!handler) {
        console.warn(
          `[RouteRegistry] Missing handler for ${method.toUpperCase()} ${normalizedPath} (${operationId})`,
        );
        continue;
      }

      mountEndpoint({
        method: method.toUpperCase(),
        path: normalizedPath,
        handler,
        operationId,
      });
    }
  }
}

function registerSupplementalRoutes() {
  registerRoutes(SUPPLEMENTAL_ROUTES, { document: true });
}

function registerArkRoutes() {
  registerRoutes(ARK_ROUTES, { document: true });
}

function registerRoutes(routes, { document = false } = {}) {
  for (const route of routes) {
    if (document) {
      coverage.markDocumented(route.path);
    }
    mountEndpoint(route);
  }
}

registerSchemaRoutes();
registerSupplementalRoutes();
registerArkRoutes();

router.options('*', () => new Response(null, { status: 204, headers: corsHeaders }));

coverage.markDocumented('/.well-known/ark/actions');
mountEndpoint({
  method: 'GET',
  path: '/.well-known/ark/actions',
  handler: () =>
    new Response(JSON.stringify(actions), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  operationId: 'arkManifest',
});

coverage.markDocumented('/.well-known/gpt-actions.json');
mountEndpoint({
  method: 'GET',
  path: '/.well-known/gpt-actions.json',
  handler: () =>
    new Response(JSON.stringify(gptSchema), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  operationId: 'gptActionsSchema',
});

const coverageReport = coverage.report();
if (coverageReport.missing.length > 0) {
  console.warn('[RouteCoverage] Missing handlers for documented endpoints:', coverageReport.missing);
}

async function logChatGPTAction(env, operationId, inputPayload, resultPayload, error = null) {
  try {
    const canonical = toCanonical(operationId);
    const level = error ? 'error' : 'info';
    const sessionId =
      inputPayload?.session_id || inputPayload?.sessionId || crypto.randomUUID();

    const payload = {
      operation: operationId,
      canonical_operation: canonical,
      timestamp: new Date().toISOString(),
      input: sanitizeForLog(inputPayload),
      ...(error
        ? { error: { message: error.message, stack: trimStack(error.stack) } }
        : { result: sanitizeForLog(resultPayload) }),
    };

    await writeLog(env, {
      type: canonical,
      who: 'system',
      level,
      session_id: sessionId,
      tags: [
        `operation:${canonical}`,
        'source:gpt',
        error ? 'status:error' : 'status:success',
      ],
      payload,
      textOrVector: buildEmbeddingText(canonical, inputPayload, error),
    });
  } catch (loggingError) {
    console.warn('[logChatGPTAction] Failed to record action', loggingError);
  }
}

function sanitizeForLog(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function trimStack(stack) {
  if (!stack) return [];
  return stack.split('\n').slice(0, 5);
}

function buildEmbeddingText(operation, input, error) {
  if (error) {
    return scrubText(`${operation} error: ${error.message}`);
  }

  const preview = input ? JSON.stringify(sanitizeForLog(input)).slice(0, 300) : 'no payload';
  return scrubText(`${operation} executed with payload ${preview}`);
}

function scrubText(text) {
  if (!text) return '';
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]')
    .replace(/\s+/g, ' ')
    .trim();
}

router.all('*', async (request, env) => {
  const url = new URL(request.url);
  const notFoundError = new Error(`No handler registered for ${url.pathname}`);
  notFoundError.code = 'ENDPOINT_NOT_REGISTERED';

  const errorData = await handleError(notFoundError, {
    endpoint: url.pathname,
    method: request.method,
  }, env);

  const coverageSnapshot = coverage.report();
  const availableEndpoints = coverage.available();

  const body = {
    success: false,
    error: {
      id: errorData.errorId,
      message: errorData.userMessage,
      category: 'routing',
      timestamp: errorData.timestamp,
    },
    fallback_guidance: errorData.fallbackGuidance,
    technical_details: {
      endpoint: errorData.endpoint,
      severity: errorData.severity,
      available_endpoints: availableEndpoints,
      undocumented_handlers: coverageSnapshot.extra,
      missing_documented_endpoints: coverageSnapshot.missing,
    },
    schema: {
      gpt_actions_version: gptSchema.info?.version ?? 'unknown',
      ark_schema_version: actions.info?.version ?? 'unknown',
      total_documented_endpoints: availableEndpoints.length,
    },
  };

  return applyCors(
    new Response(JSON.stringify(body), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    }),
    404,
  );
});

export default {
  async fetch(request, env, ctx) {
    const response = await router.handle(request, env, ctx);
    return applyCors(response, 404);
  },

  async scheduled(event, env, ctx) {
    try {
      await handleScheduledTriggers(env);
    } catch (error) {
      console.error('Scheduled trigger error:', error);
      await logChatGPTAction(env, 'scheduledTriggerError', {
        event: event.scheduledTime,
        cron: event.cron,
      }, null, error);
    }
  },
};
