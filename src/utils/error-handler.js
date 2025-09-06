/**
 * Centralized error handling for Aquil Symbolic Engine
 * Integrates with ARK logging system for complete traceability
 */

import { logMetamorphicEvent } from '../ark/core.js';
import { corsHeaders } from './cors.js';
import { safeLog } from './gpt-compat.js';

/**
 * Categorize errors for better debugging and monitoring
 */
function categorizeError(error) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') return 'network';
  if (error.code?.includes('SQL') || error.message?.includes('database')) return 'database';
  if (error.name === 'ValidationError' || error.message?.includes('validation')) return 'validation';
  if (error.name === 'SyntaxError' || error.message?.includes('JSON')) return 'parsing';
  if (error.code === 'ENOENT' || error.message?.includes('not found')) return 'not_found';
  if (error.message?.includes('timeout')) return 'timeout';
  if (error.message?.includes('rate limit')) return 'rate_limit';
  if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) return 'auth';
  return 'unknown';
}

/**
 * Generate user-friendly error messages based on category
 */
function generateUserMessage(error, category) {
  const userMessages = {
    network: "Connection issue - please try again in a moment.",
    database: "Data storage temporarily unavailable. Your request is still valuable.",
    validation: "Request format needs adjustment. Please check your input.",
    parsing: "Data format issue. Please verify your request structure.",
    not_found: "Requested resource not available.",
    timeout: "Request took too long - please try again.",
    rate_limit: "Too many requests - please wait a moment before trying again.",
    auth: "Authentication required or insufficient permissions.",
    unknown: "Unexpected issue occurred. Your input is still meaningful."
  };

  return userMessages[category] || userMessages.unknown;
}

/**
 * Enhanced error handler with ARK integration
 */
export async function handleError(error, context = {}, env = null) {
  const {
    endpoint = 'unknown',
    method = 'unknown',
    sessionId = null,
    userId = 'system',
    requestBody = null,
    userInput = null
  } = context;

  const category = categorizeError(error);
  const timestamp = new Date().toISOString();
  const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const traceId = `trace_${errorId}`;

  // Create comprehensive error log with structured format
  const errorLog = {
    id: errorId,
    timestamp,
    category,
    message: error.message || 'Unknown error',
    stack: error.stack,
    endpoint,
    method,
    sessionId,
    userId,
    userInput: userInput ? userInput.substring(0, 200) : null, // Truncate for privacy
    requestBodySize: requestBody ? JSON.stringify(requestBody).length : 0,
    severity: determineSeverity(error, category),
    
    // Enhanced observability metadata
    observability: {
      error_id: errorId,
      trace_id: traceId,
      error_code: generateStructuredErrorCode(category, error),
      correlation_id: context.correlationId || traceId,
      environment: env?.ENV || env?.ENVIRONMENT || 'unknown',
      service: 'aquil-symbolic-engine',
      error_context: {
        endpoint: endpoint,
        method: method,
        user_agent: context.userAgent || null,
        ip_address: context.ipAddress || null
      }
    }
  };

  // Log to ARK system if environment available
  if (env) {
    // Use safe logging to prevent failures from halting execution in GPT_COMPAT_MODE
    await safeLog(env, async () => {
      await logMetamorphicEvent(env, {
        kind: 'system_error',
        detail: {
          error_id: errorId,
          category,
          endpoint,
          message: error.message,
          severity: errorLog.severity,
          user_impact: category === 'network' ? 'temporary' : 'functional',
          trace_id: traceId,
          error_code: errorLog.observability.error_code
        },
        signal_strength: errorLog.severity === 'critical' ? 'high' : 'medium',
        session_id: sessionId,
        voice: 'system',
        tags: ['error', category, endpoint.replace('/api/', ''), `trace:${traceId}`]
      });
    });
  }

  // Console log for immediate debugging with structured format
  console.error(`[${errorId}] ${category.toUpperCase()} ERROR:`, {
    message: error.message,
    endpoint,
    sessionId,
    timestamp,
    trace_id: traceId,
    error_code: errorLog.observability.error_code,
    severity: errorLog.severity
  });

  // Return structured error response
  return {
    errorId,
    category,
    userMessage: generateUserMessage(error, category),
    technicalMessage: error.message,
    timestamp,
    endpoint,
    sessionId,
    severity: errorLog.severity,
    fallbackGuidance: generateFallbackGuidance(category, endpoint),
    
    // Enhanced observability data
    observability: errorLog.observability
  };
}

/**
 * Determine error severity for prioritization
 */
function determineSeverity(error, category) {
  if (category === 'database' && error.message?.includes('connection')) return 'critical';
  if (category === 'network' && error.code === 'ECONNREFUSED') return 'high';
  if (category === 'auth') return 'medium';
  if (category === 'validation' || category === 'parsing') return 'low';
  if (category === 'not_found') return 'low';
  return 'medium';
}

/**
 * Generate fallback guidance for users when systems fail
 */
function generateFallbackGuidance(category, endpoint) {
  const guidanceMap = {
    database: {
      message: "Your insights and growth continue even when storage is offline.",
      suggestions: [
        "Trust your inner knowing - it doesn't depend on external systems",
        "Journal your thoughts to capture this moment",
        "Your awareness itself is transformative"
      ]
    },
    network: {
      message: "Connection issues don't interrupt your inner wisdom.",
      suggestions: [
        "Take this pause as an invitation to check in with yourself",
        "What is your body telling you right now?",
        "Sometimes the most important insights come in quiet moments"
      ]
    },
    validation: {
      message: "Every attempt to connect and grow matters.",
      suggestions: [
        "Your intention to engage with your growth is already meaningful",
        "Try rephrasing your request in your own words",
        "What feels most important to explore right now?"
      ]
    },
    default: {
      message: "Technical issues don't diminish your inner wisdom.",
      suggestions: [
        "Your growth journey continues regardless of system status",
        "Trust what you already know",
        "This moment of pause might have its own wisdom"
      ]
    }
  };

  return guidanceMap[category] || guidanceMap.default;
}

/**
 * Create standardized error response for API endpoints
 */
export function createErrorResponse(errorData, statusCode = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: {
      id: errorData.errorId,
      message: errorData.userMessage,
      category: errorData.category,
      timestamp: errorData.timestamp,
      session_id: errorData.sessionId
    },
    fallback_guidance: errorData.fallbackGuidance,
    technical_details: {
      endpoint: errorData.endpoint,
      severity: errorData.severity
    }
  }), {
    status: statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Wrapper for async endpoint handlers with automatic error handling
 */
export function withErrorHandling(handler) {
  return async (request, env, context = {}) => {
    try {
      return await handler(request, env, context);
    } catch (error) {
      const errorContext = {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        sessionId: request.headers.get('x-session-id') || context.sessionId,
        userId: context.userId || 'anonymous'
      };

      // Try to extract user input from request
      try {
        if (request.method === 'POST') {
          const body = await request.clone().json();
          errorContext.requestBody = body;
          errorContext.userInput = body.payload?.content || body.content || body.message;
        }
      } catch (bodyError) {
        // Ignore body parsing errors in error handler
      }

      const errorData = await handleError(error, errorContext, env);
      
      // Determine appropriate HTTP status code
      const statusCode = getHttpStatusFromCategory(errorData.category);
      
      return createErrorResponse(errorData, statusCode);
    }
  };
}

/**
 * Map error categories to appropriate HTTP status codes
 */
function getHttpStatusFromCategory(category) {
  const statusMap = {
    validation: 400,
    parsing: 400,
    not_found: 404,
    auth: 401,
    rate_limit: 429,
    timeout: 408,
    database: 503,
    network: 503,
    unknown: 500
  };
  
  return statusMap[category] || 500;
}

/**
 * Health check error handler for monitoring endpoints
 */
export async function handleHealthCheckError(error, env) {
  const errorData = await handleError(error, {
    endpoint: '/api/health',
    method: 'GET',
    sessionId: 'health-check'
  }, env);

  return {
    status: 'error',
    error: errorData.category,
    message: errorData.technicalMessage,
    timestamp: errorData.timestamp,
    severity: errorData.severity,
    trace_id: errorData.observability.trace_id,
    error_code: errorData.observability.error_code
  };
}

/**
 * Generate structured error codes for observability and monitoring
 */
function generateStructuredErrorCode(category, error) {
  const errorType = error.name || 'Error';
  const prefix = category.toUpperCase();
  
  // Create specific error codes based on patterns
  if (category === 'database') {
    if (error.message?.includes('connection')) return `${prefix}_CONNECTION_FAILED`;
    if (error.message?.includes('timeout')) return `${prefix}_TIMEOUT`;
    if (error.message?.includes('constraint')) return `${prefix}_CONSTRAINT_VIOLATION`;
    return `${prefix}_OPERATION_FAILED`;
  }
  
  if (category === 'validation') {
    if (error.message?.includes('required')) return `${prefix}_REQUIRED_FIELD`;
    if (error.message?.includes('format')) return `${prefix}_INVALID_FORMAT`;
    return `${prefix}_VALIDATION_FAILED`;
  }
  
  if (category === 'auth') {
    if (error.message?.includes('unauthorized')) return `${prefix}_UNAUTHORIZED`;
    if (error.message?.includes('forbidden')) return `${prefix}_FORBIDDEN`;
    return `${prefix}_AUTHENTICATION_FAILED`;
  }
  
  if (category === 'network') {
    if (error.message?.includes('timeout')) return `${prefix}_TIMEOUT`;
    if (error.message?.includes('refused')) return `${prefix}_CONNECTION_REFUSED`;
    return `${prefix}_REQUEST_FAILED`;
  }
  
  // Default structured code
  return `${prefix}_${errorType.toUpperCase()}_ERROR`;
}
