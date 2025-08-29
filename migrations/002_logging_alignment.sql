-- Migration: Ensure metamorphic_logs table has required columns for unified logging
-- Columns: id, timestamp, kind, signal_strength, detail, session_id, voice_used, tags
-- Extra ARK columns are preserved, can be NULL/defaults


-- Canonical logging schema alignment
CREATE TABLE IF NOT EXISTS metamorphic_logs (
	id TEXT PRIMARY KEY,
	timestamp TEXT,
	kind TEXT,
	signal_strength TEXT,
	detail TEXT,
	session_id TEXT,
	voice_used TEXT,
	tags TEXT
);

-- Add missing columns if not present, allow NULL
-- SQLite does not support IF NOT EXISTS for ADD COLUMN. These statements will error if the column exists.
-- You may need to manually check schema before running these, or handle errors in your migration process.
-- The following columns already exist in metamorphic_logs. Commented out to prevent duplicate column errors.
-- ALTER TABLE metamorphic_logs ADD COLUMN id TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN timestamp TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN kind TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN signal_strength TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN detail TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN session_id TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN voice_used TEXT;
-- ALTER TABLE metamorphic_logs ADD COLUMN tags TEXT;

-- Existing ARK columns are preserved and allowed to be NULL
-- No destructive changes

CREATE INDEX IF NOT EXISTS idx_metamorphic_logs_timestamp ON metamorphic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metamorphic_logs_session_id ON metamorphic_logs(session_id);
