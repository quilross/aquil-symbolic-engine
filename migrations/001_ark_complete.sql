CREATE TABLE IF NOT EXISTS metamorphic_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    kind TEXT NOT NULL,
    signal_strength TEXT DEFAULT 'medium',
    detail TEXT DEFAULT '{}',
    voice_used TEXT,
    session_id TEXT
);

CREATE TABLE IF NOT EXISTS voice_effectiveness (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    voice_name TEXT NOT NULL,
    effectiveness REAL DEFAULT 0.0,
    context_type TEXT
);

CREATE TABLE IF NOT EXISTS commitment_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    session_id TEXT
);

CREATE INDEX idx_meta_timestamp ON metamorphic_logs(timestamp);
CREATE INDEX idx_voice_eff ON voice_effectiveness(voice_name, effectiveness);
