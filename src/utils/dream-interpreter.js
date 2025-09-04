/**
 * Dream interpretation utilities
 * Provides deterministic analysis and synthesis for dream content
 */

/**
 * Extract themes from dream text using keyword analysis
 */
function extractThemes(text) {
  const themeKeywords = {
    'transformation': ['change', 'transform', 'become', 'evolve', 'metamorphosis', 'shift'],
    'relationships': ['people', 'friend', 'family', 'stranger', 'together', 'alone', 'conversation'],
    'fear': ['scared', 'afraid', 'terror', 'anxiety', 'worried', 'panic', 'dark'],
    'power': ['control', 'strength', 'weak', 'powerful', 'helpless', 'authority'],
    'journey': ['travel', 'path', 'road', 'walk', 'journey', 'destination', 'lost'],
    'home': ['house', 'home', 'room', 'door', 'familiar', 'childhood'],
    'nature': ['water', 'ocean', 'forest', 'mountain', 'animal', 'sky', 'earth'],
    'creativity': ['art', 'music', 'create', 'build', 'design', 'imagine'],
    'spirituality': ['divine', 'sacred', 'spirit', 'soul', 'transcendent', 'mystical'],
    'conflict': ['fight', 'struggle', 'conflict', 'battle', 'resist', 'oppose']
  };

  const textLower = text.toLowerCase();
  const themes = [];

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const matches = keywords.filter(keyword => textLower.includes(keyword));
    if (matches.length > 0) {
      themes.push(theme);
    }
  }

  // If no themes found, add generic ones based on text length and content
  if (themes.length === 0) {
    if (textLower.includes('i') || textLower.includes('me')) themes.push('self-reflection');
    if (textLower.includes('remember') || textLower.includes('forgot')) themes.push('memory');
    themes.push('unconscious-processing');
  }

  return themes.slice(0, 5); // Limit to 5 themes max
}

/**
 * Extract symbols (key nouns and adjectives) from dream text
 */
function extractSymbols(text) {
  // Simple noun extraction - look for common dream symbols
  const symbolPatterns = [
    /\b(house|door|room|window|mirror|key|car|water|fire|animal|tree|mountain|sky|sun|moon|star|book|phone|computer|bridge|stairs|elevator|kitchen|bathroom|bedroom|garden|forest|ocean|river|lake|bird|cat|dog|snake|spider|flower|baby|child|mother|father|friend|stranger|teacher|doctor|police|ghost|angel|demon|monster)\b/gi
  ];

  const symbols = new Set();
  
  for (const pattern of symbolPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => symbols.add(match.toLowerCase()));
    }
  }

  // Extract adjectives that might be symbolic
  const adjectives = text.match(/\b(big|small|dark|bright|beautiful|scary|strange|familiar|old|new|broken|perfect|empty|full|hidden|lost|found|flying|falling|running|walking|talking|silent)\b/gi);
  if (adjectives) {
    adjectives.forEach(adj => symbols.add(adj.toLowerCase()));
  }

  return Array.from(symbols).slice(0, 8); // Limit to 8 symbols
}

/**
 * Identify tensions and contradictions in dream narrative
 */
function extractTensions(text) {
  const tensionIndicators = [
    { pattern: /but|however|although|despite|even though/gi, tension: 'contradiction' },
    { pattern: /can't|couldn't|unable|impossible/gi, tension: 'limitation' },
    { pattern: /want|need|desire|wish|hope/gi, tension: 'longing' },
    { pattern: /scared|afraid|worried|nervous/gi, tension: 'anxiety' },
    { pattern: /confused|lost|don't know|uncertain/gi, tension: 'confusion' },
    { pattern: /trapped|stuck|can't escape/gi, tension: 'entrapment' },
    { pattern: /should|must|have to|supposed to/gi, tension: 'obligation' }
  ];

  const tensions = [];
  const textLower = text.toLowerCase();

  for (const { pattern, tension } of tensionIndicators) {
    if (pattern.test(text)) {
      tensions.push(tension);
    }
  }

  // Look for emotional contrasts
  const emotions = textLower.match(/\b(happy|sad|angry|calm|excited|scared|peaceful|worried|joyful|anxious)\b/g);
  if (emotions && emotions.length > 1) {
    const uniqueEmotions = [...new Set(emotions)];
    if (uniqueEmotions.length > 1) {
      tensions.push('emotional-ambivalence');
    }
  }

  return tensions.slice(0, 4); // Limit to 4 tensions
}

/**
 * Generate actionable invitations based on dream content and engine cues
 */
function generateInvitations(text, themes, tensions, engine = null) {
  const invitations = [];

  // Theme-based invitations
  if (themes.includes('transformation')) {
    invitations.push('What aspect of your life is ready for change?');
  }
  if (themes.includes('relationships')) {
    invitations.push('Consider reaching out to someone important to you today.');
  }
  if (themes.includes('fear')) {
    invitations.push('Name one small fear you could face this week.');
  }
  if (themes.includes('creativity')) {
    invitations.push('Spend 15 minutes creating something with your hands today.');
  }
  if (themes.includes('journey')) {
    invitations.push('Take a mindful walk and notice what calls to you.');
  }

  // Tension-based invitations
  if (tensions.includes('confusion')) {
    invitations.push('Write down one question this dream raises for you.');
  }
  if (tensions.includes('limitation')) {
    invitations.push('Identify one small step around a current limitation.');
  }
  if (tensions.includes('anxiety')) {
    invitations.push('Practice three deep breaths when you feel uncertain today.');
  }

  // Engine-influenced micro-commitments
  if (engine && engine.micro) {
    invitations.unshift(engine.micro); // Prioritize engine suggestion
  }

  // Default invitations if none match
  if (invitations.length === 0) {
    invitations.push('Take time to journal about this dream today.');
    invitations.push('Notice any waking life echoes of this dream imagery.');
  }

  return invitations.slice(0, 3); // Limit to 3 invitations
}

/**
 * Create a summary synthesis of the dream interpretation
 */
function createSummary(text, themes, symbols, tensions, invitations) {
  const dreamLength = text.length;
  
  let summary = '';
  
  if (dreamLength < 50) {
    summary = 'This brief dream fragment hints at ';
  } else if (dreamLength < 200) {
    summary = 'This dream explores themes of ';
  } else {
    summary = 'This rich dream narrative weaves together ';
  }

  // Add primary themes
  if (themes.length > 0) {
    summary += themes.slice(0, 2).join(' and ');
  } else {
    summary += 'unconscious processing';
  }

  // Add tension or resolution note
  if (tensions.length > 0) {
    summary += `, revealing tensions around ${tensions[0]}`;
  } else {
    summary += ', offering insights for integration';
  }

  // Add symbols note if rich imagery
  if (symbols.length >= 3) {
    summary += `. The imagery of ${symbols.slice(0, 2).join(' and ')} suggests `;
    if (themes.includes('transformation')) {
      summary += 'a readiness for change';
    } else if (themes.includes('relationships')) {
      summary += 'relational dynamics at play';
    } else {
      summary += 'symbolic significance worth exploring';
    }
  }

  summary += '.';

  // Add invitation context
  if (invitations.length > 0) {
    summary += ` Consider ${invitations[0].toLowerCase()}`;
  }

  return summary;
}

/**
 * Build complete interpretation from dream text and optional context
 */
export function buildInterpretation(text, motifs = [], engine = null) {
  const themes = extractThemes(text);
  const symbols = extractSymbols(text);
  const tensions = extractTensions(text);
  
  // Merge any recognized motifs with symbols
  const allSymbols = [...new Set([...symbols, ...motifs.slice(0, 3)])];
  
  const invitations = generateInvitations(text, themes, tensions, engine);
  const summary = createSummary(text, themes, allSymbols, tensions, invitations);

  return {
    themes,
    symbols: allSymbols.slice(0, 8),
    tensions,
    invitations,
    summary
  };
}

/**
 * Call pattern recognition if available (fail-open)
 */
export async function maybeRecognizePatterns(env, text) {
  try {
    // Import pattern recognizer
    const { PatternRecognizer } = await import('../src-core-pattern-recognizer.js');
    const recognizer = new PatternRecognizer(env);
    
    // Use analyzePatterns with dream text
    const result = await recognizer.analyzePatterns({
      area_of_focus: 'dreams',
      text: text,
      context: 'dream_interpretation'
    });
    
    // Extract symbols/motifs from patterns
    const motifs = [];
    if (result.identified_patterns?.behavioral_patterns?.recurring_themes) {
      motifs.push(...result.identified_patterns.behavioral_patterns.recurring_themes.slice(0, 3));
    }
    if (result.identified_patterns?.emotional_patterns?.primary_emotions) {
      motifs.push(...result.identified_patterns.emotional_patterns.primary_emotions.slice(0, 3));
    }
    
    return motifs;
  } catch (error) {
    // Fail-open: return empty array if pattern recognition fails
    console.warn('Pattern recognition failed:', error.message);
    return [];
  }
}

/**
 * Safely truncate text for logging
 */
export function safeTruncated(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}