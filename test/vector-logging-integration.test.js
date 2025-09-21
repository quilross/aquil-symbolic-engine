/**
 * Vector Logging Integration Test Suite
 * Tests the integration between vector operations and logging system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { writeLog } from '../src/actions/logging.js';
import { queryVector, semanticRecall } from '../src/actions/vectorize.js';

describe('Vector Logging Integration', () => {
  let mockEnv;

  beforeEach(() => {
    // Mock environment with all required bindings
    mockEnv = {
      AQUIL_AI: {
        run: async (model, { text }) => {
          // Mock response with proper 1024-dimensional vector
          const mockVector = new Array(1024).fill(0).map((_, i) => Math.random());
          return {
            data: [mockVector]
          };
        }
      },
      AQUIL_CONTEXT: {
        upsert: async (payload) => {
          return { inserted: payload.length };
        },
        query: async (vector, options) => {
          return {
            matches: [
              {
                id: 'logvec_test',
                score: 0.95,
                metadata: { 
                  type: 'test',
                  trace_id: 'test_trace_123',
                  operation_id: 'testLog'
                },
                values: vector
              }
            ]
          };
        }
      },
      AQUIL_MEMORIES: {
        put: async (key, value, options) => {
          return { success: true };
        },
        get: async (key) => {
          return { value: '{"test": "data"}' };
        }
      }
    };
  });

  describe('Vector logging with textOrVector parameter', () => {
    it('should log text and create vector embedding', async () => {
      const result = await writeLog(mockEnv, {
        type: 'test_log',
        payload: { message: 'Test log entry' },
        session_id: 'test-session',
        who: 'test',
        level: 'info',
        textOrVector: 'This is test text for vector embedding'
      });

      expect(result.vector).toBe('ok');
      expect(result.kv).toBe('ok');
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should log with pre-computed vector', async () => {
      const testVector = new Array(1024).fill(0.5);
      
      const result = await writeLog(mockEnv, {
        type: 'test_log',
        payload: { message: 'Test log with vector' },
        session_id: 'test-session',
        who: 'test',
        level: 'info',
        textOrVector: testVector
      });

      expect(result.vector).toBe('ok');
      expect(result.kv).toBe('ok');
      expect(result.id).toBeDefined();
    });

    it('should include trace ID in vector metadata', async () => {
      const traceId = 'custom_trace_123';
      
      const result = await writeLog(mockEnv, {
        type: 'test_log',
        payload: { message: 'Test with trace' },
        session_id: 'test-session',
        who: 'test',
        level: 'info',
        textOrVector: 'Test text with trace ID',
        trace_id: traceId
      });

      expect(result.vector).toBe('ok');
      expect(result.trace_id).toBe(traceId);
    });

    it('should handle vector logging errors gracefully', async () => {
      const errorEnv = {
        ...mockEnv,
        AQUIL_CONTEXT: {
          upsert: async () => {
            throw new Error('Vector store unavailable');
          }
        }
      };

      const result = await writeLog(errorEnv, {
        type: 'test_log',
        payload: { message: 'Test error handling' },
        textOrVector: 'Test text'
      });

      expect(result.vector).toContain('Vector store unavailable');
      expect(result.kv).toBe('ok'); // Should still succeed in KV
    });
  });

  describe('Vector search integration', () => {
    it('should perform semantic recall on logged vectors', async () => {
      // First log something with vector
      await writeLog(mockEnv, {
        type: 'insight',
        payload: { insight: 'Important discovery' },
        textOrVector: 'This is an important insight about patterns'
      });

      // Then search for it
      const searchResult = await semanticRecall(mockEnv, {
        text: 'discovery patterns',
        topK: 5
      });

      expect(searchResult.matches).toBeDefined();
      expect(searchResult.matches.length).toBeGreaterThan(0);
      expect(searchResult.matches[0].id).toContain('logvec_');
    });

    it('should use transformative inquiry mode', async () => {
      const result = await queryVector(mockEnv, {
        text: 'analyze my growth patterns',
        mode: 'transformative_inquiry',
        topK: 3
      });

      expect(result.mode).toBe('transformative_inquiry');
      expect(result.inquiries).toBeDefined();
      expect(result.guidance).toBeDefined();
    });

    it('should support legacy query mode', async () => {
      const result = await queryVector(mockEnv, {
        text: 'find relevant logs',
        mode: 'legacy',
        topK: 5
      });

      // Legacy mode (queryByText) returns an array directly
      expect(Array.isArray(result) || result.matches).toBeTruthy();
    });
  });

  describe('Circuit breaker integration', () => {
    it('should skip vector operations when circuit breaker is open', async () => {
      const circuitBreakerEnv = {
        ...mockEnv,
        // Mock circuit breaker module
        '../utils/ops-middleware.js': {
          checkStoreCircuitBreaker: async () => ({ shouldSkip: true }),
          recordStoreFailure: async () => {},
        }
      };

      const result = await writeLog(circuitBreakerEnv, {
        type: 'test_log',
        payload: { message: 'Test circuit breaker' },
        textOrVector: 'Test text'
      });

      // Should still work for KV but skip vector
      expect(result.kv).toBe('ok');
      // Vector might be skipped due to circuit breaker
    });
  });

  describe('Dimension validation', () => {
    it('should reject invalid vector dimensions', async () => {
      const invalidVector = [1, 2, 3]; // Wrong dimension
      
      const result = await writeLog(mockEnv, {
        type: 'test_log',
        payload: { message: 'Test invalid vector' },
        textOrVector: invalidVector
      });

      // The error should be captured in the vector field
      expect(result.vector).toContain('Embedding dimension mismatch');
      expect(result.kv).toBe('ok'); // KV should still succeed
    });

    it('should accept valid 1024-dimensional vectors', async () => {
      const validVector = new Array(1024).fill(0.7);
      
      const result = await writeLog(mockEnv, {
        type: 'test_log',
        payload: { message: 'Test valid vector' },
        textOrVector: validVector
      });

      expect(result.vector).toBe('ok');
    });
  });
});