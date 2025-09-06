/**
 * CORS utilities for Aquil's Cloudflare Workers
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, X-API-Key, Idempotency-Key",
  "Access-Control-Max-Age": "86400",
};

export function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function addCORSHeaders(response) {
  Object.keys(corsHeaders).forEach((key) => {
    response.headers.set(key, corsHeaders[key]);
  });
  return response;
}

/**
 * Enhanced CORS handling with origin checking
 * @param {Request} req - Request object
 * @param {Object} env - Environment bindings
 * @returns {Object} CORS headers with origin checking
 */
export function getCORSHeaders(req, env) {
  try {
    const allowedOrigins = env.CORS_ALLOW_ORIGINS?.split(',').map(o => o.trim()) || [];
    
    if (allowedOrigins.length === 0) {
      return corsHeaders; // Fall back to default * origin
    }
    
    const origin = req.headers.get('Origin');
    if (origin && allowedOrigins.includes(origin)) {
      return {
        ...corsHeaders,
        "Access-Control-Allow-Origin": origin
      };
    }
    
    // If specific origins are configured but this origin isn't allowed, deny
    return {
      ...corsHeaders,
      "Access-Control-Allow-Origin": "null"
    };
  } catch (error) {
    console.warn('CORS header generation failed:', error.message);
    return corsHeaders; // Fail-open to default headers
  }
}
