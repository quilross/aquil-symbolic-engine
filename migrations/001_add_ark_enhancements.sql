-- ARK 2.0 Database Enhancements
-- These tables ADD to your existing system

CREATE TABLE IF NOT EXISTS metamorphic_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    kind TEXT NOT NULL,
    signal_strength TEXT DEFAULT 'medium',
    developmental_vector TEXT DEFAULT 'integration',
    detail TEXT DEFAULT '{}',
    voice_effectiveness TEXT DEFAULT 'neutral',
    intervention_stack TEXT DEFAULT '[]',
    transformation_indicators TEXT DEFAULT '[]',
    recursive_depth INTEGER DEFAULT 1,
    systemic_impact TEXT DEFAULT 'localized',
    session_id TEXT,
    voice_used TEXT
);

CREATE TABLE IF NOT EXISTS commitment_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'emerging',
    transformation_level INTEGER DEFAULT 1,
    ritual_stack TEXT DEFAULT '[]',
    due_at DATETIME,
    developmental_edge TEXT,
    systemic_integration TEXT,
    metamorphic_indicators TEXT DEFAULT '[]',
    session_id TEXT,
    voice_suggested TEXT
);

CREATE TABLE IF NOT EXISTS voice_effectiveness (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    voice_name TEXT NOT NULL,
    context_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    engagement_level REAL DEFAULT 0.0,
    breakthrough_indicators INTEGER DEFAULT 0,
    overall_effectiveness REAL DEFAULT 0.0,
    response_depth TEXT,
    emotional_resonance TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metamorphic_timestamp ON metamorphic_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_commitment_status ON commitment_logs(status);
CREATE INDEX IF NOT EXISTS idx_voice_effectiveness ON voice_effectiveness(voice_name, overall_effectiveness);
