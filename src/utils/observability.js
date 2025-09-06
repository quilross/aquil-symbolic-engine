// OpenTelemetry configuration for Aquil Symbolic Engine
// This module provides instrumentation for observability and monitoring

import { trace, metrics, context } from '@opentelemetry/api';

/**
 * Initialize OpenTelemetry for the Cloudflare Worker environment
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Observability tools
 */
export function initializeObservability(env) {
  const tracer = trace.getTracer('aquil-symbolic-engine', '2.0.0');
  const meter = metrics.getMeter('aquil-symbolic-engine', '2.0.0');

  // Create metrics
  const operationCounter = meter.createCounter('aquil_operations_total', {
    description: 'Total number of operations processed'
  });

  const operationDuration = meter.createHistogram('aquil_operation_duration_ms', {
    description: 'Duration of operations in milliseconds'
  });

  const errorCounter = meter.createCounter('aquil_errors_total', {
    description: 'Total number of errors encountered'
  });

  return {
    tracer,
    meter,
    metrics: {
      operationCounter,
      operationDuration,
      errorCounter
    }
  };
}

/**
 * Create a traced operation wrapper
 * @param {Object} observability - Observability tools from initializeObservability
 * @param {string} operationName - Name of the operation
 * @param {Function} operation - The operation to execute
 * @returns {Function} Wrapped operation with tracing
 */
export function traceOperation(observability, operationName, operation) {
  const { tracer, metrics } = observability;

  return async function(...args) {
    const span = tracer.startSpan(operationName);
    const startTime = Date.now();

    try {
      // Add operation attributes
      span.setAttributes({
        'operation.name': operationName,
        'service.name': 'aquil-symbolic-engine',
        'service.version': '2.0.0'
      });

      // Execute the operation
      const result = await operation(...args);

      // Record success metrics
      metrics.operationCounter.add(1, {
        operation: operationName,
        status: 'success'
      });

      span.setStatus({ code: 1 }); // SUCCESS
      return result;

    } catch (error) {
      // Record error metrics
      metrics.operationCounter.add(1, {
        operation: operationName,
        status: 'error'
      });

      metrics.errorCounter.add(1, {
        operation: operationName,
        error_type: error.constructor.name
      });

      // Record exception in span
      span.recordException(error);
      span.setStatus({ 
        code: 2, 
        message: error.message 
      });

      throw error;

    } finally {
      // Record operation duration
      const duration = Date.now() - startTime;
      metrics.operationDuration.record(duration, {
        operation: operationName
      });

      span.end();
    }
  };
}

/**
 * Middleware for tracing HTTP requests
 * @param {Object} observability - Observability tools
 * @returns {Function} Express-style middleware
 */
export function createTracingMiddleware(observability) {
  const { tracer } = observability;

  return function tracingMiddleware(request, env, ctx) {
    const url = new URL(request.url);
    const span = tracer.startSpan(`HTTP ${request.method} ${url.pathname}`);

    // Add request attributes
    span.setAttributes({
      'http.method': request.method,
      'http.url': request.url,
      'http.path': url.pathname,
      'http.user_agent': request.headers.get('user-agent') || 'unknown'
    });

    // Store span in context for nested operations
    return context.with(trace.setSpan(context.active(), span), () => {
      return { span };
    });
  };
}

/**
 * Log structured events with OpenTelemetry spans
 * @param {Object} span - Active OpenTelemetry span
 * @param {string} eventName - Name of the event
 * @param {Object} attributes - Event attributes
 */
export function logEvent(span, eventName, attributes = {}) {
  if (span && span.addEvent) {
    span.addEvent(eventName, {
      ...attributes,
      timestamp: Date.now()
    });
  }
}

/**
 * Create custom metrics for specific operations
 * @param {Object} meter - OpenTelemetry meter
 * @returns {Object} Custom metrics
 */
export function createCustomMetrics(meter) {
  return {
    // ChatGPT Actions specific metrics
    chatgptActionCounter: meter.createCounter('aquil_chatgpt_actions_total', {
      description: 'Total ChatGPT actions processed'
    }),

    // Trust building metrics
    trustCheckinCounter: meter.createCounter('aquil_trust_checkins_total', {
      description: 'Total trust check-ins completed'
    }),

    // Somatic healing metrics
    somaticSessionCounter: meter.createCounter('aquil_somatic_sessions_total', {
      description: 'Total somatic healing sessions'
    }),

    // Vector operations metrics
    vectorOperationCounter: meter.createCounter('aquil_vector_operations_total', {
      description: 'Total vector operations (upsert/query)'
    }),

    // Storage operation metrics
    storageOperationDuration: meter.createHistogram('aquil_storage_operation_duration_ms', {
      description: 'Duration of storage operations in milliseconds'
    })
  };
}

/**
 * Export telemetry data (for development/debugging)
 * Note: In production, this would typically be sent to a telemetry backend
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} telemetryData - Collected telemetry data
 */
export async function exportTelemetry(env, telemetryData) {
  // In development, we can log to KV for inspection
  if (env.AQUIL_MEMORIES) {
    const timestamp = new Date().toISOString();
    const key = `telemetry:${timestamp.slice(0, 13)}`; // Hour bucket
    
    try {
      await env.AQUIL_MEMORIES.put(key, JSON.stringify({
        timestamp,
        ...telemetryData
      }), { expirationTtl: 86400 }); // 24 hour TTL
    } catch (error) {
      console.error('Failed to export telemetry:', error);
    }
  }
}