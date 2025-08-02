/**
 * Security and Authentication Module
 * Handles authentication, authorization, rate limiting, and security measures
 */

import { Utils } from './utils.js';

export class Security {
  constructor() {
    this.rateStore = new Map();
    this.suspiciousActivity = new Map();
  }

  /**
   * Authenticate request with bearer token
   * @param {Request} request - HTTP request
   * @param {Object} env - Environment variables
   * @returns {Object} Authentication result
   */
  authenticateRequest(request, env) {
    const auth = request.headers.get('Authorization') || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer') {
      return {
        authenticated: false,
        error: 'Invalid authorization scheme. Use Bearer token.',
        status: 401
      };
    }

    if (!token) {
      return {
        authenticated: false,
        error: 'Missing authentication token',
        status: 401
      };
    }

    // Sanitize token
    const sanitizedToken = Utils.sanitizeInput(token);

    // Check against valid tokens
    const isValidUserToken = env.API_TOKEN && sanitizedToken === env.API_TOKEN;
    const isValidAdminToken = env.API_TOKEN_ADMIN && sanitizedToken === env.API_TOKEN_ADMIN;

    if (!isValidUserToken && !isValidAdminToken) {
      this.logSuspiciousActivity(request, 'invalid_token_attempt');
      return {
        authenticated: false,
        error: 'Invalid authentication token',
        status: 401
      };
    }

    return {
      authenticated: true,
      token: sanitizedToken,
      isAdmin: isValidAdminToken,
      isUser: isValidUserToken
    };
  }

  /**
   * Check rate limiting for request
   * @param {Request} request - HTTP request
   * @param {number} maxRequests - Maximum requests per window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit result
   */
  checkRateLimit(request, maxRequests = 100, windowMs = 60000) {
    const clientId = this.getClientIdentifier(request);
    const allowed = Utils.checkRateLimit(clientId, maxRequests, windowMs, this.rateStore);

    if (!allowed) {
      this.logSuspiciousActivity(request, 'rate_limit_exceeded');
      return {
        allowed: false,
        error: 'Rate limit exceeded. Please slow down.',
        status: 429
      };
    }

    return { allowed: true };
  }

  /**
   * Validate admin permissions for sensitive operations
   * @param {string} token - Authentication token
   * @param {Object} env - Environment variables
   * @returns {boolean} True if admin token
   */
  requireAdminAccess(token, env) {
    return token === env.API_TOKEN_ADMIN;
  }

  /**
   * Get client identifier for rate limiting
   * @param {Request} request - HTTP request
   * @returns {string} Client identifier
   */
  getClientIdentifier(request) {
    // Use CF-Connecting-IP header if available (Cloudflare Workers)
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               request.headers.get('X-Real-IP') ||
               'unknown';

    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const userId = request.headers.get('X-User-Id') || '';

    // Create a composite identifier
    return `${ip}:${userId}:${this.hashString(userAgent)}`;
  }

  /**
   * Hash string for identifier creation
   * @param {string} str - String to hash
   * @returns {string} Simple hash
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Log suspicious activity
   * @param {Request} request - HTTP request
   * @param {string} activityType - Type of suspicious activity
   */
  logSuspiciousActivity(request, activityType) {
    const clientId = this.getClientIdentifier(request);
    const timestamp = new Date().toISOString();

    if (!this.suspiciousActivity.has(clientId)) {
      this.suspiciousActivity.set(clientId, []);
    }

    const activities = this.suspiciousActivity.get(clientId);
    activities.push({
      type: activityType,
      timestamp,
      path: new URL(request.url).pathname,
      userAgent: request.headers.get('User-Agent')
    });

    // Keep only last 10 activities per client
    if (activities.length > 10) {
      activities.splice(0, activities.length - 10);
    }

    this.suspiciousActivity.set(clientId, activities);

    // Log to console for monitoring
    Utils.log('warn', 'Suspicious activity detected', {
      clientId,
      activityType,
      path: new URL(request.url).pathname
    });
  }

  /**
   * Check if client is exhibiting suspicious patterns
   * @param {Request} request - HTTP request
   * @returns {Object} Suspicion check result
   */
  checkSuspiciousActivity(request) {
    const clientId = this.getClientIdentifier(request);
    const activities = this.suspiciousActivity.get(clientId) || [];

    // Check for patterns that might indicate abuse
    const recentActivities = activities.filter(activity =>
      Date.now() - new Date(activity.timestamp).getTime() < 300000 // Last 5 minutes
    );

    const invalidTokenAttempts = recentActivities.filter(a => a.type === 'invalid_token_attempt').length;
    const rateLimitExceeded = recentActivities.filter(a => a.type === 'rate_limit_exceeded').length;

    // Flag as suspicious if multiple bad attempts
    const isSuspicious = invalidTokenAttempts >= 3 || rateLimitExceeded >= 2;

    if (isSuspicious) {
      return {
        suspicious: true,
        reason: invalidTokenAttempts >= 3 ? 'Multiple invalid token attempts' : 'Excessive rate limiting',
        recommendedAction: 'temporary_block'
      };
    }

    return { suspicious: false };
  }

  /**
   * Sanitize and validate request data
   * @param {Object} data - Request data
   * @param {Object} schema - Validation schema
   * @returns {Object} Sanitized and validated data
   */
  sanitizeAndValidate(data, schema = {}) {
    // First sanitize the input
    const sanitized = Utils.sanitizeInput(data);

    // Then validate against schema if provided
    if (Object.keys(schema).length > 0) {
      Utils.validateRequestData(sanitized, schema);
    }

    return sanitized;
  }

  /**
   * Generate secure API token
   * @param {string} prefix - Token prefix
   * @param {number} length - Token length (excluding prefix)
   * @returns {string} Generated token
   */
  generateSecureToken(prefix = 'sq', length = 32) {
    const randomPart = Utils.generateSecureToken(length);
    return `${prefix}_${randomPart}`;
  }

  /**
   * Validate token format
   * @param {string} token - Token to validate
   * @param {string} expectedPrefix - Expected token prefix
   * @returns {boolean} True if valid format
   */
  validateTokenFormat(token, expectedPrefix = 'sq') {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const pattern = new RegExp(`^${expectedPrefix}_[a-zA-Z0-9]{32,}$`);
    return pattern.test(token);
  }

  /**
   * Check for common security headers
   * @param {Request} request - HTTP request
   * @returns {Object} Security headers analysis
   */
  analyzeSecurityHeaders(request) {
    const headers = {};
    const securityHeaders = [
      'X-Forwarded-For',
      'X-Real-IP',
      'CF-Connecting-IP',
      'CF-Ray',
      'CF-IPCountry',
      'User-Agent',
      'Referer',
      'Origin'
    ];

    securityHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    return {
      headers,
      hasCloudflareHeaders: !!(headers['CF-Ray'] || headers['CF-Connecting-IP']),
      userAgent: headers['User-Agent'] || 'unknown',
      country: headers['CF-IPCountry'] || 'unknown'
    };
  }

  /**
   * Create security log entry
   * @param {string} event - Security event type
   * @param {Request} request - HTTP request
   * @param {Object} additionalData - Additional log data
   * @returns {Object} Log entry
   */
  createSecurityLog(event, request, additionalData = {}) {
    const clientId = this.getClientIdentifier(request);
    const securityHeaders = this.analyzeSecurityHeaders(request);

    return {
      timestamp: new Date().toISOString(),
      event,
      clientId,
      path: new URL(request.url).pathname,
      method: request.method,
      ...securityHeaders,
      ...additionalData
    };
  }

  /**
   * Validate request origin and prevent CSRF
   * @param {Request} request - HTTP request
   * @param {Array} allowedOrigins - List of allowed origins
   * @returns {Object} Origin validation result
   */
  validateOrigin(request, allowedOrigins = []) {
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    // For OPTIONS requests (CORS preflight), always allow
    if (request.method === 'OPTIONS') {
      return { valid: true, reason: 'CORS preflight' };
    }

    // If no origin restrictions, allow
    if (allowedOrigins.length === 0) {
      return { valid: true, reason: 'No origin restrictions' };
    }

    // Check origin header
    if (origin && allowedOrigins.includes(origin)) {
      return { valid: true, reason: 'Origin in allowed list' };
    }

    // Check referer as fallback
    if (referer) {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refererOrigin)) {
        return { valid: true, reason: 'Referer origin in allowed list' };
      }
    }

    return {
      valid: false,
      reason: 'Origin not in allowed list',
      origin,
      referer
    };
  }

  /**
   * Clean up old rate limiting and activity data
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanup(maxAge = 3600000) { // Default 1 hour
    const cutoff = Date.now() - maxAge;

    // Clean rate limiting data
    for (const [key, timestamps] of this.rateStore.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > cutoff);
      if (validTimestamps.length === 0) {
        this.rateStore.delete(key);
      } else {
        this.rateStore.set(key, validTimestamps);
      }
    }

    // Clean suspicious activity data
    for (const [key, activities] of this.suspiciousActivity.entries()) {
      const validActivities = activities.filter(activity =>
        new Date(activity.timestamp).getTime() > cutoff
      );
      if (validActivities.length === 0) {
        this.suspiciousActivity.delete(key);
      } else {
        this.suspiciousActivity.set(key, validActivities);
      }
    }
  }

  /**
   * Get security status and statistics
   * @returns {Object} Security status
   */
  getSecurityStatus() {
    const now = Date.now();
    const recentCutoff = now - 300000; // Last 5 minutes

    let totalClients = 0;
    let activeClients = 0;
    let totalSuspiciousActivities = 0;

    // Count rate limiting data
    for (const [, timestamps] of this.rateStore.entries()) {
      totalClients++;
      const recentActivity = timestamps.filter(ts => ts > recentCutoff);
      if (recentActivity.length > 0) {
        activeClients++;
      }
    }

    // Count suspicious activities
    for (const [, activities] of this.suspiciousActivity.entries()) {
      totalSuspiciousActivities += activities.length;
    }

    return {
      totalClients,
      activeClients,
      totalSuspiciousActivities,
      rateStoreSize: this.rateStore.size,
      suspiciousActivityStoreSize: this.suspiciousActivity.size,
      lastCleanup: new Date().toISOString()
    };
  }
}
