/**
 * Simple ops middleware wrapper for minimal integration
 */

import { 
  rateLimitMiddleware, 
  requestSizeMiddleware, 
  addSecurityHeaders 
} from './ops-middleware.js';
import { getCORSHeaders } from './cors.js';

/**
 * Apply basic ops middleware to a route handler
 * @param {Function} handler - Original route handler
 * @returns {Function} Wrapped handler with middleware
 */
export function withOpsChecks(handler) {
  return async (req, env) => {
    try {
      // Rate limiting check
      const rateLimitResponse = await rateLimitMiddleware(req, env);
      if (rateLimitResponse) {
        return addSecurityHeaders(rateLimitResponse, env);
      }
      
      // Request size check
      const sizeResponse = await requestSizeMiddleware(req, env);
      if (sizeResponse) {
        return addSecurityHeaders(sizeResponse, env);
      }
      
      // Execute original handler
      let response = await handler(req, env);
      
      // Apply security headers
      response = addSecurityHeaders(response, env);
      
      // Update CORS headers if needed
      const corsHeaders = getCORSHeaders(req, env);
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
      
    } catch (error) {
      console.warn('Ops middleware error:', error.message);
      
      // Fall back to original handler
      try {
        return await handler(req, env);
      } catch (handlerError) {
        return new Response(JSON.stringify({
          error: "Internal server error",
          message: "Request processing failed"
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  };
}