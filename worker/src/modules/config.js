/**
 * Configuration Module
 * Centralized configuration management with environment variable support
 */

export class Config {
  constructor(env = {}) {
    this.env = env;
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables with defaults
   * @returns {Object} Configuration object
   */
  loadConfig() {
    return {
      // API Configuration
      api: {
        baseUrl: this.env.API_BASE_URL || 'https://signal_q.catnip-pieces1.workers.dev',
        version: '2.1.0',
        timeout: parseInt(this.env.API_TIMEOUT) || 30000
      },

      // Authentication
      auth: {
        userToken: this.env.API_TOKEN,
        adminToken: this.env.API_TOKEN_ADMIN,
        tokenExpiry: parseInt(this.env.TOKEN_EXPIRY) || 86400, // 24 hours
        requireAuth: this.env.REQUIRE_AUTH !== 'false'
      },

      // Rate Limiting
      rateLimit: {
        maxRequests: parseInt(this.env.RATE_LIMIT_MAX) || 100,
        windowMs: parseInt(this.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
        enabled: this.env.RATE_LIMIT_ENABLED !== 'false'
      },

      // Storage
      storage: {
        maxWrites: parseInt(this.env.MAX_WRITES_PER_DAY) || 900,
        maxReads: parseInt(this.env.MAX_READS_PER_DAY) || 90000,
        dataRetention: this.env.DATA_RETENTION_DAYS || '90'
      },

      // AI Configuration
      ai: {
        model: this.env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
        maxTokens: parseInt(this.env.AI_MAX_TOKENS) || 512,
        temperature: parseFloat(this.env.AI_TEMPERATURE) || 0.7,
        enabled: this.env.AI_ENABLED !== 'false'
      },

      // Security
      security: {
        allowedOrigins: this.parseArray(this.env.ALLOWED_ORIGINS),
        logSuspiciousActivity: this.env.LOG_SUSPICIOUS_ACTIVITY !== 'false',
        maxFailedAttempts: parseInt(this.env.MAX_FAILED_ATTEMPTS) || 3,
        blockDuration: parseInt(this.env.BLOCK_DURATION) || 300000 // 5 minutes
      },

      // Feature Flags
      features: {
        autonomousExecution: this.env.AUTONOMOUS_EXECUTION !== 'false',
        patternRecognition: this.env.PATTERN_RECOGNITION !== 'false',
        philadelphiaIntegration: this.env.PHILADELPHIA_INTEGRATION !== 'false',
        advancedAnalytics: this.env.ADVANCED_ANALYTICS === 'true'
      },

      // Debugging
      debug: {
        enabled: this.env.DEBUG === 'true',
        logLevel: this.env.LOG_LEVEL || 'info',
        verbose: this.env.VERBOSE === 'true'
      },

      // Health Check
      health: {
        endpoints: parseInt(this.env.HEALTH_ENDPOINT_COUNT) || 76,
        responseTimeThreshold: parseInt(this.env.RESPONSE_TIME_THRESHOLD) || 1000
      }
    };
  }

  /**
   * Parse array from environment variable
   * @param {string} value - Comma-separated string
   * @returns {Array} Parsed array
   */
  parseArray(value) {
    if (!value) {
      return [];
    }
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot-separated path (e.g., 'api.baseUrl')
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value by path
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;

    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Check required configuration
    if (!this.get('auth.userToken')) {
      errors.push('API_TOKEN environment variable is required');
    }

    if (!this.get('auth.adminToken')) {
      warnings.push('API_TOKEN_ADMIN not set - admin features will be disabled');
    }

    // Validate token formats
    const userToken = this.get('auth.userToken');
    if (userToken && !userToken.startsWith('sq_')) {
      warnings.push('User token should start with "sq_" prefix');
    }

    const adminToken = this.get('auth.adminToken');
    if (adminToken && !adminToken.startsWith('sq_admin_')) {
      warnings.push('Admin token should start with "sq_admin_" prefix');
    }

    // Validate numeric configurations
    const numericConfigs = [
      'rateLimit.maxRequests',
      'rateLimit.windowMs',
      'storage.maxWrites',
      'storage.maxReads',
      'ai.maxTokens'
    ];

    for (const path of numericConfigs) {
      const value = this.get(path);
      if (value !== undefined && (isNaN(value) || value < 0)) {
        errors.push(`${path} must be a positive number`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get environment-specific configuration
   * @returns {Object} Environment info
   */
  getEnvironmentInfo() {
    return {
      environment: this.env.ENVIRONMENT || 'production',
      worker: this.env.WORKER_NAME || 'signal_q',
      version: this.get('api.version'),
      deployedAt: this.env.DEPLOYED_AT || new Date().toISOString(),
      cloudflare: {
        accountId: this.env.CLOUDFLARE_ACCOUNT_ID,
        zoneId: this.env.CLOUDFLARE_ZONE_ID
      }
    };
  }

  /**
   * Get security configuration summary
   * @returns {Object} Security config summary
   */
  getSecurityConfig() {
    return {
      authRequired: this.get('auth.requireAuth'),
      rateLimitEnabled: this.get('rateLimit.enabled'),
      allowedOrigins: this.get('security.allowedOrigins'),
      maxFailedAttempts: this.get('security.maxFailedAttempts'),
      autonomousExecution: this.get('features.autonomousExecution')
    };
  }

  /**
   * Get all configuration (excluding sensitive data)
   * @returns {Object} Safe configuration object
   */
  getSafeConfig() {
    const config = JSON.parse(JSON.stringify(this.config));

    // Remove sensitive information
    if (config.auth) {
      config.auth.userToken = config.auth.userToken ? '[REDACTED]' : null;
      config.auth.adminToken = config.auth.adminToken ? '[REDACTED]' : null;
    }

    return config;
  }

  /**
   * Check if feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} True if enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get configuration for health check response
   * @returns {Object} Health check configuration
   */
  getHealthCheckConfig() {
    return {
      version: this.get('api.version'),
      endpoints: this.get('health.endpoints'),
      features: {
        ai: this.get('ai.enabled'),
        autonomous: this.get('features.autonomousExecution'),
        philadelphia: this.get('features.philadelphiaIntegration')
      },
      security: {
        authEnabled: this.get('auth.requireAuth'),
        rateLimitEnabled: this.get('rateLimit.enabled')
      }
    };
  }
}
