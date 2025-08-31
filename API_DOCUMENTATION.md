# ARK 2.0 Consciousness Companion API Documentation

## Overview

The ARK 2.0 Consciousness Companion System is a comprehensive personal AI wisdom builder that provides multi-voice cognitive support, metamorphic logging, autonomous ritual suggestions, Socratic questioning, and COM-B model coaching.

## Base URL
- Production: `https://signal-q.me`
- Development: `http://localhost:8787`

## Core Endpoints

### 1. Logging & Session Management

#### POST /api/log
Log any data or conversation event for metamorphic tracking.

**Request Body:**
```json
{
  "type": "insight|breakthrough|reflection|chat_message",
  "who": "user|assistant|system",
  "level": "info|warning|error|highlight",
  "session_id": "string",
  "tags": ["trust", "wisdom", "body"],
  "text": "The actual content to log",
  "payload": { "any": "additional data" }
}
```

#### GET /api/logs
Retrieve all logged events with optional filtering.

#### GET /api/session-init
Initialize a new session with continuity from previous interactions.

### 2. Trust Building System

#### POST /api/trust/check-in
Comprehensive trust state analysis and personalized guidance.

**Request Body:**
```json
{
  "current_state": "How you're feeling right now",
  "trust_level": 1-10,
  "specific_situation": "What's happening in your life",
  "body_sensations": "Physical awareness"
}
```

**Response:**
- Trust analysis and patterns
- Personalized affirmations
- Specific exercises and practices
- Progress tracking

### 3. Media Wisdom Extraction

#### POST /api/media/extract-wisdom
Transform media consumption into growth insights.

**Request Body:**
```json
{
  "media_type": "movie|tv|book|podcast|article",
  "title": "Media title",
  "your_reaction": "How it affected you",
  "emotional_themes": ["themes you noticed"],
  "growth_opportunities": ["what you learned"]
}
```

### 4. Somatic Healing Sessions

#### POST /api/somatic/session
Generate body-based healing practices and somatic awareness.

**Request Body:**
```json
{
  "body_state": "Current physical sensations",
  "emotional_state": "Current emotional state",
  "specific_areas": ["areas of focus"],
  "session_type": "grounding|energizing|releasing|integrating"
}
```

### 5. Wisdom Synthesis

#### POST /api/wisdom/synthesize
Multi-framework synthesis integrating Human Design, Gene Keys, astrology, and somatic wisdom.

#### GET /api/wisdom/daily-synthesis
Daily compilation of insights and patterns.

### 6. Pattern Recognition

#### POST /api/patterns/recognize
Identify growth patterns across your journey.

**Request Body:**
```json
{
  "text": "Description of situation or pattern",
  "context": { "situation": "context details" }
}
```

#### POST /api/patterns/autonomous-detect
Autonomous pattern detection from recent logs.

### 7. Standing Tall Coaching

#### POST /api/standing-tall/practice
Confidence building and empowerment practices.

**Request Body:**
```json
{
  "current_challenge": "What you're facing",
  "confidence_level": 1-10,
  "specific_fears": ["fears to address"],
  "desired_outcome": "What you want to achieve"
}
```

### 8. Socratic Questioning System

#### POST /api/socratic/question
Generate deep, transformative questions for self-inquiry.

**Request Body:**
```json
{
  "context": { "topic": "career|relationships|growth|purpose" },
  "depth_level": "surface|deep|profound",
  "voice": "oracle|mirror|guide|challenger"
}
```

**Voice Types:**
- **Oracle**: Mystical, intuitive questions
- **Mirror**: Reflective, self-awareness questions  
- **Guide**: Supportive, developmental questions
- **Challenger**: Direct, growth-edge questions

### 9. COM-B Model Coaching

#### POST /api/coaching/comb-analysis
Behavioral change coaching using Capability, Opportunity, Motivation framework.

**Request Body:**
```json
{
  "behavior_goal": "What you want to change or achieve",
  "current_situation": "Where you are now",
  "context": { "domain": "health|career|relationships|personal" }
}
```

### 10. Commitment & Contract Tracking

#### POST /api/commitments/create
Create and track personal commitments.

#### GET /api/commitments/active
Retrieve active commitments and progress.

#### POST /api/contracts/create
Create transformation contracts with milestones.

### 11. System Health & Monitoring

#### GET /api/health
Comprehensive system health check with service status.

#### GET /api/monitoring/metrics
Production monitoring metrics and performance data.

## Multi-Voice Cognitive System

The system supports four distinct AI voices for different types of interactions:

1. **Oracle Voice**: Mystical, intuitive guidance
2. **Mirror Voice**: Reflective self-awareness
3. **Guide Voice**: Supportive development
4. **Challenger Voice**: Growth-edge questioning

## Metamorphic Logging

All interactions are logged with metamorphic tracking that:
- Captures transformation moments
- Identifies breakthrough patterns
- Tracks growth trajectories
- Enables personalized insights

## Autonomous Features

- **Ritual Suggestions**: AI-generated practices based on patterns
- **Pattern Detection**: Automatic identification of growth themes
- **Breakthrough Recognition**: Celebration of transformation moments
- **Personalized Guidance**: Adaptive responses based on history

## Error Handling

All endpoints include comprehensive error handling with:
- Graceful degradation when services unavailable
- Fallback responses for AI failures
- Detailed error logging for debugging
- User-friendly error messages

## Security & Privacy

- All data stored in user's Cloudflare infrastructure
- No third-party data sharing
- Secure API authentication
- Privacy-first design

## Testing

Comprehensive test suite with 58+ tests covering:
- All API endpoints
- Error handling scenarios
- Integration flows
- Edge cases and fallbacks

Run tests with: `npm test`

## Development

Start development server: `npm run dev`
Deploy to production: `npm run deploy`

## GPT Actions Integration

The system is designed for seamless ChatGPT integration via GPT Actions. The OpenAPI schema (`gpt-actions-schema.json`) provides complete endpoint definitions for GPT to understand and interact with the system.

For GPT setup instructions, see `CHATGPT_SETUP_GUIDE.md`.