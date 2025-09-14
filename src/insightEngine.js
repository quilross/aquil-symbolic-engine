/**
 * Insight Engine - Core insight-generation logic for journal entries
 * Analyzes patterns, themes, and contradictions to generate meaningful insights
 */

import * as journalService from './journalService.js';

/**
 * Generate insights by analyzing current entry against user history
 * @param {Object} currentEntry - The new journal entry to analyze
 * @param {Array} userHistory - Array of past journal entries
 * @returns {Promise<string>} Generated insight as a string
 */
export async function generateInsight(currentEntry, userHistory) {
  try {
    // Validate inputs
    if (!currentEntry || (typeof currentEntry !== 'object' && typeof currentEntry !== 'string')) {
      throw new Error('Current entry must be a valid object or string');
    }

    if (!Array.isArray(userHistory)) {
      throw new Error('User history must be an array');
    }

    // Extract content from current entry
    const currentContent = extractContent(currentEntry);
    if (!currentContent || currentContent.trim() === '') {
      return "Continue documenting your journey - each entry builds deeper self-awareness.";
    }

    // If no history, provide general insight
    if (userHistory.length === 0) {
      return analyzeFirstEntry(currentContent);
    }

    // Analyze patterns and contradictions
    const themes = identifyRecurringThemes(currentContent, userHistory);
    const contradictions = findContradictions(currentContent, userHistory);
    
    // Generate insight based on findings
    if (contradictions.length > 0) {
      return generateContradictionInsight(contradictions[0]);
    }
    
    if (themes.length > 0) {
      return generateThemeInsight(themes[0], userHistory.length);
    }

    // Fallback insight
    return generateGeneralInsight(currentContent, userHistory.length);

  } catch (error) {
    console.error('Error generating insight:', error);
    return "Your journey continues to unfold with wisdom and growth.";
  }
}

/**
 * Extract meaningful content from entry for analysis
 */
function extractContent(entry) {
  // Handle different entry structures
  if (entry.content !== undefined) return entry.content;
  if (entry.detail !== undefined) return entry.detail;
  if (entry.payload && typeof entry.payload === 'string') return entry.payload;
  if (entry.payload && entry.payload.content !== undefined) return entry.payload.content;
  if (typeof entry === 'string') return entry;
  
  return JSON.stringify(entry);
}

/**
 * Analyze first journal entry
 */
function analyzeFirstEntry(content) {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('grateful') || contentLower.includes('thank')) {
    return "Starting your journey with gratitude creates a foundation for deep awareness and growth.";
  }
  
  if (contentLower.includes('challenge') || contentLower.includes('difficult')) {
    return "Acknowledging challenges is the first step toward transformation and inner strength.";
  }
  
  if (contentLower.includes('goal') || contentLower.includes('want') || contentLower.includes('hope')) {
    return "Setting intentions in your journal creates a powerful container for manifesting change.";
  }
  
  return "Beginning to document your inner world is a courageous act of self-discovery.";
}

/**
 * Identify recurring themes across entries
 */
function identifyRecurringThemes(currentContent, userHistory) {
  const themeKeywords = {
    'relationships': ['relationship', 'friend', 'family', 'partner', 'love', 'connection', 'alone', 'together'],
    'growth': ['grow', 'learn', 'develop', 'improve', 'better', 'progress', 'evolve', 'change'],
    'emotions': ['feel', 'emotion', 'happy', 'sad', 'angry', 'anxious', 'joy', 'fear', 'peace'],
    'work': ['work', 'job', 'career', 'professional', 'colleague', 'boss', 'project', 'meeting'],
    'health': ['health', 'body', 'exercise', 'sleep', 'energy', 'tired', 'strong', 'wellness'],
    'creativity': ['create', 'art', 'music', 'write', 'imagine', 'inspire', 'express', 'design'],
    'spirituality': ['spirit', 'soul', 'meaning', 'purpose', 'meditation', 'prayer', 'divine', 'sacred'],
    'confidence': ['confident', 'doubt', 'believe', 'trust', 'self-worth', 'capable', 'deserve', 'worthy']
  };

  const currentLower = currentContent.toLowerCase();
  const themes = [];

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    // Check if theme appears in current entry
    const currentMatches = keywords.filter(keyword => currentLower.includes(keyword));
    
    if (currentMatches.length > 0) {
      // Count occurrences in history
      const historyCount = userHistory.filter(entry => {
        const historyContent = extractContent(entry).toLowerCase();
        return keywords.some(keyword => historyContent.includes(keyword));
      }).length;

      // If theme appears in current entry and at least 1 historical entry, it's recurring
      if (historyCount >= 1) {
        themes.push({
          name: theme,
          currentMatches,
          historyCount,
          frequency: historyCount / userHistory.length
        });
      }
    }
  }

  // Sort by frequency/relevance
  return themes.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Find contradictions between current entry and history
 */
function findContradictions(currentContent, userHistory) {
  const contradictionPatterns = [
    {
      current: ['confident', 'strong', 'capable', 'powerful'],
      historical: ['doubt', 'weak', 'incapable', 'powerless', 'insecure'],
      type: 'confidence_growth'
    },
    {
      current: ['calm', 'peaceful', 'relaxed', 'centered'],
      historical: ['anxious', 'stressed', 'worried', 'overwhelmed', 'panic'],
      type: 'emotional_stability'
    },
    {
      current: ['clear', 'focused', 'determined', 'decisive'],
      historical: ['confused', 'scattered', 'uncertain', 'indecisive'],
      type: 'clarity_development'
    },
    {
      current: ['connected', 'loved', 'supported', 'belonging'],
      historical: ['isolated', 'lonely', 'disconnected', 'alone'],
      type: 'relationship_healing'
    }
  ];

  const currentLower = currentContent.toLowerCase();
  const contradictions = [];

  for (const pattern of contradictionPatterns) {
    // Check if current entry matches current pattern
    const currentMatch = pattern.current.some(word => currentLower.includes(word));
    
    if (currentMatch) {
      // Check how many historical entries match the historical pattern
      const historicalMatches = userHistory.filter(entry => {
        const historyContent = extractContent(entry).toLowerCase();
        return pattern.historical.some(word => historyContent.includes(word));
      }).length;

      // If significant historical pattern exists, it's a meaningful contradiction
      if (historicalMatches >= Math.min(2, Math.ceil(userHistory.length * 0.3))) {
        contradictions.push({
          type: pattern.type,
          historicalMatches,
          totalHistory: userHistory.length,
          significance: historicalMatches / userHistory.length
        });
      }
    }
  }

  return contradictions.sort((a, b) => b.significance - a.significance);
}

/**
 * Generate insight from identified contradiction
 */
function generateContradictionInsight(contradiction) {
  const insights = {
    'confidence_growth': "Notice how your self-confidence has evolved - what once felt uncertain now feels grounded. This transformation reflects your growing trust in yourself.",
    'emotional_stability': "Your emotional landscape has shifted toward greater stability and peace. This reveals your developing capacity to navigate life's waves with grace.",
    'clarity_development': "Where confusion once lived, clarity now emerges. This growing decisiveness shows your strengthening connection to inner wisdom.",
    'relationship_healing': "Your sense of connection and belonging has deepened significantly. This healing in your relational world reflects your expanding capacity for love."
  };

  return insights[contradiction.type] || "You're experiencing meaningful growth that contradicts old patterns - this transformation shows your evolving capacity for change.";
}

/**
 * Generate insight from recurring theme
 */
function generateThemeInsight(theme, historyLength) {
  const insights = {
    'relationships': `Relationships continue to be a central theme in your journey (${theme.historyCount}/${historyLength} entries). This reveals the importance of connection in your growth process.`,
    'growth': `Your commitment to personal growth appears consistently in your entries (${theme.historyCount}/${historyLength} times). This dedication to evolution is a core strength.`,
    'emotions': `Emotional awareness is a recurring focus in your journaling (${theme.historyCount}/${historyLength} entries). This emotional intelligence is deepening your self-understanding.`,
    'work': `Professional life emerges repeatedly in your reflections (${theme.historyCount}/${historyLength} entries). Consider how your work aligns with your deeper values and purpose.`,
    'health': `Wellness and body awareness appear frequently in your journey (${theme.historyCount}/${historyLength} entries). This attention to physical well-being supports your overall growth.`,
    'creativity': `Creative expression is a consistent thread in your entries (${theme.historyCount}/${historyLength} times). This creative energy is a vital part of your authentic self.`,
    'spirituality': `Spiritual themes weave through your reflections regularly (${theme.historyCount}/${historyLength} entries). This spiritual dimension adds depth to your personal evolution.`,
    'confidence': `Self-confidence and self-worth appear repeatedly in your journey (${theme.historyCount}/${historyLength} entries). This focus on inner strength is building your authentic power.`
  };

  return insights[theme.name] || `The theme of ${theme.name} appears consistently in your journey, revealing its significance in your growth process.`;
}

/**
 * Generate general insight when no specific patterns found
 */
function generateGeneralInsight(content, historyLength) {
  const contentLower = content.toLowerCase();
  const entryCount = historyLength + 1;
  const ordinal = getOrdinal(entryCount);
  
  if (contentLower.includes('progress') || contentLower.includes('better')) {
    return `This is your ${ordinal} entry, and recognition of progress shows your growing self-awareness and commitment to growth.`;
  }
  
  if (contentLower.includes('challenge') || contentLower.includes('difficult')) {
    return `With ${historyLength} previous entries, you're building resilience by consistently facing challenges with awareness and courage.`;
  }
  
  if (contentLower.includes('grateful') || contentLower.includes('appreciate')) {
    return `Gratitude emerges naturally in your ${ordinal} entry, showing how appreciation deepens through consistent practice.`;
  }
  
  return `Each entry adds depth to your self-understanding. With ${historyLength} previous reflections, you're building a rich foundation of awareness.`;
}

/**
 * Convert number to ordinal (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(num) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}