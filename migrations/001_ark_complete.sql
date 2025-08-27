-- Full ARK 2.0 Database Schema Migration

-- Metamorphic event logs with enriched ARK analytics
CREATE TABLE IF NOT EXISTS metamorphic_logs (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  kind TEXT NOT NULL,
  signal_strength TEXT DEFAULT 'medium',
  detail TEXT DEFAULT '{}',
  voice_used TEXT,
  session_id TEXT,
  tags TEXT,
  developmental_vector TEXT DEFAULT 'integration',
  voice_effectiveness REAL DEFAULT 0.0,
  intervention_stack TEXT DEFAULT '[]',
  transformation_indicators TEXT DEFAULT '[]',
  recursive_depth INTEGER DEFAULT 1,
  systemic_impact TEXT DEFAULT 'localized'
);

-- Commitment logs for symbolic actions with ARK metadata
CREATE TABLE IF NOT EXISTS commitment_logs (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  session_id TEXT,
  transformation_level INTEGER DEFAULT 1,
  ritual_stack TEXT DEFAULT '[]',
  due_at DATETIME,
  developmental_edge TEXT,
  systemic_integration TEXT,
  metamorphic_indicators TEXT DEFAULT '[]',
  voice_suggested TEXT
);

-- Voice effectiveness tracking with deep engagement metrics
CREATE TABLE IF NOT EXISTS voice_effectiveness (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  voice_name TEXT NOT NULL,
  context_type TEXT,
  engagement_level REAL DEFAULT 0.0,
  breakthrough_indicators INTEGER DEFAULT 0,
  overall_effectiveness REAL DEFAULT 0.0,
  response_depth TEXT,
  emotional_resonance TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_meta_timestamp ON metamorphic_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_commitment_status ON commitment_logs(status);
CREATE INDEX IF NOT EXISTS idx_voice_eff ON voice_effectiveness(voice_name, overall_effectiveness);
