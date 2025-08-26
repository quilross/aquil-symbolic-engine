export class TrustScorer {
  constructor() {
    this.trustIndicators = [
      'trust', 'confidence', 'believe', 'faith', 'doubt', 'uncertain',
      'know', 'feel', 'sense', 'intuition', 'gut', 'instinct'
    ];
  }

  analyzeTrustLevel(text) {
    const lowerText = text.toLowerCase();
    let trustScore = 5; // baseline

    const positiveIndicators = [
      'i trust', 'i know', 'i believe', 'confident', 'certain',
      'clear', 'strong', 'sure', 'feels right', 'intuition says'
    ];

    const negativeIndicators = [
      'doubt', 'uncertain', 'confused', 'scared', 'worried',
      "don't know", 'not sure', 'questioning', 'second guess'
    ];

    positiveIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) trustScore += 1;
    });

    negativeIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) trustScore -= 1;
    });

    return Math.max(1, Math.min(10, trustScore));
  }

  calculateTrustRelevance(text) {
    const lowerText = text.toLowerCase();
    const matches = this.trustIndicators.filter(word => lowerText.includes(word));
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
}

