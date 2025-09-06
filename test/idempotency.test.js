import { describe, it, expect, beforeEach } from 'vitest';
import { trace } from '@opentelemetry/api';

describe('Idempotency Tests', () => {
  let tracer;

  beforeEach(() => {
    // Initialize OpenTelemetry tracer for test observability
    tracer = trace.getTracer('aquil-test');
  });

  it('should handle idempotent operations correctly', async () => {
    const span = tracer.startSpan('idempotency-test');
    
    try {
      // Test idempotent KV operations
      const env = globalThis.TEST_ENV;
      const key = 'test-idempotency-key';
      const value = 'test-value';

      // First operation
      const result1 = await env.AQUIL_MEMORIES.put(key, value);
      expect(result1).toBe(true);

      // Second operation (should be idempotent)
      const result2 = await env.AQUIL_MEMORIES.put(key, value);
      expect(result2).toBe(true);

      // Verify operations are equivalent
      expect(result1).toEqual(result2);

      span.setStatus({ code: 1 }); // SUCCESS
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  });

  it('should maintain consistency across D1 operations', async () => {
    const span = tracer.startSpan('d1-consistency-test');
    
    try {
      const env = globalThis.TEST_ENV;
      
      // Test D1 idempotent insert
      const stmt = env.AQUIL_DB.prepare('INSERT OR REPLACE INTO logs (id, payload) VALUES (?, ?)');
      const boundStmt = stmt.bind('test-id', JSON.stringify({ test: 'data' }));
      
      const result1 = await boundStmt.run();
      const result2 = await boundStmt.run();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.meta.changes).toBe(1);
      expect(result2.meta.changes).toBe(1);

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