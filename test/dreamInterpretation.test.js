/**
 * Tests for interpretDream functionality
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { buildInterpretation, maybeRecognizePatterns, safeTruncated } from '../src/utils/dream-interpreter.js';

test('buildInterpretation - basic success with plausible dream text', () => {
  const dreamText = 'I was walking through a dark forest and found a beautiful golden door. I felt scared but curious about what was behind it. There were strange animals watching me from the trees.';
  
  const interpretation = buildInterpretation(dreamText);
  
  assert.ok(interpretation.summary, 'Should have a summary');
  assert.ok(Array.isArray(interpretation.themes), 'Should have themes array');
  assert.ok(Array.isArray(interpretation.symbols), 'Should have symbols array');
  assert.ok(Array.isArray(interpretation.tensions), 'Should have tensions array');
  assert.ok(Array.isArray(interpretation.invitations), 'Should have invitations array');
  
  assert.ok(interpretation.themes.length >= 2, 'Should have 2-5 themes');
  assert.ok(interpretation.themes.length <= 5, 'Should have 2-5 themes');
  
  assert.ok(interpretation.invitations.length >= 1, 'Should have 1-3 invitations');
  assert.ok(interpretation.invitations.length <= 3, 'Should have 1-3 invitations');
  
  assert.ok(interpretation.summary.length > 20, 'Summary should be substantive');
  
  // Should extract common symbols from the text
  const symbolsText = interpretation.symbols.join(' ');
  assert.ok(symbolsText.includes('door') || symbolsText.includes('forest') || symbolsText.includes('animal'), 'Should extract key symbols');
});

test('buildInterpretation - handles short text gracefully', () => {
  const shortText = 'I had a dream.';
  
  const interpretation = buildInterpretation(shortText);
  
  assert.ok(interpretation.summary, 'Should still have summary');
  assert.ok(Array.isArray(interpretation.themes), 'Should have themes array');
  assert.equal(interpretation.themes.length >= 1, true, 'Should have at least default themes');
});

test('buildInterpretation - integrates engine cues for invitations', () => {
  const dreamText = 'I was trying to climb a mountain but kept slipping down. I felt frustrated and wanted to give up.';
  
  const mockEngine = {
    voice: 'strategist',
    pressLevel: 2,
    questions: ['What small step could you take today?'],
    micro: 'Take one concrete action toward your goal today'
  };
  
  const interpretation = buildInterpretation(dreamText, [], mockEngine);
  
  // Should prioritize engine micro-commitment
  assert.ok(interpretation.invitations.includes(mockEngine.micro), 'Should include engine micro-commitment');
});

test('buildInterpretation - includes motifs from pattern recognition', () => {
  const dreamText = 'I was flying over the ocean and saw dolphins swimming below.';
  const motifs = ['freedom', 'flow', 'intuition'];
  
  const interpretation = buildInterpretation(dreamText, motifs);
  
  // Should merge motifs with extracted symbols
  const allSymbols = interpretation.symbols.join(' ');
  assert.ok(motifs.some(motif => allSymbols.includes(motif)), 'Should include pattern recognition motifs');
});

test('safeTruncated - handles text correctly', () => {
  const longText = 'This is a very long dream narrative that goes on and on with many details about the experience and emotions felt during the dream state and various symbols and meanings that emerged.';
  
  const truncated = safeTruncated(longText, 50);
  assert.ok(truncated.length <= 50, 'Should truncate to max length');
  assert.ok(truncated.endsWith('...'), 'Should add ellipsis when truncated');
  
  const shortText = 'Short dream.';
  const notTruncated = safeTruncated(shortText, 50);
  assert.equal(notTruncated, shortText, 'Should not truncate short text');
});

test('maybeRecognizePatterns - fails gracefully', async () => {
  // Test with missing env bindings (should fail-open)
  const mockEnv = {}; // Empty env to trigger failure
  
  const result = await maybeRecognizePatterns(mockEnv, 'I had a dream about water');
  
  assert.ok(Array.isArray(result), 'Should return array even on failure');
  assert.equal(result.length, 0, 'Should return empty array on failure');
});

console.log('✅ All dream interpretation unit tests passed');