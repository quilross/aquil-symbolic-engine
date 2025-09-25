/**
 * Personal Development Routes - Wisdom, somatic healing, personal growth features
 */

import { Router } from 'itty-router';
import { handleDiscoveryInquiry } from '../ark/endpoints.js';
import { runEngine } from '../agent/engine.js';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';
import { z } from 'zod';

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}

// Import the personal development classes
import { SomaticHealer } from '../src-core-somatic-healer.js';
import { TrustBuilder } from '../src-core-trust-builder.js';
import { MediaWisdomExtractor } from '../src-core-media-wisdom.js';
import { PatternRecognizer } from '../src-core-pattern-recognizer.js';
import { StandingTall } from '../src-core-standing-tall.js';
import { AquilCore } from '../src-core-aquil-core.js';
import { ValuesClarifier } from '../src-core-values-clarifier.js';
import { CreativityUnleasher } from '../src-core-creativity-unleasher.js';
import { AbundanceCultivator } from '../src-core-abundance-cultivator.js';
import { TransitionNavigator } from '../src-core-transition-navigator.js';
import { AncestryHealer } from '../src-core-ancestry-healer.js';

// Schema validation for media wisdom extraction
const mediaWisdomSchema = z.object({
  media_type: z.string().min(1),
  title: z.string().min(1),
  personal_reaction: z.string().min(1),
});

const personalDevRouter = Router();

// Discovery inquiry with Behavioral Intelligence Engine
personalDevRouter.post("/api/discovery/generate-inquiry", withErrorHandling(async (req, env) => {
  const result = await handleDiscoveryInquiry(req, env);
  const data = await result.clone().json();
  
  // Wire conversational engine if enabled
  if (env.ENABLE_CONVERSATIONAL_ENGINE === '1') {
    const body = await req.clone().json();
    const userText = body.prompt || body.text || '';
    const sessionId = data.session_id || extractSessionId(req) || crypto.randomUUID();
    
    try {
      const probe = await runEngine(env, sessionId, userText);
      // Blend engine output into existing response fields
      data.voice_used = probe.voice;
      data.press_level = probe.pressLevel;
      if (probe.questions && probe.questions.length > 0) {
        data.questions = probe.questions;
      }
      if (probe.micro) {
        data.micro_commitment = probe.micro;
      }
    } catch (engineError) {
      console.error('Engine integration error:', engineError);
      // Continue without engine enhancement
    }
  }
  
  await logChatGPTAction(env, 'generateInquiry', {}, data);
  
  return addCORSToResponse(result);
}));

// Trust check-in
personalDevRouter.post("/api/trust/check-in", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const trustBuilder = new TrustBuilder(env);
  const result = await trustBuilder.checkIn(body);
  
  await logChatGPTAction(env, 'trustCheckIn', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Somatic session
personalDevRouter.post("/api/somatic/session", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const somaticHealer = new SomaticHealer(env);
  const result = await somaticHealer.processSession(body);
  
  await logChatGPTAction(env, 'somaticHealingSession', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Media wisdom extraction
personalDevRouter.post("/api/media/extract-wisdom", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const validation = mediaWisdomSchema.safeParse(body);
  
  if (!validation.success) {
    return addCORSToResponse(createErrorResponse(400, "validation_error", validation.error.message));
  }

  const { media_type, title, personal_reaction } = validation.data;
  
  try {
    const extractor = new MediaWisdomExtractor(env);
    const result = await extractor.extractWisdom({ media_type, title, personal_reaction });

    // Ensure result matches the schema format
    const response = {
      extracted_wisdom: result.extracted_wisdom || "No wisdom extracted",
      personal_connections: Array.isArray(result.trust_building_connections) 
        ? result.trust_building_connections 
        : [result.trust_building_connections || "No connections identified"].flat(),
      actionable_takeaways: Array.isArray(result.actionable_insights) 
        ? result.actionable_insights 
        : [result.actionable_insights || "No takeaways identified"].flat(),
      emotional_resonance: result.wisdom_analysis?.emotions || "Neutral",
      related_themes: Array.isArray(result.wisdom_analysis?.growth_themes) 
        ? result.wisdom_analysis.growth_themes 
        : [result.wisdom_analysis?.growth_themes || "General growth"].flat(),
      session_id: crypto.randomUUID(),
      media_type: media_type,
    };

    await logChatGPTAction(env, 'extractMediaWisdom', body, response);
    return addCORSToResponse(createSuccessResponse(response));
  } catch (error) {
    await logChatGPTAction(env, 'extractMediaWisdom', body, null, error);
    return addCORSToResponse(createErrorResponse(500, "extraction_error", error.message));
  }
}));

// Pattern recognition
personalDevRouter.post("/api/patterns/recognize", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const recognizer = new PatternRecognizer(env);
  const result = await recognizer.recognize(body);
  
  await logChatGPTAction(env, 'recognizePatterns', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Standing tall practice
personalDevRouter.post("/api/standing-tall/practice", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const standingTall = new StandingTall(env);
  const result = await standingTall.practice(body);
  
  await logChatGPTAction(env, 'standingTallPractice', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Wisdom synthesis
personalDevRouter.post("/api/wisdom/synthesize", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const aquilCore = new AquilCore(env);
  const result = await aquilCore.synthesizeWisdom(body);
  
  await logChatGPTAction(env, 'synthesizeWisdom', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Daily wisdom synthesis
personalDevRouter.get("/api/wisdom/daily-synthesis", withErrorHandling(async (req, env) => {
  const aquilCore = new AquilCore(env);
  const result = await aquilCore.dailySynthesis();
  
  await logChatGPTAction(env, 'getDailySynthesis', {}, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Energy optimization - simplified implementation
personalDevRouter.post("/api/energy/optimize", withErrorHandling(async (req, env) => {
  const body = await req.json();
  
  // Simplified energy optimization logic
  const result = {
    energy_level: body.current_energy || 5,
    optimization_suggestions: [
      "Take breaks every 90 minutes",
      "Practice deep breathing",
      "Stay hydrated",
      "Get natural light exposure"
    ],
    personalized_tips: [
      "Your energy patterns suggest morning focus time",
      "Consider afternoon movement breaks",
      "Evening wind-down routines support better rest"
    ],
    session_id: body.session_id || crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'optimizeEnergy', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Values clarification
personalDevRouter.post("/api/values/clarify", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const valuesClarifier = new ValuesClarifier(env);
  const result = await valuesClarifier.clarify(body);
  
  await logChatGPTAction(env, 'clarifyValues', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Creativity unleashing
personalDevRouter.post("/api/creativity/unleash", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const creativityUnleasher = new CreativityUnleasher(env);
  const result = await creativityUnleasher.unleash(body);
  
  await logChatGPTAction(env, 'unleashCreativity', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Abundance cultivation
personalDevRouter.post("/api/abundance/cultivate", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const abundanceCultivator = new AbundanceCultivator(env);
  const result = await abundanceCultivator.cultivate(body);
  
  await logChatGPTAction(env, 'cultivateAbundance', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Transition navigation
personalDevRouter.post("/api/transitions/navigate", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const transitionNavigator = new TransitionNavigator(env);
  const result = await transitionNavigator.navigate(body);
  
  await logChatGPTAction(env, 'navigateTransition', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Ancestry healing
personalDevRouter.post("/api/ancestry/heal", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const ancestryHealer = new AncestryHealer(env);
  const result = await ancestryHealer.heal(body);
  
  await logChatGPTAction(env, 'healAncestry', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// Helper function to extract session ID
function extractSessionId(req) {
  return req.headers.get('x-session-id') || 
         req.headers.get('session-id') ||
         new URL(req.url).searchParams.get('session_id');
}

export { personalDevRouter };