export class PatternMatcher {
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

  analyzeShrinkingPatterns(text) {
    const lowerText = text.toLowerCase();
    const patterns = [];

    const shrinkingIndicators = {
      'people_pleasing': ['please others', 'what they think', 'avoid conflict', 'keep everyone happy'],
      'hiding': ['hide', 'invisible', 'background', 'blend in', 'not seen'],
      'perfectionism': ['perfect', 'right way', 'mistake', 'wrong', 'flawless'],
      'seeking_approval': ['approval', 'validation', 'acceptance', 'liked', 'permission'],
      'minimizing': ['not important', "doesn't matter", 'small thing', 'no big deal']
    };

    Object.entries(shrinkingIndicators).forEach(([pattern, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  calculateFrequency(items) {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([item, count]) => ({ item, count }));
  }

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
      return "You're operating from strong self-trust. This is your natural state - use it as a foundation for bigger challenges.";
    } else if (data.trust_level >= 6) {
      return 'Your trust is building steadily. This is excellent progress - notice how it feels to trust yourself more.';
    } else {
      return 'Trust develops gradually through practice. Every moment of awareness like this strengthens your inner authority.';
    }
  }

  generateMediaInsight(data) {
    if (data.resonance_score >= 8) {
      return "Strong resonance often indicates content that mirrors your growth edge or activation. Pay attention to what it's triggering.";
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

