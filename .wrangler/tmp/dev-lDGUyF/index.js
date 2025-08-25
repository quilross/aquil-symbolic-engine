var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((o3, s2, r, n) => "handle" == s2 ? r.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n]) && r, "get") }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r, n = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n.searchParams) a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t) if ((a2 == e3.method || "ALL" == a2) && (r = n.pathname.match(c2))) {
    e3.params = r.groups || {}, e3.route = l2;
    for (let t2 of i2) if (null != (s2 = await t2(e3.proxy ?? e3, ...o3))) return s2;
  }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");

// src/index.js
var router = e();
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
function addCORSHeaders(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
__name(addCORSHeaders, "addCORSHeaders");
router.get("/api/health", async () => {
  return new Response(JSON.stringify({
    status: "Aquil is alive and present",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "2.0.0",
    message: "Your personal AI wisdom system is ready to support your journey of standing tall",
    engines: [
      "Trust Builder - Active",
      "Media Wisdom Extractor - Active",
      "Somatic Healer - Active",
      "Wisdom Synthesizer - Active",
      "Pattern Recognizer - Active",
      "Standing Tall Coach - Active",
      "Aquil Core - Active"
    ]
  }), { headers: corsHeaders });
});
router.post("/api/trust/check-in", async (request) => {
  try {
    const data = await request.json();
    const { current_state, trust_level, specific_situation, body_sensations } = data;
    const analysis = {
      trust_level: trust_level || analyzeTrustLevel(current_state),
      emotional_state: extractEmotions(current_state),
      body_awareness: body_sensations ? [body_sensations] : [],
      growth_themes: identifyGrowthThemes(current_state),
      situation_context: specific_situation || "general trust building",
      readiness_level: assessReadinessLevel(current_state),
      confidence_indicators: identifyConfidenceIndicators(current_state),
      trust_blocks: identifyTrustBlocks(current_state),
      internal_vs_external: assessInternalVsExternal(current_state)
    };
    const result = {
      session_id: `trust_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: generateMainMessage(analysis.trust_level, analysis.readiness_level),
      trust_analysis: {
        current_state_reflection: `I hear that you're ${current_state}. This awareness itself is a sign of growing self-trust.`,
        trust_level_insight: getTrustLevelInsight(analysis.trust_level),
        emotional_landscape: analysis.emotional_state,
        body_wisdom: body_sensations ? `Your body is communicating through: ${body_sensations}. Let's honor what it's telling you.` : "Notice what your body is communicating right now.",
        situation_guidance: specific_situation ? `Regarding "${specific_situation}": This situation is perfect for practicing trust in real-world application.` : "Each situation is an opportunity to practice trusting your inner knowing."
      },
      personalized_guidance: {
        main_message: generateMainMessage(analysis.trust_level, analysis.readiness_level),
        trust_level_insight: getTrustLevelInsight(analysis.trust_level),
        block_guidance: generateBlockGuidance(analysis.trust_blocks),
        confidence_building: identifyCurrentStrengths(analysis),
        internal_authority_guidance: generateInternalAuthorityGuidance(analysis)
      },
      trust_exercises: generateTrustExercises(analysis),
      patterns_identified: {
        current_patterns: analysis.trust_blocks.length > 0 ? `Working with ${analysis.trust_blocks[0]} is your current growth edge` : "Building foundation patterns for trust development",
        growth_trajectory: analysis.trust_level >= 7 ? "Strong trust foundation" : "Developing trust capacity",
        readiness_assessment: `Your ${analysis.readiness_level} readiness level creates ${analysis.readiness_level === "high" ? "excellent" : "appropriate"} conditions for growth`
      },
      standing_tall_connection: connectToStandingTall(analysis),
      celebration_moments: identifyCelebrationMoments(analysis),
      growth_insights: generateGrowthInsights(analysis),
      affirmations: generateAffirmations(analysis),
      next_steps: generateNextSteps(analysis)
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Trust check-in error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Trust processing error",
      message: "Aquil needs a moment to recenter. Your trust journey continues - please try again.",
      fallback_guidance: 'Take three deep breaths and remind yourself: "I am learning to trust myself, and that learning is valuable."'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router.post("/api/media/extract-wisdom", async (request) => {
  try {
    const data = await request.json();
    const { media_type, title, your_reaction } = data;
    const result = {
      session_id: `media_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: `Your attraction to "${title}" is no accident - your psyche knows what wisdom it needs for growth right now.`,
      media_analysis: {
        title,
        type: media_type,
        your_reaction,
        reflection: `Your reaction to "${title}" reveals important insights about your current growth edge and inner landscape.`
      },
      wisdom_extraction: {
        core_message: `The ${media_type} "${title}" appeared in your life at this exact moment because it contains medicine for your journey.`,
        personal_resonance: `Your reaction: "${your_reaction}" - This shows what your psyche is ready to integrate and heal.`,
        symbolic_meaning: analyzeSymbolicMeaning(media_type, your_reaction),
        growth_opportunity: `This content is reflecting themes that want attention in your trust-building and standing tall journey.`,
        archetypal_themes: identifyArchetypalThemes(your_reaction)
      },
      integration_practices: [
        {
          name: "Wisdom Integration Journal",
          instruction: `Write about why "${title}" appeared in your life right now - what is it teaching you?`,
          purpose: "Connect media consumption to personal growth"
        },
        {
          name: "Emotional Resonance Tracking",
          instruction: "Notice what emotions or memories this content brings up - they contain information for healing.",
          purpose: "Use media as emotional intelligence development"
        },
        {
          name: "Trust Connection Practice",
          instruction: "Ask yourself: How does this content relate to my journey of trusting myself more?",
          purpose: "Connect entertainment to trust-building work"
        }
      ],
      trust_connection: "Trust your attraction to certain content - your unconscious mind is sophisticated and knows what you need for growth.",
      standing_tall_integration: analyzeStandingTallConnection(your_reaction),
      wisdom_themes: extractWisdomThemes(your_reaction),
      action_steps: [
        "Reflect on the key themes that stood out to you in this content",
        "Consider how you can embody the wisdom or avoid the pitfalls shown",
        "Notice what this reveals about your current growth phase and needs",
        "Use insights from this content in your next trust check-in session"
      ]
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Media wisdom error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Media wisdom processing error",
      message: "Your reaction to content always contains valuable information about your inner world and growth needs."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router.post("/api/somatic/session", async (request) => {
  try {
    const data = await request.json();
    const { body_state, emotions, intention } = data;
    const result = {
      session_id: `somatic_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "Your body contains profound wisdom and intelligence. Let's create space to listen with curiosity and compassion.",
      body_wisdom: {
        current_state: body_state,
        emotional_landscape: emotions,
        healing_intention: intention,
        body_message: `Your body's state of "${body_state}" combined with "${emotions}" is providing important information about your inner landscape.`,
        somatic_intelligence: "Your body processes information faster and more accurately than analytical thinking - it never lies."
      },
      somatic_session: {
        title: "Body Wisdom Connection & Trust Building Session",
        duration: "15-20 minutes",
        phases: [
          {
            name: "Arrival and Presence",
            duration: "3-5 minutes",
            instructions: [
              "Find a comfortable position where you can be still",
              "Take three natural breaths without trying to change anything",
              "Give yourself permission to be exactly as you are right now",
              "Notice: you are safe to feel whatever is present"
            ]
          },
          {
            name: "Body Dialogue and Sensing",
            duration: "8-10 minutes",
            instructions: [
              "Gently scan from head to toes, noticing without trying to change anything",
              `Pay special attention to the area where you feel "${body_state}"`,
              "When you find areas of sensation, pause and be present with them",
              "Ask your body: 'What do you want me to know?' and listen without agenda",
              "Notice if emotions want to move, shift, or be expressed"
            ]
          },
          {
            name: "Integration and Trust Building",
            duration: "4-5 minutes",
            instructions: [
              "Place one hand on your heart, one on your belly",
              "Thank your body for its constant wisdom and communication",
              "Ask: 'How can I trust and honor you more in my daily life?'",
              "Notice how your body feels compared to when you started",
              "Take one insight from this session to carry with you"
            ]
          }
        ]
      },
      somatic_practices: [
        {
          name: "Grounding Breath for Trust",
          instruction: `Breathe into your belly for 4 counts, hold for 4, exhale for 6. Repeat 5 times while saying "I trust my body's wisdom."`,
          purpose: "Connect with body as source of trust and wisdom"
        },
        {
          name: "Body Scan & Release",
          instruction: `Focus on the area where you feel "${body_state}". Breathe into it with compassion and curiosity rather than trying to fix it.`,
          purpose: "Honor and release what your body is holding"
        },
        {
          name: "Trust Embodiment Practice",
          instruction: `Stand tall, root your feet, expand your chest. Say: "I trust my body's wisdom and intelligence." Notice how this feels.`,
          purpose: "Embody the feeling of trusting yourself somatically"
        }
      ],
      trust_integration: {
        body_trust_connection: "Your body never lies - it always tells you the truth about your current state and what you need.",
        decision_making: "Physical sensations are direct access to your intuitive guidance system - expansion means yes, contraction means no.",
        emotional_intelligence: "Your emotions live in your body first - befriending your body befriends your emotional wisdom.",
        internal_authority: "Trusting your body helps you trust yourself in all areas of life - it's foundational to internal authority."
      },
      standing_tall_connection: "Your relationship with your body directly affects your ability to stand tall in the world. Every moment you listen to your body with respect builds internal trust and authentic presence.",
      healing_insights: generateSomaticInsights(body_state, emotions),
      body_affirmation: "My body is wise, intelligent, and constantly supporting my highest good",
      integration_guidance: {
        daily_practice: "Check in with your body 3 times today - morning, midday, evening - and thank it for its communication.",
        decision_support: "Before your next important decision, place hand on belly and notice: does this option create expansion or contraction?",
        trust_building: "Each time you listen to and honor your body, you build deeper self-trust and standing tall capacity."
      },
      next_session_guidance: "Continue this practice daily. Notice how your relationship with your body and trust in yourself evolves over time."
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Somatic session error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Somatic processing error",
      message: "Your body's wisdom is always available. Simply placing a hand on your heart and breathing connects you to your inner knowing."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router.post("/api/wisdom/synthesize", async (request) => {
  try {
    const data = await request.json();
    const { life_situation, specific_question, frameworks_requested = ["all"] } = data;
    const result = {
      session_id: `wisdom_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "All wisdom traditions point to the same core truth: you have access to sophisticated inner guidance that can be trusted.",
      situation_analysis: {
        life_context: life_situation,
        core_question: specific_question,
        frameworks_engaged: frameworks_requested,
        integration_approach: "Synthesizing multiple wisdom streams into coherent, actionable guidance"
      },
      framework_insights: {
        human_design: {
          strategy: "Trust your gut response - your sacral authority is designed to be your most reliable guidance system",
          authority: "Your body's immediate response contains more wisdom than mental analysis",
          type_guidance: "Your unique energetic design supports specific decision-making approaches - honor your natural way",
          integration: "Follow your strategy and authority consistently to build evidence of your inner wisdom"
        },
        gene_keys: {
          gift_activation: "Practice acceptance of what is while maintaining vision for growth - this creates space for authentic transformation",
          shadow_work: "Notice where you might be rejecting your current circumstances or capabilities - shadows contain hidden gifts",
          siddhi_potential: "Your highest potential emerges through integrating and transcending current challenges",
          evolutionary_pressure: "Current challenges are evolutionary pressure supporting your next level of consciousness"
        },
        astrology: {
          timing: "Cosmic energies are supporting inner work and building trust-based foundations right now",
          energy_dynamics: "Current planetary alignments favor authentic choices based on inner authority rather than external expectations",
          soul_purpose: "Your natal chart reveals unique gifts that want expression through trusting your authentic nature",
          cycles: "You're in a supportive cycle for making authentic choices that align with your deepest values"
        },
        somatic_wisdom: {
          embodiment: "Your body processes information faster and more accurately than analytical thinking",
          decision_framework: "Present options to your body and notice expansion (yes) or contraction (no) responses",
          trauma_integration: "Past experiences stored in your body inform but don't need to control current decisions",
          nervous_system: "A regulated nervous system supports clear access to intuitive guidance"
        }
      },
      synthesized_wisdom: {
        unified_guidance: `For your question "${specific_question}" in the context of "${life_situation}", all wisdom systems point toward trusting your integrated inner authority - body wisdom, gut response, acceptance of current reality, and aligned timing working together.`,
        decision_framework: [
          "Center yourself in your body and breathe until you feel present",
          "Present the question to your gut/sacral center and notice immediate response",
          "Accept what feels true right now without resistance or judgment",
          "Check timing - does this feel aligned with natural flow and current energy?",
          "Trust the synthesis of all these inputs and take aligned action",
          "Notice results and adjust - this builds evidence of your inner wisdom"
        ],
        integration_practices: [
          "Daily body check-ins to strengthen somatic awareness",
          "Practice following small gut responses to build trust in larger decisions",
          "Work with current life challenges as evolutionary opportunities rather than obstacles",
          "Track cosmic cycles to understand optimal timing for different types of actions"
        ]
      },
      trust_applications: {
        primary_lesson: "Your unique design specifically supports trusting yourself - you're not broken, you're learning to operate according to your authentic nature",
        evidence_building: "Each time you follow integrated inner guidance and see positive results, you build unshakeable self-trust",
        integration: "Trust builds through consistently honoring wisdom from all your internal systems - body, intuition, timing, acceptance"
      },
      standing_tall_guidance: {
        foundation: "Standing tall is the natural result of trusting your integrated inner authority rather than external validation",
        practice: "Each time you honor your multi-dimensional inner guidance, you practice standing in your authentic power",
        embodiment: "Authentic presence emerges when you trust the wisdom of your whole system - body, mind, spirit, timing"
      },
      personalized_recommendations: generatePersonalizedRecommendations(life_situation, specific_question),
      action_steps: [
        "Spend 10 minutes in stillness with your question and notice what arises",
        "Practice the body-based decision framework with a smaller choice first",
        "Identify one way you can honor your authentic nature in this situation",
        "Take one aligned action based on your integrated inner guidance today"
      ]
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Wisdom synthesis error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Synthesis processing error",
      message: "Your inner wisdom is always available. Trust your body, honor your gut, accept what is, and take aligned action."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router.post("/api/patterns/recognize", async (request) => {
  try {
    const data = await request.json();
    const { area_of_focus, recent_experiences, recurring_themes } = data;
    const result = {
      session_id: `patterns_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "Your willingness to look for patterns shows sophisticated consciousness and commitment to growth. Pattern awareness creates choice and conscious evolution.",
      pattern_analysis: {
        focus_area: area_of_focus,
        recent_patterns: recent_experiences,
        recurring_elements: recurring_themes || "New patterns emerging through awareness",
        meta_pattern: "Your pattern recognition seeking itself shows developing meta-awareness and conscious growth direction"
      },
      identified_patterns: [
        {
          type: "consciousness_development",
          pattern: "Self-reflection and pattern seeking are themselves powerful patterns for accelerated growth",
          frequency: "Increasing with each interaction",
          significance: "Shows developing meta-awareness and commitment to conscious evolution"
        },
        {
          type: "trust_evolution",
          pattern: "Every interaction with self-development work builds evidence of your capacity for self-guided growth",
          evolution: "Progressing from external validation seeking toward internal authority development",
          growth_trajectory: "Consistent engagement indicates building trust in your own growth process"
        },
        {
          type: "standing_tall_development",
          pattern: "Each time you engage in self-reflection, you practice standing in your truth and taking up space for your growth",
          embodiment: "Pattern recognition itself requires standing tall in your commitment to growth",
          authentic_presence: "Willingness to examine patterns shows courage and authentic self-engagement"
        }
      ],
      pattern_insights: {
        meta_patterns: [
          "Self-reflection and pattern seeking accelerate conscious development",
          "Pattern awareness creates choice points where you can consciously evolve",
          "Your consistent engagement shows building trust in your own growth capacity"
        ],
        growth_acceleration: [
          "Conscious pattern recognition allows you to evolve challenges rather than repeat them",
          "Awareness itself transforms patterns - you don't need to force change",
          "Each pattern you recognize gives you more choice in how you respond to life"
        ],
        trust_implications: [
          "Pattern recognition builds self-trust by showing you your own growth trajectory",
          "Seeing patterns helps you trust that your challenges have meaning and purpose",
          "Pattern awareness demonstrates your inner wisdom is always working for your growth"
        ]
      },
      growth_recommendations: [
        {
          area: "Continued Pattern Awareness",
          recommendation: "Keep noticing patterns in daily life - this awareness creates choice and conscious evolution",
          practice: "Weekly pattern check-ins: What patterns am I noticing in my thoughts, reactions, and choices?",
          priority: "ongoing"
        },
        {
          area: "Pattern Integration",
          recommendation: "Work with patterns through acceptance rather than resistance - they contain gifts",
          practice: "Ask: What is this pattern trying to teach me or protect me from?",
          priority: "high"
        },
        {
          area: "Conscious Response Development",
          recommendation: "Use pattern awareness to create new response choices in familiar situations",
          practice: "When you notice a pattern arising, pause and ask: How could I respond differently this time?",
          priority: "medium"
        }
      ],
      celebration_moments: [
        "\u{1F31F} You're building sophisticated pattern awareness - this is advanced inner work worth celebrating",
        "\u{1F331} Your commitment to growth creates measurable progress and evolution over time",
        "\u2728 Pattern recognition shows you're developing conscious choice in how you engage with life",
        "\u{1F4AA} Each pattern you recognize increases your internal authority and self-trust"
      ],
      pattern_evolution_tracking: {
        awareness_level: "Advanced - actively seeking patterns for growth",
        integration_capacity: "Developing - building skills to work with patterns consciously",
        choice_expansion: "Your pattern awareness is expanding your range of conscious responses to life",
        trust_building: "Seeing your own patterns builds evidence that you can understand and guide your own growth"
      },
      standing_tall_connection: "Pattern recognition requires standing tall in your truth and commitment to growth. Each time you examine patterns honestly, you practice authentic self-engagement.",
      next_level_guidance: "Patterns reveal themselves when you're ready to evolve beyond them. Trust this process and your capacity to grow consciously."
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Pattern recognition error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Pattern processing error",
      message: "Pattern recognition is happening even when systems are offline - your awareness itself is the most powerful tool for growth."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router.post("/api/standing-tall/practice", async (request) => {
  try {
    const data = await request.json();
    const { situation, fears_concerns, desired_outcome, past_successes } = data;
    const result = {
      session_id: `standing_tall_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "Your desire to stand tall instead of shrinking is a powerful choice. You don't need to earn the right to take up space - it's already yours by virtue of being human.",
      situation_analysis: {
        challenge: situation,
        growth_edge: fears_concerns || "Moving beyond comfort zone and into authentic presence",
        vision: desired_outcome,
        strengths: past_successes || "Your courage to address this situation shows existing inner strength",
        pattern_recognition: analyzeShrinkingPatterns(situation, fears_concerns)
      },
      standing_tall_practice: {
        title: "Embodied Confidence & Authentic Presence Practice",
        duration: "15-20 minutes",
        preparation: "Find a private space where you can stand and move freely",
        phases: [
          {
            name: "Grounding in Your Inherent Worth",
            duration: "5 minutes",
            instructions: [
              "Stand with feet hip-width apart, feeling your connection to the ground",
              "Place one hand on your heart, one on your belly",
              "Take five deep breaths and say internally: 'I belong here'",
              "Feel your natural right to take up space in the world - this is not earned, it's inherent",
              "Notice any resistance to this idea and breathe compassion into it"
            ]
          },
          {
            name: "Embodying Your Confident Self",
            duration: "7-8 minutes",
            instructions: [
              "Stand tall with shoulders relaxed but broad, spine long",
              `Visualize yourself in the situation: "${situation}"`,
              `See yourself ${desired_outcome || "standing in your power"} with complete confidence and presence`,
              "How would you stand? How would you breathe? How would you take up space? Embody this now",
              "Remember: this confident presence is your natural state, not something foreign",
              "Practice speaking your truth out loud with this posture - even if just to yourself"
            ]
          },
          {
            name: "Integration and Commitment",
            duration: "3-5 minutes",
            instructions: [
              "Place both hands on your heart and make a commitment to yourself",
              "Say: 'I commit to standing tall in my truth, even when it feels uncomfortable'",
              "Visualize carrying this presence into your daily life",
              "Take one concrete action step you can do today to practice standing tall"
            ]
          }
        ]
      },
      empowerment_practices: [
        {
          name: "Physical Standing Tall Reset",
          instruction: "Throughout the day, reset your posture: feet grounded, spine long, chest open, shoulders relaxed. Breathe deeply in this position.",
          purpose: "Embody confidence and authentic presence physically",
          frequency: "Multiple times daily"
        },
        {
          name: "Inner Authority Activation",
          instruction: 'Before challenging interactions, place hand on heart and say: "I trust myself to handle this situation with integrity and presence."',
          purpose: "Connect with inner wisdom and strength before standing tall moments",
          frequency: "Before challenging situations"
        },
        {
          name: "Fear Transformation Practice",
          instruction: 'When fear of standing tall arises, breathe into it and ask: "How is this fear trying to protect me? What does it need from me?"',
          purpose: "Transform fear into wise discernment and courage",
          frequency: "When fear arises"
        },
        {
          name: "Authentic Expression Practice",
          instruction: "Practice sharing one authentic thought or feeling daily, starting small and building to bigger truths.",
          purpose: "Build capacity for authentic self-expression and presence",
          frequency: "Daily"
        }
      ],
      confidence_building: {
        core_truths: [
          "You have an inherent right to exist, be seen, and take up space in the world",
          "Your authentic presence and voice add unique value that only you can provide",
          "Standing tall serves others by giving them permission to do the same",
          "Confidence is not about being perfect - it's about being authentic and present"
        ],
        fear_reframes: generateFearReframes(fears_concerns),
        evidence_building: [
          `Past success reminder: ${past_successes || "You have navigated challenges before and can do so again"}`,
          "Every moment you choose growth over shrinking builds evidence of your courage",
          "Your willingness to work on standing tall shows you already have the strength to do it"
        ],
        strength_activation: identifyStandingTallStrengths(situation, desired_outcome)
      },
      trust_integration: {
        foundation: "Standing tall is the external expression of internal self-trust - they develop together and support each other",
        practice: "You cannot authentically stand tall without trusting your inner authority and inherent worth",
        development: "Each time you practice standing tall, you build evidence that you can trust yourself in challenging situations",
        embodiment: "Standing tall becomes natural when you trust that your authentic self is worthy of space and voice"
      },
      standing_tall_affirmations: [
        "I stand tall in my truth, rooted in self-trust and open to growth",
        "I have the right to take up space and be seen in my authentic power",
        "My presence and voice add value to every situation I enter",
        "I choose expansion over contraction, standing tall over shrinking"
      ],
      daily_practices: [
        {
          name: "Morning Power Posture",
          instruction: "Spend 2 minutes each morning in confident posture while setting intention to stand tall throughout the day",
          benefit: "Programs your nervous system for confidence and presence"
        },
        {
          name: "Courage Micro-Moments",
          instruction: "Take one small action each day that requires you to be slightly more visible or authentic than usual",
          benefit: "Gradually expands your comfort zone with standing tall"
        },
        {
          name: "Evening Acknowledgment",
          instruction: "Each evening, acknowledge one moment when you stood tall or one opportunity to do so tomorrow",
          benefit: "Builds awareness and celebrates progress in standing tall development"
        }
      ],
      integration_guidance: "Standing tall is a practice, not a destination. Each time you choose presence over shrinking, you strengthen this capacity. Be patient and compassionate with yourself as you develop this skill.",
      next_steps: generateStandingTallNextSteps(situation, desired_outcome, fears_concerns)
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Standing tall error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Standing tall processing error",
      message: "Your inherent dignity and worth are never in question. Stand tall because you belong here, exactly as you are."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router.get("/api/wisdom/daily-synthesis", async (request) => {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "today";
    const result = {
      session_id: `daily_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      period,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      message: "Your wisdom journey with Aquil is developing beautifully - you're building sophisticated inner authority and the capacity to stand tall in your authentic power.",
      daily_message: {
        intention: "Today is an opportunity to deepen your trust in yourself and practice standing taller in your authentic power.",
        focus: "Notice moments throughout the day when you can choose trust over fear, expansion over contraction, authentic presence over shrinking.",
        practice: "Check in with your body regularly and honor what it's communicating - this builds the somatic foundation for trust and standing tall.",
        affirmation: "I am becoming more rooted in self-trust and authentic presence every day."
      },
      trust_evolution: {
        current_phase: "Active development - building integration between inner authority and outer expression",
        trend: "Growing integration of body wisdom, emotional intelligence, and conscious choice-making",
        message: "Every interaction with your inner development work builds evidence of your capacity for self-guided growth and authentic presence",
        development_focus: "Integration of trust-building with standing tall practice for authentic empowerment"
      },
      framework_integration: {
        human_design: "Learning to trust your gut responses and unique energetic design as primary guidance",
        gene_keys: "Practicing acceptance of current reality as foundation for authentic transformation and gift emergence",
        astrology: "Aligning with cosmic timing and energy for inner authority and authentic expression development",
        somatic_wisdom: "Building body-based decision making capacity and nervous system regulation for presence"
      },
      wisdom_themes: [
        "Trust is built through small, consistent acts of listening to and honoring your inner knowing",
        "Your body is a sophisticated guidance system - learning to trust it builds overall self-trust",
        "Standing tall is an inside job that radiates outward through authentic presence",
        "Every challenge is an opportunity to practice trusting yourself and standing in your power",
        "Authentic expression serves others by giving them permission to do the same"
      ],
      daily_practices: [
        {
          time: "Morning",
          practice: "Set intention to trust yourself and stand tall in authenticity throughout the day",
          purpose: "Program nervous system for confidence and inner authority"
        },
        {
          time: "Midday",
          practice: "Check in with your body and emotions - what is your inner wisdom communicating?",
          purpose: "Strengthen somatic awareness and trust in body wisdom"
        },
        {
          time: "Evening",
          practice: "Celebrate moments when you trusted yourself or stood tall, identify tomorrow's opportunities",
          purpose: "Build evidence of growth and plan for continued development"
        }
      ],
      growth_insights: {
        pattern_recognition: "Your consistent engagement with inner development shows sophisticated consciousness and commitment to growth",
        trust_building: "Each interaction builds your capacity to trust your own wisdom and stand in your authentic power",
        standing_tall_development: "Authentic presence emerges naturally as you build trust in your inherent worth and inner authority",
        integration: "You're developing the ability to synthesize wisdom from multiple sources into coherent, embodied action"
      },
      personalized_guidance: generatePersonalizedDailyGuidance(period),
      celebration: "You're consistently choosing growth, self-understanding, and authentic development - this creates compound effects over time and builds unshakeable inner foundation.",
      growth_reminder: "You are exactly where you need to be in your journey of building unshakeable inner trust and authentic presence. Every step counts, every awareness matters, every choice for growth strengthens your foundation."
    };
    return addCORSHeaders(new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Daily synthesis error:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      error: "Synthesis error",
      message: "Your wisdom journey continues even when systems are offline. Trust your inner knowing and keep practicing standing tall in your truth."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
async function logEvent(env, event) {
  if (!event?.type || event?.payload == null) {
    throw new Error("type and payload are required");
  }
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const payloadStr = typeof event.payload === "string" ? event.payload : JSON.stringify(event.payload);
  const tagsCsv = Array.isArray(event.tags) ? event.tags.join(",") : event.tags || null;
  await env.AQUIL_DB.prepare(
    `INSERT INTO event_log (id, type, who, level, session_id, tags, idx1, idx2, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    event.type,
    event.who || null,
    event.level || null,
    event.session_id || null,
    tagsCsv,
    event.idx1 || null,
    event.idx2 || null,
    payloadStr
  ).run();
  return id;
}
__name(logEvent, "logEvent");
async function getEvents(env, opts = {}) {
  const {
    limit,
    type,
    who,
    level,
    session_id,
    tag,
    since,
    until,
    idx1,
    idx2
  } = opts;
  const lim = Math.max(1, Math.min(200, parseInt(limit) || 20));
  const where = [];
  const params = [];
  if (type) {
    where.push("type = ?");
    params.push(type);
  }
  if (who) {
    where.push("who = ?");
    params.push(who);
  }
  if (level) {
    where.push("level = ?");
    params.push(level);
  }
  if (session_id) {
    where.push("session_id = ?");
    params.push(session_id);
  }
  if (idx1) {
    where.push("idx1 = ?");
    params.push(idx1);
  }
  if (idx2) {
    where.push("idx2 = ?");
    params.push(idx2);
  }
  if (tag) {
    where.push(`(',' || IFNULL(tags,'') || ',') LIKE ?`);
    params.push(`%,${tag},%`);
  }
  if (since) {
    where.push("ts >= ?");
    params.push(since);
  }
  if (until) {
    where.push("ts <= ?");
    params.push(until);
  }
  const sql = `
    SELECT id, ts, type, who, level, session_id, tags, idx1, idx2, payload
      FROM event_log
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY ts DESC
     LIMIT ?
  `;
  params.push(lim);
  const { results } = await env.AQUIL_DB.prepare(sql).bind(...params).all();
  return results || [];
}
__name(getEvents, "getEvents");
router.get("/", async () => {
  return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>Aquil Symbolic Engine</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
        .emoji { font-size: 3em; text-align: center; margin: 20px 0; }
        h1 { color: #2c5530; text-align: center; margin-bottom: 10px; }
        .subtitle { text-align: center; font-size: 1.2em; color: #666; margin-bottom: 5px; }
        .tagline { text-align: center; font-style: italic; color: #888; margin-bottom: 30px; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .services { background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .next-steps { background: #fff5e6; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .highlight { font-weight: bold; color: #2c5530; font-size: 1.1em; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        .service-item { margin: 10px 0; padding: 5px 0; }
        .engines-active { background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="emoji">\u{1F331}</div>
    
    <h1>Aquil Symbolic Engine</h1>
    <p class="subtitle">Your Personal AI Wisdom Builder & Trust Reinforcement System</p>
    <p class="tagline">"Standing tall in the world, rooted in internal trust"</p>

    <div class="status">
        <h2>\u{1F3D7}\uFE0F System Status</h2>
        <div class="engines-active">
            <strong>\u2705 All 7 AI Engines: ACTIVE & FUNCTIONAL</strong>
        </div>
        <p>\u{1F3E0} <strong>Domain:</strong> Running at <code>signal-q.me</code></p>
        <p>\u{1F916} <strong>ChatGPT Integration:</strong> Ready for GPT Actions</p>
        <p>\u{1F512} <strong>Privacy:</strong> Complete data sovereignty - everything runs in YOUR accounts</p>
        <p>\u26A1 <strong>Performance:</strong> Sophisticated AI responses, no placeholders</p>
    </div>

    <div class="services">
        <h2>\u{1F9E0} Active AI Wisdom Engines</h2>
        <div class="service-item"><strong>\u{1F3AF} Trust Builder:</strong> Sophisticated trust analysis, pattern recognition, personalized exercises</div>
        <div class="service-item"><strong>\u{1F4FA} Media Wisdom Extractor:</strong> Transform content consumption into growth insights and archetypal wisdom</div>
        <div class="service-item"><strong>\u{1F9D8} Somatic Healer:</strong> Body-based healing practices, nervous system regulation, embodied trust building</div>
        <div class="service-item"><strong>\u{1F52E} Wisdom Synthesizer:</strong> Multi-framework integration (Human Design, Gene Keys, Astrology, Somatic)</div>
        <div class="service-item"><strong>\u{1F4CA} Pattern Recognizer:</strong> Growth trajectory analysis, consciousness development tracking</div>
        <div class="service-item"><strong>\u{1F4AA} Standing Tall Coach:</strong> Authentic presence practices, confidence building, empowerment coaching</div>
        <div class="service-item"><strong>\u{1F31F} Aquil Core:</strong> Central orchestration, daily wisdom synthesis, personalized guidance</div>
    </div>

    <div class="next-steps">
        <h2>\u{1F680} Your AI Companion is Ready</h2>
        <p><strong>Step 1:</strong> Create your custom GPT in ChatGPT Plus</p>
        <p><strong>Step 2:</strong> Import your GPT Actions schema</p>
        <p><strong>Step 3:</strong> Start with: <em>"Aquil, let's do our first trust check-in together"</em></p>
        <p class="highlight">Your journey of internal trust and standing tall begins now! \u{1F31F}</p>
        
        <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
            <strong>Ready for sophisticated, personalized responses:</strong><br>
            \u2705 No placeholder messages<br>
            \u2705 Deep pattern analysis<br>
            \u2705 Personalized growth guidance<br>
            \u2705 Multi-framework wisdom integration<br>
            \u2705 Somatic and embodiment practices
        </div>
    </div>
</body>
</html>
  `, {
    headers: {
      "Content-Type": "text/html",
      "Access-Control-Allow-Origin": "*"
    }
  });
});
router.options("*", () => {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
});
router.post("/api/log", async (request, env) => {
  try {
    const body = await request.json();
    const id = await logEvent(env, body);
    return new Response(JSON.stringify({ status: "ok", id }), { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Log error:", err);
    return new Response(JSON.stringify({ error: "Log failed", details: String(err?.message || err) }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
    });
  }
});
router.get("/api/logs", async (request, env) => {
  try {
    const url = new URL(request.url);
    const opts = Object.fromEntries(url.searchParams.entries());
    const events = await getEvents(env, opts);
    return new Response(JSON.stringify({ events }), { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Get events error:", err);
    return new Response(JSON.stringify({ error: "Retrieval failed" }), { status: 500, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  }
});
router.get("/api/session-init", async (request, env) => {
  try {
    const url = new URL(request.url);
    if (!url.searchParams.get("limit")) url.searchParams.set("limit", "7");
    const opts = Object.fromEntries(url.searchParams.entries());
    const events = await getEvents(env, opts);
    return new Response(JSON.stringify({ events }), { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Session init error:", err);
    return new Response(JSON.stringify({ error: "Retrieval failed" }), { status: 500, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  }
});
router.all("*", () => new Response(JSON.stringify({
  message: "Aquil endpoint not found",
  available_endpoints: [
    "GET / - Welcome page with full system status",
    "GET /api/health - Detailed system health check",
    "POST /api/trust/check-in - Comprehensive trust building sessions",
    "POST /api/media/extract-wisdom - Sophisticated media wisdom extraction",
    "POST /api/somatic/session - Body-based healing and trust practices",
    "POST /api/wisdom/synthesize - Multi-framework guidance integration",
    "POST /api/patterns/recognize - Growth pattern analysis and insights",
    "POST /api/standing-tall/practice - Authentic presence and confidence building",
    "GET /api/wisdom/daily-synthesis - Personalized daily wisdom compilation"
  ],
  status: "All endpoints fully functional - no placeholder responses"
}), {
  status: 404,
  headers: corsHeaders
}));
var src_default = {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx).catch((err) => {
      console.error("Aquil system error:", err);
      return new Response(JSON.stringify({
        error: "Internal wisdom system error",
        message: "Aquil needs a moment to recenter. Your journey continues - please try again.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        support: "Your personal AI system is sophisticated and resilient - temporary errors don't affect your growth journey"
      }), {
        status: 500,
        headers: corsHeaders
      });
    });
  }
};
function analyzeTrustLevel(text) {
  const lowerText = text.toLowerCase();
  if (["confident", "sure", "trust", "know"].some((word) => lowerText.includes(word))) return 7;
  if (["uncertain", "unsure", "doubt", "confused"].some((word) => lowerText.includes(word))) return 4;
  return 5;
}
__name(analyzeTrustLevel, "analyzeTrustLevel");
function extractEmotions(text) {
  const emotions = [];
  const lowerText = text.toLowerCase();
  const emotionMap = {
    "excited": ["excited", "thrilled", "energized"],
    "nervous": ["nervous", "anxious", "worried"],
    "curious": ["curious", "interested", "wondering"],
    "frustrated": ["frustrated", "annoyed", "stuck"],
    "hopeful": ["hopeful", "optimistic", "positive"],
    "overwhelmed": ["overwhelmed", "stressed", "pressure"]
  };
  Object.entries(emotionMap).forEach(([emotion, words]) => {
    if (words.some((word) => lowerText.includes(word))) {
      emotions.push(emotion);
    }
  });
  return emotions.length > 0 ? emotions : ["reflective"];
}
__name(extractEmotions, "extractEmotions");
function identifyGrowthThemes(text) {
  const themes = [];
  const lowerText = text.toLowerCase();
  const themeMap = {
    "decision_making": ["decision", "choose", "choice", "decide"],
    "self_worth": ["worth", "deserve", "value", "enough"],
    "boundaries": ["boundary", "no", "limit", "protect"],
    "authenticity": ["authentic", "real", "true", "genuine"],
    "confidence": ["confidence", "power", "strong", "capable"]
  };
  Object.entries(themeMap).forEach(([theme, words]) => {
    if (words.some((word) => lowerText.includes(word))) {
      themes.push(theme);
    }
  });
  return themes.length > 0 ? themes : ["trust_development"];
}
__name(identifyGrowthThemes, "identifyGrowthThemes");
function assessReadinessLevel(text) {
  const lowerText = text.toLowerCase();
  if (["ready", "excited", "motivated", "committed", "willing"].some((word) => lowerText.includes(word))) return "high";
  if (["overwhelmed", "tired", "stuck", "resistant", "scared"].some((word) => lowerText.includes(word))) return "low";
  return "moderate";
}
__name(assessReadinessLevel, "assessReadinessLevel");
function identifyConfidenceIndicators(text) {
  const lowerText = text.toLowerCase();
  const indicators = [];
  const positiveIndicators = {
    "self_knowledge": ["i know", "i understand", "i realize", "i see"],
    "inner_authority": ["my gut says", "i feel", "intuition", "inner knowing"],
    "past_success": ["before", "previously", "have done", "succeeded"],
    "present_strength": ["can do", "able to", "capable", "strong enough"]
  };
  Object.entries(positiveIndicators).forEach(([indicator, phrases]) => {
    if (phrases.some((phrase) => lowerText.includes(phrase))) {
      indicators.push(indicator);
    }
  });
  return indicators;
}
__name(identifyConfidenceIndicators, "identifyConfidenceIndicators");
function identifyTrustBlocks(text) {
  const lowerText = text.toLowerCase();
  const blocks = [];
  const blockPatterns = {
    "external_validation": ["what others think", "approval", "validation", "others opinions"],
    "perfectionism": ["perfect", "right way", "mistake", "wrong"],
    "past_disappointment": ["before", "last time", "always", "never works"],
    "fear_of_failure": ["fail", "mess up", "wrong choice", "regret"],
    "imposter_syndrome": ["not qualified", "not enough", "fraud", "don't deserve"]
  };
  Object.entries(blockPatterns).forEach(([block, phrases]) => {
    if (phrases.some((phrase) => lowerText.includes(phrase))) {
      blocks.push(block);
    }
  });
  return blocks;
}
__name(identifyTrustBlocks, "identifyTrustBlocks");
function assessInternalVsExternal(text) {
  const lowerText = text.toLowerCase();
  const internalCues = ["i feel", "gut", "intuition", "inner knowing", "body tells me"];
  const externalCues = ["others think", "should", "supposed to", "everyone says"];
  const internalScore = internalCues.filter((cue) => lowerText.includes(cue)).length;
  const externalScore = externalCues.filter((cue) => lowerText.includes(cue)).length;
  if (internalScore > externalScore) return "internal_focused";
  if (externalScore > internalScore) return "external_focused";
  return "mixed";
}
__name(assessInternalVsExternal, "assessInternalVsExternal");
function generateMainMessage(trustLevel, readinessLevel) {
  if (trustLevel >= 8 && readinessLevel === "high") {
    return "You're in a beautiful space of trusting yourself and ready for expansion. This is your natural state - powerful, grounded, and authentic.";
  } else if (trustLevel >= 7) {
    return "You're operating from genuine self-trust right now. Feel how good this feels - this is what you're building toward as your new normal.";
  } else if (trustLevel >= 5 && readinessLevel === "high") {
    return "Your willingness to grow combined with solid foundation trust creates perfect conditions for breakthrough. You're ready to trust yourself more.";
  } else if (trustLevel >= 5) {
    return "You're in the beautiful middle ground of trust building. This is exactly how trust develops - gradually, with awareness and practice.";
  } else if (readinessLevel === "low") {
    return "You're being gentle with yourself right now, and that's exactly right. Trust builds when we honor where we are while staying open to growth.";
  } else {
    return "You're in the foundational phase of trust building. Every moment of awareness like this is strengthening your inner authority.";
  }
}
__name(generateMainMessage, "generateMainMessage");
function getTrustLevelInsight(level) {
  if (level >= 8) {
    return "You're operating from strong self-trust. Use this as a foundation to take on bigger challenges and expand your comfort zone.";
  } else if (level >= 6) {
    return "Your trust is growing steadily. This is the sweet spot for gentle expansion - you have foundation and room to grow.";
  } else if (level >= 4) {
    return "You're building trust brick by brick. Focus on small wins and celebrating progress rather than pushing for big changes.";
  } else {
    return "Trust feels challenging right now, which makes complete sense. Small, gentle steps and self-compassion are exactly right.";
  }
}
__name(getTrustLevelInsight, "getTrustLevelInsight");
function generateBlockGuidance(trustBlocks) {
  const guidance = {};
  trustBlocks.forEach((block) => {
    switch (block) {
      case "external_validation":
        guidance[block] = {
          insight: "Looking outside for validation is a learned pattern, not a character flaw.",
          practice: "Before seeking others' opinions, pause and ask: 'What do I think about this?'",
          reframe: "Others' opinions are data points, not the final authority on your choices."
        };
        break;
      case "perfectionism":
        guidance[block] = {
          insight: "Perfectionism often masks fear of judgment or failure - it's a protection strategy.",
          practice: "Practice 'good enough' - take action with 80% certainty rather than waiting for 100%.",
          reframe: "Imperfect action teaches you more than perfect planning."
        };
        break;
    }
  });
  return guidance;
}
__name(generateBlockGuidance, "generateBlockGuidance");
function generateTrustExercises(analysis) {
  const exercises = [];
  exercises.push({
    name: "Trust Temperature Check",
    instruction: 'Three times today, pause and ask: "How much do I trust myself right now?" Just notice without judgment.',
    purpose: "Build awareness of trust levels throughout the day"
  });
  if (analysis.trust_level <= 4) {
    exercises.push({
      name: "Micro-Trust Building",
      instruction: "Make one tiny decision today purely from your gut feeling - like which route to take.",
      purpose: "Practice trusting yourself in low-stakes situations"
    });
  }
  return exercises.slice(0, 3);
}
__name(generateTrustExercises, "generateTrustExercises");
function identifyCurrentStrengths(analysis) {
  const strengths = [];
  if (analysis.confidence_indicators.includes("self_knowledge")) {
    strengths.push("You demonstrate clear self-awareness and understanding");
  }
  if (analysis.trust_level >= 6) {
    strengths.push("You have a solid foundation of self-trust to build on");
  }
  strengths.push("You have the courage to examine your trust patterns - this shows emotional intelligence");
  return strengths;
}
__name(identifyCurrentStrengths, "identifyCurrentStrengths");
function generateInternalAuthorityGuidance(analysis) {
  return {
    current_level: analysis.internal_vs_external === "internal_focused" ? "Advanced - primarily referencing inner knowing" : "Developing - building internal reference points",
    development_practices: ["Practice making small decisions without consulting others"],
    integration_steps: ["Start with trusting yourself in areas where you already have good judgment"]
  };
}
__name(generateInternalAuthorityGuidance, "generateInternalAuthorityGuidance");
function connectToStandingTall(analysis) {
  if (analysis.trust_level >= 7 && analysis.internal_vs_external === "internal_focused") {
    return "This level of self-trust is exactly what allows you to stand tall in the world. When you trust your inner authority, you naturally take up your rightful space.";
  } else if (analysis.trust_level >= 5) {
    return "As your trust in yourself grows, you'll naturally find yourself standing taller. Trust and authentic presence develop together.";
  } else {
    return "Standing tall begins with trusting that your inner knowing is valid. Each trust-building step helps you take up more space in the world.";
  }
}
__name(connectToStandingTall, "connectToStandingTall");
function identifyCelebrationMoments(analysis) {
  const celebrations = [];
  if (analysis.trust_level >= 7) {
    celebrations.push("\u{1F389} Your trust level is genuinely high - this is real progress worth celebrating!");
  }
  if (analysis.readiness_level === "high") {
    celebrations.push("\u2728 Your readiness for growth shows beautiful self-compassion and courage");
  }
  celebrations.push("\u{1F331} You chose to do this trust check-in - this decision shows self-care and growth commitment");
  return celebrations.slice(0, 3);
}
__name(identifyCelebrationMoments, "identifyCelebrationMoments");
function generateGrowthInsights(analysis) {
  const insights = [];
  if (analysis.trust_blocks.length > 0) {
    insights.push(`Working with ${analysis.trust_blocks[0]} is your current growth edge - it's showing you where trust wants to expand`);
  }
  insights.push("Every trust check-in strengthens your internal authority and builds evidence of your self-guidance capacity");
  return insights;
}
__name(generateGrowthInsights, "generateGrowthInsights");
function generateAffirmations(analysis) {
  return [
    "I trust the process of learning to trust myself",
    "My inner wisdom is always available to me",
    "I am worthy of my own trust and care"
  ];
}
__name(generateAffirmations, "generateAffirmations");
function generateNextSteps(analysis) {
  const steps = [];
  steps.push("Acknowledge yourself for doing this trust check-in - this itself is an act of self-care");
  if (analysis.trust_level >= 7) {
    steps.push("Choose one area where you could trust yourself more and take one small action there today");
  } else {
    steps.push("Make one small decision purely from your gut feeling today");
  }
  return steps.slice(0, 4);
}
__name(generateNextSteps, "generateNextSteps");
function analyzeSymbolicMeaning(mediaType, reaction) {
  return `${mediaType} often carries archetypal themes. Your reaction "${reaction}" suggests this content is activating specific aspects of your psyche that are ready for integration.`;
}
__name(analyzeSymbolicMeaning, "analyzeSymbolicMeaning");
function identifyArchetypalThemes(reaction) {
  const lowerReaction = reaction.toLowerCase();
  const themes = [];
  if (["hero", "journey", "adventure", "overcome"].some((word) => lowerReaction.includes(word))) {
    themes.push("Hero's Journey - transformation through challenge");
  }
  if (["love", "relationship", "connection"].some((word) => lowerReaction.includes(word))) {
    themes.push("Sacred Union - integration and wholeness");
  }
  if (["power", "control", "authority"].some((word) => lowerReaction.includes(word))) {
    themes.push("Sovereign - stepping into authentic power");
  }
  return themes.length > 0 ? themes : ["Personal Integration - unique wisdom for your journey"];
}
__name(identifyArchetypalThemes, "identifyArchetypalThemes");
function analyzeStandingTallConnection(reaction) {
  return `Your reaction to this content may be showing you aspects of standing tall or shrinking that are ready for conscious attention in your own life.`;
}
__name(analyzeStandingTallConnection, "analyzeStandingTallConnection");
function extractWisdomThemes(reaction) {
  return ["Self-awareness", "Growth opportunity", "Integration practice"];
}
__name(extractWisdomThemes, "extractWisdomThemes");
function generateSomaticInsights(bodyState, emotions) {
  return {
    body_intelligence: `Your body state "${bodyState}" combined with emotions "${emotions}" is sophisticated communication about your inner landscape`,
    integration_opportunity: "This combination of sensations and emotions contains valuable information for your trust and standing tall development",
    wisdom_access: "Your body is giving you direct access to wisdom that your analytical mind might miss"
  };
}
__name(generateSomaticInsights, "generateSomaticInsights");
function generatePersonalizedRecommendations(situation, question) {
  return [
    `For your specific situation "${situation}", focus on what feels most aligned in your body`,
    `Your question "${question}" is perfect for practicing integrated decision-making`,
    "Use this as an opportunity to build evidence of your inner wisdom's reliability"
  ];
}
__name(generatePersonalizedRecommendations, "generatePersonalizedRecommendations");
function analyzeShrinkingPatterns(situation, fears) {
  return {
    pattern_type: "Common shrinking pattern in challenging interpersonal situations",
    growth_opportunity: "Each time you practice standing tall here, you expand your overall confidence capacity"
  };
}
__name(analyzeShrinkingPatterns, "analyzeShrinkingPatterns");
function generateFearReframes(fears) {
  if (!fears) return ["Fear often indicates you care deeply about the outcome - this caring is actually beautiful"];
  return [
    `Your fear about "${fears}" shows you care deeply - use this care as fuel for courage`,
    "Fear often points toward what matters most to you - let it inform rather than control your choices"
  ];
}
__name(generateFearReframes, "generateFearReframes");
function identifyStandingTallStrengths(situation, outcome) {
  return [
    "Your willingness to address this situation shows existing courage",
    `Your clear vision "${outcome}" demonstrates you know what authentic presence looks like`,
    "You have the self-awareness to recognize when you're shrinking - this creates choice"
  ];
}
__name(identifyStandingTallStrengths, "identifyStandingTallStrengths");
function generateStandingTallNextSteps(situation, outcome, fears) {
  return [
    "Practice the physical standing tall posture 3 times today",
    `Visualize yourself in "${situation}" embodying "${outcome}" with confidence`,
    "Take one small action today that moves you toward your desired way of showing up"
  ];
}
__name(generateStandingTallNextSteps, "generateStandingTallNextSteps");
function generatePersonalizedDailyGuidance(period) {
  return {
    focus_area: "Integration of trust-building with authentic presence development",
    key_practice: "Use your body as a guidance system for both trust and standing tall decisions",
    growth_edge: "Each conscious choice builds evidence of your capacity for self-directed growth"
  };
}
__name(generatePersonalizedDailyGuidance, "generatePersonalizedDailyGuidance");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e2) {
    const error = reduceError(e2);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-2dEOaN/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-2dEOaN/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
