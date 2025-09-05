/**
 * Operational Middleware for Aquil Symbolic Engine
 * 
 * Provides rate limiting, request size guards, circuit breakers, and security headers.
 * All features are behind feature flags and fail-open by default.
 */

import { incrementRateLimitExceeded, incrementRequestSizeExceeded, incrementStoreCircuitOpen } from './metrics.js';

// Constants for middleware configuration
const CIRCUIT_BREAKER_TTL = 3600; // 1 hour (in seconds)

/**
 * Canary rollout functionality
 * Determines if a request should receive new middleware based on user/session hash
 * @param {Request} req - Request object
 * @param {Object} env - Environment bindings
 * @returns {boolean} true if request is in canary cohort
 */
function isCanaryRequest(req, env) {
  try {
    // Check if canary is enabled
    const canaryEnabled = env.ENABLE_CANARY === '1' || env.ENABLE_CANARY === 'true';
    if (!canaryEnabled) return false;
    
    // Check kill switch
    const killSwitch = env.DISABLE_NEW_MW === '1' || env.DISABLE_NEW_MW === 'true';
    if (killSwitch) return false;
    
    const canaryPercent = parseInt(env.CANARY_PERCENT || '5', 10);
    if (canaryPercent <= 0) return false;
    
    // Get identifier for consistent hashing (session ID from headers or IP as fallback)
    const sessionId = req.headers.get('x-session-id') || req.headers.get('session-id');
    const userAgent = req.headers.get('user-agent') || '';
    const forwarded = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    
    // Create consistent identifier
    const identifier = sessionId || `${forwarded}-${userAgent.slice(0, 50)}`;
    
    // Simple hash function to determine canary assignment
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const isCanary = Math.abs(hash) % 100 < canaryPercent;
    
    if (isCanary) {
      console.log(`[CANARY] Request ${identifier.slice(0, 20)}... assigned to canary (${canaryPercent}%)`);
    }
    
    return isCanary;
  } catch (error) {
    console.warn('Canary assignment error:', error.message);
    return false; // Fail-safe: not in canary on error
  }
}

/**
 * Token bucket rate limiter using KV store
 * @param {Object} env - Environment bindings
 * @param {string} identifier - Client identifier (IP, session, etc.)
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
async function checkRateLimit(env, identifier) {
  try {
    if (!env.AQUIL_MEMORIES) return { allowed: true, remaining: -1 };
    
    const rps = parseInt(env.RATE_LIMIT_RPS || '10', 10);
    const burst = parseInt(env.RATE_LIMIT_BURST || '20', 10);
    const window = 60; // 1 minute window
    
    const key = `rate_limit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Get current bucket state
    const stored = await env.AQUIL_MEMORIES.get(key, { type: 'json' });
    const bucket = stored || { tokens: burst, lastRefill: now };
    
    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed * (rps / window));
    bucket.tokens = Math.min(burst, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if request is allowed
    const allowed = bucket.tokens > 0;
    if (allowed) {
      bucket.tokens--;
    }
    
    // Store updated bucket state
    await env.AQUIL_MEMORIES.put(key, JSON.stringify(bucket), {
      expirationTtl: window * 2 // Clean up old buckets
    });
    
    return { allowed, remaining: bucket.tokens };
  } catch (error) {
    // Fail-open: if rate limiting fails, allow the request
    console.warn('Rate limit check failed:', error.message);
    return { allowed: true, remaining: -1 };
  }
}

/**
 * Rate limiting middleware
 * @param {Request} req - Request object
 * @param {Object} env - Environment bindings
 * @returns {Response|null} 429 response if rate limited and enabled, null otherwise
 */
export async function rateLimitMiddleware(req, env) {
  try {
    const enableRateLimit = env.ENABLE_RATE_LIMIT === '1' || env.ENABLE_RATE_LIMIT === true;
    
    // Get client identifier (prefer session, fallback to IP)
    const clientIP = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';
    const sessionId = req.headers.get('X-Session-ID') || clientIP;
    
    const { allowed, remaining } = await checkRateLimit(env, sessionId);
    
    if (!allowed) {
      incrementRateLimitExceeded(env, sessionId);
      
      if (enableRateLimit) {
        return new Response(JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please slow down.",
          retryAfter: 60
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Remaining': String(remaining)
          }
        });
      } else {
        // Log but continue (fail-open)
        console.log(`[RATE_LIMIT] Exceeded for ${sessionId}, but continuing (ENABLE_RATE_LIMIT=0)`);
      }
    }
    
    return null; // Continue processing
  } catch (error) {
    // Fail-open: if middleware fails, continue processing
    console.warn('Rate limit middleware error:', error.message);
    return null;
  }
}

/**
 * Request size guard middleware
 * @param {Request} req - Request object
 * @param {Object} env - Environment bindings
 * @returns {Response|null} 413 response if oversized and enabled, null otherwise
 */
export async function requestSizeMiddleware(req, env) {
  try {
    const enableSizeCap = env.ENABLE_REQ_SIZE_CAP === '1' || env.ENABLE_REQ_SIZE_CAP === true;
    const maxSize = parseInt(env.REQ_SIZE_BYTES || '2000000', 10); // 2MB default
    
    const contentLength = req.headers.get('Content-Length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      
      if (size > maxSize) {
        incrementRequestSizeExceeded(env);
        
        if (enableSizeCap) {
          return new Response(JSON.stringify({
            error: "Request too large",
            message: `Request size ${size} bytes exceeds limit of ${maxSize} bytes`,
            maxSize: maxSize
          }), {
            status: 413,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Warn but continue (fail-open)
          console.warn(`[REQ_SIZE] Request size ${size} exceeds ${maxSize}, but continuing (ENABLE_REQ_SIZE_CAP=0)`);
        }
      }
    }
    
    return null; // Continue processing
  } catch (error) {
    // Fail-open: if middleware fails, continue processing
    console.warn('Request size middleware error:', error.message);
    return null;
  }
}

/**
 * Circuit breaker for store operations
 * @param {Object} env - Environment bindings
 * @param {string} store - Store name (d1, kv, r2, vector)
 * @returns {Promise<{open: boolean, shouldSkip: boolean}>}
 */
export async function checkStoreCircuitBreaker(env, store) {
  try {
    const enableBreaker = env.ENABLE_STORE_BREAKER === '1' || env.ENABLE_STORE_BREAKER === true;
    const threshold = parseInt(env.BREAKER_THRESHOLD || '5', 10);
    const windowSeconds = 60;
    const cooldownSeconds = 300; // 5 minutes
    
    if (!env.AQUIL_MEMORIES) return { open: false, shouldSkip: false };
    
    const key = `circuit_breaker:${store}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Get circuit breaker state
    const stored = await env.AQUIL_MEMORIES.get(key, { type: 'json' });
    const breaker = stored || { 
      failures: 0, 
      windowStart: now, 
      isOpen: false, 
      openedAt: null 
    };
    
    // Reset window if expired
    if (now - breaker.windowStart > windowSeconds) {
      breaker.failures = 0;
      breaker.windowStart = now;
    }
    
    // Check if cooldown period has passed
    if (breaker.isOpen && breaker.openedAt && (now - breaker.openedAt) > cooldownSeconds) {
      breaker.isOpen = false;
      breaker.failures = 0;
      breaker.openedAt = null;
    }
    
    const shouldSkip = enableBreaker && breaker.isOpen;
    
    return { open: breaker.isOpen, shouldSkip };
  } catch (error) {
    // Fail-open: if circuit breaker check fails, allow operation
    console.warn('Circuit breaker check failed:', error.message);
    return { open: false, shouldSkip: false };
  }
}

/**
 * Record store operation failure for circuit breaker
 * @param {Object} env - Environment bindings
 * @param {string} store - Store name
 */
export async function recordStoreFailure(env, store) {
  try {
    const enableBreaker = env.ENABLE_STORE_BREAKER === '1' || env.ENABLE_STORE_BREAKER === true;
    const threshold = parseInt(env.BREAKER_THRESHOLD || '5', 10);
    
    if (!env.AQUIL_MEMORIES || !enableBreaker) return;
    
    const key = `circuit_breaker:${store}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Get current state
    const stored = await env.AQUIL_MEMORIES.get(key, { type: 'json' });
    const breaker = stored || { 
      failures: 0, 
      windowStart: now, 
      isOpen: false, 
      openedAt: null 
    };
    
    // Increment failure count
    breaker.failures++;
    
    // Trip breaker if threshold exceeded
    if (breaker.failures >= threshold && !breaker.isOpen) {
      breaker.isOpen = true;
      breaker.openedAt = now;
      incrementStoreCircuitOpen(env, store);
      console.warn(`[CIRCUIT_BREAKER] Opened for store ${store} after ${breaker.failures} failures`);
    }
    
    // Store updated state
    await env.AQUIL_MEMORIES.put(key, JSON.stringify(breaker), {
      expirationTtl: CIRCUIT_BREAKER_TTL
    });
  } catch (error) {
    // Graceful degradation - circuit breaker state persistence failure shouldn't halt operations
    console.warn('Circuit breaker state persistence failed:', error.message, {
      storeId: storeId,
      failureCount: breaker.failureCount
    });
  }
}

/**
 * Add CORS headers to response
 * @param {Response} response - Response object
 * @param {Object} env - Environment bindings
 * @returns {Response} Response with CORS headers
 */
export function addCORSHeaders(response, env) {
  try {
    const allowedOrigins = env.CORS_ALLOW_ORIGINS?.split(',') || [];
    
    if (allowedOrigins.length === 0) {
      return response;
    }
    
    // For now, return the response as-is since we don't have the request origin
    // This would need to be called from the route handler with access to the request
    return response;
  } catch (error) {
    console.warn('CORS header addition failed:', error.message);
    return response;
  }
}

/**
 * Add security headers to response
 * @param {Response} response - Response object
 * @param {Object} env - Environment bindings
 * @returns {Response} Response with security headers
 */
export function addSecurityHeaders(response, env) {
  try {
    const enableSecurityHeaders = env.ENABLE_SECURITY_HEADERS === '1' || env.ENABLE_SECURITY_HEADERS === true;
    const enableHSTS = env.ENABLE_HSTS === '1' || env.ENABLE_HSTS === true;
    
    if (!enableSecurityHeaders) {
      return response;
    }
    
    const newHeaders = new Headers(response.headers);
    
    // Add security headers
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('Referrer-Policy', 'no-referrer');
    
    // Add HSTS only if explicitly enabled
    if (enableHSTS) {
      newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (error) {
    console.warn('Security headers addition failed:', error.message);
    return response;
  }
}

/**
 * Apply operational middleware and security headers to response
 * @param {Request} req - Request object
 * @param {Object} env - Environment bindings
 * @param {Function} handler - Route handler function
 * @returns {Promise<Response>} Response with middleware applied
 */
export async function withOpsMiddleware(req, env, handler) {
  try {
    // Check canary assignment and kill switch
    const inCanary = isCanaryRequest(req, env);
    const killSwitch = env.DISABLE_NEW_MW === '1' || env.DISABLE_NEW_MW === 'true';
    
    // Apply rate limiting middleware (only for canary users, unless globally enabled)
    const rateLimitEnabled = env.ENABLE_RATE_LIMIT === '1' || (inCanary && !killSwitch);
    if (rateLimitEnabled) {
      const rateLimitResponse = await rateLimitMiddleware(req, env);
      if (rateLimitResponse) {
        return addSecurityHeaders(rateLimitResponse, env);
      }
    }
    
    // Apply request size middleware (only for canary users, unless globally enabled)
    const sizeLimitEnabled = env.ENABLE_REQ_SIZE_CAP === '1' || (inCanary && !killSwitch);
    if (sizeLimitEnabled) {
      const sizeResponse = await requestSizeMiddleware(req, env);
      if (sizeResponse) {
        return addSecurityHeaders(sizeResponse, env);
      }
    }
    
    // Circuit breaker is checked per-store, but we can add a global canary flag
    if (inCanary && !killSwitch) {
      // Store canary assignment in request context for circuit breaker checks
      req.canaryEnabled = true;
    }
    
    // Execute the handler
    let response = await handler();
    
    // Apply security headers
    response = addSecurityHeaders(response, env);
    
    return response;
  } catch (error) {
    console.warn('Ops middleware error:', error.message);
    // Fall back to executing handler without middleware
    try {
      return await handler();
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
}