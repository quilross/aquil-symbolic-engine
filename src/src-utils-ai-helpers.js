/**
 * AI processing helpers for Aquil's wisdom systems
 * Handles natural language processing and pattern recognition
 */

export class AquilAI {
  constructor() {
    this.patterns = {
      trust_indicators: [
        'trust', 'confidence', 'believe', 'faith', 'doubt', 'uncertain',
        'know', 'feel', 'sense', 'intuition', 'gut', 'instinct'
      ],
      emotional_words: [
        'anxious', 'excited', 'sad', 'happy', 'angry', 'frustrated', 
        'calm', 'peaceful', 'worried', 'hopeful', 'scared', 'confident'
      ],
      body_words: [
        'tense', 'tight', 'heavy', 'light', 'warm', 'cold',
        'pressure', 'sensation', 'pain', 'comfort', 'energy', 'tired'
      ],
      growth_words: [
        'learn', 'grow', 'change', 'evolve', 'develop', 'transform',
        'improve', 'shift', 'heal', 'understand', 'realize', 'discover'
      ]
    };
  }

  // Analyze trust level from text
  analyzeTrustLevel(text) {
    const lowerText = text.toLowerCase();
    let trustScore = 5; // baseline

    // Positive trust indicators
    const positiveIndicators = [
      'i trust', 'i know', 'i believe', 'confident', 'certain',
      'clear', 'strong', 'sure', 'feels right', 'intuition says'
    ];
    
    // Negative trust indicators  
    const negativeIndicators = [
      'doubt', 'uncertain', 'confused', 'scared', 'worried',
      'don\'t know', 'not sure', 'questioning', 'second guess'
    ];

    positiveIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) trustScore += 1;
    });

    negativeIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) trustScore -= 1;
    });

    return Math.max(1, Math.min(10, trustScore));
  }

  // Extract emotions from text
  extractEmotions(text) {
    const lowerText = text.toLowerCase();
    const foundEmotions = [];

    const emotionMap = {
      'anxious': ['anxious', 'anxiety', 'worried', 'nervous', 'stressed'],
      'excited': ['excited', 'thrilled', 'energized', 'pumped'],
      'sad': ['sad', 'down', 'depressed', 'blue', 'melancholy'],
      'angry': ['angry', 'mad', 'frustrated', 'irritated', 'furious'],
      'calm': ['calm', 'peaceful', 'serene', 'relaxed', 'centered'],
      'confused': ['confused', 'unclear', 'puzzled', 'lost', 'unsure'],
      'hopeful': ['hopeful', 'optimistic', 'positive', 'encouraged'],
      'fearful': ['scared', 'afraid', 'fearful', 'terrified', 'frightened']
    };

    Object.entries(emotionMap).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundEmotions.push(emotion);
      }
    });

    return foundEmotions;
  }

  // Extract body sensations from text
  extractBodySensations(text) {
    const lowerText = text.toLowerCase();
    const sensations = [];

    const sensationMap = {
      'tension': ['tense', 'tight', 'stiff', 'rigid', 'contracted'],
      'pressure': ['pressure', 'heavy', 'weight', 'compressed'],
      'warmth': ['warm', 'hot', 'burning', 'heated'],
      'coolness': ['cool', 'cold', 'chilly', 'frozen'],
      'lightness': ['light', 'floating', 'airy', 'weightless'],
      'energy': ['energy', 'buzzing', 'electric', 'vibrating'],
      'numbness': ['numb', 'disconnected', 'empty', 'void'],
      'pain': ['pain', 'ache', 'hurt', 'sore', 'uncomfortable']
    };

    Object.entries(sensationMap).forEach(([sensation, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        sensations.push(sensation);
      }
    });

    return sensations;
  }

  // Identify growth themes from text
  identifyGrowthThemes(text) {
    const lowerText = text.toLowerCase();
    const themes = [];

    const themeMap = {
      'authenticity': ['authentic', 'real', 'true self', 'genuine', 'honest'],
      'boundaries': ['boundary', 'limit', 'say no', 'protect', 'space'],
      'self_worth': ['worth', 'value', 'deserve', 'enough', 'worthy'],
      'courage': ['courage', 'brave', 'bold', 'risk', 'fear'],
      'relationships': ['relationship', 'connect', 'love', 'family', 'friend'],
      'purpose': ['purpose', 'meaning', 'calling', 'mission', 'path'],
      'healing': ['heal', 'recover', 'trauma', 'pain', 'restore'],
      'creativity': ['create', 'art', 'express', 'imagination', 'inspire'],
      'spirituality': ['spiritual', 'soul', 'divine', 'sacred', 'prayer'],
      'mindfulness': ['present', 'aware', 'mindful', 'meditation', 'breath']
    };

    Object.entries(themeMap).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes.push(theme);
      }
    });

    return themes;
  }

  // Analyze media consumption patterns
  analyzeMediaConsumption(mediaData) {
    const { title, your_reaction, media_type } = mediaData;
    
    const emotions = this.extractEmotions(your_reaction);
    const themes = this.identifyGrowthThemes(your_reaction);
    const trustRelevance = this.calculateTrustRelevance(your_reaction);
    
    return {
      emotional_response: emotions,
      growth_themes: themes,
      trust_relevance: trustRelevance,
      resonance_score: this.calculateResonance(your_reaction),
      wisdom_potential: this.assessWisdomPotential(themes, emotions)
    };
  }

  calculateTrustRelevance(text) {
    const trustWords = this.patterns.trust_indicators;
    const lowerText = text.toLowerCase();
    
    const matches = trustWords.filter(word => lowerText.includes(word));
    return matches.length > 0 ? matches : [];
  }

  calculateResonance(text) {
    const strongWords = ['deeply', 'really', 'very', 'extremely', 'totally', 'completely'];
    const emotionalWords = ['moved', 'touched', 'affected', 'impacted', 'struck'];
    
    const lowerText = text.toLowerCase();
    let score = 5;
    
    strongWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    emotionalWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    return Math.min(10, score);
  }

  assessWisdomPotential(themes, emotions) {
    if (themes.length > 2 || emotions.length > 2) return 'high';
    if (themes.length > 0 || emotions.length > 0) return 'medium';
    return 'low';
  }

  // Analyze standing tall vs shrinking patterns
  analyzeShrinkingPatterns(text) {
    const lowerText = text.toLowerCase();
    const patterns = [];

    const shrinkingIndicators = {
      'people_pleasing': ['please others', 'what they think', 'avoid conflict', 'keep everyone happy'],
      'hiding': ['hide', 'invisible', 'background', 'blend in', 'not seen'],
      'perfectionism': ['perfect', 'right way', 'mistake', 'wrong', 'flawless'],
      'seeking_approval': ['approval', 'validation', 'acceptance', 'liked', 'permission'],
      'minimizing': ['not important', 'doesn\'t matter', 'small thing', 'no big deal']
    };

    Object.entries(shrinkingIndicators).forEach(([pattern, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  // Assess confidence level from text
  assessConfidenceLevel(text) {
    const lowerText = text.toLowerCase();
    let level = 5; // baseline

    const confidenceIndicators = [
      'confident', 'strong', 'capable', 'powerful', 'certain', 'clear'
    ];
    const uncertaintyIndicators = [
      'insecure', 'doubt', 'weak', 'uncertain', 'confused', 'lost'
    ];

    confidenceIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) level += 1;
    });

    uncertaintyIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) level -= 1;
    });

    return Math.max(1, Math.min(10, level));
  }

  // Generate personalized affirmations based on analysis
  generateAffirmations(analysis) {
    const affirmations = [
      'I trust the wisdom that lives within me',
      'My inner knowing guides me toward my highest good'
    ];

    if (analysis.trust_level >= 7) {
      affirmations.push('I stand in my power and trust my decisions');
    } else {
      affirmations.push('I am learning to trust myself, and that learning is valuable');
    }

    if (analysis.growth_themes.includes('authenticity')) {
      affirmations.push('I honor my authentic self and express my truth');
    }

    if (analysis.growth_themes.includes('courage')) {
      affirmations.push('I have the courage to be seen and heard');
    }

    return affirmations.slice(0, 4); // Return top 4
  }

  // Analyze somatic state
  analyzeSomaticState(bodyState, emotions) {
    const bodyAnalysis = {
      energy_level: this.assessEnergyLevel(bodyState),
      nervous_system_state: this.assessNervousSystemState(bodyState, emotions),
      tension_areas: this.identifyTensionAreas(bodyState),
      emotional_embodiment: this.analyzeEmotionalEmbodiment(emotions)
    };

    return bodyAnalysis;
  }

  assessEnergyLevel(bodyState) {
    const lowerText = bodyState.toLowerCase();
    
    if (['energized', 'buzzing', 'vibrant', 'alive', 'electric'].some(word => lowerText.includes(word))) return 'high';
    if (['tired', 'drained', 'exhausted', 'heavy', 'depleted'].some(word => lowerText.includes(word))) return 'low';
    if (['calm', 'centered', 'steady', 'grounded', 'balanced'].some(word => lowerText.includes(word))) return 'balanced';
    
    return 'moderate';
  }

  assessNervousSystemState(bodyState, emotions) {
    const combinedText = `${bodyState} ${emotions}`.toLowerCase();
    
    if (['activated', 'anxious', 'buzzing', 'wired', 'restless'].some(word => combinedText.includes(word))) {
      return 'activated';
    } else if (['numb', 'disconnected', 'frozen', 'shut down', 'empty'].some(word => combinedText.includes(word))) {
      return 'hypoactivated';
    } else if (['calm', 'centered', 'grounded', 'present', 'peaceful'].some(word => combinedText.includes(word))) {
      return 'regulated';
    }
    
    return 'mixed';
  }

  identifyTensionAreas(bodyState) {
    const lowerText = bodyState.toLowerCase();
    const areas = [];

    const areaMap = {
      'head_neck': ['head', 'neck', 'jaw', 'skull', 'temple'],
      'shoulders': ['shoulder', 'upper back', 'shoulder blade'],
      'chest_heart': ['chest', 'heart', 'ribs', 'sternum'],
      'core': ['stomach', 'belly', 'abdomen', 'core'],
      'back': ['back', 'spine', 'lower back'],
      'hips_pelvis': ['hips', 'pelvis', 'lower body'],
      'legs_feet': ['legs', 'thighs', 'calves', 'feet']
    };

    Object.entries(areaMap).forEach(([area, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword) && 
          (lowerText.includes('tense') || lowerText.includes('tight') || lowerText.includes('pain')))) {
        areas.push(area);
      }
    });

    return areas;
  }

  analyzeEmotionalEmbodiment(emotions) {
    return {
      primary_emotions: emotions.slice(0, 3),
      embodiment_quality: emotions.length > 2 ? 'rich_emotional_awareness' : 'developing_awareness'
    };
  }

  // Calculate frequency of items for pattern recognition
  calculateFrequency(items) {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([item, count]) => ({ item, count }));
  }

  // Generate contextual insights based on patterns
  generateContextualInsight(analysisType, data) {
    switch (analysisType) {
      case 'trust_building':
        return this.generateTrustInsight(data);
      case 'media_wisdom':
        return this.generateMediaInsight(data);
      case 'somatic_healing':
        return this.generateSomaticInsight(data);
      default:
        return 'Your awareness and willingness to explore are valuable steps in your growth journey.';
    }
  }

  generateTrustInsight(data) {
    if (data.trust_level >= 8) {
      return 'You\'re operating from strong self-trust. This is your natural state - use it as a foundation for bigger challenges.';
    } else if (data.trust_level >= 6) {
      return 'Your trust is building steadily. This is excellent progress - notice how it feels to trust yourself more.';
    } else {
      return 'Trust develops gradually through practice. Every moment of awareness like this strengthens your inner authority.';
    }
  }

  generateMediaInsight(data) {
    if (data.resonance_score >= 8) {
      return 'Strong resonance often indicates content that mirrors your growth edge or activation. Pay attention to what it\'s triggering.';
    } else if (data.growth_themes.length > 0) {
      return `The themes of ${data.growth_themes[0]} in this content reflect active areas of your development.`;
    } else {
      return 'Even subtle responses to content contain valuable information about your current growth needs.';
    }
  }

  generateSomaticInsight(data) {
    if (data.nervous_system_state === 'regulated') {
      return 'A regulated nervous system creates the foundation for clear decision-making and authentic expression.';
    } else if (data.nervous_system_state === 'activated') {
      return 'Activation provides important information. Working with it compassionately builds nervous system resilience.';
    } else {
      return 'Your body is always communicating. Listening with curiosity builds the trust needed for embodied wisdom.';
    }
  }
}