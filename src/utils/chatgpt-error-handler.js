/**
 * ChatGPT Actions Error Handling Enhancement
 * Provides intelligent error recovery and user-friendly responses
 */

export class ChatGPTActionsErrorHandler {
  constructor() {
    this.errorPatterns = new Map([
      ['RATE_LIMIT', { retry: true, delay: 1000, userMessage: 'Taking a brief moment to ensure quality...' }],
      ['NETWORK_ERROR', { retry: true, delay: 500, userMessage: 'Connection hiccup, retrying...' }],
      ['VALIDATION_ERROR', { retry: false, userMessage: 'Let me help you with the correct format...' }],
      ['SYSTEM_OVERLOAD', { retry: true, delay: 2000, userMessage: 'System is busy, please wait...' }]
    ]);
  }
  
  async handleError(error, operationId, requestData, attempt = 1) {
    const errorType = this.classifyError(error);
    const pattern = this.errorPatterns.get(errorType);
    
    // Log error for monitoring
    console.error(`ChatGPT Action Error: ${operationId}`, {
      error: error.message,
      type: errorType,
      attempt,
      requestData: this.sanitizeForLogging(requestData)
    });
    
    // For ChatGPT Actions, always return a valid response
    if (pattern && pattern.retry && attempt < 3) {
      await this.delay(pattern.delay);
      // Return retry instruction for ChatGPT
      return new Response(JSON.stringify({
        error: false, // Don't trigger ChatGPT error handling
        status: 'retrying',
        message: pattern.userMessage,
        retry_after: pattern.delay,
        attempt: attempt + 1
      }), {
        status: 200, // Always 200 for ChatGPT
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Final error response for ChatGPT
    return new Response(JSON.stringify({
      error: false, // Don't trigger ChatGPT error handling
      status: 'graceful_degradation',
      message: this.getUserFriendlyMessage(errorType, operationId),
      alternative_action: this.suggestAlternative(operationId),
      support_info: {
        error_id: `${operationId}-${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('overload') || message.includes('capacity')) {
      return 'SYSTEM_OVERLOAD';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  getUserFriendlyMessage(errorType, operationId) {
    const messages = {
      'RATE_LIMIT': 'I need a moment to process this thoughtfully. Let me try a different approach.',
      'NETWORK_ERROR': 'Having trouble connecting. Let me try another way to help you.',
      'VALIDATION_ERROR': 'I need to adjust how I\'m processing your request. Let me try again.',
      'SYSTEM_OVERLOAD': 'The system is quite busy right now. Let me offer an alternative approach.',
      'UNKNOWN_ERROR': 'I encountered an unexpected issue. Let me try a different way to assist you.'
    };
    
    return messages[errorType] || messages['UNKNOWN_ERROR'];
  }
  
  suggestAlternative(operationId) {
    const alternatives = {
      'trustCheckIn': 'I can still offer trust-building insights through conversation',
      'recognizePatterns': 'Let\'s explore patterns through guided discussion',
      'synthesizeWisdom': 'I can help synthesize insights conversationally',
      'somaticHealingSession': 'We can do some simple breathing exercises together',
      'navigateTransitions': 'Let\'s talk through your transition step by step'
    };
    
    return alternatives[operationId] || 'Let\'s continue our conversation in a different way';
  }
  
  sanitizeForLogging(data) {
    // Remove sensitive data for logging
    const sanitized = { ...data };
    delete sanitized.personal_info;
    delete sanitized.private_thoughts;
    return sanitized;
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Enhanced wrapper for ChatGPT Actions
export function withChatGPTErrorHandling(handler) {
  const errorHandler = new ChatGPTActionsErrorHandler();
  
  return async (request, env, ctx) => {
    try {
      return await handler(request, env, ctx);
    } catch (error) {
      const url = new URL(request.url);
      const operationId = url.pathname.split('/').pop();
      const requestData = request.method === 'POST' ? await request.clone().json() : {};
      
      return await errorHandler.handleError(error, operationId, requestData);
    }
  };
}
