/**
 * Avoidance Detection Module
 * Detects vagueness, avoidance patterns, and concreteness in user input
 */

/**
 * Detects avoidance patterns in user input
 * @param {string} input - User input text
 * @param {string} [prevTopic] - Previous topic for topic shift detection
 * @returns {Object} - {score: number, cues: string[], concreteness: number}
 */
export function detectAvoidance(input, prevTopic = '') {
  if (!input || typeof input !== 'string') {
    return { score: 0, cues: [], concreteness: 0 };
  }

  const text = input.toLowerCase().trim();
  const words = text.split(/\s+/).filter(word => word.length > 0);
  
  // Hedging lexicon patterns
  const hedgingPatterns = [
    'maybe', 'i guess', 'sort of', 'kind of', 'probably', 
    'i don\'t know', 'idk', 'whatever', 'or something', 'i think',
    'perhaps', 'might be', 'could be', 'not sure', 'dunno'
  ];
  
  const cues = [];
  let score = 0;
  
  // Count hedging indicators
  let hedgingCount = 0;
  for (const pattern of hedgingPatterns) {
    if (text.includes(pattern)) {
      hedgingCount++;
      cues.push('hedging');
    }
  }
  
  // Score based on hedging frequency
  if (hedgingCount > 0) {
    score += Math.min(0.4, hedgingCount * 0.15);
  }
  
  // Calculate concreteness
  const concreteness = calculateConcreteness(text, words);
  
  // Penalize low concreteness
  if (concreteness < 0.3) {
    score += 0.3;
    cues.push('vague');
  }
  
  // Check for topic shift if previous topic provided
  if (prevTopic && prevTopic.length > 0) {
    const similarity = calculateJaccardSimilarity(text, prevTopic.toLowerCase());
    if (similarity < 0.2) {
      score += 0.2;
      cues.push('topic_shift');
    }
  }
  
  // Cap score at 1.0
  score = Math.min(1.0, score);
  
  // Remove duplicate cues
  const uniqueCues = [...new Set(cues)];
  
  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    cues: uniqueCues,
    concreteness: Math.round(concreteness * 100) / 100
  };
}

/**
 * Calculate concreteness based on word count, nouns, verbs, and specific details
 * @param {string} text - Input text
 * @param {string[]} words - Array of words
 * @returns {number} - Concreteness score between 0 and 1
 */
function calculateConcreteness(text, words) {
  let score = 0;
  
  // Base score from word count (minimum 5 words for basic concreteness)
  if (words.length >= 5) {
    score += 0.3;
  } else {
    // Penalize very short responses
    return Math.max(0, words.length / 5 * 0.3);
  }
  
  // Look for concrete elements
  const timeIndicators = [
    'today', 'yesterday', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday', 'morning', 'afternoon', 'evening', 'night',
    'week', 'month', 'year', 'hour', 'minute', 'am', 'pm', 'o\'clock'
  ];
  
  const placeIndicators = [
    'at work', 'at home', 'in the', 'at the', 'downtown', 'uptown', 
    'office', 'house', 'room', 'kitchen', 'bedroom', 'car', 'store',
    'school', 'hospital', 'park', 'restaurant', 'gym'
  ];
  
  const numberPattern = /\b\d+\b/;
  
  // Check for time references
  let hasTime = false;
  for (const indicator of timeIndicators) {
    if (text.includes(indicator)) {
      hasTime = true;
      break;
    }
  }
  
  // Check for place references
  let hasPlace = false;
  for (const indicator of placeIndicators) {
    if (text.includes(indicator)) {
      hasPlace = true;
      break;
    }
  }
  
  // Check for numbers
  const hasNumbers = numberPattern.test(text);
  
  // Reward concrete details
  if (hasTime) score += 0.25;
  if (hasPlace) score += 0.25;
  if (hasNumbers) score += 0.2;
  
  // Look for nouns and verbs (simple heuristic based on common patterns)
  const nounPatterns = [
    /\b(person|people|friend|family|job|work|project|goal|feeling|emotion|thought|idea|problem|solution|decision|choice|relationship|situation|experience|moment|time|place|thing|way|life|world|day|week|month|year)\b/g
  ];
  
  const verbPatterns = [
    /\b(am|is|are|was|were|been|being|have|has|had|do|does|did|will|would|could|should|might|may|can|go|went|come|came|see|saw|think|thought|feel|felt|know|knew|want|wanted|need|needed|try|tried|work|worked|make|made|take|took|give|gave|get|got|say|said|tell|told|ask|asked|help|helped|start|started|stop|stopped|continue|continued)\b/g
  ];
  
  let nounCount = 0;
  let verbCount = 0;
  
  for (const pattern of nounPatterns) {
    const matches = text.match(pattern);
    if (matches) nounCount += matches.length;
  }
  
  for (const pattern of verbPatterns) {
    const matches = text.match(pattern);
    if (matches) verbCount += matches.length;
  }
  
  // Basic grammar structure indicates concreteness
  if (nounCount > 0 && verbCount > 0) {
    score += 0.2;
  }
  
  return Math.min(1.0, score);
}

/**
 * Calculate Jaccard similarity between two texts
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateJaccardSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.split(/\s+/).filter(word => word.length > 2));
  const words2 = new Set(text2.split(/\s+/).filter(word => word.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}