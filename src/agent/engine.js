/**
 * Behavioral Intelligence Engine (Ark 2.0)
 * Main orchestrator for conversational engine
 */

import { detectAvoidance } from './avoidance.js';
import { selectVoice } from './voice.js';
import { nextPressLevel, detectOverwhelm } from './pressing.js';
import { generateQuestions } from './questions.js';

/**
 * Main engine function that orchestrates the behavioral intelligence
 * @param {Object} env - Environment bindings
 * @param {string} session_id - Session identifier
 * @param {string} userText - User input text
 * @returns {Promise<Object>} - Engine result with voice, pressLevel, cues, questions, micro
 */
export async function runEngine(env, session_id, userText) {
  try {
    // 1. Load state from KV
    const state = await loadState(env, session_id);
    
    // 2. Detect avoidance and signals
    const signals = detectAvoidance(userText, state.lastTopic);
    
    // 3. Detect overwhelm
    const overwhelm = detectOverwhelm(userText, parseFloat(env.OVERWHELM_SENSITIVITY || '0.5'));
    
    // 4. Calculate next press level
    const pressLevel = nextPressLevel(
      state.pressLevel,
      signals.score,
      overwhelm,
      parseInt(env.PRESS_BASE || '1', 10),
      parseInt(env.PRESS_MAX || '4', 10)
    );
    
    // 5. Select voice
    const voice = selectVoice({ 
      text: userText, 
      signals, 
      pressLevel 
    });
    
    // 6. Generate questions
    const context = {
      session_id,
      cues: signals.cues,
      avoidanceScore: signals.score
    };
    
    const questions = await generateQuestions(env, {
      voice,
      pressLevel,
      text: userText,
      context
    });
    
    // 7. Log via logChatGPTAction
    await logEngine(env, {
      session_id,
      pressLevel,
      voice,
      cues: signals.cues,
      input: userText
    }, {
      questions: questions.questions,
      micro: questions.micro
    });
    
    // 8. Save state
    await saveState(env, session_id, {
      pressLevel,
      lastVoice: voice,
      lastTopic: extractKeyPhrases(userText),
      lastAt: Date.now()
    });
    
    return {
      voice,
      pressLevel,
      cues: signals.cues,
      questions: questions.questions || [],
      micro: questions.micro || null
    };
    
  } catch (error) {
    console.error('Engine error:', error);
    
    // Fail-open response
    return {
      voice: 'mirror',
      pressLevel: parseInt(env.PRESS_BASE || '1', 10),
      cues: ['error'],
      questions: ["What feels most important for you to explore right now?"],
      micro: null
    };
  }
}

/**
 * Load conversation state from KV
 * @param {Object} env - Environment bindings
 * @param {string} session_id - Session identifier
 * @returns {Promise<Object>} - State object
 */
async function loadState(env, session_id) {
  const defaultState = {
    pressLevel: parseInt(env.PRESS_BASE || '1', 10),
    lastVoice: 'mirror',
    lastTopic: '',
    lastAt: 0
  };
  
  if (!env.AQUIL_MEMORIES) {
    return defaultState;
  }
  
  try {
    const key = `convo:${session_id}`;
    const data = await env.AQUIL_MEMORIES.get(key);
    
    if (!data) {
      return defaultState;
    }
    
    const state = JSON.parse(data);
    
    // Validate state structure
    return {
      pressLevel: typeof state.pressLevel === 'number' ? state.pressLevel : defaultState.pressLevel,
      lastVoice: typeof state.lastVoice === 'string' ? state.lastVoice : defaultState.lastVoice,
      lastTopic: typeof state.lastTopic === 'string' ? state.lastTopic : defaultState.lastTopic,
      lastAt: typeof state.lastAt === 'number' ? state.lastAt : defaultState.lastAt
    };
    
  } catch (error) {
    console.warn('Failed to load state:', error);
    return defaultState;
  }
}

/**
 * Save conversation state to KV
 * @param {Object} env - Environment bindings
 * @param {string} session_id - Session identifier
 * @param {Object} state - State to save
 * @returns {Promise<void>}
 */
async function saveState(env, session_id, state) {
  if (!env.AQUIL_MEMORIES) {
    console.warn('KV store (AQUIL_MEMORIES) not available for session state persistence');
    return; // Graceful degradation when KV not configured
  }
  
  try {
    const key = `convo:${session_id}`;
    const data = JSON.stringify(state);
    
    // Set TTL based on environment setting, default to 7 days
    const ttl = parseInt(env.KV_TTL_SECONDS || '604800', 10);
    
    if (ttl > 0) {
      await env.AQUIL_MEMORIES.put(key, data, { expirationTtl: ttl });
    } else {
      await env.AQUIL_MEMORIES.put(key, data); // No expiration
    }
    
  } catch (error) {
    console.warn('Failed to save session state:', error.message, {
      sessionId: session_id,
      stateSize: JSON.stringify(state).length
    });
    // Graceful degradation - conversation continues without state persistence
  }
}

/**
 * Log engine action using the existing logChatGPTAction function
 * @param {Object} env - Environment bindings
 * @param {Object} input - Input data
 * @param {Object} output - Output data
 * @returns {Promise<void>}
 */
async function logEngine(env, input, output) {
  try {
    // Use the logging infrastructure directly
    const { writeLog } = await import('../actions/logging.js');
    
    const logData = {
      type: 'conversationalProbe',
      payload: {
        action: 'conversationalProbe',
        input: input,
        result: { success: true, processed: true, ...output }
      },
      session_id: input.session_id || null,
      who: 'system',
      level: 'info',
      tags: [
        'action:conversationalProbe',
        'domain:conversation',
        'source:gpt',
        `env:${env.ENVIRONMENT || 'production'}`,
        'success',
        'chatgpt_action'
      ],
      binary: null,
      textOrVector: `conversational probe: session=${input.session_id}, voice=${input.voice}, press=${input.pressLevel}`
    };
    
    await writeLog(env, logData);
  } catch (error) {
    console.warn('Failed to log engine action:', error.message, {
      sessionId: input.session_id,
      voice: input.voice,
      endpoint: 'behavioral_engine'
    });
    // Graceful degradation - logging failures don't interrupt user experience
  }
}

/**
 * Extract key noun phrases from text for topic tracking
 * @param {string} text - Input text
 * @returns {string} - Key phrases
 */
function extractKeyPhrases(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Simple heuristic: take meaningful words (nouns, verbs)
  const meaningfulWords = words.filter(word => {
    // Filter out common function words
    const functionWords = [
      'this', 'that', 'they', 'them', 'their', 'there', 'then', 'than',
      'when', 'where', 'what', 'which', 'would', 'could', 'should',
      'have', 'been', 'will', 'with', 'from', 'into', 'some', 'more',
      'very', 'just', 'like', 'only', 'also', 'much', 'well'
    ];
    return !functionWords.includes(word);
  });
  
  // Take first 3-5 meaningful words as topic representation
  return meaningfulWords.slice(0, 5).join(' ');
}