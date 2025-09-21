// Shared validation and helpers for logging-related routes and handlers
// Builds validation constants from configuration to keep a single source of truth

import actions from '../../config/ark.actions.logging.json' with { type: 'json' };

// Validation constants from config
export const LOG_TYPES = new Set(actions['x-ark-metadata'].enums?.logTypes ?? []);
export const STORED_IN = new Set(actions['x-ark-metadata'].enums?.storedIn ?? []);
export const UUID_V4 = new RegExp(actions['x-ark-metadata'].validation?.uuidV4 ?? '^[0-9a-fA-F-]{36}$');
export const MAX_DETAIL = actions['x-ark-metadata'].validation?.maxDetailLength ?? 4000;

// Generic helpers
export async function readJson(req) {
  try { return await req.json() } catch { return null }
}

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' }, ...init });
}

export function isIso(ts) {
  try {
    const d = new Date(ts);
    return !isNaN(d.getTime());
  } catch { return false }
}

// Ensure D1 schema for logs/retrieval meta exists (idempotent)
export async function ensureSchema(env) {
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
  `);
}

export function validateLog(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid body';
  const { id, type, detail, timestamp, storedIn } = payload;
  if (!UUID_V4.test(id)) return 'id must be uuid v4';
  if (!LOG_TYPES.has(type)) return `type must be one of ${[...LOG_TYPES].join(',')}`;
  if (detail != null && typeof detail !== 'string') return 'detail must be string';
  if (detail && detail.length > MAX_DETAIL) return `detail exceeds ${MAX_DETAIL} chars`;
  if (!isIso(timestamp)) return 'timestamp must be ISO 8601';
  if (!STORED_IN.has(storedIn)) return `storedIn must be one of ${[...STORED_IN].join(',')}`;
  return null;
}
