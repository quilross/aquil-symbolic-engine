import {
  getPhiladelphiaTime,
  generateId,
  logMetamorphicEvent,
  selectOptimalVoice,
  performHealthChecks,
  performReadinessChecks,
} from "./core.js";

// Helper function to safely parse JSON values
const parseValue = (val) => {
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

// Manifest for GPT: describes all available actions and storage usage
export const ARK_MANIFEST = [
  {
    name: "handleSessionInit",
    path: "/api/session-init",
    description: "Session initialization with continuity and AI-crafted opening",
    storage: ["D1", "Worker AI"],
    logs: true,
    triggers: ["start", "begin", "hello", "hi", "new session"],
    voices: ["mirror", "oracle", "scientist", "strategist"]
  },
  {
    name: "handleDiscoveryInquiry",
    path: "/api/discovery/generate-inquiry",
    description: "Generate Socratic questions using AI and log inquiry",
    storage: ["D1", "Worker AI"],
    logs: true,
    triggers: ["question", "explore", "deeper", "inquiry", "socratic"],
    voices: ["oracle", "scientist"]
  },
  {
    name: "handleRitualSuggestion",
    path: "/api/ritual/auto-suggest",
    description: "Suggest rituals for collapse loops, disconnection, stagnation, identity doubt, energy optimization, creative blocks, abundance",
    storage: ["D1", "Worker AI"],
    logs: true,
    triggers: ["ritual", "practice", "ceremony", "stuck", "disconnected", "stagnant", "doubt", "drained", "blocked", "scarcity"],
    voices: ["strategist", "oracle"]
  },
  {
    name: "handleHealthCheck",
    path: "/api/system/health-check",
    description: "Perform health checks and log results",
    storage: ["D1"],
    logs: true,
    triggers: ["health", "status", "check", "system"],
    voices: ["scientist"]
  },
  {
    name: "handleRetrieveLogs",
    path: "/api/logs",
    description: "Retrieve conversation history and context",
    storage: ["D1"],
    logs: false,
    triggers: ["history", "logs", "past", "previous", "remember"],
    voices: ["mirror", "scientist"]
  },
  {
    name: "handleLog",
    path: "/api/log",
    description: "General logging endpoint for events and feedback",
    storage: ["D1", "KV"],
    logs: true,
    triggers: ["log", "record", "save", "remember"],
    voices: ["mirror", "scientist"]
  },
  {
    name: "handleTrustCheckIn",
    path: "/api/trust/check-in",
    description: "Analyze trust patterns and provide embodied practices",
    storage: ["D1"],
    logs: true,
    triggers: ["trust", "doubt", "confidence", "self-trust", "decision", "uncertainty"],
    voices: ["mirror", "oracle"]
  },
  {
    name: "handleMediaWisdom",
    path: "/api/media/extract-wisdom",
    description: "Extract wisdom from books, articles, videos, podcasts",
    storage: ["D1"],
    logs: true,
    triggers: ["book", "article", "video", "podcast", "media", "content", "wisdom", "insights"],
    voices: ["oracle", "scientist"]
  },
  {
    name: "handleSomaticSession",
    path: "/api/somatic/session",
    description: "Generate body-based healing sessions and somatic practices",
    storage: ["D1"],
    logs: true,
    triggers: ["body", "somatic", "physical", "tension", "pain", "embodied", "sensation", "breathe"],
    voices: ["mirror", "oracle"]
  },
  {
    name: "handleWisdomSynthesis",
    path: "/api/wisdom/synthesize",
    description: "Synthesize insights from multiple experiences and patterns",
    storage: ["D1"],
    logs: true,
    triggers: ["synthesize", "integrate", "wisdom", "insights", "patterns", "meaning"],
    voices: ["oracle", "scientist"]
  },
  {
    name: "handlePatternRecognition",
    path: "/api/patterns/recognize",
    description: "Recognize behavioral and emotional patterns across experiences",
    storage: ["D1"],
    logs: true,
    triggers: ["pattern", "recurring", "habit", "behavior", "cycle", "repeat"],
    voices: ["scientist", "oracle"]
  },
  {
    name: "handleStandingTall",
    path: "/api/standing-tall/practice",
    description: "Generate practices for confidence, authenticity, and personal power",
    storage: ["D1"],
    logs: true,
    triggers: ["confidence", "power", "authentic", "small", "shrink", "stand tall", "presence"],
    voices: ["strategist", "mirror"]
  },
  {
    name: "handleDreamInterpretation",
    path: "/api/dreams/interpret",
    description: "Interpret dreams using archetypal and symbolic analysis",
    storage: ["D1"],
    logs: true,
    triggers: ["dream", "nightmare", "sleep", "unconscious", "symbolic", "archetypal"],
    voices: ["oracle"]
  },
  {
    name: "handleEnergyOptimization",
    path: "/api/energy/optimize",
    description: "Optimize energy levels through lifestyle and somatic practices",
    storage: ["D1"],
    logs: true,
    triggers: ["energy", "tired", "drained", "exhausted", "fatigue", "vitality", "burnout"],
    voices: ["scientist", "strategist"]
  },
  {
    name: "handleValuesClarification",
    path: "/api/values/clarify",
    description: "Clarify core values and align decisions with authentic self",
    storage: ["D1"],
    logs: true,
    triggers: ["values", "what matters", "important", "priority", "authentic", "align"],
    voices: ["oracle", "mirror"]
  },
  {
    name: "handleCreativityUnleashing",
    path: "/api/creativity/unleash",
    description: "Overcome creative blocks and unleash authentic expression",
    storage: ["D1"],
    logs: true,
    triggers: ["creative", "block", "stuck", "express", "art", "write", "create", "inspiration"],
    voices: ["oracle", "strategist"]
  },
  {
    name: "handleAbundanceCultivation",
    path: "/api/abundance/cultivate",
    description: "Transform scarcity mindset and cultivate abundance consciousness",
    storage: ["D1"],
    logs: true,
    triggers: ["money", "abundance", "scarcity", "financial", "wealth", "prosperity", "lack"],
    voices: ["oracle", "strategist"]
  },
  {
    name: "handleTransitionNavigation",
    path: "/api/transitions/navigate",
    description: "Navigate life transitions with wisdom and support",
    storage: ["D1"],
    logs: true,
    triggers: ["transition", "change", "moving", "new phase", "uncertain", "shift", "transform"],
    voices: ["oracle", "strategist"]
  },
  {
    name: "handleAncestryHealing",
    path: "/api/ancestry/heal",
    description: "Heal ancestral patterns and family dynamics",
    storage: ["D1"],
    logs: true,
    triggers: ["family", "ancestry", "generational", "parents", "lineage", "inherited", "ancestral"],
    voices: ["oracle", "mirror"]
  },
  {
    name: "handleCommitmentCreation",
    path: "/api/commitments/create",
    description: "Create trackable commitments with accountability",
    storage: ["D1"],
    logs: true,
    triggers: ["commit", "promise", "goal", "practice", "accountability", "track"],
    voices: ["strategist"]
  },
  {
    name: "handleActiveCommitments",
    path: "/api/commitments/active",
    description: "Retrieve active commitments and progress tracking",
    storage: ["D1"],
    logs: false,
    triggers: ["commitments", "progress", "active", "tracking", "goals"],
    voices: ["strategist", "scientist"]
  },
  {
    name: "handleCommitmentProgress",
    path: "/api/commitments/{id}/progress",
    description: "Log progress on specific commitments",
    storage: ["D1"],
    logs: true,
    triggers: ["progress", "update", "commitment", "check-in"],
    voices: ["strategist", "mirror"]
  },
  {
    name: "handleContractCreation",
    path: "/api/contracts/create",
    description: "Create formal contracts with self or others",
    storage: ["D1"],
    logs: true,
    triggers: ["contract", "agreement", "formal", "commitment", "accountability"],
    voices: ["strategist"]
  },
  {
    name: "handleDailySynthesis",
    path: "/api/wisdom/daily-synthesis",
    description: "Generate daily wisdom synthesis and compass",
    storage: ["D1"],
    logs: true,
    triggers: ["daily", "synthesis", "compass", "today", "morning", "evening"],
    voices: ["oracle", "scientist"]
  },
  {
    name: "handleInsights",
    path: "/api/insights",
    description: "Generate longitudinal insights and growth patterns",
    storage: ["D1"],
    logs: true,
    triggers: ["insights", "growth", "progress", "patterns", "trajectory"],
    voices: ["scientist", "oracle"]
  }
];

// Helper to call Worker AI (supports both env.AI and env.AI_GATEWAY)
async function aiCall(env, model, messages) {
  const client = env.AI || env.AI_GATEWAY;
  if (!client) throw new Error("AI binding not found");
  return client.run(model, { messages });
}

// Retrieve recent continuity logs from the database
async function fetchContinuityLogs(env, limit = 5) {
  if (!env.AQUIL_DB) return [];

  try {
    const { results } = await env.AQUIL_DB.prepare(
      "SELECT id, timestamp, kind, detail FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?",
    )
      .bind(limit)
      .all();
    return results.map((r) => ({ ...r, detail: parseValue(r.detail) }));
  } catch {
    try {
      const { results } = await env.AQUIL_DB.prepare(
        "SELECT id, ts as timestamp, type as kind, payload as detail FROM event_log ORDER BY ts DESC LIMIT ?",
      )
        .bind(limit)
        .all();
      return results.map((r) => ({ ...r, detail: parseValue(r.detail) }));
    } catch {
      return [];
    }
  }
}

// Session Init with AI-crafted opening
export async function handleSessionInit(request, env) {
  const sessionId = generateId();
  const continuity = await fetchContinuityLogs(env);

  // AI-generated Mirror opening with enhanced integration
  let mirrorOpening;
  try {
    const prompt = `Weave these continuity events into a grounding Mirror opening: ${JSON.stringify(continuity)}`;
    const aiResp = await aiCall(env, "@cf/meta/llama-2-7b-chat-int8", [
      { role: "user", content: prompt },
    ]);
    mirrorOpening = aiResp.response;
  } catch {
    mirrorOpening = continuity.length
      ? `I recall our journey through: ${continuity.map((e) => e.kind).join(", ")}. How are you today?`
      : "I’m here with you in this moment. What’s alive for you right now?";
  }

  // Log initiation
  await logMetamorphicEvent(env, {
    kind: "session_init",
    detail: { 
      continuity_count: continuity.length,
      opening: mirrorOpening,
      session_id: sessionId,
      voice: "mirror",
      timestamp: getPhiladelphiaTime()
    },
    session_id: sessionId,
    voice: "mirror",
  });

  // Return array of recent session logs as per schema
  return new Response(
    JSON.stringify(continuity),
    { headers: { "Content-Type": "application/json" } },
  );
}

// Discovery Inquiry with AI
export async function handleDiscoveryInquiry(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { context = {}, session_id } = data;
  const userInput = context.input || data.topic || "";
  
  // Check if conversational engine is enabled
  if (env.ENABLE_CONVERSATIONAL_ENGINE === '1' && userInput) {
    try {
      // Import and run the conversational engine
      const { runEngine } = await import('../agent/engine.js');
      const engineResult = await runEngine(env, session_id || generateId(), userInput);
      
      // Generate response using engine output
      const voice = engineResult.voice || selectOptimalVoice(userInput, context);
      
      // Compose response: short reflection + engine questions + optional micro-commitment
      let response = generateReflection(userInput, voice, engineResult.cues);
      
      if (engineResult.questions && engineResult.questions.length > 0) {
        response += "\n\n" + engineResult.questions.join("\n\n");
      }
      
      if (engineResult.micro) {
        response += "\n\n" + engineResult.micro;
      }
      
      await logMetamorphicEvent(env, {
        kind: "discovery_inquiry_with_engine",
        detail: { 
          response,
          engine_voice: engineResult.voice,
          press_level: engineResult.pressLevel,
          cues: engineResult.cues
        },
        session_id,
        voice,
      });
      
      return new Response(
        JSON.stringify({ 
          inquiry: response, 
          voice_used: voice,
          questions: engineResult.questions,
          press_level: engineResult.pressLevel,
          engine_active: true
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (engineError) {
      console.warn('Conversational engine failed, falling back to standard flow:', engineError);
      // Fall through to standard processing
    }
  }
  
  // Standard processing (original logic)
  const voice = selectOptimalVoice(context.input || "", context);
  let question;
  try {
    const prompt = `As Ark’s ${voice} voice, ask a Socratic question about: ${JSON.stringify(context)}`;
    const aiResp = await aiCall(env, "@cf/meta/llama-2-7b-chat-int8", [
      { role: "user", content: prompt },
    ]);
    question = aiResp.response;
  } catch {
    question = "What emerges when you explore this topic?";
  }
  await logMetamorphicEvent(env, {
    kind: "discovery_inquiry",
    detail: { question },
    session_id,
    voice,
  });
  return new Response(
    JSON.stringify({ inquiry: question, voice_used: voice }),
    { headers: { "Content-Type": "application/json" } },
  );
}

// Ritual Suggestion with AI
export async function handleRitualSuggestion(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { context = {}, session_id } = data;
  let ritual;
  try {
    const prompt = `Recommend a ritual for this context: ${JSON.stringify(context)}`;
    const aiResp = await aiCall(env, "@cf/meta/llama-2-7b-chat-int8", [
      { role: "user", content: prompt },
    ]);
    ritual = JSON.parse(aiResp.response);
  } catch {
    ritual = {
      name: "Gentle Pause",
      instructions: ["Take three deep breaths", "Ground in the present moment"],
      purpose: "Reset and refocus",
    };
  }
  await logMetamorphicEvent(env, {
    kind: "ritual_suggestion",
    detail: { ritual },
    session_id,
    voice: "strategist",
  });
  return new Response(JSON.stringify({ suggestion: ritual }), {
    headers: { "Content-Type": "application/json" },
  });
}

// Health Check
export async function handleHealthCheck(request, env) {
  const health = await performHealthChecks(env);
  return new Response(
    JSON.stringify({ ...health, timestamp: getPhiladelphiaTime() }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

// Readiness Check (for deployment gates and canary rollouts)
export async function handleReadinessCheck(request, env) {
  const readiness = await performReadinessChecks(env);
  return new Response(
    JSON.stringify(readiness),
    {
      headers: { "Content-Type": "application/json" },
      status: 200, // Always 200 for fail-open behavior
    },
  );
}

// Retrieve logs with optional filtering
export async function handleRetrieveLogs(request, env) {
  if (!env.AQUIL_DB) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "20", 10),
    200,
  );
  const filters = {
    type: url.searchParams.get("type"),
    who: url.searchParams.get("who"),
    level: url.searchParams.get("level"),
    session_id: url.searchParams.get("session_id"),
    tag: url.searchParams.get("tag"),
  };

  const buildWhere = (map) => {
    const clauses = [];
    const values = [];
    for (const key of ["type", "who", "level", "session_id"]) {
      const val = filters[key];
      if (val) {
        clauses.push(`${map[key]} = ?`);
        values.push(val);
      }
    }
    if (filters.tag) {
      clauses.push(`${map.tag} LIKE ?`);
      values.push(`%${filters.tag}%`);
    }
    return {
      where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
      values,
    };
  };

  const tableExists = async (name) => {
    const row = await env.AQUIL_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    )
      .bind(name)
      .first();
    return !!row;
  };

  try {
    if (await tableExists("metamorphic_logs")) {
      const { where, values } = buildWhere({
        type: "kind",
        who: "voice",
        level: "signal_strength",
        session_id: "session_id",
        tag: "tags",
      });
      const stmt = env.AQUIL_DB.prepare(
        `SELECT id, timestamp, kind, detail FROM metamorphic_logs${where} ORDER BY timestamp DESC LIMIT ?`,
      ).bind(...values, limit);
      const { results } = await stmt.all();
      return new Response(
        JSON.stringify(results.map((r) => ({ ...r, detail: parseValue(r.detail) }))),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    if (await tableExists("event_log")) {
      const { where, values } = buildWhere({
        type: "type",
        who: "who",
        level: "level",
        session_id: "session_id",
        tag: "tags",
      });
      const stmt = env.AQUIL_DB.prepare(
        `SELECT id, ts AS timestamp, type AS kind, payload AS detail FROM event_log${where} ORDER BY ts DESC LIMIT ?`,
      ).bind(...values, limit);
      const { results } = await stmt.all();
      return new Response(
        JSON.stringify(results.map((r) => ({ ...r, detail: parseValue(r.detail) }))),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unable to fetch logs", message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// Logging
export async function handleLog(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const id = await logMetamorphicEvent(env, {
    kind: body.type,
    detail: body.payload,
    session_id: body.session_id,
    voice: body.who,
  });
  return new Response(JSON.stringify({ status: "ok", id }), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Generate a short reflection based on voice and cues
 * @param {string} userInput - User input text
 * @param {string} voice - Selected voice
 * @param {string[]} cues - Detection cues
 * @returns {string} - Reflection text
 */
function generateReflection(userInput, voice, cues = []) {
  const hasAvoidance = cues.includes('hedging') || cues.includes('vague');
  const hasTopicShift = cues.includes('topic_shift');
  const hasOverwhelm = voice === 'mirror' && (userInput.toLowerCase().includes('overwhelm') || userInput.toLowerCase().includes('stuck'));
  
  const reflections = {
    mirror: {
      normal: "I hear you.",
      avoidance: "I notice some uncertainty in what you shared.",
      overwhelm: "It sounds like a lot is happening for you right now.",
      topic_shift: "I sense we've moved to something new."
    },
    oracle: {
      normal: "There's wisdom in what you're exploring.",
      avoidance: "Something deeper wants to be seen here.",
      overwhelm: "The fog often clears when we slow down.",
      topic_shift: "A new thread is weaving itself into our conversation."
    },
    scientist: {
      normal: "Let's examine this more closely.",
      avoidance: "I'd like to understand this more specifically.",
      overwhelm: "Let's break this down into manageable pieces.",
      topic_shift: "You've introduced a new variable."
    },
    strategist: {
      normal: "Let's get clear on next steps.",
      avoidance: "Clarity will help us move forward.",
      overwhelm: "Let's prioritize what needs your attention.",
      topic_shift: "This shifts our focus - let's align on direction."
    }
  };
  
  const voiceReflections = reflections[voice] || reflections.mirror;
  
  if (hasOverwhelm) return voiceReflections.overwhelm;
  if (hasTopicShift) return voiceReflections.topic_shift;
  if (hasAvoidance) return voiceReflections.avoidance;
  return voiceReflections.normal;
}
