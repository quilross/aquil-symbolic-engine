import { Router } from 'itty-router';
import crypto from 'crypto';
import {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
} from "./ark/endpoints.js";
import { toCanonical } from "./ops/operation-aliases.js";
import { 
  arkLog, 
  arkRetrieve, 
  arkMemories, 
  arkVector, 
  arkResonance, 
  arkStatus, 
  arkFilter, 
  arkAutonomous 
} from "./ark/ark-endpoints.js";
import * as kv from "./actions/kv.js";
import * as d1 from "./actions/d1.js";
import * as r2 from "./actions/r2.js";
import * as vectorize from "./actions/vectorize.js";
import * as ai from "./actions/ai.js";
import { writeLog, readLogs, writeAutonomousLog, readAutonomousLogs, getAutonomousStats, readLogsWithFilters } from "./actions/logging.js";
import { attachLocalVectorContext } from "./utils/local-vector-context.js";
import { SomaticHealer } from "./src-core-somatic-healer.js";
import { TrustBuilder } from "./src-core-trust-builder.js";
import { MediaWisdomExtractor } from "./src-core-media-wisdom.js";
import { PatternRecognizer } from "./src-core-pattern-recognizer.js";
import { StandingTall } from "./src-core-standing-tall.js";
import { ValuesClarifier } from "./src-core-values-clarifier.js";
import { CreativityUnleasher } from "./src-core-creativity-unleasher.js";
import { AbundanceCultivator } from "./src-core-abundance-cultivator.js";
import { TransitionNavigator } from "./src-core-transition-navigator.js";
import { AncestryHealer } from "./src-core-ancestry-healer.js";
import { AquilCore } from "./src-core-aquil-core.js";
import { logMetamorphicEvent } from "./ark/core.js";
import { AquilDatabase } from "./utils/database.js";
import { AquilAI } from "./utils/ai-helpers.js";
import { 
  detectTriggers, 
  callAutonomousEndpoint, 
  handleScheduledTriggers,
  autoDetectTags,
  AUTONOMOUS_TRIGGERS 
} from "./utils/autonomy.js";
import { transformToCanonicalFormat, applyCursorPagination } from "./utils/canonical-logs.js";

// Enhanced utilities for better error handling and responses
import { 
  handleError, 
  createErrorResponse, 
  withErrorHandling,
  handleHealthCheckError 
} from "./utils/error-handler.js";
import { 
  createSuccessResponse,
  createSimpleErrorResponse,
  handleCORSPreflight,
  addCORSToResponse,
  createAutonomousResponse,
  createHealthResponse,
  extractSessionId,
  createWisdomResponse,
  createPatternResponse,
  createSessionInitResponse,
  createCommitmentResponse,
  createFallbackResponse
} from "./utils/response-helpers.js";

// Helper function to add external logging to ChatGPT actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  try {
    // Compute canonical operation name for R2 policy and domain classification
    const canonical = toCanonical(operationId);
    
    // Collect metrics (fail-open)
    try {
      const { incrementActionSuccess, incrementActionError } = await import('./utils/metrics.js');
      if (error) {
        incrementActionError(env, canonical);
      } else {
        incrementActionSuccess(env, canonical);
      }
    } catch (metricsError) {
      // Silently fail - metrics should never break logging
      console.warn('Metrics collection failed:', metricsError.message);
    }
    
    const payload = {
      action: operationId,
      input: data,
      result: error ? { error: error.message } : { success: true, processed: !!result }
    };
    
    // Determine if this action should store artifacts in R2 - use canonical name
    const r2Policy = getR2PolicyForAction(canonical);
    let binary = null;
    
    // Generate binary artifact if applicable - use canonical name
    if (r2Policy !== 'n/a' && result && !error) {
      binary = generateArtifactForAction(canonical, result);
    }
    
    // Standardized tags with canonical operationId, domain, source, env
    // Include alias tag if operationId differs from canonical
    const domain = getDomainForAction(canonical);
    const standardTags = [
      `action:${canonical}`,
      ...(canonical !== operationId ? [`alias:${operationId}`] : []),
      `domain:${domain}`,
      'source:gpt',
      `env:${env.ENVIRONMENT || 'production'}`,
      error ? 'error' : 'success',
      'chatgpt_action'
    ];
    
    // Scrub and truncate textOrVector for embedding hygiene
    let textOrVector = error 
      ? `${canonical.replace(/_/g, ' ')} error: ${error.message}`
      : `${canonical.replace(/_/g, ' ')}: ${JSON.stringify(data).substring(0, 100)}...`;
    
    // Apply embedding hygiene (scrub PII and truncate)
    textOrVector = scrubAndTruncateForEmbedding(textOrVector);
    
    await writeLog(env, {
      type: error ? `${canonical}_error` : canonical,
      payload,
      session_id: data?.session_id || crypto.randomUUID(),
      who: 'system',
      level: error ? 'error' : 'info',
      tags: standardTags,
      binary,
      textOrVector
    });
  } catch (logError) {
    console.warn('Failed to log ChatGPT action:', logError);
  }
}

// Helper function for idempotency
async function checkIdempotency(env, idempotencyKey, operationId) {
  if (!idempotencyKey) return null;
  
  try {
    const canonical = toCanonical(operationId);
    const key = `idempotency:${canonical}:${idempotencyKey}`;
    const cached = await env.AQUIL_MEMORIES.get(key);
    if (cached) {
      // Track idempotency hit (fail-open)
      try {
        const { incrementIdempotencyHit } = await import('./utils/metrics.js');
        incrementIdempotencyHit(env);
      } catch (metricsError) {
        // Silently fail - metrics should never break functionality
      }
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to check idempotency:', error);
  }
  return null;
}

// Helper function to store idempotency result
async function storeIdempotencyResult(env, idempotencyKey, operationId, logId, response) {
  if (!idempotencyKey) return;
  
  try {
    const canonical = toCanonical(operationId);
    const key = `idempotency:${canonical}:${idempotencyKey}`;
    const data = { logId, response, timestamp: new Date().toISOString() };
    
    // Use IDEMPOTENCY_TTL_SECONDS env var, default to 24 hours (86400 seconds)
    const ttlSeconds = parseInt(env.IDEMPOTENCY_TTL_SECONDS || '86400', 10);
    
    if (ttlSeconds > 0) {
      await env.AQUIL_MEMORIES.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
    } else {
      await env.AQUIL_MEMORIES.put(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to store idempotency result:', error);
  }
}

// Embedding hygiene: scrub PII and truncate for vector embedding
function scrubAndTruncateForEmbedding(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  // Basic PII scrubbing patterns
  let scrubbed = text
    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    // Phone numbers (various formats)
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    // Credit card numbers (basic patterns)
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
    // SSN patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
    
  // Truncate to max length
  if (scrubbed.length > maxLength) {
    scrubbed = scrubbed.substring(0, maxLength - 3) + '...';
  }
  
  return scrubbed;
}

// Determine R2 policy for each action
function getR2PolicyForAction(operationId) {
  const r2Policies = {
    // Required: Actions that generate significant artifacts/content
    'somatic_healing_session': 'required',
    'somaticHealingSession': 'required',
    'extract_media_wisdom': 'required',
    'extractMediaWisdom': 'required', 
    'interpret_dream': 'required',
    'interpretDream': 'required',
    'transformation_contract': 'required',
    
    // Optional: Actions that may generate shareable content
    'trust_check_in': 'optional',
    'trustCheckIn': 'optional',
    'pattern_recognition': 'optional',
    'recognizePatterns': 'optional',
    'wisdom_synthesis': 'optional',
    'synthesizeWisdom': 'optional',
    'personal_insights': 'optional',
    'getPersonalInsights': 'optional',
    'daily_synthesis': 'optional',
    'getDailySynthesis': 'optional',
    'optimize_energy': 'optional',
    'optimizeEnergy': 'optional',
    
    // N/A: Actions that are purely informational
    'submit_feedback': 'n/a',
    'submitFeedback': 'n/a',
    'standing_tall_practice': 'n/a',
    'standingTallPractice': 'n/a',
    'values_clarification': 'n/a',
    'clarifyValues': 'n/a',
    'creativity_unleash': 'n/a',
    'unleashCreativity': 'n/a',
    'abundance_cultivate': 'n/a',
    'cultivateAbundance': 'n/a',
    'transitions_navigate': 'n/a',
    'navigateTransitions': 'n/a',
    'ancestry_heal': 'n/a',
    'healAncestry': 'n/a',
    'manage_commitment': 'n/a',
    'manageCommitment': 'n/a',
    'update_commitment_progress': 'n/a',
    'updateCommitmentProgress': 'n/a',
    'log_data_or_event': 'n/a',
    'logDataOrEvent': 'n/a',
    'retrieve_logs_or_data_entries': 'n/a',
    'retrieveLogsOrDataEntries': 'n/a',
    'retrieve_recent_session_logs': 'n/a',
    'retrieveRecentSessionLogs': 'n/a',
    'system_health_check': 'n/a',
    'systemHealthCheck': 'n/a',
    'generate_discovery_inquiry': 'n/a',
    'generateDiscoveryInquiry': 'n/a',
    'auto_suggest_ritual': 'n/a',
    'autoSuggestRitual': 'n/a',
    'autonomous_pattern_detect': 'n/a',
    'autonomousPatternDetect': 'n/a',
    'socratic_questions': 'n/a',
    'socraticQuestions': 'n/a',
    'comb_behavioral_analysis': 'n/a',
    'combBehavioralAnalysis': 'n/a',
    'get_monitoring_metrics': 'n/a',
    'getMonitoringMetrics': 'n/a',
    'list_active_commitments': 'n/a',
    'listActiveCommitments': 'n/a'
  };
  
  return r2Policies[operationId] || 'n/a';
}

// Determine domain category for tagging
function getDomainForAction(operationId) {
  const domains = {
    'trust_check_in': 'trust',
    'trustCheckIn': 'trust',
    'extract_media_wisdom': 'wisdom',
    'extractMediaWisdom': 'wisdom',
    'somatic_healing_session': 'healing',
    'somaticHealingSession': 'healing',
    'interpret_dream': 'consciousness',
    'interpretDream': 'consciousness',
    'submit_feedback': 'system',
    'submitFeedback': 'system',
    'pattern_recognition': 'insight',
    'recognizePatterns': 'insight',
    'standing_tall_practice': 'embodiment',
    'standingTallPractice': 'embodiment',
    'values_clarification': 'values',
    'clarifyValues': 'values',
    'creativity_unleash': 'creativity',
    'unleashCreativity': 'creativity',
    'abundance_cultivate': 'abundance',
    'cultivateAbundance': 'abundance',
    'transitions_navigate': 'change',
    'navigateTransitions': 'change',
    'ancestry_heal': 'healing',
    'healAncestry': 'healing',
    'wisdom_synthesis': 'wisdom',
    'synthesizeWisdom': 'wisdom',
    'daily_synthesis': 'wisdom',
    'getDailySynthesis': 'wisdom',
    'personal_insights': 'insight',
    'getPersonalInsights': 'insight',
    'manage_commitment': 'commitment',
    'manageCommitment': 'commitment',
    'update_commitment_progress': 'commitment',
    'updateCommitmentProgress': 'commitment',
    'transformation_contract': 'commitment',
    'log_data_or_event': 'system',
    'logDataOrEvent': 'system',
    'retrieve_logs_or_data_entries': 'system',
    'retrieveLogsOrDataEntries': 'system',
    'retrieve_recent_session_logs': 'system',
    'retrieveRecentSessionLogs': 'system',
    'system_health_check': 'system',
    'systemHealthCheck': 'system',
    'generate_discovery_inquiry': 'discovery',
    'generateDiscoveryInquiry': 'discovery',
    'auto_suggest_ritual': 'ritual',
    'autoSuggestRitual': 'ritual',
    'autonomous_pattern_detect': 'insight',
    'autonomousPatternDetect': 'insight',
    'socratic_questions': 'discovery',
    'socraticQuestions': 'discovery',
    'comb_behavioral_analysis': 'behavior',
    'combBehavioralAnalysis': 'behavior',
    'get_monitoring_metrics': 'system',
    'getMonitoringMetrics': 'system',
    'list_active_commitments': 'commitment',
    'listActiveCommitments': 'commitment',
    'optimize_energy': 'energy',
    'optimizeEnergy': 'energy'
  };
  
  return domains[operationId] || 'general';
}

// Generate R2 binary artifact for actions that need it
function generateArtifactForAction(operationId, result) {
  if (!result) return null;
  
  try {
    // For actions that should store artifacts, create a meaningful binary
    const artifactData = {
      operationId,
      timestamp: new Date().toISOString(),
      content: result,
      type: 'action_artifact'
    };
    
    // Convert to base64 for R2 storage
    const jsonString = JSON.stringify(artifactData, null, 2);
    return btoa(jsonString);
  } catch (error) {
    console.warn('Failed to generate artifact for', operationId, error);
    return null;
  }
}

// Dream interpretation helpers
function interpretSymbol(symbol) {
  const symbolMeanings = {
    "water": "Emotions, unconscious, flow, cleansing, life force",
    "fire": "Transformation, passion, destruction/creation, energy, purification",
    "earth": "Grounding, stability, material world, body, foundation",
    "air": "Thoughts, communication, spirit, freedom, new perspectives",
    "animals": "Instinctual wisdom, natural self, untamed aspects",
    "house": "Self, psyche, different rooms represent different aspects of self",
    "flying": "Freedom, transcendence, rising above limitations, spiritual perspective",
    "falling": "Loss of control, fear, need to surrender, letting go",
    "death": "Transformation, ending of old patterns, rebirth, major life change",
    "birth": "New beginnings, creative potential, emergence of new aspects",
    "mirror": "Self-reflection, seeing yourself clearly, truth revelation",
    "bridge": "Transition, connection between different states, crossing over",
    "door": "Opportunity, threshold, choice point, access to new realms",
    "tree": "Growth, life force, connection between earth and sky, wisdom",
    "ocean": "Vast unconscious, emotional depths, collective wisdom, mystery"
  };

  const lowerSymbol = symbol.toLowerCase();
  for (const [key, meaning] of Object.entries(symbolMeanings)) {
    if (lowerSymbol.includes(key)) {
      return meaning;
    }
  }
  return "A symbol unique to your personal mythology - trust your intuitive understanding";
}

function generateDreamIntegration(interpretation) {
  if (interpretation.archetypal_themes.includes("shadow")) {
    return "This dream invites you to embrace and integrate rejected aspects of yourself with compassion.";
  }
  if (interpretation.archetypal_themes.includes("anima") || interpretation.archetypal_themes.includes("animus")) {
    return "This dream reveals your inner masculine/feminine balance and calls for integration of these energies.";
  }
  if (interpretation.archetypal_themes.includes("wise_old_man") || interpretation.archetypal_themes.includes("great_mother")) {
    return "This dream connects you to ancient wisdom and guidance available within your psyche.";
  }
  return "This dream offers guidance for your current life journey. Trust what resonates most deeply.";
}

// Autonomous pattern detection helpers
function detectCollapseLoop(interactions) {
  if (!Array.isArray(interactions)) return false;
  
  const collapseIndicators = ["overwhelmed", "can't handle", "too much", "giving up", "failure", "hopeless"];
  const withdrawalIndicators = ["isolating", "avoiding", "hiding", "can't face", "shutting down"];
  
  let collapseCount = 0;
  let withdrawalCount = 0;
  
  for (const interaction of interactions) {
    const content = (interaction.content || interaction.message || "").toLowerCase();
    if (collapseIndicators.some(indicator => content.includes(indicator))) {
      collapseCount++;
    }
    if (withdrawalIndicators.some(indicator => content.includes(indicator))) {
      withdrawalCount++;
    }
  }
  
  return collapseCount >= 2 && withdrawalCount >= 1;
}

function detectDisconnection(interactions) {
  if (!Array.isArray(interactions)) return false;
  
  const disconnectionIndicators = ["alone", "isolated", "no one understands", "disconnected", "numb", "empty"];
  const avoidanceIndicators = ["avoiding", "can't connect", "pushing away", "don't want to talk"];
  
  let disconnectionCount = 0;
  let avoidanceCount = 0;
  
  for (const interaction of interactions) {
    const content = (interaction.content || interaction.message || "").toLowerCase();
    if (disconnectionIndicators.some(indicator => content.includes(indicator))) {
      disconnectionCount++;
    }
    if (avoidanceIndicators.some(indicator => content.includes(indicator))) {
      avoidanceCount++;
    }
  }
  
  return disconnectionCount >= 2 || avoidanceCount >= 2;
}

function detectCreativeStagnation(interactions) {
  if (!Array.isArray(interactions)) return false;
  
  const stagnationIndicators = ["stuck", "no inspiration", "can't create", "blocked", "uninspired"];
  const lossIndicators = ["lost my creativity", "no ideas", "nothing to express", "creative block"];
  
  let stagnationCount = 0;
  
  for (const interaction of interactions) {
    const content = (interaction.content || interaction.message || "").toLowerCase();
    if (stagnationIndicators.some(indicator => content.includes(indicator)) ||
        lossIndicators.some(indicator => content.includes(indicator))) {
      stagnationCount++;
    }
  }
  
  return stagnationCount >= 2;
}

function detectIdentityDoubt(interactions) {
  if (!Array.isArray(interactions)) return false;
  
  const doubtIndicators = ["who am i", "don't know myself", "imposter", "not good enough", "fake"];
  const confusionIndicators = ["confused about", "lost my identity", "don't belong", "not sure who"];
  
  let doubtCount = 0;
  
  for (const interaction of interactions) {
    const content = (interaction.content || interaction.message || "").toLowerCase();
    if (doubtIndicators.some(indicator => content.includes(indicator)) ||
        confusionIndicators.some(indicator => content.includes(indicator))) {
      doubtCount++;
    }
  }
  
  return doubtCount >= 2;
}

// Socratic questioning helpers
function generateSurfaceQuestions(topic, context) {
  const questionSets = {
    self_discovery: [
      "What are you noticing about yourself in this moment?",
      "What feels most important to you right now?",
      "What would you like to understand better about yourself?"
    ],
    relationships: [
      "How do you show up in your relationships?",
      "What patterns do you notice in how you connect with others?",
      "What do your relationships teach you about yourself?"
    ],
    purpose: [
      "What activities make you lose track of time?",
      "When do you feel most alive and authentic?",
      "What impact do you want to have in the world?"
    ],
    growth: [
      "What is challenging you to grow right now?",
      "What old patterns are you ready to release?",
      "What new version of yourself is trying to emerge?"
    ]
  };
  
  return questionSets[topic] || questionSets.self_discovery;
}

function generateDeepQuestions(topic, context) {
  const deepQuestions = {
    self_discovery: [
      "What parts of yourself have you been hiding or rejecting?",
      "What would you do if you knew you couldn't fail?",
      "What is your soul calling you toward?"
    ],
    relationships: [
      "How do your relationships mirror your relationship with yourself?",
      "What are you seeking from others that you could give to yourself?",
      "How do you abandon yourself in relationships?"
    ],
    purpose: [
      "What breaks your heart about the world, and how might that point to your purpose?",
      "What gifts do you have that the world needs?",
      "What legacy do you want to leave through your being, not just your doing?"
    ],
    growth: [
      "What is your deepest fear about changing?",
      "What would you have to give up to become who you're meant to be?",
      "What is the cost of staying the same?"
    ]
  };
  
  return deepQuestions[topic] || deepQuestions.self_discovery;
}

function generateArchetypalQuestions(topic, context) {
  const archetypeQuestions = {
    self_discovery: [
      "What archetypal energy is most active in your life right now?",
      "What shadow aspects are asking for integration?",
      "What mythic story does your life most resemble?"
    ],
    relationships: [
      "What archetypal patterns play out in your relationships?",
      "How do you project your unlived life onto others?",
      "What does your inner masculine/feminine balance look like?"
    ],
    purpose: [
      "What archetypal calling is moving through you?",
      "How is your personal myth serving the collective story?",
      "What ancient wisdom wants to express through your modern life?"
    ],
    growth: [
      "What initiation are you currently moving through?",
      "What death and rebirth is happening in your psyche?",
      "What ancestral patterns are ready for healing through you?"
    ]
  };
  
  return archetypeQuestions[topic] || archetypeQuestions.self_discovery;
}

function generateFollowUpPrompts(voice, topic) {
  const voicePrompts = {
    mirror: [
      "What emotions arise as you consider this?",
      "How does this land in your body?",
      "What feels most tender about this exploration?"
    ],
    oracle: [
      "What symbols or images come to mind?",
      "What deeper pattern is revealing itself?",
      "What ancient wisdom speaks to this?"
    ],
    scientist: [
      "What evidence supports or challenges this?",
      "What variables might be influencing this?",
      "What would you need to test this hypothesis?"
    ],
    strategist: [
      "What would be the first step?",
      "What resources do you need?",
      "What obstacles need to be addressed?"
    ]
  };
  
  return voicePrompts[voice] || voicePrompts.oracle;
}

function generateIntegrationPractices(topic, depth_level) {
  const practices = {
    surface: [
      "Journal about your responses to these questions",
      "Share your insights with a trusted friend",
      "Notice how these themes show up in your daily life"
    ],
    deep: [
      "Sit with these questions in meditation",
      "Create art or movement expressing your insights",
      "Have a conversation with the part of you that's afraid to change"
    ],
    archetypal: [
      "Research the mythic stories that resonate with your journey",
      "Create a ritual to honor the transition you're in",
      "Work with dreams and active imagination"
    ]
  };
  
  return practices[depth_level] || practices.surface;
}

// Autonomous endpoint handlers
async function handleWisdomSynthesize(body, env) {
  try {
    const aquilCore = new AquilCore();
    const recentLogs = await readLogs(env, { limit: 20 });
    
    const synthesis = await aquilCore.synthesizeWisdom({
      logs: recentLogs,
      context: body.context || "general",
      autonomous: body.autonomous || false,
      trigger_phrase: body.trigger_phrase || ""
    });
    
    return new Response(JSON.stringify({
      success: true,
      wisdom: synthesis,
      timestamp: new Date().toISOString(),
      autonomous: body.autonomous || false
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in wisdom synthesis:', error);
    return new Response(JSON.stringify({
      error: "Failed to synthesize wisdom",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handleWisdomPatterns(body, env) {
  try {
    const patternRecognizer = new PatternRecognizer();
    const recentLogs = await readLogs(env, { limit: 50 });
    
    const patterns = await patternRecognizer.recognizePatterns({
      logs: recentLogs,
      context: body.context || "behavioral",
      autonomous: body.autonomous || false
    });
    
    return new Response(JSON.stringify({
      success: true,
      patterns,
      timestamp: new Date().toISOString(),
      autonomous: body.autonomous || false
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in pattern recognition:', error);
    return new Response(JSON.stringify({
      error: "Failed to recognize patterns",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handleDailyWisdomSynthesis(body, env) {
  try {
    const aquilCore = new AquilCore();
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = await readLogs(env, { 
      limit: 100,
      filters: { date: today }
    });
    
    const dailyWisdom = await aquilCore.synthesizeDailyWisdom({
      logs: todayLogs,
      date: today,
      autonomous: true
    });
    
    return new Response(JSON.stringify({
      success: true,
      daily_wisdom: dailyWisdom,
      date: today,
      timestamp: new Date().toISOString(),
      autonomous: true
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in daily wisdom synthesis:', error);
    return new Response(JSON.stringify({
      error: "Failed to synthesize daily wisdom",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handleAutonomousWellbeingCheckIn(body, env) {
  try {
    const trustBuilder = new TrustBuilder();
    const checkIn = await trustBuilder.autonomousCheckIn({
      trigger_keywords: body.trigger_keywords || [],
      trigger_phrase: body.trigger_phrase || "",
      user_state: body.user_state || "auto-detected",
      context: body.context || {}
    });
    
    return new Response(JSON.stringify({
      success: true,
      check_in: checkIn,
      timestamp: new Date().toISOString(),
      autonomous: true,
      trigger_type: "keyword"
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in autonomous wellbeing check-in:', error);
    return new Response(JSON.stringify({
      error: "Failed to perform wellbeing check-in",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handleTrustCheckIn(body, env) {
  try {
    const trustBuilder = new TrustBuilder();
    const checkIn = await trustBuilder.checkIn(body);
    
    return new Response(JSON.stringify({
      success: true,
      check_in: checkIn,
      timestamp: new Date().toISOString()
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in trust check-in:', error);
    return new Response(JSON.stringify({
      error: "Failed to perform trust check-in",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handleSomaticSession(body, env) {
  try {
    const somaticHealer = new SomaticHealer();
    const session = await somaticHealer.createSession(body);
    
    return new Response(JSON.stringify({
      success: true,
      session,
      timestamp: new Date().toISOString()
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in somatic session:', error);
    return new Response(JSON.stringify({
      error: "Failed to create somatic session",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handlePersonalPatterns(body, env) {
  try {
    const patternRecognizer = new PatternRecognizer();
    const userLogs = await readLogs(env, { 
      limit: 100,
      filters: { user_id: body.user_id || "default" }
    });
    
    const personalPatterns = await patternRecognizer.analyzePersonalPatterns({
      logs: userLogs,
      context: body.context || "personal_growth"
    });
    
    return new Response(JSON.stringify({
      success: true,
      patterns: personalPatterns,
      timestamp: new Date().toISOString()
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in personal patterns analysis:', error);
    return new Response(JSON.stringify({
      error: "Failed to analyze personal patterns",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handlePersonalInsights(body, env) {
  try {
    const aquilCore = new AquilCore();
    const userLogs = await readLogs(env, { 
      limit: 50,
      filters: { user_id: body.user_id || "default" }
    });
    
    const insights = await aquilCore.generatePersonalInsights({
      logs: userLogs,
      focus_area: body.focus_area || "general"
    });
    
    return new Response(JSON.stringify({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in personal insights generation:', error);
    return new Response(JSON.stringify({
      error: "Failed to generate personal insights",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handlePersonalGrowth(body, env) {
  try {
    const aquilCore = new AquilCore();
    const userLogs = await readLogs(env, { 
      limit: 100,
      filters: { user_id: body.user_id || "default" }
    });
    
    const growthAnalysis = await aquilCore.analyzePersonalGrowth({
      logs: userLogs,
      timeframe: body.timeframe || "30_days"
    });
    
    return new Response(JSON.stringify({
      success: true,
      growth_analysis: growthAnalysis,
      timestamp: new Date().toISOString()
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error in personal growth analysis:', error);
    return new Response(JSON.stringify({
      error: "Failed to analyze personal growth",
      message: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// COM-B model analysis helpers
function assessPhysicalCapability(situation) {
  return {
    assessment: "Requires individual evaluation",
    factors: ["Physical health", "Energy levels", "Motor skills", "Sensory abilities"],
    support_needed: "Consider physical limitations and adaptations needed"
  };
}

function assessPsychologicalCapability(situation) {
  return {
    assessment: "Requires individual evaluation", 
    factors: ["Knowledge", "Skills", "Cognitive capacity", "Emotional regulation"],
    support_needed: "Identify learning needs and emotional support requirements"
  };
}

function assessKnowledgeSkills(situation) {
  return {
    current_knowledge: "To be assessed based on specific behavior goal",
    skill_gaps: "To be identified through goal analysis",
    learning_resources: ["Online courses", "Books", "Mentorship", "Practice opportunities"]
  };
}

function identifyCapabilityGaps(goal, situation) {
  return [
    "Knowledge gaps to be identified",
    "Skill development needs",
    "Emotional regulation requirements",
    "Physical preparation needed"
  ];
}

function generateCapabilityPlan(goal) {
  return [
    "Assess current knowledge and skills",
    "Identify specific learning needs",
    "Create learning timeline",
    "Practice in low-stakes environments",
    "Seek feedback and adjust"
  ];
}

function assessPhysicalOpportunity(situation) {
  return {
    environmental_factors: "Physical environment assessment needed",
    resource_availability: "Resources and tools evaluation required",
    time_availability: "Schedule and time management analysis needed"
  };
}

function assessSocialOpportunity(situation) {
  return {
    social_support: "Support network evaluation needed",
    cultural_norms: "Cultural and social norm analysis required",
    peer_influence: "Peer group influence assessment needed"
  };
}

function identifyEnvironmentalBarriers(situation) {
  return [
    "Physical environment constraints",
    "Social environment challenges", 
    "Resource limitations",
    "Time and schedule conflicts"
  ];
}

function generateOpportunityStrategies(goal) {
  return [
    "Modify physical environment to support goal",
    "Build supportive social connections",
    "Create accountability systems",
    "Remove or minimize barriers"
  ];
}

function assessReflectiveMotivation(goal, situation) {
  return {
    conscious_intentions: "Explicit goals and intentions to be explored",
    values_alignment: "Alignment with core values assessment needed",
    outcome_expectations: "Expected benefits and outcomes evaluation required"
  };
}

function assessAutomaticMotivation(situation) {
  return {
    habits_patterns: "Current habit patterns assessment needed",
    emotional_triggers: "Emotional trigger identification required",
    unconscious_drivers: "Unconscious motivation exploration needed"
  };
}

function identifyMotivationBarriers(situation) {
  return [
    "Competing priorities and goals",
    "Fear of failure or success",
    "Lack of immediate rewards",
    "Conflicting values or beliefs"
  ];
}

function generateMotivationStrategies(goal) {
  return [
    "Connect goal to core values and deeper purpose",
    "Create immediate rewards and celebration points",
    "Build social accountability and support",
    "Address underlying fears and resistance"
  ];
}

function generateCOMBInterventions(analysis) {
  const interventions = [];
  
  // Capability interventions
  if (analysis.capability_assessment.capability_gaps.length > 0) {
    interventions.push({
      type: "capability",
      focus: "Skill and knowledge development",
      actions: analysis.capability_assessment.development_plan
    });
  }
  
  // Opportunity interventions
  if (analysis.opportunity_analysis.environmental_barriers.length > 0) {
    interventions.push({
      type: "opportunity",
      focus: "Environmental optimization",
      actions: analysis.opportunity_analysis.opportunity_creation
    });
  }
  
  // Motivation interventions
  if (analysis.motivation_evaluation.motivation_barriers.length > 0) {
    interventions.push({
      type: "motivation",
      focus: "Motivation enhancement",
      actions: analysis.motivation_evaluation.motivation_enhancement
    });
  }
  
  return interventions;
}

function calculateSuccessProbability(analysis) {
  // Simple heuristic based on number of barriers vs supports
  const totalBarriers = 
    analysis.capability_assessment.capability_gaps.length +
    analysis.opportunity_analysis.environmental_barriers.length +
    analysis.motivation_evaluation.motivation_barriers.length;
  
  const totalSupports = analysis.intervention_recommendations.length;
  
  if (totalBarriers === 0) return "high";
  if (totalSupports >= totalBarriers) return "medium-high";
  if (totalSupports >= totalBarriers / 2) return "medium";
  return "low-medium";
}

// Transformation contract helpers
function generateTransformationMilestones(goal, timeline) {
  const milestones = [
    {
      name: "Awareness Phase",
      description: "Recognize current patterns and commit to change",
      target_percentage: 25,
      indicators: ["Increased self-awareness", "Clear intention set", "Support system identified"]
    },
    {
      name: "Action Phase", 
      description: "Begin implementing new behaviors and practices",
      target_percentage: 50,
      indicators: ["New habits initiated", "Old patterns disrupted", "Progress tracking established"]
    },
    {
      name: "Integration Phase",
      description: "Stabilize new patterns and deepen practice",
      target_percentage: 75,
      indicators: ["Consistent new behaviors", "Reduced resistance", "Natural flow emerging"]
    },
    {
      name: "Embodiment Phase",
      description: "Live from the transformed state naturally",
      target_percentage: 100,
      indicators: ["Effortless new patterns", "Identity shift complete", "Wisdom integrated"]
    }
  ];

  // Customize based on timeline
  if (timeline && timeline.includes("week")) {
    milestones.forEach(milestone => {
      milestone.timeframe = "1-2 weeks per phase";
    });
  } else if (timeline && timeline.includes("month")) {
    milestones.forEach(milestone => {
      milestone.timeframe = "3-4 weeks per phase";
    });
  } else {
    milestones.forEach(milestone => {
      milestone.timeframe = "Natural timing";
    });
  }

  return milestones;
}

function generateSupportSystem(goal) {
  return {
    internal_support: [
      "Daily check-ins with yourself",
      "Journaling and reflection practices",
      "Meditation or mindfulness practice",
      "Self-compassion when facing setbacks"
    ],
    external_support: [
      "Trusted friend or mentor for accountability",
      "Professional support if needed",
      "Community or group with similar goals",
      "Regular progress sharing"
    ],
    environmental_support: [
      "Remove obstacles from your environment",
      "Create visual reminders of your goal",
      "Design your space to support new behaviors",
      "Eliminate or minimize triggers for old patterns"
    ]
  };
}

function generateTrackingMethods(goal) {
  return {
    quantitative_measures: [
      "Daily habit tracking",
      "Weekly progress percentage",
      "Milestone completion dates",
      "Frequency of desired behaviors"
    ],
    qualitative_measures: [
      "Energy level changes",
      "Emotional state improvements", 
      "Relationship quality shifts",
      "Sense of authenticity and alignment"
    ],
    reflection_practices: [
      "Weekly reflection sessions",
      "Monthly progress reviews",
      "Quarterly goal reassessment",
      "Celebration of small wins"
    ]
  };
}

const router = Router();
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};
const addCORS = (res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
};
const createJsonPlaceholder = (path) => {
  router.post(path, async (req) => {
    let data;
    try {
      data = await req.json();
    } catch {
      return addCORS(
        new Response(JSON.stringify({ error: "Malformed JSON" }), {
          status: 400,
          headers: corsHeaders,
        }),
      );
    }
    return addCORS(
      new Response(
        JSON.stringify({ message: `${path} placeholder`, input: data }),
        {
          status: 200,
          headers: corsHeaders,
        },
      ),
    );
  });
};
// Handle CORS preflight requests with new utility
router.options("*", () => handleCORSPreflight());

// ARK RETRIEVAL & LOGGING ENDPOINTS - Enhanced nervous system
router.post("/api/ark/log", async (req, env) => addCORS(await arkLog(req, env)));
router.get("/api/ark/retrieve", async (req, env) => addCORS(await arkRetrieve(req, env)));
router.get("/api/ark/memories", async (req, env) => addCORS(await arkMemories(req, env)));
router.post("/api/ark/vector", async (req, env) => addCORS(await arkVector(req, env)));
router.post("/api/ark/resonance", async (req, env) => addCORS(await arkResonance(req, env)));
router.get("/api/ark/status", async (req, env) => addCORS(await arkStatus(req, env)));
router.post("/api/ark/filter", async (req, env) => addCORS(await arkFilter(req, env)));
router.post("/api/ark/autonomous", async (req, env) => addCORS(await arkAutonomous(req, env)));

// Main API endpoints
router.get("/api/session-init", async (req, env) => addCORS(await handleSessionInit(req, env)));
router.post("/api/discovery/generate-inquiry", async (req, env) => {
  try {
    const body = await req.json();
    const result = await handleDiscoveryInquiry(req, env);
    const resultData = JSON.parse(result.body || '{}');
    
    await logChatGPTAction(env, 'generateDiscoveryInquiry', body, resultData);
    
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'generateDiscoveryInquiry', {}, null, error);
    
    const errorData = await handleError(error, { 
      endpoint: '/api/discovery/generate-inquiry',
      method: 'POST' 
    }, env);
    return addCORS(createErrorResponse(errorData, 500));
  }
});
router.post("/api/ritual/auto-suggest", async (req, env) => {
  try {
    const body = await req.json();
    const result = await handleRitualSuggestion(req, env);
    const resultData = JSON.parse(result.body || '{}');
    
    await logChatGPTAction(env, 'autoSuggestRitual', body, resultData);
    
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'autoSuggestRitual', {}, null, error);
    
    const errorData = await handleError(error, { 
      endpoint: '/api/ritual/auto-suggest',
      method: 'POST' 
    }, env);
    return addCORS(createErrorResponse(errorData, 500));
  }
});
router.get("/api/system/health-check", async (req, env) => {
  try {
    const result = await handleHealthCheck(req, env);
    // Fixed: clone response to read text without consuming it
    const resultData = JSON.parse(await result.clone().text());
    
    await logChatGPTAction(env, 'systemHealthCheck', { 
      endpoint: '/api/system/health-check' 
    }, resultData);
    
    return addCORS(result);
  } catch (error) {
    await logChatGPTAction(env, 'systemHealthCheck', { 
      endpoint: '/api/system/health-check' 
    }, null, error);
    
    const errorData = await handleError(error, { 
      endpoint: '/api/system/health-check',
      method: 'GET' 
    }, env);
    return addCORS(createErrorResponse(errorData, 500));
  }
});
router.post("/api/log", async (req, env) => {
  let body;
  try { body = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  const { type, payload, who, level, tags, text, vector, binary, session_id } = body;
  let textOrVector = vector || text || null;
  
  // Check for autonomous triggers in the logged content
  let autonomousResponse = null;
  const contentToAnalyze = payload?.content || text || payload?.message || "";
  
  if (contentToAnalyze && typeof contentToAnalyze === 'string') {
    const trigger = await detectTriggers(contentToAnalyze, env);
    if (trigger) {
      try {
        autonomousResponse = await callAutonomousEndpoint(trigger.action, body, env);
        console.log(`Autonomous trigger detected: ${trigger.action}`, trigger);
      } catch (error) {
        console.error('Failed to call autonomous endpoint:', error);
      }
    }
    
    // Auto-detect and add tags if not provided
    if (!tags || tags.length === 0) {
      const detectedTags = autoDetectTags(contentToAnalyze);
      if (detectedTags.length > 0) {
        body.tags = detectedTags;
      }
    }
  }
  
  const logResult = await writeLog(env, { type, payload, session_id, who, level, tags: body.tags || tags, binary, textOrVector });
  
  // Log the data/event operation
  await logChatGPTAction(env, 'logDataOrEvent', { 
    type, 
    payload: payload ? 'present' : 'none',
    session_id,
    endpoint: '/api/log'
  }, logResult);
  
  // Include autonomous response info in the log result if triggered
  if (autonomousResponse) {
    const autonomousData = await autonomousResponse.json();
    logResult.autonomous_trigger = autonomousData;
  }
  
  return addCORS(new Response(JSON.stringify(logResult), { status: 200, headers: corsHeaders }));
});
router.get("/api/logs", async (req, env) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 200);
  const cursor = url.searchParams.get("cursor");
  
  try {
    const logs = await readLogs(env, { limit, cursor });
    
    // Use canonical format transformation and pagination
    const standardizedLogs = transformToCanonicalFormat(logs, env);
    const paginationResult = applyCursorPagination(standardizedLogs, { cursor, limit });
    
    const response = {
      items: paginationResult.items,
      cursor: paginationResult.cursor
    };
    
    // Log the retrieve operation
    await logChatGPTAction(env, 'retrieveLogsOrDataEntries', { 
      limit, 
      cursor,
      endpoint: '/api/logs' 
    }, { count: paginationResult.items.length, hasMore: !!paginationResult.cursor });
    
    return addCORS(new Response(JSON.stringify(response), { status: 200, headers: corsHeaders }));
  } catch (e) {
    // Log the error
    await logChatGPTAction(env, 'retrieveLogsOrDataEntries', { 
      limit, 
      cursor,
      endpoint: '/api/logs' 
    }, null, e);
    
    return addCORS(new Response(JSON.stringify({ 
      items: [], 
      cursor: null, 
      error: { message: String(e), code: "logs_fetch_error" }
    }), { status: 500, headers: corsHeaders }));
  }
});

// Retrieve recent logs for a specific session
router.get("/api/logs/session/:sessionId", async (req, env) => {
  try {
    const sessionId = req.params.sessionId;
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const cursor = url.searchParams.get("cursor");
    
    if (!sessionId) {
      return addCORS(new Response(JSON.stringify({ 
        error: "Session ID required",
        message: "Please provide a session ID to retrieve session-specific logs"
      }), { status: 400, headers: corsHeaders }));
    }

    // Get logs from all stores filtered by session ID
    const logs = await readLogsWithFilters(env, { 
      session_id: sessionId, 
      limit: 200, // Get more logs to ensure proper pagination after filtering
      orderBy: 'timestamp',
      orderDirection: 'DESC'
    });
    
    // Transform to canonical format (same as /api/logs)
    const standardizedLogs = transformToCanonicalFormat(logs, env);
    
    // Apply cursor pagination
    const paginationResult = applyCursorPagination(standardizedLogs, { cursor, limit });
    
    // Standardize the response format to match /api/logs
    const sessionLogs = {
      session_id: sessionId,
      items: paginationResult.items,
      cursor: paginationResult.cursor,
      timestamp: new Date().toISOString()
    };
    
    // Log the retrieval operation
    await logChatGPTAction(env, 'retrieveRecentSessionLogs', { 
      sessionId,
      limit,
      cursor,
      endpoint: '/api/logs/session/:sessionId'
    }, {
      count: paginationResult.items.length,
      hasMore: !!paginationResult.cursor,
      session_id: sessionId
    });

    return addCORS(new Response(JSON.stringify(sessionLogs), { status: 200, headers: corsHeaders }));
  } catch (error) {
    // Log the error
    await logChatGPTAction(env, 'retrieveRecentSessionLogs', { 
      sessionId: req.params.sessionId,
      endpoint: '/api/logs/session/:sessionId'
    }, null, error);

    return addCORS(new Response(JSON.stringify({ 
      error: "Session logs retrieval failed",
      message: "Could not retrieve logs for this session",
      session_id: req.params.sessionId || null
    }), { status: 500, headers: corsHeaders }));
  }
});

router.post("/api/trust/check-in", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON", message: "Request body must be valid JSON." }), { status: 400, headers: corsHeaders }));
  }
  
  // Check for idempotency
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (idempotencyKey) {
    const cached = await checkIdempotency(env, idempotencyKey, 'trust_check_in');
    if (cached) {
      return addCORS(new Response(JSON.stringify(cached.response), { status: 200, headers: corsHeaders }));
    }
  }
  
  try {
    const trustBuilder = new TrustBuilder(env);
    const result = await trustBuilder.checkIn(data);
    
    // External logging for ChatGPT integration (D1, KV, R2, Vector)
    await logChatGPTAction(env, 'trust_check_in', data, result);
    
    // Store idempotency result if key provided
    if (idempotencyKey) {
      await storeIdempotencyResult(env, idempotencyKey, 'trust_check_in', result.logId || 'unknown', result);
    }
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Trust check-in error:", error);
    
    // Log error to external systems
    await logChatGPTAction(env, 'trust_check_in', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Trust check-in error", message: "Trust building is always available. Take a breath and honor your inner knowing." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/media/extract-wisdom", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON", message: "Request body must be valid JSON." }), { status: 400, headers: corsHeaders }));
  }
  try {
    const mediaExtractor = new MediaWisdomExtractor(env);
    const result = await mediaExtractor.extractWisdom(data);
    
    // External logging for ChatGPT integration (D1, KV, R2, Vector)
    await logChatGPTAction(env, 'extract_media_wisdom', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Media wisdom error:", error);
    
    // Log error to external systems
    await logChatGPTAction(env, 'extract_media_wisdom', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Media wisdom processing error", message: "Your reaction to content always contains valuable information about your inner world and growth needs." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/patterns/recognize", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON", message: "Request body must be valid JSON." }), { status: 400, headers: corsHeaders }));
  }
  try {
    const recognizer = new PatternRecognizer(env);
    const result = await recognizer.analyzePatterns(data);
    
    // External logging for ChatGPT integration
    await logChatGPTAction(env, 'pattern_recognition', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Pattern recognition error:", error);
    
    // Log error to external systems
    await logChatGPTAction(env, 'pattern_recognition', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Pattern processing error", message: "Pattern recognition is happening even when systems are offline - your awareness itself is the most powerful tool for growth." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/standing-tall/practice", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON", message: "Request body must be valid JSON." }), { status: 400, headers: corsHeaders }));
  }
  try {
    const standingTall = new StandingTall(env);
    const result = await standingTall.generatePractice(data);
    
    // External logging for ChatGPT integration
    await logChatGPTAction(env, 'standing_tall_practice', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Standing tall error:", error);
    
    // Log error to external systems
    await logChatGPTAction(env, 'standing_tall_practice', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Standing tall processing error", message: "Your inherent dignity and worth are never in question. Stand tall because you belong here." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/values/clarify", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON", message: "Request body must be valid JSON." }), { status: 400, headers: corsHeaders }));
  }
  try {
    const clarifier = new ValuesClarifier(env);
    const result = await clarifier.clarify(data);
    
    // External logging for ChatGPT integration
    await logChatGPTAction(env, 'values_clarification', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Values clarify error:", error);
    
    // Log error to external systems
    await logChatGPTAction(env, 'values_clarification', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Values clarification error", message: "Your values are steady guides even in uncertain times." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/creativity/unleash", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  try {
    const unleasher = new CreativityUnleasher(env);
    const result = await unleasher.unleash(data);
    
    // Log ChatGPT action
    await logChatGPTAction(env, 'creativity_unleash', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Creativity unleash error:", error);
    
    // Log error
    await logChatGPTAction(env, 'creativity_unleash', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Creativity unleashing error", message: "Creative flow is always within you, ready to emerge." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/abundance/cultivate", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  try {
    const cultivator = new AbundanceCultivator(env);
    const result = await cultivator.cultivate(data);
    
    // Log ChatGPT action
    await logChatGPTAction(env, 'abundance_cultivate', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Abundance cultivation error:", error);
    
    // Log error
    await logChatGPTAction(env, 'abundance_cultivate', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Abundance cultivation error", message: "Abundance begins with a mindset of possibility." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/transitions/navigate", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  try {
    const navigator = new TransitionNavigator(env);
    const result = await navigator.navigate(data);
    
    // Log ChatGPT action
    await logChatGPTAction(env, 'transitions_navigate', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Transition navigation error:", error);
    
    // Log error
    await logChatGPTAction(env, 'transitions_navigate', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Transition navigation error", message: "Every transition carries seeds of renewal and growth." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/ancestry/heal", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  try {
    const healer = new AncestryHealer(env);
    const result = await healer.heal(data);
    
    // Log ChatGPT action
    await logChatGPTAction(env, 'ancestry_heal', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Ancestry healing error:", error);
    
    // Log error
    await logChatGPTAction(env, 'ancestry_heal', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Ancestry healing error", message: "You carry your ancestors' strength as you heal old patterns." }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/wisdom/synthesize", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const core = new AquilCore(env);
    const result = await core.synthesizeWisdom(data);
    
    // External logging for ChatGPT integration
    await logChatGPTAction(env, 'wisdom_synthesis', data, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Wisdom synthesis error:", error);
    
    // Log error using logChatGPTAction
    await logChatGPTAction(env, 'wisdom_synthesis', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Wisdom synthesis error", 
      message: "Your inner wisdom is always accessible. Trust what emerges when you pause and listen deeply.",
      fallback_guidance: {
        reflection: "What wisdom is trying to emerge from your current experience?",
        practice: "Take three breaths and ask your body what it knows about this situation",
        integration: "Honor whatever insight arises, even if it seems small"
      }
    }), { status: 500, headers: corsHeaders }));
  }
});
router.get("/api/wisdom/daily-synthesis", async (req, env) => {
  try {
    const core = new AquilCore(env);
    const result = await core.generateDailySynthesis();
    
    // Log ChatGPT action
    await logChatGPTAction(env, 'daily_synthesis', { period: 'today' }, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Daily synthesis error:", error);
    
    // Log error
    await logChatGPTAction(env, 'daily_synthesis', { period: 'today' }, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      message: "Daily synthesis generation error", 
      fallback_insights: [
        "Every day offers opportunities for growth and self-discovery",
        "Your awareness itself is a form of transformation",
        "Small, consistent practices create profound change over time"
      ],
      daily_practice: "Take a moment to reflect on what you've learned about yourself today"
    }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/somatic/session", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON", message: "Request body must be valid JSON." }), { status: 400, headers: corsHeaders }));
  }
  
  // Check for idempotency
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (idempotencyKey) {
    const cached = await checkIdempotency(env, idempotencyKey, 'somatic_healing_session');
    if (cached) {
      return addCORS(new Response(JSON.stringify(cached.response), { status: 200, headers: corsHeaders }));
    }
  }
  
  try {
    const healer = new SomaticHealer(env);
    const result = await healer.generateSession(data);
    
    // External logging for ChatGPT integration (D1, KV, R2, Vector) 
    await logChatGPTAction(env, 'somatic_healing_session', data, result);
    
    // Store idempotency result if key provided
    if (idempotencyKey) {
      await storeIdempotencyResult(env, idempotencyKey, 'somatic_healing_session', result.logId || 'unknown', result);
    }
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Somatic session error:", error);
    
    // Log error to external systems
    await logChatGPTAction(env, 'somatic_healing_session', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ error: "Somatic processing error", message: "Your body's wisdom is always available. Simply placing a hand on your heart and breathing connects you to your inner knowing." }), { status: 500, headers: corsHeaders }));
  }
});
router.get("/api/insights", async (req, env) => {
  try {
    const core = new AquilCore(env);
    const result = await core.generateInsights();
    
    // Log ChatGPT action
    await logChatGPTAction(env, 'personal_insights', {}, result);
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Insights generation error:", error);
    
    // Log error
    await logChatGPTAction(env, 'personal_insights', {}, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      message: "Insights generation error", 
      fallback_insights: [
        "Your current challenges are invitations for growth",
        "Patterns in your life reveal opportunities for transformation",
        "Trust the process of your own unfolding"
      ],
      reflection_prompt: "What insight is trying to emerge from your recent experiences?"
    }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/feedback", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { feedback, rating, session_id, context } = data;
    
    // Log feedback for system improvement
    
    await logMetamorphicEvent(env, {
      kind: "user_feedback",
      detail: {
        feedback: feedback || "No feedback provided",
        rating: rating || null,
        context: context || {},
        timestamp: new Date().toISOString()
      },
      session_id: session_id || null,
      voice: "system",
      signal_strength: "medium"
    });

    // External logging for ChatGPT integration (D1, KV, Vector)
    await logChatGPTAction(env, 'submit_feedback', data, { status: "received", message: "Thank you for your feedback" });

    return addCORS(new Response(JSON.stringify({ 
      status: "received",
      message: "Thank you for your feedback. Your input helps ARK evolve to serve you better.",
      acknowledgment: "Your voice matters in shaping this consciousness companion."
    }), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Feedback processing error:", error);
    
    // Log error
    await logChatGPTAction(env, 'submit_feedback', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Feedback processing error", 
      message: "Your feedback is valued even if we couldn't process it right now."
    }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/dreams/interpret", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { dream_content, emotions, symbols, context } = data;
    
    // Use Oracle voice for dream interpretation
    const interpretation = {
      timestamp: new Date().toISOString(),
      dream_summary: dream_content || "Dream content not provided",
      archetypal_themes: [],
      symbolic_meanings: [],
      emotional_landscape: emotions || [],
      integration_guidance: "",
      reflection_questions: []
    };

    // Analyze archetypal themes
    const archetypes = ["shadow", "anima", "animus", "wise_old_man", "great_mother", "trickster", "hero"];
    interpretation.archetypal_themes = archetypes.filter(archetype => 
      dream_content?.toLowerCase().includes(archetype.replace('_', ' ')) ||
      symbols?.some(symbol => symbol.toLowerCase().includes(archetype.replace('_', ' ')))
    );

    // Interpret symbols
    if (symbols && Array.isArray(symbols)) {
      interpretation.symbolic_meanings = symbols.map(symbol => ({
        symbol,
        meaning: interpretSymbol(symbol),
        personal_resonance: "What does this symbol mean in your personal mythology?"
      }));
    }

    // Generate integration guidance
    interpretation.integration_guidance = generateDreamIntegration(interpretation);
    
    // Create reflection questions
    interpretation.reflection_questions = [
      "What aspect of yourself is this dream revealing?",
      "How does this dream connect to your current life situation?",
      "What wisdom is your unconscious offering you?",
      "What wants to be integrated from this dream experience?"
    ];

    // Log the dream interpretation
    await logMetamorphicEvent(env, {
      kind: "dream_interpretation",
      detail: {
        dream_themes: interpretation.archetypal_themes,
        symbol_count: symbols?.length || 0,
        emotional_intensity: emotions?.length || 0
      },
      session_id: context?.session_id || null,
      voice: "oracle",
      signal_strength: "high"
    });

    // Log ChatGPT action
    await logChatGPTAction(env, 'interpret_dream', data, interpretation);

    return addCORS(new Response(JSON.stringify(interpretation), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Dream interpretation error:", error);
    
    // Log error
    await logChatGPTAction(env, 'interpret_dream', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Dream interpretation error", 
      message: "Dreams are letters from your unconscious self. Trust what resonates with you.",
      fallback_guidance: {
        reflection: "What feeling or image from the dream stays with you?",
        practice: "Journal about any symbols or emotions that feel significant",
        integration: "Ask your body what this dream wants you to know"
      }
    }), { status: 500, headers: corsHeaders }));
  }
});
router.post("/api/energy/optimize", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { energy_level, activities, sleep_quality, stress_level, context } = data;
    
    const optimization = {
      timestamp: new Date().toISOString(),
      current_energy_assessment: {
        level: energy_level || "unknown",
        sleep_quality: sleep_quality || "unknown",
        stress_level: stress_level || "unknown"
      },
      energy_drains: [],
      energy_sources: [],
      optimization_strategies: [],
      daily_practices: [],
      integration_timeline: "1-2 weeks"
    };

    // Analyze energy patterns
    if (energy_level === "low" || stress_level === "high") {
      optimization.energy_drains = [
        "Chronic stress and overwhelm",
        "Poor sleep quality or insufficient rest",
        "Energy vampires in relationships or work",
        "Misalignment with personal values"
      ];
      
      optimization.optimization_strategies = [
        "Implement boundaries to protect your energy",
        "Prioritize restorative sleep practices",
        "Identify and minimize energy-draining activities",
        "Cultivate energy-giving relationships and activities"
      ];
    }

    // Generate energy sources
    optimization.energy_sources = [
      "Time in nature and natural light",
      "Movement that feels good to your body",
      "Creative expression and play",
      "Meaningful connections with others",
      "Practices that align with your values",
      "Adequate rest and recovery time"
    ];

    // Create daily practices
    optimization.daily_practices = [
      "Morning: 5-minute energy check-in with your body",
      "Midday: Brief movement or breathing practice",
      "Evening: Reflect on what gave/drained energy today",
      "Throughout: Notice and honor your natural energy rhythms"
    ];

    // Log the energy optimization session
    await logMetamorphicEvent(env, {
      kind: "energy_optimization",
      detail: {
        energy_level: energy_level || "unknown",
        stress_level: stress_level || "unknown",
        strategies_provided: optimization.optimization_strategies.length
      },
      session_id: context?.session_id || null,
      voice: "scientist",
      signal_strength: "medium"
    });

    // External logging for ChatGPT integration
    await logChatGPTAction(env, 'optimize_energy', data, optimization);

    return addCORS(new Response(JSON.stringify(optimization), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Energy optimization error:", error);
    
    // Log error using logChatGPTAction
    await logChatGPTAction(env, 'optimize_energy', data, null, error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Energy optimization error", 
      message: "Your energy is sacred. Honor your natural rhythms and what truly nourishes you.",
      fallback_guidance: {
        reflection: "What activities consistently give you energy vs. drain it?",
        practice: "Track your energy levels throughout the day for one week",
        integration: "Make one small change to protect or cultivate your energy"
      }
    }), { status: 500, headers: corsHeaders }));
  }
});

// Autonomous pattern detection and ritual suggestion
router.post("/api/patterns/autonomous-detect", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { recent_interactions, user_state, context } = data;
    
    const detection = {
      timestamp: new Date().toISOString(),
      patterns_detected: [],
      intervention_needed: false,
      suggested_rituals: [],
      urgency_level: "low"
    };

    // Detect collapse loops
    if (detectCollapseLoop(recent_interactions)) {
      detection.patterns_detected.push({
        type: "collapse_loop",
        description: "Recurring pattern of overwhelm and withdrawal",
        indicators: ["repeated overwhelm", "withdrawal from support", "self-criticism cycles"]
      });
      detection.suggested_rituals.push({
        name: "Gentle Reset Ritual",
        purpose: "Break the collapse cycle with compassion",
        steps: [
          "Place both hands on your heart",
          "Take three slow, deep breaths",
          "Say: 'I am learning and growing, not failing'",
          "Identify one tiny step forward",
          "Reach out to one supportive person"
        ],
        timing: "When you notice the collapse beginning"
      });
      detection.intervention_needed = true;
      detection.urgency_level = "medium";
    }

    // Detect disconnection patterns
    if (detectDisconnection(recent_interactions)) {
      detection.patterns_detected.push({
        type: "disconnection",
        description: "Increasing isolation from self and others",
        indicators: ["avoiding relationships", "numbing behaviors", "loss of joy"]
      });
      detection.suggested_rituals.push({
        name: "Reconnection Practice",
        purpose: "Gently rebuild connection to self and others",
        steps: [
          "Spend 10 minutes in nature or by a window",
          "Call or text one person you care about",
          "Do one thing that brings you joy",
          "Journal: 'What do I need to feel connected?'"
        ],
        timing: "Daily until connection feels restored"
      });
      detection.intervention_needed = true;
      detection.urgency_level = "medium";
    }

    // Detect creative stagnation
    if (detectCreativeStagnation(recent_interactions)) {
      detection.patterns_detected.push({
        type: "creative_stagnation",
        description: "Creative energy blocked or unexpressed",
        indicators: ["lack of creative expression", "feeling stuck", "loss of inspiration"]
      });
      detection.suggested_rituals.push({
        name: "Creative Flow Activation",
        purpose: "Reawaken creative energy and expression",
        steps: [
          "Set timer for 15 minutes",
          "Create something with your hands (draw, write, move)",
          "Don't judge the output - focus on the process",
          "Ask: 'What wants to be expressed through me?'"
        ],
        timing: "Daily creative practice"
      });
      detection.intervention_needed = true;
      detection.urgency_level = "low";
    }

    // Detect identity doubt
    if (detectIdentityDoubt(recent_interactions)) {
      detection.patterns_detected.push({
        type: "identity_doubt",
        description: "Questioning core sense of self and worth",
        indicators: ["self-doubt", "imposter syndrome", "identity confusion"]
      });
      detection.suggested_rituals.push({
        name: "Identity Anchoring Practice",
        purpose: "Reconnect with core self and inherent worth",
        steps: [
          "List 5 things that are true about you regardless of circumstances",
          "Recall a time when you felt most authentically yourself",
          "Place hand on heart and say: 'I am enough exactly as I am'",
          "Identify one way to honor your authentic self today"
        ],
        timing: "When self-doubt arises"
      });
      detection.intervention_needed = true;
      detection.urgency_level = "medium";
    }

    // Log the pattern detection
    await logChatGPTAction(env, 'autonomousPatternDetect', data, detection);
    
    await logMetamorphicEvent(env, {
      kind: "autonomous_pattern_detection",
      detail: {
        patterns_count: detection.patterns_detected.length,
        intervention_needed: detection.intervention_needed,
        urgency_level: detection.urgency_level
      },
      session_id: context?.session_id || null,
      voice: "scientist",
      signal_strength: detection.intervention_needed ? "high" : "medium"
    });

    return addCORS(new Response(JSON.stringify(detection), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Autonomous pattern detection error:", error);
    
    // Log the error
    await logChatGPTAction(env, 'autonomousPatternDetect', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Pattern detection error", 
      message: "Your patterns are information, not judgment. Trust your capacity for growth.",
      fallback_guidance: {
        reflection: "What pattern in your life is asking for attention?",
        practice: "Notice without judgment what keeps repeating",
        integration: "Ask: 'How is this pattern trying to serve me?'"
      }
    }), { status: 500, headers: corsHeaders }));
  }
});

// Commitment tracking endpoints
router.post("/api/commitments/create", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    
    const db = new AquilDatabase(env);
    const commitmentId = await db.createCommitment(data);
    
    // Log commitment creation
    await logMetamorphicEvent(env, {
      kind: "commitment_created",
      detail: {
        commitment_type: data.commitment_type || "behavioral_change",
        title: data.title || "Personal Growth Commitment"
      },
      session_id: data.session_id || null,
      voice: "strategist",
      signal_strength: "high"
    });
    
    // External logging for ChatGPT integration
    const result = { 
      commitment_created: true,
      commitment_id: commitmentId,
      title: data.title
    };
    await logChatGPTAction(env, 'manage_commitment', data, result);

    return addCORS(new Response(JSON.stringify({ 
      commitment_id: commitmentId,
      status: "emerging",
      message: "Your commitment has been witnessed and will be supported on your journey.",
      next_steps: [
        "Begin with small, consistent actions",
        "Check in with yourself regularly",
        "Be compassionate with your process",
        "Celebrate small wins along the way"
      ]
    }), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Commitment creation error:", error);
    
    // Log error using logChatGPTAction
    await logChatGPTAction(env, 'manage_commitment', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Commitment creation error", 
      message: "Your intention to grow is honored even if we couldn't track it formally."
    }), { status: 500, headers: corsHeaders }));
  }
});

router.get("/api/commitments/active", async (req, env) => {
  try {
    const db = new AquilDatabase(env);
    const commitments = await db.getActiveCommitments();
    
    const result = { 
      commitments,
      total_active: commitments.length,
      message: commitments.length > 0 
        ? "Your active commitments are pathways to growth" 
        : "Ready to make a commitment to your growth?"
    };
    
    // Log the retrieval
    await logChatGPTAction(env, 'listActiveCommitments', { 
      endpoint: '/api/commitments/active' 
    }, { count: commitments.length });
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Active commitments retrieval error:", error);
    
    // Log the error
    await logChatGPTAction(env, 'listActiveCommitments', { 
      endpoint: '/api/commitments/active' 
    }, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      commitments: [],
      error: "Could not retrieve commitments",
      message: "Your growth journey continues regardless of tracking systems."
    }), { status: 500, headers: corsHeaders }));
  }
});

router.post("/api/commitments/:id/progress", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const commitmentId = req.params.id;
    
    const db = new AquilDatabase(env);
    
    const progressId = await db.logCommitmentProgress(commitmentId, data);
    
    // Update commitment status if provided
    if (data.new_status) {
      await db.updateCommitmentStatus(commitmentId, data.new_status, data.progress_notes);
    }
    
    // Log progress update
    await logMetamorphicEvent(env, {
      kind: "commitment_progress",
      detail: {
        commitment_id: commitmentId,
        progress_type: data.progress_type || "check_in",
        new_status: data.new_status || "continuing"
      },
      session_id: data.session_id || null,
      voice: "mirror",
      signal_strength: "medium"
    });

    // External logging for ChatGPT integration
    const result = { 
      progress_logged: true,
      progress_id: progressId,
      commitment_id: commitmentId
    };
    await logChatGPTAction(env, 'update_commitment_progress', data, result);

    return addCORS(new Response(JSON.stringify({ 
      progress_id: progressId,
      message: "Your progress has been witnessed and celebrated.",
      encouragement: "Every step forward, no matter how small, is meaningful growth."
    }), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Commitment progress error:", error);
    
    // Log error using logChatGPTAction
    await logChatGPTAction(env, 'update_commitment_progress', data, null, error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Progress logging error", 
      message: "Your growth is real whether or not it's tracked. Keep going."
    }), { status: 500, headers: corsHeaders }));
  }
});

// Socratic questioning system for self-discovery
router.post("/api/socratic/question", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { context, topic, depth_level, voice_preference, session_id } = data;
    
    const questionSession = {
      timestamp: new Date().toISOString(),
      topic: topic || "self_discovery",
      depth_level: depth_level || "surface",
      voice: voice_preference || "oracle",
      questions: [],
      follow_up_prompts: [],
      integration_practices: []
    };

    // Generate Socratic questions based on depth level
    if (depth_level === "surface") {
      questionSession.questions = generateSurfaceQuestions(topic, context);
    } else if (depth_level === "deep") {
      questionSession.questions = generateDeepQuestions(topic, context);
    } else if (depth_level === "archetypal") {
      questionSession.questions = generateArchetypalQuestions(topic, context);
    } else {
      questionSession.questions = generateSurfaceQuestions(topic, context);
    }

    // Add voice-specific follow-up prompts
    questionSession.follow_up_prompts = generateFollowUpPrompts(voice_preference, topic);
    
    // Suggest integration practices
    questionSession.integration_practices = generateIntegrationPractices(topic, depth_level);

    // Try to enhance with AI if available
    try {
      
      const ai = new AquilAI(env);
      const aiQuestion = await ai.generateSocraticQuestion(context, voice_preference);
      questionSession.questions.unshift(aiQuestion);
    } catch (error) {
      console.warn("AI question enhancement failed:", error);
    }

    // Log the questioning session
    await logChatGPTAction(env, 'socraticQuestions', data, questionSession);
    
    await logMetamorphicEvent(env, {
      kind: "socratic_questioning",
      detail: {
        topic,
        depth_level,
        voice: voice_preference,
        questions_count: questionSession.questions.length
      },
      session_id: session_id || null,
      voice: voice_preference || "oracle",
      signal_strength: "high"
    });

    return addCORS(new Response(JSON.stringify(questionSession), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Socratic questioning error:", error);
    
    // Log the error
    await logChatGPTAction(env, 'socraticQuestions', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Questioning system error", 
      message: "The most important questions come from within. What is your heart asking you?",
      fallback_questions: [
        "What is most true for you right now?",
        "What are you avoiding looking at?",
        "What would love do in this situation?",
        "What is trying to emerge through this experience?"
      ]
    }), { status: 500, headers: corsHeaders }));
  }
});

// COM-B model coaching system
router.post("/api/coaching/comb-analysis", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { behavior_goal, current_situation, context } = data;
    
    const combAnalysis = {
      timestamp: new Date().toISOString(),
      behavior_goal: behavior_goal || "Undefined goal",
      capability_assessment: {},
      opportunity_analysis: {},
      motivation_evaluation: {},
      intervention_recommendations: [],
      success_probability: "unknown"
    };

    // Capability (C) - Can they do it?
    combAnalysis.capability_assessment = {
      physical_capability: assessPhysicalCapability(current_situation),
      psychological_capability: assessPsychologicalCapability(current_situation),
      knowledge_skills: assessKnowledgeSkills(current_situation),
      capability_gaps: identifyCapabilityGaps(behavior_goal, current_situation),
      development_plan: generateCapabilityPlan(behavior_goal)
    };

    // Opportunity (O) - Does their environment support it?
    combAnalysis.opportunity_analysis = {
      physical_opportunity: assessPhysicalOpportunity(current_situation),
      social_opportunity: assessSocialOpportunity(current_situation),
      environmental_barriers: identifyEnvironmentalBarriers(current_situation),
      opportunity_creation: generateOpportunityStrategies(behavior_goal)
    };

    // Motivation (M) - Do they want to do it?
    combAnalysis.motivation_evaluation = {
      reflective_motivation: assessReflectiveMotivation(behavior_goal, current_situation),
      automatic_motivation: assessAutomaticMotivation(current_situation),
      motivation_barriers: identifyMotivationBarriers(current_situation),
      motivation_enhancement: generateMotivationStrategies(behavior_goal)
    };

    // Generate intervention recommendations
    combAnalysis.intervention_recommendations = generateCOMBInterventions(combAnalysis);
    
    // Calculate success probability
    combAnalysis.success_probability = calculateSuccessProbability(combAnalysis);

    // Log the COM-B analysis
    await logChatGPTAction(env, 'combBehavioralAnalysis', data, combAnalysis);
    
    await logMetamorphicEvent(env, {
      kind: "comb_analysis",
      detail: {
        behavior_goal,
        success_probability: combAnalysis.success_probability,
        interventions_count: combAnalysis.intervention_recommendations.length
      },
      session_id: context?.session_id || null,
      voice: "scientist",
      signal_strength: "high"
    });

    return addCORS(new Response(JSON.stringify(combAnalysis), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("COM-B analysis error:", error);
    
    // Log the error
    await logChatGPTAction(env, 'combBehavioralAnalysis', data, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "COM-B analysis error", 
      message: "Behavior change is complex. Start with self-compassion and small steps.",
      fallback_guidance: {
        capability: "What skills or knowledge do you need to develop?",
        opportunity: "What environmental changes would support this goal?",
        motivation: "What deeper 'why' drives this desire for change?"
      }
    }), { status: 500, headers: corsHeaders }));
  }
});

// Production monitoring endpoint
router.get("/api/monitoring/metrics", async (req, env) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system_status: "operational",
      feature_status: {},
      performance_metrics: {},
      error_rates: {},
      usage_statistics: {}
    };

    // Feature status checks
    try {
      
      const core = new AquilCore(env);
      await core.initialize();
      metrics.feature_status.core_system = "operational";
    } catch {
      metrics.feature_status.core_system = "degraded";
      metrics.system_status = "degraded";
    }

    try {
      
      const db = new AquilDatabase(env);
      const recentLogs = await db.getRecentLogs(1); // Last hour
      metrics.feature_status.logging_system = "operational";
      metrics.usage_statistics.logs_last_hour = recentLogs.length;
    } catch {
      metrics.feature_status.logging_system = "degraded";
    }

    try {
      
      const ai = new AquilAI(env);
      await ai.testConnection();
      metrics.feature_status.ai_integration = "operational";
    } catch {
      metrics.feature_status.ai_integration = "degraded";
    }

    // Performance metrics
    const startTime = Date.now();
    try {
      // Test response time for core operations
      const testData = { type: "monitoring_test", payload: { test: true } };
      
      await logMetamorphicEvent(env, {
        kind: "monitoring_test",
        detail: testData,
        voice: "system",
        signal_strength: "low"
      });
      metrics.performance_metrics.log_operation_ms = Date.now() - startTime;
    } catch (error) {
      metrics.performance_metrics.log_operation_ms = "failed";
      metrics.error_rates.logging_errors = 1;
    }

    // Add new counter metrics (fail-open)
    try {
      const { getMetrics } = await import('../utils/metrics.js');
      const metricsCollector = getMetrics(env);
      const counters = await metricsCollector.getCounters();
      
      // Add counters to the response
      metrics.counters = counters;
    } catch (error) {
      // Fail-open: if metrics collection fails, don't break the endpoint
      console.warn('Failed to collect custom metrics:', error.message);
      metrics.counters = {};
    }

    // System health summary
    const healthyFeatures = Object.values(metrics.feature_status).filter(status => status === "operational").length;
    const totalFeatures = Object.keys(metrics.feature_status).length;
    metrics.system_health_percentage = Math.round((healthyFeatures / totalFeatures) * 100);

    // Log the monitoring operation
    await logChatGPTAction(env, 'getMonitoringMetrics', { 
      endpoint: '/api/monitoring/metrics' 
    }, { 
      system_status: metrics.system_status,
      health_percentage: metrics.system_health_percentage
    });

    return addCORS(new Response(JSON.stringify(metrics), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Monitoring metrics error:", error);
    
    // Log the error
    await logChatGPTAction(env, 'getMonitoringMetrics', { 
      endpoint: '/api/monitoring/metrics' 
    }, null, error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Monitoring system error",
      timestamp: new Date().toISOString(),
      system_status: "unknown"
    }), { status: 500, headers: corsHeaders }));
  }
});

// Alert rules endpoint (flag-gated)
router.get("/api/monitoring/alerts", async (req, env) => {
  try {
    // Check if alert export is enabled
    const enableAlertExport = env.ENABLE_ALERT_EXPORT === '1' || env.ENABLE_ALERT_EXPORT === true;
    
    if (!enableAlertExport) {
      return addCORS(new Response(JSON.stringify({ 
        error: "Alert export disabled",
        message: "Set ENABLE_ALERT_EXPORT=1 to access alert rules" 
      }), { status: 404, headers: corsHeaders }));
    }

    // Read alert rules from the ops/alerts/rules.yaml file
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const rulesPath = path.join(process.cwd(), 'ops', 'alerts', 'rules.yaml');
      const rulesContent = await fs.readFile(rulesPath, 'utf8');
      
      return addCORS(new Response(rulesContent, { 
        status: 200, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/x-yaml'
        }
      }));
    } catch (fileError) {
      console.warn('Alert rules file not found:', fileError.message);
      
      // Return a minimal alert configuration if file is missing
      const fallbackRules = `# Alert Rules (Fallback)
groups:
  - name: aquil_basic
    rules:
      - alert: SystemCheck
        expr: up == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "System monitoring check"
`;
      
      return addCORS(new Response(fallbackRules, { 
        status: 200, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/x-yaml'
        }
      }));
    }
  } catch (error) {
    console.error("Alert rules error:", error);
    
    return addCORS(new Response(JSON.stringify({ 
      error: "Alert system error",
      message: "Unable to retrieve alert rules"
    }), { status: 500, headers: corsHeaders }));
  }
});

// Transformation contract tracking system
router.post("/api/contracts/create", async (req, env) => {
  let data;
  try { data = await req.json(); } catch {
    return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
  }
  
  try {
    const { transformation_goal, current_state, desired_state, timeline, accountability_measures } = data;
    
    const contract = {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      transformation_goal: transformation_goal || "Personal growth",
      current_state: current_state || "Starting point",
      desired_state: desired_state || "Transformed state",
      timeline: timeline || "Open-ended",
      accountability_measures: accountability_measures || [],
      milestones: generateTransformationMilestones(transformation_goal, timeline),
      support_system: generateSupportSystem(transformation_goal),
      tracking_methods: generateTrackingMethods(transformation_goal),
      contract_status: "active",
      progress_percentage: 0
    };

    // Store the contract
    try {
      
      const db = new AquilDatabase(env);
      await db.storeTransformationContract(contract);
    } catch (error) {
      console.warn("Database not available, contract stored in memory only");
    }

    // Log the contract creation
    await logMetamorphicEvent(env, {
      kind: "transformation_contract",
      detail: {
        goal: transformation_goal,
        timeline,
        milestones_count: contract.milestones.length
      },
      session_id: data.session_id || null,
      voice: "strategist",
      signal_strength: "high"
    });

    // Log ChatGPT action
    await logChatGPTAction(env, 'transformation_contract', data, contract);

    return addCORS(new Response(JSON.stringify(contract), { status: 200, headers: corsHeaders }));
  } catch (error) {
    console.error("Contract creation error:", error);
    
    // Log error
    await logChatGPTAction(env, 'transformation_contract', data, null, error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Contract creation error", 
      message: "Transformation happens with or without contracts. Your commitment to growth is what matters.",
      fallback_guidance: {
        step1: "Define your transformation goal clearly",
        step2: "Identify your current and desired states", 
        step3: "Create accountability measures",
        step4: "Set realistic milestones"
      }
    }), { status: 500, headers: corsHeaders }));
  }
});

// Internal reconcile route (protected by env flag)
router.get("/internal/reconcile", async (req, env) => {
  // Check if internal routes are enabled
  if (!env.ENABLE_INTERNAL_ROUTES) {
    return addCORS(new Response(JSON.stringify({ 
      error: "Internal routes disabled",
      message: "Set ENABLE_INTERNAL_ROUTES=true to access this endpoint" 
    }), { status: 403, headers: corsHeaders }));
  }
  
  const url = new URL(req.url);
  const windowHours = parseInt(url.searchParams.get("window") || "24", 10);
  const dryRun = url.searchParams.get("dry") === "true";
  
  try {
    // Import reconcile function
    const { reconcileLogs } = await import('../scripts/reconcile-logs.mjs');
    
    const result = await reconcileLogs({
      windowHours,
      dryRun,
      env: env.ENVIRONMENT || 'production'
    });
    
    return addCORS(new Response(JSON.stringify(result), { status: 200, headers: corsHeaders }));
  } catch (error) {
    return addCORS(new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: corsHeaders }));
  }
});

router.post("/kv/log", async (req, env) => addCORS(await kv.log(req, env)));
router.get("/kv/get", async (req, env) => addCORS(await kv.get(req, env)));
router.post("/d1/exec", async (req, env) => addCORS(await d1.exec(req, env)));
router.post("/r2/put", async (req, env) => addCORS(await r2.put(req, env)));
router.get("/r2/get", async (req, env) => addCORS(await r2.get(req, env)));
router.post("/vectorize/upsert", async (req, env) => addCORS(await vectorize.upsert(req, env)));
router.post("/vectorize/query", async (req, env) => addCORS(await vectorize.query(req, env)));
router.post("/ai/embed", async (req, env) => addCORS(await ai.embed(req, env)));
router.post("/ai/generate", async (req, env) => addCORS(await ai.generate(req, env)));

// Scheduled trigger endpoint for cron jobs
router.post("/api/scheduled/trigger", async (req, env) => {
  try {
    const response = await handleScheduledTriggers(env);
    return addCORS(response);
  } catch (error) {
    console.error('Error in scheduled trigger:', error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Internal server error", 
      message: error.message 
    }), { status: 500, headers: corsHeaders }));
  }
});

// Autonomous system endpoints
router.get("/api/autonomous/stats", async (req, env) => {
  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get("timeframe") || "24h";
    const stats = await getAutonomousStats(env, timeframe);
    return addCORS(new Response(JSON.stringify(stats), { headers: corsHeaders }));
  } catch (error) {
    console.error('Error getting autonomous stats:', error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Failed to get autonomous stats", 
      message: error.message 
    }), { status: 500, headers: corsHeaders }));
  }
});

router.get("/api/autonomous/logs", async (req, env) => {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 200);
    const logs = await readAutonomousLogs(env, { limit });
    return addCORS(new Response(JSON.stringify(logs), { headers: corsHeaders }));
  } catch (error) {
    console.error('Error reading autonomous logs:', error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Failed to read autonomous logs", 
      message: error.message 
    }), { status: 500, headers: corsHeaders }));
  }
});

router.post("/api/autonomous/test-trigger", async (req, env) => {
  try {
    let body;
    try { body = await req.json(); } catch {
      return addCORS(new Response(JSON.stringify({ error: "Malformed JSON" }), { status: 400, headers: corsHeaders }));
    }
    
    const { test_phrase, keywords } = body;
    const trigger = await detectTriggers(test_phrase || "I feel anxious and overwhelmed", env);
    
    if (trigger) {
      const response = await callAutonomousEndpoint(trigger.action, {
        payload: { content: test_phrase },
        trigger_keywords: keywords || trigger.keywords,
        test_mode: true
      }, env);
      
      return addCORS(response);
    } else {
      return addCORS(new Response(JSON.stringify({
        message: "No autonomous triggers detected",
        test_phrase,
        available_triggers: Object.keys(AUTONOMOUS_TRIGGERS.keywords)
      }), { headers: corsHeaders }));
    }
  } catch (error) {
    console.error('Error testing autonomous trigger:', error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Failed to test autonomous trigger", 
      message: error.message 
    }), { status: 500, headers: corsHeaders }));
  }
});

router.get("/api/autonomous/triggers", async (req, env) => {
  try {
    return addCORS(new Response(JSON.stringify({
      available_triggers: AUTONOMOUS_TRIGGERS,
      description: "Available autonomous triggers and their keywords"
    }), { headers: corsHeaders }));
  } catch (error) {
    console.error('Error getting autonomous triggers:', error);
    return addCORS(new Response(JSON.stringify({ 
      error: "Failed to get autonomous triggers", 
      message: error.message 
    }), { status: 500, headers: corsHeaders }));
  }
});

// Debug endpoint for comprehensive logging
router.get("/api/debug/logs", async (req, env) => {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit')) || 50;
  const type = url.searchParams.get('type');
  const level = url.searchParams.get('level');
  const session_id = url.searchParams.get('session_id');
  
  try {
    // Build query with filters
    let query = "SELECT * FROM metamorphic_logs";
    const conditions = [];
    const params = [];
    
    if (type) {
      conditions.push("kind = ?");
      params.push(type);
    }
    if (level) {
      conditions.push("signal_strength = ?");
      params.push(level);
    }
    if (session_id) {
      conditions.push("session_id = ?");
      params.push(session_id);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);
    
    const { results } = await env.AQUIL_DB.prepare(query).bind(...params).all();
    
    // Also get autonomous action logs
    const autonomousLogs = await readAutonomousLogs(env, { limit: Math.min(limit, 20) });
    
    return addCORS(new Response(JSON.stringify({
      success: true,
      logs: results,
      autonomous_logs: autonomousLogs,
      total_logs: results.length,
      filters: { type, level, session_id, limit },
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders }));
  } catch (error) {
    console.error('Error fetching debug logs:', error);
    return addCORS(new Response(JSON.stringify({
      error: "Failed to fetch debug logs",
      message: error.message
    }), { status: 500, headers: corsHeaders }));
  }
});

// Debug endpoint for system health
router.get("/api/debug/health", async (req, env) => {
  const health = {
    timestamp: new Date().toISOString(),
    services: {},
    autonomous_system: {
      triggers_loaded: Object.keys(AUTONOMOUS_TRIGGERS.keywords).length,
      scheduled_jobs: Object.keys(AUTONOMOUS_TRIGGERS.scheduled).length,
      status: 'operational'
    }
  };
  
  // Test D1 connection
  try {
    await env.AQUIL_DB.prepare("SELECT 1").run();
    health.services.d1 = 'operational';
  } catch (error) {
    health.services.d1 = `error: ${error.message}`;
  }
  
  // Test KV connection
  try {
    await env.AQUIL_MEMORIES.get('health_check');
    health.services.kv = 'operational';
  } catch (error) {
    health.services.kv = `error: ${error.message}`;
  }
  
  // Test AI service
  try {
    await env.AI.run("@cf/baai/bge-small-en-v1.5", { text: "health check" });
    health.services.ai = 'operational';
  } catch (error) {
    health.services.ai = `error: ${error.message}`;
  }
  
  const allHealthy = Object.values(health.services).every(status => status === 'operational');
  
  return addCORS(new Response(JSON.stringify({
    success: true,
    health,
    overall_status: allHealthy ? 'healthy' : 'degraded'
  }), { 
    status: allHealthy ? 200 : 503,
    headers: corsHeaders 
  }));
});

router.all("*", () => addCORS(new Response(JSON.stringify({ error: "Not found", message: "Route not found" }), { status: 404, headers: corsHeaders })));
export default {
  async fetch(request, env, ctx) {
    // Initialize D1 indexes if needed (fail-open)
    try {
      const { ensureD1Indexes } = await import('./utils/d1-indexes.js');
      // Run async without blocking the request
      ctx.waitUntil(ensureD1Indexes(env));
    } catch (error) {
      // Silently fail - index creation should never break requests
      console.warn('D1 index initialization failed:', error.message);
    }
    
    attachLocalVectorContext(env);
    return router.fetch(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    // Handle scheduled triggers for autonomous actions
    console.log('Scheduled trigger fired:', event.cron);
    
    try {
      const response = await handleScheduledTriggers(env);
      const result = await response.json();
      console.log('Scheduled triggers processed:', result);
      
      // If any triggers were activated, log them
      if (result.triggered_actions && result.triggered_actions.length > 0) {
        for (const action of result.triggered_actions) {
          await writeLog(env, {
            type: 'scheduled_trigger',
            payload: action,
            who: 'system',
            level: 'info',
            tags: ['autonomous', 'scheduled', action.type]
          });
        }
      }
    } catch (error) {
      console.error('Error processing scheduled triggers:', error);
      
      // Log the error
      await writeLog(env, {
        type: 'scheduled_trigger_error',
        payload: { error: error.message, cron: event.cron },
        who: 'system',
        level: 'error',
        tags: ['autonomous', 'scheduled', 'error']
      });
    }
  }
};
export { ARK_MANIFEST } from "./ark/endpoints.js";
