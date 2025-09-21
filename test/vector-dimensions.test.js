/**
 * Vector Dimensions Test Suite
 * Tests the 1024-dimension validation and embedding functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ensureVector, upsertVectors, queryVectorIndex, testVectorFlow } from '../src/actions/vectorize.js';

describe('Vector Dimension Validation', () => {
  let mockEnv;

  beforeEach(() => {
    // Mock environment with AI and vector context
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
                id: 'logvec_test1',
                score: 0.95,
                metadata: { type: 'test' },
                values: vector
              }
            ]
          };
        }
      }
    };
  });

  describe('ensureVector function', () => {
    it('should accept valid 1024-dimensional vectors', async () => {
      const validVector = new Array(1024).fill(0.5);
      const result = await ensureVector(mockEnv, validVector);
      expect(result).toEqual(validVector);
      expect(result.length).toBe(1024);
    });

    it('should reject vectors with wrong dimensions', async () => {
      const invalidVector = [1, 2, 3, 4, 5]; // Only 5 dimensions
      
      await expect(async () => {
        await ensureVector(mockEnv, invalidVector);
      }).rejects.toThrow('Embedding dimension mismatch: got 5, expected 1024');
    });

    it('should generate 1024-dimensional embeddings from text', async () => {
      const result = await ensureVector(mockEnv, "Test text for embedding");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
    });

    it('should handle empty or null text input', async () => {
      const result = await ensureVector(mockEnv, "");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1024);
      
      const result2 = await ensureVector(mockEnv, null);
      expect(Array.isArray(result2)).toBe(true);
      expect(result2.length).toBe(1024);
    });
  });

  describe('upsertVectors function', () => {
    it('should require id parameter', async () => {
      await expect(async () => {
        await upsertVectors(mockEnv, { text: "test" });
      }).rejects.toThrow("upsertVectors: 'id' is required");
    });

    it('should upsert with text input', async () => {
      const result = await upsertVectors(mockEnv, {
        id: 'test123',
        text: 'Ark system full memory test',
        metadata: { type: 'test' }
      });
      
      expect(result.inserted).toBe(1);
    });

    it('should upsert with valid vector input', async () => {
      const validVector = new Array(1024).fill(0.7);
      const result = await upsertVectors(mockEnv, {
        id: 'test456',
        vector: validVector,
        metadata: { type: 'test' }
      });
      
      expect(result.inserted).toBe(1);
    });

    it('should reject invalid vector dimensions', async () => {
      const invalidVector = [1, 2, 3]; // Wrong dimension
      
      await expect(async () => {
        await upsertVectors(mockEnv, {
          id: 'test789',
          vector: invalidVector
        });
      }).rejects.toThrow('Embedding dimension mismatch: got 3, expected 1024');
    });
  });

  describe('queryVectorIndex function', () => {
    it('should query with text input', async () => {
      const result = await queryVectorIndex(mockEnv, {
        text: 'Ark system full memory test',
        topK: 1
      });
      
      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].id).toBe('logvec_test1');
    });

    it('should query with valid vector input', async () => {
      const validVector = new Array(1024).fill(0.8);
      const result = await queryVectorIndex(mockEnv, {
        vector: validVector,
        topK: 1
      });
      
      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should use default parameters correctly', async () => {
      const result = await queryVectorIndex(mockEnv, {
        text: 'test query'
      });
      
      expect(result.matches).toBeDefined();
    });
  });

  describe('testVectorFlow function', () => {
    it('should complete full vector flow test', async () => {
      const result = await testVectorFlow(mockEnv);
      
      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].id).toBe('logvec_test1');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle AI service failure gracefully', async () => {
      const failingEnv = {
        ...mockEnv,
        AQUIL_AI: {
          run: async () => {
            throw new Error('AI service unavailable');
          }
        }
      };

      await expect(async () => {
        await ensureVector(failingEnv, "test text");
      }).rejects.toThrow('AI service unavailable');
    });

    it('should handle invalid AI response format', async () => {
      const badResponseEnv = {
        ...mockEnv,
        AQUIL_AI: {
          run: async () => {
            return { data: ["not an array"] }; // Wrong format
          }
        }
      };

      await expect(async () => {
        await ensureVector(badResponseEnv, "test text");
      }).rejects.toThrow('Embedding failed or wrong dimension');
    });

    it('should handle missing vector context gracefully', async () => {
      const noContextEnv = {
        ...mockEnv,
        AQUIL_CONTEXT: null
      };

      await expect(async () => {
        await upsertVectors(noContextEnv, {
          id: 'test',
          text: 'test'
        });
      }).rejects.toThrow();
    });
  });
});