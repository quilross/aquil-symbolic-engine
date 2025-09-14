/**
 * Tests for Insight Engine - Core insight-generation logic
 */

import { describe, it, expect } from 'vitest';
import { generateInsight } from '../src/insightEngine.js';

describe('Insight Engine Tests', () => {
  describe('generateInsight', () => {
    it('should handle invalid inputs gracefully', async () => {
      // Test with null current entry
      let result = await generateInsight(null, []);
      expect(result).toBe("Your journey continues to unfold with wisdom and growth.");
      
      // Test with invalid user history
      result = await generateInsight({ content: "test" }, "not an array");
      expect(result).toBe("Your journey continues to unfold with wisdom and growth.");
    });

    it('should generate insight for first entry', async () => {
      const currentEntry = { content: "I am grateful for this new beginning" };
      const userHistory = [];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toBe("Starting your journey with gratitude creates a foundation for deep awareness and growth.");
    });

    it('should identify recurring themes', async () => {
      const currentEntry = { content: "Today I felt anxious about my relationship with my friend" };
      const userHistory = [
        { content: "Had a conversation with my family about my future" },
        { content: "My relationship with my partner is growing stronger" },
        { content: "Feeling connected to my friends and loved ones" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("Relationships continue to be a central theme");
      expect(result).toContain("3/3 entries");
    });

    it('should detect contradictions and growth', async () => {
      const currentEntry = { content: "I feel confident and strong in my abilities today" };
      const userHistory = [
        { content: "I doubt myself and feel weak" },
        { content: "Feeling insecure about my capabilities" },
        { content: "Work was okay today" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("self-confidence has evolved");
      expect(result).toContain("transformation");
    });

    it('should handle different entry structures', async () => {
      // Test with payload structure
      const currentEntry = { payload: { content: "This is a test entry" } };
      const userHistory = [];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("Beginning to document your inner world");
    });

    it('should provide general insights when no patterns found', async () => {
      const currentEntry = { content: "Today was a normal day" };
      const userHistory = [
        { content: "Yesterday was fine" },
        { content: "Nothing special happened" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("Each entry adds depth to your self-understanding");
      expect(result).toContain("2 previous reflections");
    });

    it('should handle progress-oriented entries', async () => {
      const currentEntry = { content: "I made great progress today and feel better" };
      const userHistory = [
        { content: "Yesterday was challenging" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("2nd entry");
      expect(result).toContain("recognition of progress");
    });

    it('should identify emotional stability growth', async () => {
      const currentEntry = { content: "I feel calm and peaceful today, very centered" };
      const userHistory = [
        { content: "I was so anxious yesterday" },
        { content: "Feeling stressed and overwhelmed" },
        { content: "Had a panic attack" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("emotional landscape has shifted");
      expect(result).toContain("stability and peace");
    });

    it('should recognize creativity themes', async () => {
      const currentEntry = { content: "I created some beautiful art today and felt inspired" };
      const userHistory = [
        { content: "Spent time writing music" },
        { content: "Had an amazing creative session designing" },
        { content: "Work meeting was boring" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("Creative expression is a consistent thread");
      expect(result).toContain("2/3");
    });

    it('should handle empty content gracefully', async () => {
      const currentEntry = { content: "" };
      const userHistory = [];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toBe("Continue documenting your journey - each entry builds deeper self-awareness.");
    });

    it('should identify work-related patterns', async () => {
      const currentEntry = { content: "Another challenging day at work with my boss" };
      const userHistory = [
        { content: "Project meeting went well" },
        { content: "Career decisions are weighing on me" },
        { content: "Had dinner with friends" }
      ];
      
      const result = await generateInsight(currentEntry, userHistory);
      expect(result).toContain("Professional life emerges repeatedly");
      expect(result).toContain("values and purpose");
    });
  });
});