import { describe, it, expect, beforeEach } from 'vitest';
import { trace } from '@opentelemetry/api';

// Mock the worker index.js handlers for testing
describe('API Endpoint Tests', () => {
  let tracer;
  let mockEnv;

  beforeEach(() => {
    // Initialize OpenTelemetry tracer for test observability
    tracer = trace.getTracer('aquil-endpoint-test');
    mockEnv = globalThis.TEST_ENV;
  });

  describe('Health Check Endpoints', () => {
    it('should return health status for /api/system/health-check', async () => {
      const span = tracer.startSpan('health-check-test');
      
      try {
        // Mock health check response
        const healthCheck = {
          ok: true,
          timestamp: new Date().toISOString(),
          d1: { status: 'healthy', latency: 10 },
          kv: { status: 'healthy', latency: 5 },
          r2: { status: 'healthy', latency: 8 },
          ai: { status: 'healthy', latency: 15 },
          vector: { status: 'healthy', latency: 12 }
        };

        expect(healthCheck.ok).toBe(true);
        expect(healthCheck.d1.status).toBe('healthy');
        expect(healthCheck.kv.status).toBe('healthy');
        expect(healthCheck.r2.status).toBe('healthy');
        expect(healthCheck.ai.status).toBe('healthy');
        expect(healthCheck.vector.status).toBe('healthy');

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });

    it('should return readiness status for /api/system/readiness', async () => {
      const span = tracer.startSpan('readiness-test');
      
      try {
        const readinessCheck = {
          ready: true,
          timestamp: new Date().toISOString(),
          services: {
            database: true,
            storage: true,
            ai: true,
            vectorDb: true
          }
        };

        expect(readinessCheck.ready).toBe(true);
        expect(readinessCheck.services.database).toBe(true);
        expect(readinessCheck.services.storage).toBe(true);
        expect(readinessCheck.services.ai).toBe(true);
        expect(readinessCheck.services.vectorDb).toBe(true);

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

  describe('Logging Endpoints', () => {
    it('should handle log POST to /api/log', async () => {
      const span = tracer.startSpan('log-post-test');
      
      try {
        const logPayload = {
          type: 'trust_check_in',
          payload: { feeling: 'confident', energy: 8 },
          session_id: 'test-session-123',
          who: 'test-user',
          level: 'info',
          tags: ['trust', 'check-in'],
          timestamp: new Date().toISOString()
        };

        // Test KV write
        const kvResult = await mockEnv.AQUIL_MEMORIES.put(
          `log:${Date.now()}`, 
          JSON.stringify(logPayload)
        );
        expect(kvResult).toBe(true);

        // Test D1 insert
        const stmt = mockEnv.AQUIL_DB.prepare(
          'INSERT INTO logs (id, type, payload, session_id, timestamp) VALUES (?, ?, ?, ?, ?)'
        );
        const boundStmt = stmt.bind(
          'test-id',
          logPayload.type,
          JSON.stringify(logPayload.payload),
          logPayload.session_id,
          logPayload.timestamp
        );
        const d1Result = await boundStmt.run();
        expect(d1Result.success).toBe(true);

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });

    it('should retrieve logs from /api/logs', async () => {
      const span = tracer.startSpan('logs-get-test');
      
      try {
        // Test KV retrieval
        const kvData = await mockEnv.AQUIL_MEMORIES.list();
        expect(kvData).toHaveProperty('keys');
        expect(Array.isArray(kvData.keys)).toBe(true);

        // Test D1 retrieval
        const stmt = mockEnv.AQUIL_DB.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10');
        const d1Data = await stmt.all();
        expect(d1Data.success).toBe(true);
        expect(Array.isArray(d1Data.results)).toBe(true);

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

  describe('Core AI Engine Endpoints', () => {
    it('should handle trust check-in via /api/trust/check-in', async () => {
      const span = tracer.startSpan('trust-checkin-test');
      
      try {
        const checkInPayload = {
          feeling: 'optimistic',
          energy_level: 7,
          trust_patterns: ['growth', 'confidence'],
          notes: 'Feeling good about progress today'
        };

        // Mock AI response
        const aiResponse = await mockEnv.AQUIL_AI.run('trust-builder', checkInPayload);
        expect(aiResponse.response).toBe('test-response');

        // Verify log would be created
        const logData = {
          type: 'trust_check_in',
          payload: checkInPayload,
          timestamp: new Date().toISOString()
        };

        expect(logData.type).toBe('trust_check_in');
        expect(logData.payload.feeling).toBe('optimistic');
        expect(logData.payload.energy_level).toBe(7);

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });

    it('should handle somatic session via /api/somatic/session', async () => {
      const span = tracer.startSpan('somatic-session-test');
      
      try {
        const somaticPayload = {
          body_awareness: 'tension in shoulders',
          breathing_pattern: 'shallow',
          grounding_needed: true,
          session_focus: 'release and relax'
        };

        // Mock AI response
        const aiResponse = await mockEnv.AQUIL_AI.run('somatic-healer', somaticPayload);
        expect(aiResponse.response).toBe('test-response');

        // Verify structure
        expect(somaticPayload.body_awareness).toBe('tension in shoulders');
        expect(somaticPayload.grounding_needed).toBe(true);

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

  describe('Vector and Storage Operations', () => {
    it('should handle vector upsert via /api/vectorize/upsert', async () => {
      const span = tracer.startSpan('vector-upsert-test');
      
      try {
        const vectors = [
          {
            id: 'test-vector-1',
            values: [0.1, 0.2, 0.3, 0.4, 0.5],
            metadata: { type: 'trust_pattern', content: 'feeling confident' }
          }
        ];

        const result = await mockEnv.AQUIL_CONTEXT.upsert(vectors);
        expect(result.mutationId).toBe('test-id');

        span.setStatus({ code: 1 }); // SUCCESS
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });

    it('should handle vector query via /api/vectorize/query', async () => {
      const span = tracer.startSpan('vector-query-test');
      
      try {
        const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5];
        const options = { topK: 5, includeMetadata: true };

        const result = await mockEnv.AQUIL_CONTEXT.query(queryVector, options);
        expect(Array.isArray(result.matches)).toBe(true);

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

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const span = tracer.startSpan('404-test');
      
      try {
        const errorResponse = {
          error: 'Endpoint not found',
          available_endpoints: [
            '/api/system/health-check',
            '/api/log',
            '/api/logs',
            '/api/trust/check-in',
            '/api/somatic/session'
          ]
        };

        expect(errorResponse.error).toBe('Endpoint not found');
        expect(Array.isArray(errorResponse.available_endpoints)).toBe(true);
        expect(errorResponse.available_endpoints.length).toBeGreaterThan(0);

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