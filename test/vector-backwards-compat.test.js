/**
 * Backwards Compatibility Test for Vector Routes
 * Tests that existing vector functionality still works with new validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { upsert, query } from '../src/actions/vectorize.js';

describe('Vector HTTP Endpoints Backwards Compatibility', () => {
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

  describe('HTTP upsert endpoint', () => {
    it('should handle text-based upsert requests', async () => {
      const mockRequest = {
        json: async () => ({
          id: 'test123',
          text: 'Test vector upsert with text',
          metadata: { type: 'test' }
        })
      };

      const response = await upsert(mockRequest, mockEnv);
      const result = await response.json();
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('test123');
      expect(result.inserted).toBe(1);
    });

    it('should reject invalid vector dimensions in HTTP requests', async () => {
      const mockRequest = {
        json: async () => ({
          id: 'test456',
          vector: [1, 2, 3, 4, 5], // Invalid dimensions
          metadata: { type: 'test' }
        })
      };

      const response = await upsert(mockRequest, mockEnv);
      const result = await response.json();
      
      expect(result.error).toBe('vector_upsert_error');
      expect(result.message).toContain('dimension mismatch');
    });
  });

  describe('HTTP query endpoint', () => {
    it('should handle text-based query requests', async () => {
      const mockRequest = {
        json: async () => ({
          text: 'Search for similar vectors',
          topK: 3
        })
      };

      const response = await query(mockRequest, mockEnv);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.query).toBe('Search for similar vectors');
      expect(result.mode).toBe('semantic_recall');
    });

    it('should handle direct vector queries', async () => {
      const validVector = new Array(1024).fill(0.5);
      const mockRequest = {
        json: async () => ({
          vector: validVector,
          topK: 1
        })
      };

      const response = await query(mockRequest, mockEnv);
      const result = await response.json();
      
      expect(result.results).toBeDefined();
      expect(result.results.matches).toBeDefined();
    });

    it('should handle requests with missing text and vector', async () => {
      const mockRequest = {
        json: async () => ({
          topK: 1
        })
      };

      const response = await query(mockRequest, mockEnv);
      const result = await response.json();
      
      expect(result.error).toBe('text or vector required for query');
    });
  });
});

// Helper function to mock readJSON (since we import from utils/http.js)
function createMockRequest(data) {
  return {
    json: async () => data
  };
}