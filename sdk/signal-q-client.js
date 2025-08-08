/**
 * Signal Q JavaScript SDK
 * Minimal single-file client for the Signal Q API
 * 
 * @example
 * const client = new SignalQClient({
 *   baseUrl: 'https://signal_q.catnip-pieces1.workers.dev',
 *   token: process.env.SIGNALQ_API_TOKEN
 * });
 * 
 * const health = await client.health();
 * const response = await client.request('/actions/probe_identity', { method: 'POST' });
 */
class SignalQClient {
  /**
   * Create a new Signal Q client
   * @param {Object} config - Configuration object
   * @param {string} config.baseUrl - Base URL for the API (e.g., 'https://signal_q.catnip-pieces1.workers.dev')
   * @param {string} config.token - Bearer token for authentication
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   */
  constructor(config) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }
    if (!config.token) {
      throw new Error('token is required');
    }

    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = config.token;
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SignalQ-SDK/1.0'
    };
  }

  /**
   * Make a raw HTTP request to the API
   * @param {string} path - API path (e.g., '/system/health')
   * @param {Object} [options={}] - Request options
   * @param {string} [options.method='GET'] - HTTP method
   * @param {Object} [options.body] - Request body (will be JSON stringified)
   * @param {Object} [options.headers={}] - Additional headers
   * @returns {Promise<Response>} - Fetch Response object
   */
  async request(path, options = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${path}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const config = {
      method,
      headers: requestHeaders,
      ...fetchOptions
    };

    // Add body for POST/PUT requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Make a request and parse the JSON response
   * @param {string} path - API path
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} - Parsed JSON response
   * @throws {Error} - If response is not ok or not valid JSON
   */
  async requestJson(path, options = {}) {
    const response = await this.request(path, options);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorBody = await response.text();
        if (errorBody) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/problem+json')) {
            const problemDetail = JSON.parse(errorBody);
            errorMessage = `${problemDetail.title}: ${problemDetail.detail} (Correlation: ${problemDetail.correlationId})`;
          } else {
            errorMessage += ` - ${errorBody}`;
          }
        }
      } catch (e) {
        // Ignore parsing errors, use default message
      }
      
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response body');
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
  }

  /**
   * Check system health
   * @returns {Promise<Object>} - Health status object
   * @example
   * const health = await client.systemHealth();
   * console.log(health.status); // 'healthy'
   */
  async systemHealth() {
    return await this.action('system_health');
  }

  /**
   * Legacy alias for systemHealth (deprecated)
   * @returns {Promise<Object>} - Health status object
   * @deprecated Use systemHealth() instead
   */
  async health() {
    return await this.systemHealth();
  }

  /**
   * Get API version information
   * @returns {Promise<Object>} - Version information
   * @example
   * const version = await client.version();
   * console.log(version.version); // '2.1.0'
   */
  async version() {
    return await this.requestJson('/version');
  }

  /**
   * Invoke a named action
   * @param {string} actionName - Name of the action to invoke
   * @param {Object} [data={}] - Action parameters
   * @returns {Promise<Object>} - Action response
   * @example
   * const probe = await client.action('probe_identity');
   * const list = await client.action('list');
   */
  async action(actionName, data = {}) {
    return await this.requestJson(`/actions/${actionName}`, {
      method: 'POST',
      body: data
    });
  }

  /**
   * List all available actions
   * @returns {Promise<Object>} - Available actions
   * @example
   * const actions = await client.listActions();
   * console.log(actions.actions);
   */
  async listActions() {
    return await this.action('list');
  }

  /**
   * Probe identity status
   * @param {Object} [context={}] - Context data for the probe
   * @returns {Promise<Object>} - Identity probe results
   * @example
   * const identity = await client.probeIdentity();
   * console.log(identity.probe);
   */
  async probeIdentity(context = {}) {
    return await this.action('probe_identity', context);
  }

  /**
   * Recalibrate the system state
   * @param {Object} [parameters={}] - Recalibration parameters
   * @returns {Promise<Object>} - Recalibration results
   * @example
   * const result = await client.recalibrateState();
   * console.log(result.state);
   */
  async recalibrateState(parameters = {}) {
    return await this.action('recalibrate_state', parameters);
  }

  /**
   * Deploy the system
   * @param {Object} [config={}] - Deployment configuration
   * @returns {Promise<Object>} - Deployment results
   * @example
   * const result = await client.deploy();
   * console.log(result.deployment);
   */
  async deploy(config = {}) {
    return await this.action('deploy', config);
  }
}

// Node.js CommonJS export 
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignalQClient;
  module.exports.SignalQClient = SignalQClient;
  module.exports.default = SignalQClient;
}

// Browser global
if (typeof window !== 'undefined') {
  window.SignalQClient = SignalQClient;
}

// For ES modules when imported via require in mixed environments
if (typeof global !== 'undefined' && typeof module === 'undefined') {
  global.SignalQClient = SignalQClient;
}