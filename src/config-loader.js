/**
 * Configuration Loader
 * Handles loading of configuration files in a Node.js compatible way
 * Replaces experimental JSON import syntax with standard dynamic imports
 */

/**
 * Load ARK configuration from JSON file
 * @returns {Promise<Object>} Configuration object
 */
export async function loadArkConfig() {
  try {
    // Dynamic import for JSON files - Node.js compatible
    const config = await import('../config/ark.actions.logging.json', { 
      assert: { type: 'json' } 
    });
    return config.default;
  } catch (error) {
    console.warn('Failed to load ARK config via dynamic import, using fallback:', error.message);
    
    // Fallback: fetch-based approach for environments that don't support JSON imports
    try {
      const response = await fetch('/config/ark.actions.logging.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (fetchError) {
      console.error('Failed to load ARK config via fetch:', fetchError.message);
      
      // Final fallback: return essential configuration structure
      return {
        'x-ark-metadata': {
          routes: {
            kvWrite: '/api/logs/kv-write',
            d1Insert: '/api/logs/d1-insert',
            promote: '/api/logs/promote',
            retrieve: '/api/logs/retrieve',
            retrieveLatest: '/api/logs/latest',
            retrievalMeta: '/api/logs/retrieval-meta'
          },
          enums: {
            logTypes: [
              'session',
              'voice-change', 
              'insight',
              'breakthrough',
              'commitment',
              'api-failure',
              'session-end'
            ],
            storedIn: ['KV', 'D1']
          },
          validation: {
            uuidV4: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
            maxDetailLength: 4000,
            timestampFormat: 'iso8601'
          }
        }
      };
    }
  }
}

/**
 * Get configuration with caching
 */
let cachedConfig = null;
export async function getArkConfig() {
  if (!cachedConfig) {
    cachedConfig = await loadArkConfig();
  }
  return cachedConfig;
}

/**
 * Extract routes from configuration
 * @returns {Promise<Object>} Routes object
 */
export async function getRoutes() {
  const config = await getArkConfig();
  return config['x-ark-metadata']?.routes || {};
}

/**
 * Extract validation constants
 * @returns {Promise<Object>} Validation constants
 */
export async function getValidationConstants() {
  const config = await getArkConfig();
  const metadata = config['x-ark-metadata'];
  
  return {
    LOG_TYPES: new Set(metadata?.enums?.logTypes || []),
    STORED_IN: new Set(metadata?.enums?.storedIn || []),
    UUID_V4: new RegExp(metadata?.validation?.uuidV4 || '^[0-9a-fA-F-]{36}$'),
    MAX_DETAIL: metadata?.validation?.maxDetailLength || 4000
  };
}