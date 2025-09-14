/**
 * Integration tests for /api/insight endpoint
 */

import { describe, it, expect } from 'vitest';

// Mock environment for testing
const mockEnv = {
  AQUIL_MEMORIES: {
    list: async ({ prefix }) => ({
      keys: [
        { name: 'log_1', metadata: {} },
        { name: 'log_2', metadata: {} }
      ]
    }),
    get: async (key) => {
      const mockEntries = {
        'log_1': JSON.stringify({ id: '1', content: 'I had a great day with friends', timestamp: '2023-01-01' }),
        'log_2': JSON.stringify({ id: '2', content: 'Feeling anxious about work', timestamp: '2023-01-02' })
      };
      return mockEntries[key] || null;
    }
  }
};

// Mock journalService
const mockJournalService = {
  listRecentEntries: async (env, options) => ({
    success: true,
    entries: [
      { key: 'log_1', content: { id: '1', content: 'I had a great day with friends', timestamp: '2023-01-01' }},
      { key: 'log_2', content: { id: '2', content: 'Feeling anxious about work', timestamp: '2023-01-02' }}
    ]
  })
};

describe('Insight Endpoint Integration Tests', () => {
  describe('POST /api/insight', () => {
    it('should generate insight from valid request', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      const currentEntry = {
        id: '3',
        content: 'Today I feel confident and ready to tackle my relationship challenges',
        timestamp: '2023-01-03'
      };
      
      const userHistory = [
        { content: 'I had a great day with friends' },
        { content: 'Feeling anxious about work' }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe("Your journey continues to unfold with wisdom and growth.");
    });

    it('should handle request with minimal data', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      const currentEntry = {
        content: 'Short entry'
      };
      
      const userHistory = [];
      
      const result = await generateInsight(currentEntry, userHistory);
      
      expect(typeof result).toBe('string');
      expect(result).toBe("Beginning to document your inner world is a courageous act of self-discovery.");
    });

    it('should detect theme patterns correctly', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      const currentEntry = {
        content: 'Another emotional day dealing with feelings'
      };
      
      const userHistory = [
        { content: 'I feel so happy today' },
        { content: 'Feeling sad about the situation' },
        { content: 'My emotions are all over the place' }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      
      expect(result).toContain('Emotional awareness is a recurring focus');
      expect(result).toContain('3/3 entries');
    });

    it('should identify contradiction patterns', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      const currentEntry = {
        content: 'I feel very confident and strong today'
      };
      
      const userHistory = [
        { content: 'I doubt everything about myself' },
        { content: 'Feeling so weak and incapable' }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      
      expect(result).toContain('self-confidence has evolved');
      expect(result).toContain('transformation');
    });

    it('should handle malformed entry data gracefully', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      const currentEntry = {
        payload: {
          content: 'Entry with nested structure'
        }
      };
      
      const userHistory = [
        { detail: 'Entry with detail field' }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should provide meaningful insights for various themes', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      // Test creativity theme
      const creativityEntry = { content: 'Created beautiful art and music today' };
      const creativityHistory = [
        { content: 'Wrote a poem yesterday' },
        { content: 'Had an amazing design session' }
      ];
      
      const creativityResult = await generateInsight(creativityEntry, creativityHistory);
      expect(creativityResult).toContain('Creative expression is a consistent thread');
      
      // Test growth theme  
      const growthEntry = { content: 'I learned so much and want to improve further' };
      const growthHistory = [
        { content: 'Growing every day' },
        { content: 'Want to develop my skills better' }
      ];
      
      const growthResult = await generateInsight(growthEntry, growthHistory);
      expect(growthResult).toContain('commitment to personal growth');
    });

    it('should handle edge case with string entry', async () => {
      const { generateInsight } = await import('../src/insightEngine.js');
      
      const result = await generateInsight('Just a string entry', []);
      
      expect(typeof result).toBe('string');
      expect(result).toBe("Beginning to document your inner world is a courageous act of self-discovery.");
    });
  });
});