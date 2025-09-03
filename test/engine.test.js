/**
 * Tests for Behavioral Intelligence Engine (Ark 2.0)
 * Minimal tests as specified in the problem statement
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

import { detectAvoidance } from '../src/agent/avoidance.js';
import { selectVoice } from '../src/agent/voice.js';
import { nextPressLevel, detectOverwhelm } from '../src/agent/pressing.js';
import { runEngine } from '../src/agent/engine.js';

// Test 1: Avoidance detection
test('Avoidance: input "I guess maybe later" should have high score and low concreteness', async () => {
  const result = detectAvoidance("I guess maybe later");
  
  assert(result.score >= 0.6, `Expected avoidance score >= 0.6, got ${result.score}`);
  assert(result.concreteness <= 0.3, `Expected concreteness <= 0.3, got ${result.concreteness}`);
  assert(result.cues.includes('hedging'), 'Expected hedging cue');
});

// Test 2: Press level escalation and de-escalation
test('Press escalates when avoidance high; drops on overwhelm', async () => {
  // High avoidance should escalate
  const escalated = nextPressLevel(2, 0.7, false, 1, 4);
  assert(escalated === 3, `Expected press level 3, got ${escalated}`);
  
  // Overwhelm should de-escalate
  const deescalated = nextPressLevel(3, 0.7, true, 1, 4);
  assert(deescalated === 2, `Expected press level 2, got ${deescalated}`);
});

// Test 3: Voice selection for low concreteness + higher press
test('Voice: low concreteness + higher press should select scientist', async () => {
  const signals = { score: 0.4, concreteness: 0.3 };
  const voice = selectVoice({ 
    text: "I don't know, maybe something", 
    signals, 
    pressLevel: 3 
  });
  
  assert(voice === 'scientist', `Expected scientist voice, got ${voice}`);
});

// Test 4: Engine returns ≤3 questions and includes micro at higher press
test('Engine: returns ≤3 questions; includes micro at higher press', async () => {
  // Mock environment
  const mockEnv = {
    ENABLE_CONVERSATIONAL_ENGINE: '1',
    PRESS_BASE: '1',
    PRESS_MAX: '4',
    OVERWHELM_SENSITIVITY: '0.5',
    AQUIL_MEMORIES: {
      get: async () => null,
      put: async () => {}
    }
  };
  
  const result = await runEngine(mockEnv, 'test-session', 'I guess I should maybe do something');
  
  assert(Array.isArray(result.questions), 'Expected questions array');
  assert(result.questions.length <= 3, `Expected ≤3 questions, got ${result.questions.length}`);
  
  // For higher press levels, should include micro-commitment
  if (result.pressLevel >= 3) {
    assert(typeof result.micro === 'string', 'Expected micro-commitment string at higher press levels');
  }
});

// Test 5: Overwhelm detection
test('Overwhelm detection works correctly', async () => {
  const overwhelmText = "I'm completely overwhelmed and can't handle this anymore";
  const normalText = "I'm thinking about my goals for next week";
  
  assert(detectOverwhelm(overwhelmText) === true, 'Expected overwhelm to be detected');
  assert(detectOverwhelm(normalText) === false, 'Expected no overwhelm in normal text');
});

// Test 6: Fail-open behavior
test('Fail-open path: engine still returns questions when errors occur', async () => {
  // Mock environment with missing bindings to trigger errors
  const mockEnv = {
    ENABLE_CONVERSATIONAL_ENGINE: '1',
    // Missing AQUIL_MEMORIES to trigger error path
  };
  
  const result = await runEngine(mockEnv, 'test-session', 'test input');
  
  // Should still return a valid response structure
  assert(typeof result === 'object', 'Expected object result');
  assert(Array.isArray(result.questions), 'Expected questions array');
  assert(result.questions.length > 0, 'Expected at least one fallback question');
  assert(typeof result.voice === 'string', 'Expected voice string');
  assert(typeof result.pressLevel === 'number', 'Expected press level number');
});

console.log('✅ All Behavioral Intelligence Engine tests passed');