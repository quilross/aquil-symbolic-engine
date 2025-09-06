/**
 * Simple Metrics Counter System
 * 
 * Provides fail-open metrics collection with optional KV persistence.
 * Counters are stored in-memory and optionally persisted to KV for aggregation.
 */

class MetricsCollector {
  constructor(env) {
    this.env = env;
    this.counters = new Map();
    this.kvKey = 'metrics:counters';
  }

  /**
   * Increment a counter with optional labels
   * @param {string} name - Counter name (e.g., 'logs_written_total')
   * @param {Object} labels - Labels object (e.g., {store: 'd1'})
   * @param {number} value - Increment value (default: 1)
   */
  increment(name, labels = {}, value = 1) {
    try {
      const key = this._getCounterKey(name, labels);
      const current = this.counters.get(key) || 0;
      this.counters.set(key, current + value);
      
      // Async persist to KV if available (fail-open)
      this._persistToKV().catch(() => {
        // Silently fail - metrics should never break the system
      });
    } catch (error) {
      // Silently fail - metrics collection is non-critical
      console.warn('Metrics increment failed:', error.message);
    }
  }

  /**
   * Get all current counter values
   * @returns {Object} Counter values with labels
   */
  async getCounters() {
    try {
      // Try to load from KV first, then merge with in-memory
      await this._loadFromKV();
      
      const counters = {};
      for (const [key, value] of this.counters.entries()) {
        const { name, labels } = this._parseCounterKey(key);
        if (!counters[name]) {
          counters[name] = [];
        }
        counters[name].push({
          labels,
          value
        });
      }
      
      return counters;
    } catch (error) {
      console.warn('Failed to get counters:', error.message);
      return {};
    }
  }

  /**
   * Reset all counters (useful for testing)
   */
  reset() {
    this.counters.clear();
  }

  /**
   * Generate counter key with labels
   * @private
   */
  _getCounterKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Parse counter key back to name and labels
   * @private
   */
  _parseCounterKey(key) {
    const match = key.match(/^([^{]+)(?:\{([^}]+)\})?$/);
    if (!match) return { name: key, labels: {} };
    
    const name = match[1];
    const labelStr = match[2];
    const labels = {};
    
    if (labelStr) {
      const pairs = labelStr.split(',');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k && v) {
          labels[k] = v.replace(/"/g, '');
        }
      }
    }
    
    return { name, labels };
  }

  /**
   * Load counters from KV (fail-open)
   * @private
   */
  async _loadFromKV() {
    try {
      if (!this.env.AQUIL_MEMORIES) return;
      
      const stored = await this.env.AQUIL_MEMORIES.get(this.kvKey, { type: 'json' });
      if (stored && typeof stored === 'object') {
        for (const [key, value] of Object.entries(stored)) {
          if (typeof value === 'number') {
            this.counters.set(key, value);
          }
        }
      }
    } catch (error) {
      // Silently fail - KV unavailability shouldn't break metrics
    }
  }

  /**
   * Persist counters to KV (fail-open)
   * @private
   */
  async _persistToKV() {
    try {
      if (!this.env.AQUIL_MEMORIES) return;
      
      const data = {};
      for (const [key, value] of this.counters.entries()) {
        data[key] = value;
      }
      
      await this.env.AQUIL_MEMORIES.put(this.kvKey, JSON.stringify(data), {
        expirationTtl: 86400 * 30 // 30 days
      });
    } catch (error) {
      // Silently fail - KV unavailability shouldn't break metrics
    }
  }
}

// Global metrics instance (initialized per request)
let globalMetrics = null;

/**
 * Get or create metrics collector for current request
 * @param {Object} env - Environment bindings
 * @returns {MetricsCollector}
 */
export function getMetrics(env) {
  if (!globalMetrics) {
    globalMetrics = new MetricsCollector(env);
  }
  return globalMetrics;
}

/**
 * Helper functions for specific metrics
 */
export function incrementLogWritten(env, store) {
  const metrics = getMetrics(env);
  metrics.increment('logs_written_total', { store });
}

export function incrementActionSuccess(env, operationId) {
  const metrics = getMetrics(env);
  metrics.increment('action_success_total', { operationId });
}

export function incrementActionError(env, operationId) {
  const metrics = getMetrics(env);
  metrics.increment('action_error_total', { operationId });
}

export function incrementMissingStoreWrite(env, store) {
  const metrics = getMetrics(env);
  metrics.increment('missing_store_writes_total', { store });
}

export function incrementIdempotencyHit(env) {
  const metrics = getMetrics(env);
  metrics.increment('idempotency_hits_total');
}

export function incrementReconcileBackfill(env, store) {
  const metrics = getMetrics(env);
  metrics.increment('reconcile_backfills_total', { store });
}

export function incrementStoreCircuitOpen(env, store) {
  const metrics = getMetrics(env);
  metrics.increment('store_circuit_open_total', { store });
}

export function incrementRateLimitExceeded(env, identifier) {
  const metrics = getMetrics(env);
  metrics.increment('rate_limit_exceeded_total', { identifier });
}

export function incrementRequestSizeExceeded(env) {
  const metrics = getMetrics(env);
  metrics.increment('request_size_exceeded_total');
}