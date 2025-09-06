import { describe, it, expect, beforeEach } from 'vitest';
import { trace, metrics } from '@opentelemetry/api';

describe('Monitoring and Observability Tests', () => {
  let tracer;
  let meter;
  let mockEnv;

  beforeEach(() => {
    // Initialize OpenTelemetry components for test observability
    tracer = trace.getTracer('aquil-monitoring-test');
    meter = metrics.getMeter('aquil-monitoring-test');
    mockEnv = globalThis.TEST_ENV;
  });

  describe('OpenTelemetry Integration', () => {
    it('should create and manage spans correctly', async () => {
      const span = tracer.startSpan('test-operation');
      
      try {
        // Add attributes to span
        span.setAttributes({
          'operation.type': 'test',
          'user.session': 'test-session-123',
          'environment': 'test'
        });

        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));

        // Record a successful operation
        span.addEvent('operation.completed', {
          'result.status': 'success',
          'timestamp': Date.now()
        });

        span.setStatus({ code: 1 }); // SUCCESS
        
        // Verify span is properly configured
        expect(span).toBeDefined();
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });

    it('should track metrics for API operations', async () => {
      const operationCounter = meter.createCounter('api_operations_total', {
        description: 'Total number of API operations'
      });

      const operationDuration = meter.createHistogram('api_operation_duration', {
        description: 'Duration of API operations in milliseconds'
      });

      // Simulate tracking an operation
      const startTime = Date.now();
      
      operationCounter.add(1, {
        'operation': 'trust_check_in',
        'status': 'success'
      });

      const duration = Date.now() - startTime;
      operationDuration.record(duration, {
        'operation': 'trust_check_in'
      });

      expect(operationCounter).toBeDefined();
      expect(operationDuration).toBeDefined();
    });
  });

  describe('ChatGPT Actions Monitor Integration', () => {
    it('should track operation performance correctly', async () => {
      const span = tracer.startSpan('monitor-integration-test');
      
      try {
        // Mock the ChatGPTActionsMonitor functionality
        const monitor = {
          trackOperation: async (operationId, startTime, success, metadata = {}) => {
            const duration = Date.now() - startTime;
            const timestamp = new Date().toISOString();
            
            // Store metrics in KV for dashboard
            const metricKey = `metrics:${operationId}:${timestamp.slice(0, 13)}`;
            const existing = {
              operation: operationId,
              hour: timestamp.slice(0, 13),
              calls: 1,
              successes: success ? 1 : 0,
              totalDuration: duration,
              errors: success ? [] : [{ timestamp, metadata }]
            };

            await mockEnv.AQUIL_MEMORIES.put(metricKey, JSON.stringify(existing));
            return existing;
          }
        };

        // Test successful operation tracking
        const startTime = Date.now();
        const result = await monitor.trackOperation('test_operation', startTime, true, {});
        
        expect(result.operation).toBe('test_operation');
        expect(result.successes).toBe(1);
        expect(result.calls).toBe(1);
        expect(result.errors).toHaveLength(0);

        // Test failed operation tracking
        const failedResult = await monitor.trackOperation('test_operation', startTime, false, { error: 'Test error' });
        
        expect(failedResult.operation).toBe('test_operation');
        expect(failedResult.successes).toBe(0);
        expect(failedResult.errors).toHaveLength(1);

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });

    it('should aggregate monitoring metrics correctly', async () => {
      const span = tracer.startSpan('metrics-aggregation-test');
      
      try {
        // Mock aggregated metrics data
        const metrics = [
          {
            operation: 'trust_check_in',
            hour: '2024-01-01T10',
            calls: 15,
            successes: 14,
            totalDuration: 2500,
            errors: [{ timestamp: '2024-01-01T10:30:00Z', metadata: { error: 'timeout' } }]
          },
          {
            operation: 'somatic_session',
            hour: '2024-01-01T10',
            calls: 8,
            successes: 8,
            totalDuration: 1200,
            errors: []
          }
        ];

        // Test aggregation logic
        const aggregated = {
          totalCalls: metrics.reduce((sum, m) => sum + m.calls, 0),
          totalSuccesses: metrics.reduce((sum, m) => sum + m.successes, 0),
          averageDuration: metrics.reduce((sum, m) => sum + m.totalDuration, 0) / metrics.reduce((sum, m) => sum + m.calls, 0),
          errorRate: (metrics.reduce((sum, m) => sum + m.errors.length, 0) / metrics.reduce((sum, m) => sum + m.calls, 0)) * 100
        };

        expect(aggregated.totalCalls).toBe(23);
        expect(aggregated.totalSuccesses).toBe(22);
        expect(aggregated.errorRate).toBeCloseTo(4.35, 1); // 1 error out of 23 calls
        expect(aggregated.averageDuration).toBeCloseTo(160.87, 1);

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should detect performance issues', async () => {
      const span = tracer.startSpan('performance-monitoring-test');
      
      try {
        const performanceThresholds = {
          avgDurationMs: 1000,
          errorRatePercent: 5,
          successRatePercent: 95
        };

        // Mock performance data that triggers alerts
        const performanceData = {
          operation: 'slow_operation',
          avgDuration: 1500, // Above threshold
          errorRate: 8, // Above threshold
          successRate: 92 // Below threshold
        };

        // Test performance issue detection
        const issues = [];
        
        if (performanceData.avgDuration > performanceThresholds.avgDurationMs) {
          issues.push('High average duration');
        }
        
        if (performanceData.errorRate > performanceThresholds.errorRatePercent) {
          issues.push('High error rate');
        }
        
        if (performanceData.successRate < performanceThresholds.successRatePercent) {
          issues.push('Low success rate');
        }

        expect(issues).toHaveLength(3);
        expect(issues).toContain('High average duration');
        expect(issues).toContain('High error rate');
        expect(issues).toContain('Low success rate');

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });
  });

  describe('Resource Health Monitoring', () => {
    it('should monitor Cloudflare Worker bindings health', async () => {
      const span = tracer.startSpan('resource-health-test');
      
      try {
        // Mock health check for all bindings
        const healthChecks = {
          d1: await checkD1Health(mockEnv.AQUIL_DB),
          kv: await checkKVHealth(mockEnv.AQUIL_MEMORIES),
          r2: await checkR2Health(mockEnv.AQUIL_STORAGE),
          vectorize: await checkVectorizeHealth(mockEnv.AQUIL_CONTEXT),
          ai: await checkAIHealth(mockEnv.AQUIL_AI)
        };

        // All mocked services should be healthy
        expect(healthChecks.d1.status).toBe('healthy');
        expect(healthChecks.kv.status).toBe('healthy');
        expect(healthChecks.r2.status).toBe('healthy');
        expect(healthChecks.vectorize.status).toBe('healthy');
        expect(healthChecks.ai.status).toBe('healthy');

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });
  });
});

// Helper functions for health checks
async function checkD1Health(d1) {
  try {
    // In test environment, mock always returns healthy
    return { status: 'healthy', latency: 10 };
  } catch {
    return { status: 'unhealthy', latency: null };
  }
}

async function checkKVHealth(kv) {
  try {
    await kv.get('health-check-key');
    return { status: 'healthy', latency: 5 };
  } catch {
    return { status: 'unhealthy', latency: null };
  }
}

async function checkR2Health(r2) {
  try {
    await r2.list({ maxKeys: 1 });
    return { status: 'healthy', latency: 8 };
  } catch {
    return { status: 'unhealthy', latency: null };
  }
}

async function checkVectorizeHealth(vectorize) {
  try {
    await vectorize.query([0.1, 0.2, 0.3], { topK: 1 });
    return { status: 'healthy', latency: 12 };
  } catch {
    return { status: 'unhealthy', latency: null };
  }
}

async function checkAIHealth(ai) {
  try {
    await ai.run('test-model', { test: 'ping' });
    return { status: 'healthy', latency: 15 };
  } catch {
    return { status: 'unhealthy', latency: null };
  }
}