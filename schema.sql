-- Aquil Symbolic Engine Database Schema
-- Personal AI wisdom and trust building system

-- User profile and preferences  
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY DEFAULT 'aquil_user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    preferences TEXT, -- JSON: communication style, frameworks, focus areas
    personality_data TEXT, -- JSON: HD, GK, astrology data
    trust_baseline INTEGER DEFAULT 5, -- 1-10 scale
    standing_tall_goal TEXT
);

-- Trust building journey tracking
CREATE TABLE IF NOT EXISTS trust_sessions (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_type TEXT, -- check-in, exercise, milestone
    trust_level INTEGER, -- 1-10
    reflection TEXT,
    insights TEXT, -- JSON: AI-generated insights
    exercises_completed TEXT, -- JSON: exercises and results
    patterns_identified TEXT, -- JSON: recurring themes
    next_steps TEXT -- JSON: recommended actions
);

-- Media consumption and wisdom extraction
CREATE TABLE IF NOT EXISTS media_wisdom (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    media_type TEXT, -- tv, movie, book, podcast, music, article
    title TEXT,
    content_summary TEXT,
    personal_reaction TEXT,
    emotional_response TEXT, -- JSON: emotions triggered
    wisdom_extracted TEXT, -- JSON: insights and lessons
    trust_connections TEXT, -- JSON: how it relates to trust journey
    action_items TEXT, -- JSON: practical applications
    growth_themes TEXT, -- JSON: personal development themes
    resonance_score INTEGER -- 1-10 how much it resonated
);

-- Somatic healing and body wisdom sessions
CREATE TABLE IF NOT EXISTS somatic_sessions (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    body_state TEXT, -- JSON: tension, energy, sensations
    emotions_present TEXT, -- JSON: current emotional state
    intention TEXT,
    session_structure TEXT, -- JSON: phases and exercises
    body_insights TEXT, -- JSON: what the body communicated
    trust_building_elements TEXT, -- JSON: how it built self-trust
    outcomes TEXT, -- JSON: shifts and changes noticed
    integration_notes TEXT
);

-- Wisdom synthesis from multiple frameworks
CREATE TABLE IF NOT EXISTS wisdom_synthesis (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    synthesis_type TEXT, -- daily, weekly, monthly, question-based
    frameworks_used TEXT, -- JSON: HD, GK, astrology, somatic
    life_situation TEXT,
    question_asked TEXT,
    synthesized_guidance TEXT, -- JSON: integrated wisdom
    trust_applications TEXT, -- JSON: how to apply for trust building
    standing_tall_connections TEXT, -- JSON: relevance to standing tall
    action_steps TEXT, -- JSON: concrete next steps
    follow_up_date DATE
);

-- Pattern recognition and growth tracking
CREATE TABLE IF NOT EXISTS growth_patterns (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    pattern_type TEXT, -- trust, media, somatic, wisdom, overall
    pattern_description TEXT,
    frequency_data TEXT, -- JSON: when and how often
    triggers TEXT, -- JSON: what activates this pattern
    responses TEXT, -- JSON: how user typically responds
    evolution_notes TEXT, -- JSON: how it's changing over time
    recommendations TEXT -- JSON: ways to work with the pattern
);

-- Daily/weekly wisdom and insight compilation
CREATE TABLE IF NOT EXISTS wisdom_compilation (
    id TEXT PRIMARY KEY,
    date DATE,
    compilation_type TEXT, -- daily, weekly, monthly
    trust_evolution TEXT, -- JSON: trust journey updates
    media_insights TEXT, -- JSON: wisdom from content consumed
    somatic_awareness TEXT, -- JSON: body wisdom developments
    framework_integration TEXT, -- JSON: HD/GK/astrology synthesis
    patterns_noticed TEXT, -- JSON: emerging patterns
    standing_tall_progress TEXT, -- JSON: confidence and empowerment growth
    celebration_moments TEXT, -- JSON: wins and progress to celebrate
    areas_for_attention TEXT, -- JSON: areas needing focus
    next_period_intentions TEXT -- JSON: intentions for coming period
);

-- Trust building exercises and their effectiveness
CREATE TABLE IF NOT EXISTS trust_exercises (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    exercise_type TEXT,
    exercise_description TEXT,
    user_experience TEXT,
    effectiveness_rating INTEGER, -- 1-10
    insights_gained TEXT,
    body_responses TEXT, -- JSON: physical responses during exercise
    emotional_shifts TEXT, -- JSON: emotional changes
    trust_impact TEXT, -- how it affected self-trust
    repeat_recommendation BOOLEAN
);

-- Standing tall practices and confidence building
CREATE TABLE IF NOT EXISTS standing_tall_sessions (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    situation_context TEXT,
    shrinking_patterns TEXT, -- JSON: identified patterns
    confidence_level INTEGER, -- 1-10
    fears_addressed TEXT, -- JSON: fears worked with
    practices_completed TEXT, -- JSON: exercises done
    insights_gained TEXT,
    embodied_shifts TEXT, -- JSON: physical/energetic changes
    next_steps TEXT -- JSON: continuing practices
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trust_sessions_date ON trust_sessions(timestamp);
CREATE INDEX IF NOT EXISTS idx_media_wisdom_date ON media_wisdom(timestamp);
CREATE INDEX IF NOT EXISTS idx_somatic_sessions_date ON somatic_sessions(timestamp);
CREATE INDEX IF NOT EXISTS idx_wisdom_synthesis_date ON wisdom_synthesis(timestamp);
CREATE INDEX IF NOT EXISTS idx_growth_patterns_type ON growth_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_wisdom_compilation_date ON wisdom_compilation(date);

-- Initialize user profile
INSERT OR REPLACE INTO user_profile (
    id, 
    preferences, 
    standing_tall_goal
) VALUES (
    'aquil_user',
    '{"communication_style": "direct_comprehensive", "frameworks": ["human_design", "gene_keys", "astrology", "somatic_wisdom"], "focus_areas": ["internal_trust", "standing_tall", "media_wisdom", "body_awareness"]}',
    'Build unshakeable internal trust as my primary navigation system and stand tall in the world instead of shrinking'
);

-- Metamorphic event logs for unified logging system
CREATE TABLE IF NOT EXISTS metamorphic_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    kind TEXT NOT NULL,
    signal_strength TEXT DEFAULT 'medium',
    detail TEXT DEFAULT '{}',
    session_id TEXT,
    voice_used TEXT,
    tags TEXT
);

-- Generic event log for chat messages, metrics, errors, etc.
CREATE TABLE IF NOT EXISTS event_log (
    id TEXT PRIMARY KEY,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT NOT NULL,
    who TEXT,
    level TEXT,
    session_id TEXT,
    tags TEXT,
    idx1 TEXT,
    idx2 TEXT,
    payload TEXT NOT NULL
);

-- Basic indexes to speed up queries
CREATE INDEX IF NOT EXISTS idx_metamorphic_timestamp ON metamorphic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metamorphic_session ON metamorphic_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_metamorphic_kind ON metamorphic_logs(kind);

CREATE INDEX IF NOT EXISTS idx_event_ts ON event_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_event_type ON event_log(type);
CREATE INDEX IF NOT EXISTS idx_event_session ON event_log(session_id);
CREATE INDEX IF NOT EXISTS idx_event_who ON event_log(who);
CREATE INDEX IF NOT EXISTS idx_event_level ON event_log(level);
