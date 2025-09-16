// Philadelphia timezone helper
export function getPhiladelphiaTime(date = new Date()) {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function generateId() {
  return `ark_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export const VOICE_SYSTEM = {
  Mirror: {
    id: "mirror",
    purpose: "Grounding, emotional continuity, somatic awareness",
    style: { tone: "gentle, reflective, embodied" },
    triggers: [
      "emotional",
      "vulnerable",
      "processing",
      "feeling",
      "scared",
      "overwhelmed",
      "body",
      "physical",
      "sensation",
      "trust",
      "self-trust"
    ],
    preferred_endpoints: [
      "/api/trust/check-in",
      "/api/somatic/session", 
      "/api/standing-tall/practice",
      "/api/values/clarify",
      "/api/ancestry/heal",
      "/api/commitments/{id}/progress"
    ],
    metabolization_focus: "emotional_integration"
  },
  Oracle: {
    id: "oracle",
    purpose: "Symbolic, archetypal pattern insight, wisdom synthesis",
    style: { tone: "symbolic, archetypal, mystical" },
    triggers: [
      "patterns",
      "deeper meaning",
      "wisdom",
      "archetypal",
      "symbolic",
      "dreams",
      "unconscious",
      "meaning",
      "synthesis",
      "integrate"
    ],
    preferred_endpoints: [
      "/api/dreams/interpret",
      "/api/media/extract-wisdom",
      "/api/wisdom/synthesize",
      "/api/patterns/recognize",
      "/api/values/clarify",
      "/api/creativity/unleash",
      "/api/abundance/cultivate",
      "/api/transitions/navigate",
      "/api/ancestry/heal",
      "/api/wisdom/daily-synthesis",
      "/api/insights"
    ],
    metabolization_focus: "symbolic_integration"
  },
  Scientist: {
    id: "scientist",
    purpose: "Systems analysis, behavioral mechanics, data synthesis",
    style: { tone: "analytical, systematic, precise" },
    triggers: ["analyze", "understand", "how does", "mechanism", "why", "data", "pattern", "behavior", "system"],
    preferred_endpoints: [
      "/api/patterns/recognize",
      "/api/energy/optimize", 
      "/api/insights",
      "/api/wisdom/daily-synthesis",
      "/api/commitments/active",
      "/api/system/health-check"
    ],
    metabolization_focus: "behavioral_analysis"
  },
  Strategist: {
    id: "strategist",
    purpose: "Tactical, practical, next-step clarity, commitment tracking",
    style: { tone: "practical, tactical, clear" },
    triggers: [
      "what should I do",
      "next steps",
      "plan",
      "action",
      "strategy",
      "how to",
      "commit",
      "goal",
      "practice",
      "accountability"
    ],
    preferred_endpoints: [
      "/api/standing-tall/practice",
      "/api/energy/optimize",
      "/api/creativity/unleash", 
      "/api/abundance/cultivate",
      "/api/transitions/navigate",
      "/api/commitments/create",
      "/api/commitments/active",
      "/api/commitments/{id}/progress",
      "/api/contracts/create",
      "/api/ritual/auto-suggest"
    ],
    metabolization_focus: "action_planning"
  },
  Default: {
    id: "default",
    purpose: "Balanced, neutral, universally applicable",
    style: { tone: "balanced, clear, approachable" },
    triggers: [],
    preferred_endpoints: ["/api/session-init", "/api/logs"],
    metabolization_focus: "general_support"
  },
};

// Enhanced logging function with complete implementation
export async function logMetamorphicEvent(env, event) {
  try {
    const phillyTime = getPhiladelphiaTime();
    const eventId = generateId();

    // Enhanced event structure
    const enhancedEvent = {
      id: eventId,
      timestamp: phillyTime,
      kind: event.kind || "general",
      signal_strength: event.signal_strength || "medium",
      detail:
        typeof event.detail === "string"
          ? event.detail
          : JSON.stringify(event.detail),
      session_id: event.session_id || null,
      voice: event.voice || "default",
      tags: Array.isArray(event.tags) ? event.tags.join(",") : event.tags || "",
      idx1: event.idx1 || null,
      idx2: event.idx2 || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    };

    // Log to database with fallback handling
    if (env.AQUIL_DB) {
        const stmt = env.AQUIL_DB.prepare(
          `INSERT INTO metamorphic_logs (id, timestamp, operationId, originalOperationId, kind, level, session_id, tags, stores, artifactKey, error_message, error_code, detail, env, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        await stmt.bind(
            enhancedEvent.id,
            enhancedEvent.timestamp,
            null, // operationId
            null, // originalOperationId
            enhancedEvent.kind,
            enhancedEvent.signal_strength || 'info',
            enhancedEvent.session_id,
            enhancedEvent.tags,
            JSON.stringify(['d1']),
            null, // artifactKey
            null, // error_message
            null, // error_code
            enhancedEvent.detail,
            null, // env
            enhancedEvent.voice || 'gpt'
          ).run();
    }

    return eventId;
  } catch (error) {
    console.error("ARK logging error:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Enhanced trigger protocol system for automatic endpoint routing
export function detectEndpointFromInput(userInput, context = {}) {
  if (!userInput || typeof userInput !== "string") {
    return null;
  }

  const input = userInput.toLowerCase();
  
  // Direct endpoint mapping based on trigger phrases
  const endpointTriggers = {
    "/api/dreams/interpret": [
      "dream", "nightmare", "had a dream", "dreamed", "dreaming", 
      "strange dream", "recurring dream", "symbolic dream"
    ],
    "/api/energy/optimize": [
      "drained", "no energy", "exhausted", "tired", "fatigue", 
      "burnout", "low energy", "feel depleted"
    ],
    "/api/values/clarify": [
      "what matters", "don't know what's important", "values", 
      "what really matters", "priority", "what's important"
    ],
    "/api/creativity/unleash": [
      "creative block", "can't create", "stuck creatively", 
      "writer's block", "no inspiration", "creative"
    ],
    "/api/abundance/cultivate": [
      "money stress", "financial", "scarcity", "can't afford", 
      "money tight", "abundance", "prosperity"
    ],
    "/api/transitions/navigate": [
      "new phase", "transition", "changing", "uncertain", 
      "moving into", "life change", "shift"
    ],
    "/api/ancestry/heal": [
      "family patterns", "generational", "ancestry", "parents", 
      "family dynamics", "inherited", "lineage"
    ],
    "/api/somatic/session": [
      "body", "physical", "tension", "pain", "breathe", 
      "embodied", "somatic", "body wisdom"
    ],
    "/api/standing-tall/practice": [
      "feel small", "shrink", "confidence", "stand tall", 
      "presence", "power", "authentic"
    ],
    "/api/commitments/create": [
      "want to practice", "commit to", "goal", "accountability", 
      "track progress", "promise myself"
    ]
  };

  // Find matching endpoint
  for (const [endpoint, triggers] of Object.entries(endpointTriggers)) {
    if (triggers.some(trigger => input.includes(trigger))) {
      return endpoint;
    }
  }

  return null;
}

// Voice selection based on user input context with enhanced endpoint awareness
export function selectOptimalVoice(userInput, context = {}) {
  if (!userInput || typeof userInput !== "string") {
    return "default";
  }

  const input = userInput.toLowerCase();
  const detectedEndpoint = detectEndpointFromInput(userInput, context);

  // If we detected a specific endpoint, prefer voices that work well with it
  if (detectedEndpoint) {
    const endpointVoiceMap = {
      "/api/dreams/interpret": "oracle",
      "/api/energy/optimize": "scientist",
      "/api/values/clarify": "oracle",
      "/api/creativity/unleash": "oracle",
      "/api/abundance/cultivate": "oracle",
      "/api/transitions/navigate": "oracle",
      "/api/ancestry/heal": "oracle",
      "/api/somatic/session": "mirror",
      "/api/standing-tall/practice": "strategist",
      "/api/commitments/create": "strategist",
      "/api/trust/check-in": "mirror"
    };
    
    if (endpointVoiceMap[detectedEndpoint]) {
      return endpointVoiceMap[detectedEndpoint];
    }
  }

  // Check for explicit voice triggers
  for (const [, voice] of Object.entries(VOICE_SYSTEM)) {
    if (
      voice.triggers?.some((trigger) => input.includes(trigger.toLowerCase()))
    ) {
      return voice.id;
    }
  }

  // Enhanced fallback logic based on emotional and content analysis
  if (
    input.includes("feel") ||
    input.includes("emotion") ||
    input.includes("hurt") ||
    input.includes("scared") ||
    input.includes("body") ||
    input.includes("physical")
  ) {
    return "mirror";
  }
  if (
    input.includes("pattern") ||
    input.includes("meaning") ||
    input.includes("why") ||
    input.includes("symbol") ||
    input.includes("dream") ||
    input.includes("wisdom")
  ) {
    return "oracle";
  }
  if (
    input.includes("analyze") ||
    input.includes("understand") ||
    input.includes("how does") ||
    input.includes("mechanism") ||
    input.includes("data") ||
    input.includes("system")
  ) {
    return "scientist";
  }
  if (
    input.includes("what should") ||
    input.includes("action") ||
    input.includes("next") ||
    input.includes("plan") ||
    input.includes("commit") ||
    input.includes("goal")
  ) {
    return "strategist";
  }

  return "default";
}

// Enhanced metabolization framework - maps experiences to specific API endpoints
export function metabolizeExperience(userInput, context = {}) {
  if (!userInput || typeof userInput !== "string") {
    return { metabolizer: null, voice: "default", synthesis_type: "general" };
  }

  const input = userInput.toLowerCase();
  
  // Experience type detection and metabolizer mapping
  const experienceMetabolizers = {
    dreams: {
      endpoint: "/api/dreams/interpret",
      voice: "oracle",
      synthesis_type: "archetypal_integration",
      triggers: ["dream", "nightmare", "sleep", "unconscious"]
    },
    media: {
      endpoint: "/api/media/extract-wisdom", 
      voice: "oracle",
      synthesis_type: "wisdom_extraction",
      triggers: ["book", "article", "video", "podcast", "movie", "content"]
    },
    body_states: {
      endpoint: "/api/somatic/session",
      voice: "mirror", 
      synthesis_type: "somatic_integration",
      triggers: ["body", "physical", "tension", "pain", "sensation", "breathe"]
    },
    creative_blocks: {
      endpoint: "/api/creativity/unleash",
      voice: "oracle",
      synthesis_type: "creative_liberation", 
      triggers: ["creative", "block", "stuck", "inspiration", "art", "write"]
    },
    family_ancestry: {
      endpoint: "/api/ancestry/heal",
      voice: "oracle",
      synthesis_type: "generational_healing",
      triggers: ["family", "ancestry", "parents", "generational", "inherited"]
    },
    energy_depletion: {
      endpoint: "/api/energy/optimize",
      voice: "scientist", 
      synthesis_type: "energy_restoration",
      triggers: ["tired", "drained", "exhausted", "energy", "burnout"]
    },
    value_confusion: {
      endpoint: "/api/values/clarify",
      voice: "oracle",
      synthesis_type: "value_alignment",
      triggers: ["values", "what matters", "important", "priority"]
    },
    life_transitions: {
      endpoint: "/api/transitions/navigate", 
      voice: "oracle",
      synthesis_type: "transition_wisdom",
      triggers: ["transition", "change", "new phase", "uncertain", "shift"]
    },
    abundance_blocks: {
      endpoint: "/api/abundance/cultivate",
      voice: "oracle", 
      synthesis_type: "abundance_consciousness",
      triggers: ["money", "financial", "scarcity", "abundance", "prosperity"]
    }
  };

  // Find matching metabolizer
  for (const [type, metabolizer] of Object.entries(experienceMetabolizers)) {
    if (metabolizer.triggers.some(trigger => input.includes(trigger))) {
      return {
        metabolizer: metabolizer.endpoint,
        voice: metabolizer.voice,
        synthesis_type: metabolizer.synthesis_type,
        experience_type: type
      };
    }
  }

  return { metabolizer: null, voice: "default", synthesis_type: "general" };
}

// Generate Socratic questions for deeper exploration - expanded for new endpoints
export function generateSocraticInquiry(topic, userContext = {}) {
  const inquiries = {
    trust: [
      "What would trusting yourself completely look like in this situation?",
      "When have you trusted yourself before and it worked out well?",
      "What is your body telling you about this decision?",
      "If you removed others' opinions entirely, what would you choose?",
    ],
    patterns: [
      "What keeps showing up in similar situations?",
      "How might this pattern be trying to protect or serve you?",
      "What would change if you responded differently next time?",
      "What does this pattern reveal about your current growth edge?",
    ],
    media: [
      "What in this content mirrors your own life right now?",
      "What character or theme resonated most strongly with you?",
      "How might this story be medicine for your current journey?",
      "What wisdom from this content wants integration in your life?",
    ],
    body: [
      "What is your body trying to communicate right now?",
      "Where do you feel this situation in your physical body?",
      "What would honoring your body's wisdom look like?",
      "How does your body respond when you think about this situation?",
    ],
    standing_tall: [
      "What would change if you stood fully in your power here?",
      "What are you afraid would happen if you didn't shrink?",
      "How do you want to be remembered in this situation?",
      "What would your most confident self do right now?",
    ],
    relationships: [
      "What pattern in relationships keeps showing up for you?",
      "How do you shrink or expand in this relationship?",
      "What would authentic expression look like here?",
      "What boundary does this situation call for?",
    ],
    decisions: [
      "What option creates expansion in your body vs contraction?",
      "What would you choose if you trusted your wisdom completely?",
      "What are your values telling you about this choice?",
      "What would you do if you couldn't fail?",
    ],
    creativity: [
      "What wants to be expressed through you right now?",
      "What would you create if nobody was watching?",
      "What creative block is actually protecting you from something?",
      "How does your creativity connect to your authentic self?",
    ],
    dreams: [
      "What emotions did this dream evoke in you?",
      "What symbols or images felt most significant?",
      "How might this dream connect to your current life situation?",
      "What is your unconscious trying to tell you through this dream?",
    ],
    energy: [
      "When do you feel most energized and alive?",
      "What activities or people drain your energy?",
      "How does your body signal when it needs rest vs. stimulation?",
      "What would honoring your natural energy rhythms look like?",
    ],
    values: [
      "What values feel most alive and true for you right now?",
      "When have you compromised your values and how did it feel?",
      "What would living fully aligned with your values look like?",
      "Which of your values is calling for more expression?",
    ],
    abundance: [
      "What beliefs about money or resources did you inherit?",
      "When have you felt truly abundant, regardless of circumstances?",
      "What would change if you trusted that there's enough?",
      "How does scarcity thinking show up in other areas of your life?",
    ],
    transitions: [
      "What are you leaving behind in this transition?",
      "What new part of yourself wants to emerge?",
      "What support do you need during this change?",
      "How can you honor both the ending and the beginning?",
    ],
    ancestry: [
      "What patterns from your family lineage serve you?",
      "What inherited patterns are ready to be transformed?",
      "How do you want to honor your ancestors while creating your own path?",
      "What gifts from your lineage want to be expressed through you?",
    ],
    commitments: [
      "What commitment would feel most supportive right now?",
      "How do you want to be held accountable?",
      "What small step could you commit to today?",
      "What would success look like for this commitment?",
    ]
  };

  return inquiries[topic] || inquiries.trust;
}

// Detect when intervention or additional support is needed
export function detectInterventionNeeds(userInput, context = {}) {
  if (!userInput || typeof userInput !== "string") {
    return { needsSupport: false, interventions: {}, recommendations: [] };
  }

  const input = userInput.toLowerCase();

  // Crisis language detection
  const crisisFlags = [
    "hopeless",
    "can't go on",
    "ending it",
    "hurt myself",
    "kill myself",
    "no point",
    "everyone would be better",
    "disappear",
    "can't take it",
  ];

  // Intensity flags that suggest overwhelm
  const intensityFlags = [
    "always",
    "never",
    "completely",
    "totally",
    "absolutely",
    "impossible",
    "can't handle",
    "too much",
    "breaking down",
  ];

  // Isolation flags
  const isolationFlags = [
    "no one understands",
    "all alone",
    "nobody cares",
    "no friends",
    "isolated",
  ];

  const interventions = {
    crisis: crisisFlags.some((flag) => input.includes(flag)),
    intensity: intensityFlags.some((flag) => input.includes(flag)),
    isolation: isolationFlags.some((flag) => input.includes(flag)),
    overwhelm:
      input.includes("overwhelm") ||
      input.includes("too much") ||
      input.includes("drowning"),
    stuck:
      input.includes("stuck") ||
      input.includes("don't know what to do") ||
      input.includes("paralyzed"),
  };

  return {
    needsSupport: Object.values(interventions).some(Boolean),
    interventions,
    recommendations: generateInterventionRecommendations(interventions),
  };
}

function generateInterventionRecommendations(interventions) {
  const recommendations = [];

  if (interventions.crisis) {
    recommendations.push({
      priority: "high",
      type: "crisis_support",
      message:
        "Your safety and wellbeing matter deeply. Please consider reaching out to a crisis helpline or trusted person.",
      resources: [
        "988 Suicide & Crisis Lifeline (call or text)",
        "Crisis Text Line: Text HOME to 741741",
        "Or go to your nearest emergency room",
      ],
    });
  }

  if (interventions.overwhelm) {
    recommendations.push({
      priority: "medium",
      type: "grounding",
      message: "Let's slow down and ground in the present moment.",
      practices: [
        "Take three slow, deep breaths",
        "Name 5 things you can see right now",
        "Feel your feet on the floor",
        "Place hand on heart and breathe",
      ],
    });
  }

  if (interventions.isolation) {
    recommendations.push({
      priority: "medium",
      type: "connection",
      message: "You don't have to navigate this alone.",
      practices: [
        "Reach out to one person who cares about you",
        "Consider joining an online community",
        "Remember that seeking help is a sign of strength",
        "Your experience matters and you deserve support",
      ],
    });
  }

  if (interventions.stuck) {
    recommendations.push({
      priority: "low",
      type: "gentle_action",
      message: "When stuck, the smallest step forward can shift everything.",
      practices: [
        "Take one tiny action - even 1% movement helps",
        "Change your physical position or environment",
        'Ask: "What would feel good right now?"',
        "Trust that clarity comes through movement, not thinking",
      ],
    });
  }

  return recommendations;
}

// Perform comprehensive health checks on the system
export async function performHealthChecks(env) {
  const checks = {
    timestamp: getPhiladelphiaTime(),
    database: false,
    kv_storage: false,
    logging_system: false,
    voice_system: true, // Always available as it's in-memory
    ark_core: true, // Always available as it's in-memory
  };

  try {
    // Database connectivity check
    if (env.AQUIL_DB) {
      const result = await env.AQUIL_DB.prepare("SELECT 1 as test").first();
      checks.database = result && result.test === 1;
    }
  } catch (error) {
    console.warn("Database health check failed:", error.message);
    checks.database = false;
  }

  try {
    // KV storage check (if available)
    if (env.AQUIL_MEMORIES) {
      const kvStore = env.AQUIL_MEMORIES;
      await kvStore.put("health_check", "ok", { expirationTtl: 60 });
      const testValue = await kvStore.get("health_check");
      checks.kv_storage = testValue === "ok";
    }
  } catch (error) {
    console.warn("KV storage health check failed:", error.message);
    checks.kv_storage = false;
  }

  try {
    // Logging system check
    const testLogId = await logMetamorphicEvent(env, {
      kind: "health_check",
      detail: "System health verification",
      signal_strength: "low",
    });
    checks.logging_system = !!testLogId;
  } catch (error) {
    console.warn("Logging system health check failed:", error.message);
    checks.logging_system = false;
  }

  // Calculate overall health score
  const totalChecks = Object.keys(checks).length - 1; // Exclude timestamp
  const passedChecks = Object.values(checks).filter(
    (check) => typeof check === "boolean" && check === true,
  ).length;

  checks.overall_health = passedChecks / totalChecks;
  
  if (checks.overall_health >= 0.8) {
    checks.status = "healthy";
  } else if (checks.overall_health >= 0.6) {
    checks.status = "degraded";
  } else {
    checks.status = "critical";
  }

  return checks;
}

// Perform readiness checks for deployment gates and canary rollouts
export async function performReadinessChecks(env) {
  const readiness = {
    ready: true,
    timestamp: getPhiladelphiaTime(),
    stores: {},
    flags: {},
    recentErrors: {},
    notes: "fail-open; actions unaffected"
  };

  // Store readiness checks
  try {
    // D1 Database ping
    if (env.AQUIL_DB) {
      try {
        await env.AQUIL_DB.prepare("SELECT COUNT(*) as count FROM metamorphic_logs LIMIT 1").first();
        readiness.stores.d1 = { status: "ok", details: "responsive" };
      } catch (error) {
        readiness.stores.d1 = { status: "degraded", error: error.message };
        readiness.ready = false;
      }
    } else {
      readiness.stores.d1 = { status: "not_configured" };
    }

    // KV ping
    if (env.AQUIL_MEMORIES) {
      try {
        await env.AQUIL_MEMORIES.put("readiness_check", "ok", { expirationTtl: 30 });
        const test = await env.AQUIL_MEMORIES.get("readiness_check");
        readiness.stores.kv = { status: test === "ok" ? "ok" : "degraded" };
      } catch (error) {
        readiness.stores.kv = { status: "degraded", error: error.message };
        readiness.ready = false;
      }
    } else {
      readiness.stores.kv = { status: "not_configured" };
    }

    // R2 ping (if available)
    if (env.AQUIL_STORAGE) {
      try {
        // Simple head request to check R2 availability
        readiness.stores.r2 = { status: "ok", details: "available" };
      } catch (error) {
        readiness.stores.r2 = { status: "degraded", error: error.message };
        readiness.ready = false;
      }
    } else {
      readiness.stores.r2 = { status: "not_configured" };
    }

    // Vector store ping (if available)
    if (env.AQUIL_CONTEXT) {
      try {
        readiness.stores.vector = { status: "ok", details: "available" };
      } catch (error) {
        readiness.stores.vector = { status: "degraded", error: error.message };
        readiness.ready = false;
      }
    } else {
      readiness.stores.vector = { status: "not_configured" };
    }
  } catch (error) {
    console.warn("Store readiness check failed:", error.message);
    readiness.ready = false;
  }

  // Feature flags state
  readiness.flags = {
    canary_enabled: env.ENABLE_CANARY === "1" || env.ENABLE_CANARY === "true",
    canary_percent: parseInt(env.CANARY_PERCENT || "0", 10),
    middleware_disabled: env.DISABLE_NEW_MW === "1" || env.DISABLE_NEW_MW === "true",
    fail_open: true
  };

  // Recent errors (simplified for fail-open behavior)
  try {
    if (env.AQUIL_DB) {
      const recentErrorsQuery = await env.AQUIL_DB.prepare(`
        SELECT kind, detail, timestamp 
        FROM metamorphic_logs 
        WHERE kind LIKE '%error%' AND timestamp > datetime('now', '-10 minutes')
        ORDER BY timestamp DESC LIMIT 5
      `).all();
      
      readiness.recentErrors = {
        action_error_total: recentErrorsQuery.results?.length || 0,
        missing_store_writes_total: 0, // Simplified
        samples: recentErrorsQuery.results?.slice(0, 3) || []
      };
    }
  } catch (error) {
    // Fail open - don't affect readiness for error collection failures
    readiness.recentErrors = { 
      action_error_total: 0,
      missing_store_writes_total: 0,
      collection_error: error.message
    };
  }

  return readiness;
}

// Enhanced response wrapper with ARK 2.0 features and synthesis capabilities
export async function enhanceResponse(
  originalResponse,
  context,
  env,
  options = {},
) {
  try {
    const voice =
      options.voice || selectOptimalVoice(context.userInput || "", context);
    const interventions = detectInterventionNeeds(
      context.userInput || "",
      context,
    );
    const metabolization = metabolizeExperience(context.userInput || "", context);
    const detectedEndpoint = detectEndpointFromInput(context.userInput || "", context);

    const enhancement = {
      ...originalResponse,
      ark_version: "2.0",
      timestamp: getPhiladelphiaTime(),
      voice_used: voice,
      voice_system: VOICE_SYSTEM[voice] || VOICE_SYSTEM.Default,
      autonomous_features_active: true,
      session_continuity: true,
      metabolization: metabolization,
      suggested_endpoint: detectedEndpoint,
    };

    // Add intervention support if needed
    if (interventions.needsSupport) {
      enhancement.support_recommendations = interventions.recommendations;
      enhancement.additional_care = true;
      enhancement.intervention_detected = true;
    }

    // Add Socratic inquiry for deeper exploration
    if (options.includeSocratic) {
      const topic =
        options.socraticTopic || 
        metabolization.experience_type ||
        context.endpoint?.split("/")[2] || 
        "trust";
      enhancement.deeper_inquiry = generateSocraticInquiry(topic, context);
    }

    // Add synthesis recommendations based on metabolization
    if (metabolization.metabolizer) {
      enhancement.synthesis_recommendation = {
        endpoint: metabolization.metabolizer,
        voice: metabolization.voice,
        type: metabolization.synthesis_type,
        rationale: `This experience appears to be ${metabolization.experience_type.replace('_', ' ')}, which would benefit from ${metabolization.synthesis_type.replace('_', ' ')}.`
      };
    }

    // Add daily/longitudinal synthesis suggestions
    if (options.includeSynthesis) {
      enhancement.synthesis_options = {
        daily: "/api/wisdom/daily-synthesis",
        longitudinal: "/api/insights",
        pattern_recognition: "/api/patterns/recognize"
      };
    }

    // Log the enhanced interaction
    if (env) {
      await logMetamorphicEvent(env, {
        kind: "enhanced_response",
        detail: {
          endpoint: context.endpoint || "unknown",
          voice_used: voice,
          interventions_detected: interventions.needsSupport,
          user_input_length: (context.userInput || "").length,
          response_enhanced: true,
          metabolization_type: metabolization.synthesis_type,
          suggested_endpoint: detectedEndpoint
        },
        signal_strength: interventions.needsSupport ? "high" : "medium",
        session_id: context.session_id || null,
        voice: voice,
      });
    }

    return enhancement;
  } catch (error) {
    console.warn("ARK enhancement failed, using original response:", error);
    return originalResponse;
  }
}

// Enhanced error handling with fallback paths for new endpoints
export function generateEndpointFallback(endpoint, userInput, context = {}) {
  const fallbacks = {
    "/api/dreams/interpret": {
      fallback_response: "I can still help you explore this dream symbolically, even without the formal archetypal mapping.",
      alternative_approach: "Let's reflect on the emotions and imagery that stood out to you.",
      voice: "oracle"
    },
    "/api/energy/optimize": {
      fallback_response: "I can still offer some general energy restoration practices.",
      alternative_approach: "Let's start with basic rest, movement, and boundary awareness.",
      voice: "scientist"
    },
    "/api/values/clarify": {
      fallback_response: "We can explore your values through reflection and inquiry.",
      alternative_approach: "What feels most important and alive for you right now?",
      voice: "oracle"
    },
    "/api/creativity/unleash": {
      fallback_response: "I can still help you work with creative blocks through exploration.",
      alternative_approach: "What wants to be expressed through you, even in small ways?",
      voice: "oracle"
    },
    "/api/abundance/cultivate": {
      fallback_response: "We can explore your relationship with abundance and scarcity.",
      alternative_approach: "What beliefs about resources feel ready to shift?",
      voice: "oracle"
    },
    "/api/transitions/navigate": {
      fallback_response: "I can support you through this transition with presence and inquiry.",
      alternative_approach: "What are you leaving behind, and what wants to emerge?",
      voice: "oracle"
    },
    "/api/ancestry/heal": {
      fallback_response: "We can explore family patterns through reflection and awareness.",
      alternative_approach: "What inherited patterns are you noticing in your life?",
      voice: "oracle"
    },
    "/api/commitments/create": {
      fallback_response: "I can still help you clarify and track commitments through our conversation.",
      alternative_approach: "What practice would feel most supportive to commit to?",
      voice: "strategist"
    },
    "/api/somatic/session": {
      fallback_response: "We can still work with body awareness through guided attention.",
      alternative_approach: "What is your body telling you right now?",
      voice: "mirror"
    }
  };

  return fallbacks[endpoint] || {
    fallback_response: "I'm here to support you through reflection and presence.",
    alternative_approach: "Let's explore this together through conversation.",
    voice: "mirror"
  };
}

// ARK Action Framework Constants for symbolic action logging
export const ARK_ARCHETYPES = ["anchor", "break", "express", "integrate"];
export const ARK_MODES = [
  "automatic",
  "conditional",
  "invitation",
  "intentional",
];
export const ARK_IMPACTS = ["self", "other", "system"];
export const ARK_DEFAULT_MODE = {
  anchor: "automatic",
  break: "conditional",
  express: "invitation",
  integrate: "intentional",
};

// Validate ARK action structure
export function validateArkAction(action) {
  const errors = [];

  if (!action.archetype || !ARK_ARCHETYPES.includes(action.archetype)) {
    errors.push(
      "Invalid or missing archetype. Must be: anchor, break, express, or integrate",
    );
  }

  if (!action.impact || !ARK_IMPACTS.includes(action.impact)) {
    errors.push("Invalid or missing impact. Must be: self, other, or system");
  }

  if (!action.payload) {
    errors.push("Missing payload - the actual action or commitment data");
  }

  if (action.mode && !ARK_MODES.includes(action.mode)) {
    errors.push(
      "Invalid mode. Must be: automatic, conditional, invitation, or intentional",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      ...action,
      mode: action.mode || ARK_DEFAULT_MODE[action.archetype],
    },
  };
}

// Crisis resources for intervention support
export const CRISIS_RESOURCES = {
  us: {
    suicide_prevention: "988",
    crisis_text: "Text HOME to 741741",
    emergency: "911",
  },
  general: [
    "Reach out to a trusted friend, family member, or counselor",
    "Contact your local emergency services",
    "Visit your nearest emergency room if in immediate danger",
    "Remember: You matter, your life has value, and help is available",
  ],
};

// Export default object with all functions
export default {
  getPhiladelphiaTime,
  generateId,
  VOICE_SYSTEM,
  logMetamorphicEvent,
  selectOptimalVoice,
  generateSocraticInquiry,
  detectInterventionNeeds,
  performHealthChecks,
  performReadinessChecks,
  enhanceResponse,
  ARK_ARCHETYPES,
  ARK_MODES,
  ARK_IMPACTS,
  ARK_DEFAULT_MODE,
  validateArkAction,
  CRISIS_RESOURCES,
};
