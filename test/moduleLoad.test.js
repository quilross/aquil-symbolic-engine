import test from 'node:test';
import assert from 'node:assert/strict';

const fakeEnv = { AQUIL_DB: {}, AQUIL_MEMORIES: {} };

test('AquilCore module loads', async () => {
  const { AquilCore } = await import('../src/src-core-aquil-core.js');
  const instance = new AquilCore(fakeEnv);
  assert.ok(instance);
});

test('TrustBuilder module loads', async () => {
  const { TrustBuilder } = await import('../src/src-core-trust-builder.js');
  const instance = new TrustBuilder(fakeEnv);
  assert.ok(instance);
});

test('EmotionAnalyzer module loads', async () => {
  const { EmotionAnalyzer } = await import('../src/src-utils-emotion-analyzer.js');
  const instance = new EmotionAnalyzer();
  assert.ok(instance);
});

test('PatternMatcher module loads', async () => {
  const { PatternMatcher } = await import('../src/src-utils-pattern-matcher.js');
  const instance = new PatternMatcher();
  assert.ok(instance);
});

test('TrustScorer module loads', async () => {
  const { TrustScorer } = await import('../src/src-utils-trust-scorer.js');
  const instance = new TrustScorer();
  assert.ok(instance);
});
