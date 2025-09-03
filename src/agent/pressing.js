/**
 * Pressing Level Management Module
 * Manages escalation and de-escalation of conversational pressing
 */

/**
 * Calculate next press level based on avoidance and context
 * @param {number} prev - Previous press level
 * @param {number} avoidanceScore - Avoidance score from 0 to 1
 * @param {boolean} overwhelm - Whether user shows overwhelm signals
 * @param {number} [base=1] - Base press level from env.PRESS_BASE
 * @param {number} [max=4] - Max press level from env.PRESS_MAX
 * @returns {number} - Next press level
 */
export function nextPressLevel(prev, avoidanceScore, overwhelm, base = 1, max = 4) {
  // Validate inputs
  if (typeof prev !== 'number' || prev < 1) {
    prev = base;
  }
  if (typeof avoidanceScore !== 'number' || avoidanceScore < 0) {
    avoidanceScore = 0;
  }
  if (typeof base !== 'number' || base < 1) {
    base = 1;
  }
  if (typeof max !== 'number' || max < base) {
    max = Math.max(4, base);
  }
  
  // Clamp previous level within bounds
  prev = Math.max(base, Math.min(max, prev));
  
  // If overwhelm detected, reduce press level
  if (overwhelm) {
    return Math.max(base, prev - 1);
  }
  
  // If high avoidance (≥ 0.6) and not overwhelm, increase press
  if (avoidanceScore >= 0.6) {
    return Math.min(max, prev + 1);
  }
  
  // Otherwise maintain current level
  return prev;
}

/**
 * Check if user input indicates overwhelm
 * @param {string} text - User input text
 * @param {number} [sensitivity=0.5] - Overwhelm sensitivity threshold
 * @returns {boolean} - True if overwhelm detected
 */
export function detectOverwhelm(text, sensitivity = 0.5) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const lowerText = text.toLowerCase();
  
  // Primary overwhelm indicators
  const overwhelmWords = [
    'stuck', 'numb', 'overwhelmed', 'tired', 'exhausted', 'drained',
    'can\'t handle', 'too much', 'breaking down', 'falling apart',
    'burnt out', 'depleted', 'overloaded', 'crushed', 'defeated',
    'hopeless', 'helpless', 'lost', 'confused', 'scattered'
  ];
  
  // Secondary stress indicators
  const stressWords = [
    'stressed', 'anxious', 'worried', 'panicking', 'freaking out',
    'can\'t cope', 'struggling', 'drowning', 'suffocating', 'trapped'
  ];
  
  let overwhelmCount = 0;
  let stressCount = 0;
  
  // Count overwhelm indicators
  for (const word of overwhelmWords) {
    if (lowerText.includes(word)) {
      overwhelmCount++;
    }
  }
  
  // Count stress indicators  
  for (const word of stressWords) {
    if (lowerText.includes(word)) {
      stressCount++;
    }
  }
  
  // Calculate overwhelm score
  const overwhelmScore = (overwhelmCount * 0.6) + (stressCount * 0.3);
  
  // Check physical indicators
  const physicalIndicators = [
    'can\'t breathe', 'heart racing', 'shaking', 'trembling',
    'chest tight', 'head spinning', 'dizzy', 'nauseous'
  ];
  
  let physicalCount = 0;
  for (const indicator of physicalIndicators) {
    if (lowerText.includes(indicator)) {
      physicalCount++;
    }
  }
  
  if (physicalCount > 0) {
    overwhelmScore += physicalCount * 0.4;
  }
  
  return overwhelmScore >= sensitivity;
}