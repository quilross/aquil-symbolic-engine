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
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS kind TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS signal_strength TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS detail TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS voice_used TEXT;
ALTER TABLE metamorphic_logs ADD COLUMN IF NOT EXISTS tags TEXT;

-- Existing ARK columns are preserved and allowed to be NULL
-- No destructive changes

CREATE INDEX IF NOT EXISTS idx_metamorphic_logs_timestamp ON metamorphic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metamorphic_logs_session_id ON metamorphic_logs(session_id);
