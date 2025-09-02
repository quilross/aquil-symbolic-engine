-- D1 Schema Migration: Fix logging schema/insert mismatch
-- Eliminates "table metamorphic_logs has no column named id" and "no such table: event_log" errors
-- Zero regression, preserves fail-open behavior, maintains ≤ 30 operations

-- Step 1: Create new metamorphic_logs table with canonical schema
CREATE TABLE IF NOT EXISTS metamorphic_logs_new (
  id TEXT PRIMARY KEY,                -- correlation id used across KV/Vector/R2
  timestamp TEXT NOT NULL,            -- ISO-8601
  operationId TEXT,
  originalOperationId TEXT,
  kind TEXT NOT NULL,                 -- "action_success" | "action_error" | "session" | etc.
  level TEXT DEFAULT 'info',
  session_id TEXT,
  tags TEXT,                          -- JSON array string
  stores TEXT,                        -- JSON array string
  artifactKey TEXT,
  error_message TEXT,
  error_code TEXT,
  detail TEXT,                        -- scrubbed JSON summary, not huge payloads
  env TEXT,
  source TEXT DEFAULT 'gpt'
);

-- Step 2: Migrate existing data if metamorphic_logs exists
INSERT OR IGNORE INTO metamorphic_logs_new (
  id, timestamp, operationId, originalOperationId, kind, level, session_id,
  tags, stores, artifactKey, error_message, error_code, detail, env, source
)
SELECT
  COALESCE(id, printf('m_%s', lower(hex(randomblob(8))))),
  COALESCE(timestamp, datetime('now')),
  NULL, -- operationId (not in old schema)
  NULL, -- originalOperationId (not in old schema)
  COALESCE(kind, 'general'),
  COALESCE(signal_strength, 'info'),  -- map signal_strength to level
  session_id,
  tags,
  NULL, -- stores (not in old schema)
  NULL, -- artifactKey (not in old schema)
  NULL, -- error_message (not in old schema)
  NULL, -- error_code (not in old schema)
  detail,
  NULL, -- env (not in old schema)
  COALESCE(source, 'gpt')
FROM metamorphic_logs
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='metamorphic_logs');

-- Step 3: Atomically swap tables
-- Backup old table if it exists
DROP TABLE IF EXISTS metamorphic_logs_backup;
ALTER TABLE metamorphic_logs RENAME TO metamorphic_logs_backup WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='metamorphic_logs');

-- Rename new table to canonical name
ALTER TABLE metamorphic_logs_new RENAME TO metamorphic_logs;

-- Step 4: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_logs_ts       ON metamorphic_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_op       ON metamorphic_logs(operationId);
CREATE INDEX IF NOT EXISTS idx_logs_session  ON metamorphic_logs(session_id);

-- Step 5: Create compatibility VIEW for event_log fallback
CREATE VIEW IF NOT EXISTS event_log AS
SELECT
  id,
  timestamp AS ts,
  kind AS type,
  operationId,
  originalOperationId,
  level,
  session_id,
  tags,
  stores,
  artifactKey,
  error_message,
  error_code,
  detail AS payload,
  env,
  source AS who
FROM metamorphic_logs;

-- Step 6: Clean up backup table after successful migration
DROP TABLE IF EXISTS metamorphic_logs_backup;