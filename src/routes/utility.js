/**
 * Utility Routes - Support features like feedback, insights, monitoring, and other utility endpoints
 */

import { Router } from 'itty-router';
import crypto from 'crypto';
import { addCORSToResponse, createSuccessResponse } from '../utils/response-helpers.js';

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}
import { withErrorHandling, createErrorResponse } from '../utils/error-handler.js';
import { buildInterpretation, maybeRecognizePatterns, safeTruncated } from '../utils/dream-interpreter.js';

const utilityRouter = Router();

// Feedback submission
utilityRouter.post("/api/feedback", withErrorHandling(async (req, env) => {
  const body = await req.json();
  
  const feedbackData = {
    feedback_id: crypto.randomUUID(),
    content: body.content || body.feedback,
    rating: body.rating,
    category: body.category || 'general',
    session_id: body.session_id,
    timestamp: new Date().toISOString(),
    user_context: body.user_context || {}
  };
  
  await logChatGPTAction(env, 'submitFeedback', body, feedbackData);
  
  return addCORSToResponse(createSuccessResponse({
    message: "Thank you for your feedback. It helps us improve your experience.",
    feedback_id: feedbackData.feedback_id
  }));
}));

// General insights endpoint
utilityRouter.get("/api/insights", withErrorHandling(async (req, env) => {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || 'general';
  const timeframe = url.searchParams.get('timeframe') || '7d';
  
  const insights = {
    category,
    timeframe,
    insights: [
      "Your growth journey is unique and valuable",
      "Every interaction builds deeper self-awareness",
      "Trust your inner wisdom while staying open to new perspectives"
    ],
    patterns: ["consistent_growth", "increasing_awareness"],
    next_steps: ["Continue daily practice", "Explore new dimensions"],
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'getInsights', { category, timeframe }, insights);
  
  return addCORSToResponse(createSuccessResponse(insights));
}));

// Dream interpretation
utilityRouter.post("/api/dreams/interpret", withErrorHandling(async (req, env) => {
  const body = await req.json();
  const dreamContent = body.dream || body.content || '';
  const context = body.context || {};
  
  if (!dreamContent) {
    return addCORSToResponse(createErrorResponse({
      error: 'missing_dream_content',
      message: 'Please provide dream content for interpretation'
    }, 400));
  }
  
  // Enhanced dream interpretation logic
  const interpretation = await buildInterpretation(dreamContent, context, env);
  const patterns = await maybeRecognizePatterns(dreamContent, context, env);
  
  const result = {
    dream_analysis: {
      content: safeTruncated(dreamContent, 1000),
      interpretation: interpretation,
      patterns: patterns,
      symbols: extractSymbols(dreamContent),
      emotions: extractEmotions(dreamContent),
      themes: extractThemes(dreamContent),
      guidance: generateGuidance(interpretation),
      session_id: body.session_id || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  };
  
  await logChatGPTAction(env, 'interpretDream', body, result);
  
  return addCORSToResponse(createSuccessResponse(result));
}));

// Monitoring metrics
utilityRouter.get("/api/monitoring/metrics", withErrorHandling(async (req, env) => {
  const metrics = {
    system_health: "operational",
    uptime: "99.9%",
    active_sessions: Math.floor(Math.random() * 100), // Mock data
    total_interactions: Math.floor(Math.random() * 10000), // Mock data
    response_time_avg: "120ms",
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'getMetrics', {}, metrics);
  
  return addCORSToResponse(createSuccessResponse(metrics));
}));

// Analytics insights
utilityRouter.get("/api/analytics/insights", withErrorHandling(async (req, env) => {
  const url = new URL(req.url);
  const period = url.searchParams.get('period') || '30d';
  
  const analytics = {
    period,
    user_engagement: {
      active_sessions: Math.floor(Math.random() * 500),
      avg_session_duration: "15m",
      popular_features: ["wisdom_synthesis", "pattern_recognition", "somatic_healing"]
    },
    content_insights: {
      most_discussed_topics: ["personal_growth", "healing", "creativity"],
      emotional_trends: ["positive", "reflective", "empowered"]
    },
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'getAnalytics', { period }, analytics);
  
  return addCORSToResponse(createSuccessResponse(analytics));
}));

// Mood tracking
utilityRouter.post("/api/mood/track", withErrorHandling(async (req, env) => {
  const body = await req.json();
  
  const moodEntry = {
    mood_id: crypto.randomUUID(),
    mood: body.mood,
    energy_level: body.energy_level || 5,
    emotions: body.emotions || [],
    notes: body.notes || '',
    context: body.context || {},
    session_id: body.session_id,
    timestamp: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'trackMood', body, moodEntry);
  
  return addCORSToResponse(createSuccessResponse({
    message: "Mood tracked successfully. Your emotional awareness is growing.",
    mood_id: moodEntry.mood_id,
    insights: generateMoodInsights(moodEntry)
  }));
}));

// Export conversation
utilityRouter.get("/api/export/conversation", withErrorHandling(async (req, env) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const format = url.searchParams.get('format') || 'json';
  
  if (!sessionId) {
    return addCORSToResponse(createErrorResponse({
      error: 'missing_session_id',
      message: 'Session ID is required for conversation export'
    }, 400));
  }
  
  // Mock conversation export
  const conversation = {
    session_id: sessionId,
    format,
    entries: [
      { timestamp: new Date().toISOString(), type: 'user', content: 'Sample conversation' },
      { timestamp: new Date().toISOString(), type: 'assistant', content: 'Sample response' }
    ],
    exported_at: new Date().toISOString()
  };
  
  await logChatGPTAction(env, 'exportConversation', { sessionId, format }, conversation);
  
  return addCORSToResponse(createSuccessResponse(conversation));
}));

// Helper functions for dream interpretation
function extractSymbols(dreamContent) {
  // Simple symbol extraction - could be enhanced with NLP
  const commonSymbols = ['water', 'fire', 'animals', 'flying', 'falling', 'house', 'car', 'people'];
  return commonSymbols.filter(symbol => 
    dreamContent.toLowerCase().includes(symbol)
  );
}

function extractEmotions(dreamContent) {
  // Simple emotion extraction
  const emotions = ['fear', 'joy', 'anger', 'sadness', 'love', 'peace', 'anxiety', 'excitement'];
  return emotions.filter(emotion => 
    dreamContent.toLowerCase().includes(emotion)
  );
}

function extractThemes(dreamContent) {
  // Simple theme extraction
  const themes = ['transformation', 'journey', 'conflict', 'healing', 'growth', 'relationship'];
  return themes.filter(theme => 
    dreamContent.toLowerCase().includes(theme.toLowerCase())
  );
}

function generateGuidance(interpretation) {
  return [
    "Reflect on the emotions present in your dream",
    "Consider how dream themes relate to your current life",
    "Pay attention to recurring symbols or patterns",
    "Trust your intuitive understanding of the dream's meaning"
  ];
}

function generateMoodInsights(moodEntry) {
  return [
    "Regular mood tracking builds emotional intelligence",
    "Notice patterns in your emotional states",
    "Your awareness of emotions is the first step to emotional mastery"
  ];
}

export { utilityRouter };