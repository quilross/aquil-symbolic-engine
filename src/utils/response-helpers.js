/**
 * Standardized response utilities for Aquil Symbolic Engine
 * Provides consistent JSON responses and CORS handling
 */

import { corsHeaders } from './cors.js';
import { logMetamorphicEvent } from '../ark/core.js';

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data, options = {}) {
  const {
    status = 200,
    message = null,
    metadata = {},
    sessionId = null,
    timestamp = new Date().toISOString()
  } = options;

  const response = {
    success: true,
    timestamp,
    ...(message && { message }),
    ...(sessionId && { session_id: sessionId }),
    data,
    ...(Object.keys(metadata).length > 0 && { metadata })
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create a standardized error response (lighter version for simple cases)
 */
export function createSimpleErrorResponse(message, status = 400, category = 'general') {
  return new Response(JSON.stringify({
    success: false,
    error: {
      message,
      category,
      timestamp: new Date().toISOString()
    }
  }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORSPreflight() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Add CORS headers to any response
 */
export function addCORSToResponse(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create autonomous action response with enhanced metadata
 */
export async function createAutonomousResponse(actionData, env = null, options = {}) {
  const {
    sessionId = null,
    originalTrigger = null,
    confidence = null
  } = options;

  const response = {
    success: true,
    autonomous: true,
    timestamp: new Date().toISOString(),
    action: actionData.action || 'unknown',
    trigger_type: actionData.trigger_type || 'keyword',
    ...(confidence && { confidence }),
    ...(originalTrigger && { original_trigger: originalTrigger }),
    ...(sessionId && { session_id: sessionId }),
    data: actionData
  };

  // Log autonomous response if environment available
  if (env) {
    try {
      await logMetamorphicEvent(env, {
        kind: 'autonomous_response',
        detail: {
          action: actionData.action,
          trigger_type: actionData.trigger_type,
          confidence: confidence || 'unknown',
          response_generated: true
        },
        signal_strength: 'medium',
        session_id: sessionId,
        voice: 'system',
        tags: ['autonomous', 'response', actionData.action]
      });
    } catch (loggingError) {
      console.warn('Failed to log autonomous response:', loggingError);
    }
  }

  return createSuccessResponse(response, { sessionId });
}

/**
 * Create health check response with system status
 */
export function createHealthResponse(healthData, overallStatus = 'healthy') {
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 206 : 503;

  return createSuccessResponse({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    ...healthData
  }, { status: statusCode });
}

/**
 * Create paginated response for log retrieval
 */
export function createPaginatedResponse(items, options = {}) {
  const {
    limit = 20,
    offset = 0,
    total = items.length,
    hasMore = false,
    sessionId = null
  } = options;

  return createSuccessResponse({
    items,
    pagination: {
      limit,
      offset,
      total,
      count: items.length,
      has_more: hasMore
    }
  }, { sessionId });
}

/**
 * Create wisdom synthesis response with enhanced metadata
 */
export async function createWisdomResponse(wisdomData, context = {}, env = null) {
  const {
    sessionId = null,
    voice = 'oracle',
    synthesisType = 'general',
    frameworks = [],
    userInput = null
  } = context;

  const response = {
    wisdom_synthesis: wisdomData,
    synthesis_metadata: {
      type: synthesisType,
      voice_used: voice,
      frameworks_integrated: frameworks,
      synthesis_timestamp: new Date().toISOString(),
      ...(userInput && { input_length: userInput.length })
    }
  };

  // Log wisdom synthesis if environment available
  if (env) {
    try {
      await logMetamorphicEvent(env, {
        kind: 'wisdom_synthesis',
        detail: {
          synthesis_type: synthesisType,
          voice_used: voice,
          frameworks_count: frameworks.length,
          wisdom_generated: true
        },
        signal_strength: 'high',
        session_id: sessionId,
        voice: voice,
        tags: ['wisdom', 'synthesis', synthesisType]
      });
    } catch (loggingError) {
      console.warn('Failed to log wisdom synthesis:', loggingError);
    }
  }

  return createSuccessResponse(response, { sessionId });
}

/**
 * Create pattern recognition response
 */
export async function createPatternResponse(patternData, context = {}, env = null) {
  const {
    sessionId = null,
    patternType = 'behavioral',
    confidence = null,
    timeframe = 'recent'
  } = context;

  const response = {
    patterns: patternData,
    pattern_metadata: {
      type: patternType,
      confidence_level: confidence,
      analysis_timeframe: timeframe,
      patterns_found: Array.isArray(patternData) ? patternData.length : 1,
      analysis_timestamp: new Date().toISOString()
    }
  };

  // Log pattern recognition if environment available
  if (env) {
    try {
      await logMetamorphicEvent(env, {
        kind: 'pattern_recognition',
        detail: {
          pattern_type: patternType,
          confidence: confidence || 'unknown',
          timeframe,
          patterns_count: response.pattern_metadata.patterns_found
        },
        signal_strength: 'medium',
        session_id: sessionId,
        voice: 'scientist',
        tags: ['patterns', patternType, 'analysis']
      });
    } catch (loggingError) {
      console.warn('Failed to log pattern recognition:', loggingError);
    }
  }

  return createSuccessResponse(response, { sessionId });
}

/**
 * Create session initialization response with continuity data
 */
export function createSessionInitResponse(sessionData, options = {}) {
  const {
    sessionId = null,
    continuityLogs = [],
    userProfile = null
  } = options;

  return createSuccessResponse({
    session_initialized: true,
    session_id: sessionId,
    continuity: {
      recent_logs: continuityLogs,
      log_count: continuityLogs.length,
      ...(userProfile && { user_profile: userProfile })
    },
    ark_status: {
      version: '2.0.0',
      autonomous_features: true,
      voice_system: true,
      logging_active: true
    }
  }, { sessionId });
}

/**
 * Create commitment tracking response
 */
export async function createCommitmentResponse(commitmentData, context = {}, env = null) {
  const {
    sessionId = null,
    action = 'created', // created, updated, progress, completed
    commitmentId = null
  } = context;

  const response = {
    commitment: commitmentData,
    commitment_metadata: {
      action,
      commitment_id: commitmentId,
      timestamp: new Date().toISOString(),
      tracking_active: true
    }
  };

  // Log commitment action if environment available
  if (env) {
    try {
      await logMetamorphicEvent(env, {
        kind: 'commitment_action',
        detail: {
          action,
          commitment_id: commitmentId,
          commitment_type: commitmentData.type || 'general'
        },
        signal_strength: 'medium',
        session_id: sessionId,
        voice: 'strategist',
        tags: ['commitment', action, commitmentData.type || 'general']
      });
    } catch (loggingError) {
      console.warn('Failed to log commitment action:', loggingError);
    }
  }

  return createSuccessResponse(response, { sessionId });
}

/**
 * Create fallback response when primary systems are unavailable
 */
export function createFallbackResponse(originalIntent, fallbackGuidance, options = {}) {
  const {
    sessionId = null,
    systemStatus = 'degraded',
    alternativeActions = []
  } = options;

  return createSuccessResponse({
    fallback_mode: true,
    system_status: systemStatus,
    original_intent: originalIntent,
    guidance: fallbackGuidance,
    alternative_actions: alternativeActions,
    message: "Your growth journey continues even when systems are offline. Trust your inner wisdom."
  }, { 
    status: 206, // Partial Content
    sessionId,
    metadata: { fallback_active: true }
  });
}

/**
 * Wrapper to ensure all responses have consistent structure
 */
export function standardizeResponse(handler) {
  return async (request, env, context = {}) => {
    const result = await handler(request, env, context);
    
    // If result is already a Response object, return as-is
    if (result instanceof Response) {
      return addCORSToResponse(result);
    }
    
    // If result is data, wrap in success response
    return createSuccessResponse(result, context);
  };
}

/**
 * Extract session ID from request headers or body
 */
export function extractSessionId(request, body = null) {
  // Try header first
  let sessionId = request.headers.get('x-session-id');
  
  // Try body if no header
  if (!sessionId && body && typeof body === 'object') {
    sessionId = body.session_id || body.sessionId;
  }
  
  // Generate new session ID if none found
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return sessionId;
}

/**
 * Create monitoring metrics response
 */
export function createMetricsResponse(metricsData, systemHealth = 'optimal') {
  return createSuccessResponse({
    system_health: systemHealth,
    metrics: metricsData,
    monitoring: {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      status: systemHealth
    }
  });
}
