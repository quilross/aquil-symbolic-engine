/**
 * Question Generation Module
 * Generates targeted questions based on voice, press level, and context
 */

/**
 * Generate questions using AI endpoints with templated fallbacks
 * @param {Object} env - Environment bindings
 * @param {Object} params - Parameters object
 * @param {string} params.voice - Selected voice (mirror|oracle|scientist|strategist)
 * @param {number} params.pressLevel - Current press level (1-4)
 * @param {string} params.text - User input text
 * @param {Object} params.context - Context including session_id
 * @returns {Promise<Object>} - {questions: string[], micro?: string}
 */
export async function generateQuestions(env, { voice, pressLevel, text, context }) {
  const result = {
    questions: [],
    micro: null
  };
  
  try {
    // Primary question generation from discovery endpoint
    const primaryQuestions = await callDiscoveryEndpoint(env, { voice, pressLevel, text, context });
    if (primaryQuestions && primaryQuestions.length > 0) {
      result.questions.push(...primaryQuestions.slice(0, 2)); // Max 2 from primary
    }
  } catch (error) {
    console.warn('Primary question generation failed:', error.message);
  }
  
  // Check if we need contradiction detection
  const needsContradictionCheck = context.cues && (
    context.cues.includes('topic_shift') || 
    (context.cues.includes('hedging') && context.avoidanceScore > 0.7)
  );
  
  if (needsContradictionCheck && result.questions.length < 3) {
    try {
      const contradictionQuestions = await callContradictionsEndpoint(env, { text, context });
      if (contradictionQuestions && contradictionQuestions.length > 0) {
        result.questions.push(...contradictionQuestions.slice(0, 1)); // Max 1 from contradictions
      }
    } catch (error) {
      console.warn('Contradiction detection failed:', error.message);
    }
  }
  
  // Fallback to Socratic endpoint if still need more questions
  if (result.questions.length === 0) {
    try {
      const socraticQuestions = await callSocraticEndpoint(env, { voice, text, context });
      if (socraticQuestions && socraticQuestions.length > 0) {
        result.questions.push(...socraticQuestions.slice(0, 2));
      }
    } catch (error) {
      console.warn('Socratic question generation failed:', error.message);
    }
  }
  
  // Apply template guardrails if output is bland or missing
  if (result.questions.length === 0 || isBlind(result.questions)) {
    const templateQuestion = getTemplateQuestion(pressLevel, voice);
    result.questions = [templateQuestion];
  }
  
  // Cap at max 3 questions
  result.questions = result.questions.slice(0, 3);
  
  // Generate micro-commitment for L3-4 press levels
  if (pressLevel >= 3 && pressLevel <= 4) {
    result.micro = generateMicroCommitment(voice, pressLevel);
  }
  
  return result;
}

/**
 * Call the discovery/generate-inquiry endpoint
 * @param {Object} env - Environment bindings
 * @param {Object} params - Parameters
 * @returns {Promise<string[]>} - Array of questions
 */
async function callDiscoveryEndpoint(env, { voice, pressLevel, text, context }) {
  try {
    // Generate questions using existing pattern from main index.js
    const socraticQuestions = {
      mirror: [
        "What does your body tell you about this?",
        "How does this land in your heart right now?"
      ],
      oracle: [
        "What pattern wants to reveal itself here?",
        "What deeper wisdom is seeking expression?"
      ],
      scientist: [
        "What evidence do you have for this?", 
        "What would you need to test this hypothesis?"
      ],
      strategist: [
        "What's the first concrete step you could take?",
        "What resources do you need to move forward?"
      ]
    };
    
    const questions = socraticQuestions[voice] || socraticQuestions.oracle;
    return [questions[Math.floor(Math.random() * questions.length)]];
  } catch (error) {
    console.warn('Discovery endpoint call failed:', error);
    return [];
  }
}

/**
 * Call the socratic/question endpoint via direct handler
 * @param {Object} env - Environment bindings  
 * @param {Object} params - Parameters
 * @returns {Promise<string[]>} - Array of questions
 */
async function callSocraticEndpoint(env, { voice, text, context }) {
  try {
    // Generate socratic questions using existing pattern from main index.js
    const socraticQuestions = {
      mirror: [
        "What does your body tell you about this?",
        "How does this land in your heart right now?"
      ],
      oracle: [
        "What pattern wants to reveal itself here?",
        "What deeper wisdom is seeking expression?"
      ],
      scientist: [
        "What evidence do you have for this?",
        "What would you need to test this hypothesis?"
      ],
      strategist: [
        "What's the first concrete step you could take?",
        "What resources do you need to move forward?"
      ]
    };
    
    const questions = socraticQuestions[voice] || socraticQuestions.oracle;
    return [questions[Math.floor(Math.random() * questions.length)]];
  } catch (error) {
    console.warn('Socratic endpoint call failed:', error);
    return [];
  }
}

/**
 * Call the patterns/expose-contradictions endpoint via direct handler
 * @param {Object} env - Environment bindings
 * @param {Object} params - Parameters
 * @returns {Promise<string[]>} - Array of questions
 */
async function callContradictionsEndpoint(env, { text, context }) {
  try {
    // Import the PatternRecognizer and call exposeContradictions directly
    const { PatternRecognizer } = await import('../src-core-pattern-recognizer.js');
    
    const recognizer = new PatternRecognizer(env);
    const result = await recognizer.exposeContradictions({
      input: text,
      session_id: context.session_id || 'unknown'
    });
    
    return result.questions || [];
  } catch (error) {
    console.warn('Contradictions endpoint call failed:', error);
    return [];
  }
}

/**
 * Get template question based on press level and voice
 * @param {number} pressLevel - Press level 1-4
 * @param {string} voice - Voice type
 * @returns {string} - Template question
 */
function getTemplateQuestion(pressLevel, voice) {
  if (pressLevel <= 1) {
    // L1 (gentle)
    return "What's the most honest word for how that feels in your body right now?";
  } else if (pressLevel === 2) {
    // L2 (specific)
    return "Name one concrete example from the last 7 days.";
  } else {
    // L3-4 (decisive)
    return "What's one action you can take in the next 24 hours?";
  }
}

/**
 * Generate micro-commitment prompt for higher press levels
 * @param {string} voice - Voice type
 * @param {number} pressLevel - Press level
 * @returns {string} - Micro-commitment prompt
 */
function generateMicroCommitment(voice, pressLevel) {
  const prompts = {
    mirror: [
      "Consider checking in with your body about this tomorrow.",
      "Notice what shifts when you honor this insight today."
    ],
    oracle: [
      "Let this pattern reveal its next layer to you in the coming days.",
      "Trust what emerges when you sit with this wisdom."
    ],
    scientist: [
      "Observe what happens when you test this hypothesis today.",
      "Track one data point about this over the next 24 hours."
    ],
    strategist: [
      "Choose one small step you can take on this today.",
      "Identify the first resource you need to move forward."
    ]
  };
  
  const voicePrompts = prompts[voice] || prompts.strategist;
  return voicePrompts[Math.floor(Math.random() * voicePrompts.length)];
}

/**
 * Check if questions are bland/generic
 * @param {string[]} questions - Array of questions
 * @returns {boolean} - True if questions are bland
 */
function isBlind(questions) {
  if (!questions || questions.length === 0) return true;
  
  const blandPatterns = [
    'tell me more',
    'how do you feel',
    'what do you think',
    'can you explain',
    'what happened',
    'generic'
  ];
  
  return questions.every(q => {
    const lower = q.toLowerCase();
    return blandPatterns.some(pattern => lower.includes(pattern));
  });
}