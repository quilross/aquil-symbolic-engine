/**
 * Utility Functions Module
 * Common helper functions and response utilities
 */

export class Utils {
  /**
   * Create standardized JSON response with CORS headers
   * @param {Object} obj - Response object
   * @param {boolean} degraded - Whether system is degraded
   * @returns {Response} Formatted response
   */
  static createResponse(obj, degraded = false) {
    obj.timestamp = new Date().toISOString();
    if (degraded) {
      obj.degraded = true;
    }

    return new Response(JSON.stringify(obj), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      }
    });
  }

  /**
   * Create CORS preflight response
   * @returns {Response} CORS response
   */
  static createCorsResponse() {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      }
    });
  }

  /**
   * Create error response with CORS headers
   * @param {Error} error - Error object
   * @param {number} status - HTTP status code
   * @returns {Response} Error response
   */
  static createErrorResponse(error, status = 500) {
    return new Response(JSON.stringify({
      error: status === 500 ? 'Internal server error' : 'Request error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
      }
    });
  }

  /**
   * Validate request data against schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @throws {Error} If validation fails
   */
  static validateRequestData(data, schema) {
    for (const [field, config] of Object.entries(schema)) {
      if (config.required && (data[field] === undefined || data[field] === null)) {
        throw new Error(`${field} is required`);
      }

      if (data[field] !== undefined && config.type && typeof data[field] !== config.type) {
        throw new Error(`${field} must be of type ${config.type}`);
      }

      if (config.validate && !config.validate(data[field])) {
        throw new Error(`${field} validation failed`);
      }
    }
  }

  /**
   * Safely parse JSON with error handling
   * @param {string} jsonString - JSON string to parse
   * @param {*} fallback - Fallback value if parsing fails
   * @returns {*} Parsed object or fallback
   */
  static safeJsonParse(jsonString, fallback = null) {
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length
   * @returns {string} Random token
   */
  static generateSecureToken(length = 32) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Format time in Philadelphia timezone
   * @returns {string} Formatted time string
   */
  static getPhiladelphiaTime() {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date());
  }

  /**
   * Calculate time difference in minutes
   * @param {Date|string} from - Start time
   * @param {Date|string} to - End time (default: now)
   * @returns {number} Difference in minutes
   */
  static getTimeDifferenceMinutes(from, to = new Date()) {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    const toDate = typeof to === 'string' ? new Date(to) : to;
    return (toDate - fromDate) / (1000 * 60);
  }

  /**
   * Sanitize input data to prevent injection attacks
   * @param {*} data - Data to sanitize
   * @returns {*} Sanitized data
   */
  static sanitizeInput(data) {
    if (typeof data === 'string') {
      return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = Utils.sanitizeInput(value);
      }
      return sanitized;
    }
    return data;
  }

  /**
   * Rate limiting check (simple implementation)
   * @param {string} identifier - Unique identifier for rate limiting
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @param {Map} rateStore - Rate limiting store
   * @returns {boolean} True if request is allowed
   */
  static checkRateLimit(identifier, maxRequests = 100, windowMs = 60000, rateStore = new Map()) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateStore.has(identifier)) {
      rateStore.set(identifier, []);
    }

    const requests = rateStore.get(identifier);

    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    rateStore.set(identifier, validRequests);
    return true;
  }

  /**
   * Create pagination metadata
   * @param {number} total - Total items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Pagination metadata
   */
  static createPaginationMeta(total, page = 1, limit = 10) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    };
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  static deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = Utils.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} Promise that resolves with function result
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Check if a value is empty (null, undefined, empty string, empty array, empty object)
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  /**
   * Log structured data for debugging
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  static log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };

    console[level] ? console[level](JSON.stringify(logEntry)) : console.log(JSON.stringify(logEntry));
  }
}
