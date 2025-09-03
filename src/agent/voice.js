/**
 * Voice Selection Module  
 * Selects appropriate conversational voice based on user input and context
 */

/**
 * Select appropriate voice based on input context and signals
 * @param {Object} params - Parameters object
 * @param {string} params.text - User input text
 * @param {Object} params.signals - Avoidance detection signals {score, concreteness}
 * @param {number} params.pressLevel - Current pressing level
 * @returns {string} - Selected voice: 'mirror'|'oracle'|'scientist'|'strategist'
 */
export function selectVoice({ text, signals, pressLevel }) {
  if (!text || typeof text !== 'string') {
    return 'mirror'; // Default safe voice
  }

  const lowerText = text.toLowerCase();
  
  // Check for overwhelm cues - Mirror voice for support
  const overwhelmCues = [
    'stuck', 'numb', 'overwhelmed', 'tired', 'exhausted', 'drained', 
    'can\'t handle', 'too much', 'breaking down', 'falling apart',
    'burnt out', 'depleted', 'overloaded'
  ];
  
  const hasOverwhelm = overwhelmCues.some(cue => lowerText.includes(cue));
  
  // Mirror for overwhelm or high hedging with low press
  if (hasOverwhelm || (signals.score >= 0.5 && pressLevel <= 2)) {
    return 'mirror';
  }
  
  // Scientist for low concreteness + mid/high press (need specificity)
  if (signals.concreteness < 0.4 && pressLevel >= 2) {
    return 'scientist';
  }
  
  // Strategist for decision/goal/action context
  const strategistCues = [
    'decision', 'decide', 'choice', 'choose', 'goal', 'goals', 'next step', 
    'what should i', 'how do i', 'action', 'plan', 'strategy', 'move forward',
    'priorities', 'focus', 'direction', 'path', 'way forward', 'what now'
  ];
  
  const hasStrategistContext = strategistCues.some(cue => lowerText.includes(cue));
  if (hasStrategistContext) {
    return 'strategist';
  }
  
  // Oracle for patterns/dreams/symbols/metaphor
  const oracleCues = [
    'pattern', 'patterns', 'dream', 'dreams', 'symbol', 'symbols', 'metaphor',
    'meaning', 'deeper', 'underneath', 'beyond', 'spiritual', 'sacred',
    'archetype', 'mythology', 'story', 'narrative', 'theme', 'wisdom',
    'intuition', 'gut feeling', 'sense that', 'feels like', 'reminds me'
  ];
  
  const hasOracleContext = oracleCues.some(cue => lowerText.includes(cue));
  if (hasOracleContext) {
    return 'oracle';
  }
  
  // Default based on press level and signals
  if (pressLevel >= 3) {
    return 'strategist'; // High press = action orientation
  } else if (signals.concreteness < 0.5) {
    return 'scientist'; // Low concreteness = need specificity
  } else {
    return 'mirror'; // Safe default for reflection
  }
}