/**
 * AI processing helpers for Aquil's wisdom systems
 * Orchestrates specialized analyzers for trust, emotion, and pattern work
 */

import { EmotionAnalyzer } from "./emotion-analyzer.js";
import { PatternMatcher } from "./pattern-matcher.js";
import { TrustScorer } from "./trust-scorer.js";

export class AquilAI {
  constructor() {
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.patternMatcher = new PatternMatcher();
    this.trustScorer = new TrustScorer();
  }

  analyzeTrustLevel(text) {
    return this.trustScorer.analyzeTrustLevel(text);
  }

  extractEmotions(text) {
    return this.emotionAnalyzer.extractEmotions(text);
  }

  extractBodySensations(text) {
    return this.emotionAnalyzer.extractBodySensations(text);
  }

  identifyGrowthThemes(text) {
    return this.patternMatcher.identifyGrowthThemes(text);
  }

  analyzeShrinkingPatterns(text) {
    return this.patternMatcher.analyzeShrinkingPatterns(text);
  }

  calculateFrequency(items) {
    return this.patternMatcher.calculateFrequency(items);
  }

  calculateTrustRelevance(text) {
    return this.trustScorer.calculateTrustRelevance(text);
  }

  calculateResonance(text) {
    return this.trustScorer.calculateResonance(text);
  }

  assessWisdomPotential(themes, emotions) {
    return this.trustScorer.assessWisdomPotential(themes, emotions);
  }

  assessConfidenceLevel(text) {
    return this.trustScorer.assessConfidenceLevel(text);
  }

  analyzeSomaticState(bodyState, emotions) {
    return this.emotionAnalyzer.analyzeSomaticState(bodyState, emotions);
  }

  generateContextualInsight(analysisType, data) {
    return this.patternMatcher.generateContextualInsight(analysisType, data);
  }

  analyzeMediaConsumption(mediaData) {
    const { your_reaction } = mediaData;
    const emotions = this.extractEmotions(your_reaction);
    const themes = this.identifyGrowthThemes(your_reaction);
    const trustRelevance = this.calculateTrustRelevance(your_reaction);

    return {
      emotional_response: emotions,
      growth_themes: themes,
      trust_relevance: trustRelevance,
      resonance_score: this.calculateResonance(your_reaction),
      wisdom_potential: this.assessWisdomPotential(themes, emotions),
    };
  }

  generateAffirmations(analysis) {
    const affirmations = [
      "I trust the wisdom that lives within me",
      "My inner knowing guides me toward my highest good",
    ];

    if (analysis.trust_level >= 7) {
      affirmations.push("I stand in my power and trust my decisions");
    } else {
      affirmations.push(
        "I am learning to trust myself, and that learning is valuable",
      );
    }

    if (analysis.growth_themes.includes("authenticity")) {
      affirmations.push("I honor my authentic self and express my truth");
    }

    if (analysis.growth_themes.includes("courage")) {
      affirmations.push("I have the courage to be seen and heard");
    }

    return affirmations.slice(0, 4);
  }

  // Values-related AI methods
  generateValuesAffirmations(prioritization) {
    const { top_values } = prioritization;
    const affirmations = [
      "I honor my core values in all my choices",
      "My values guide me toward authentic living",
    ];

    if (top_values && top_values.length > 0) {
      affirmations.push(`I embody ${top_values[0]} in my daily life`);
      if (top_values.length > 1) {
        affirmations.push(`${top_values[1]} flows through my actions and decisions`);
      }
    }

    return affirmations.slice(0, 4);
  }

  async extractValuesFromText(text, framework) {
    // Simple keyword-based extraction
    const extractedValues = [];
    framework.forEach(value => {
      if (text.toLowerCase().includes(value.toLowerCase())) {
        extractedValues.push({
          name: value,
          authenticity_score: 0.8,
          consistency_score: 0.7,
        });
      }
    });
    
    // Add some default values if none found
    if (extractedValues.length === 0) {
      extractedValues.push(
        { name: 'growth', authenticity_score: 0.6, consistency_score: 0.6 },
        { name: 'authenticity', authenticity_score: 0.7, consistency_score: 0.7 }
      );
    }
    
    return extractedValues;
  }

  async extractImplicitValues(text) {
    // Extract values implied by the text content
    const implicitValues = [];
    if (!text) return implicitValues;
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('family') || lowerText.includes('relationship')) {
      implicitValues.push({ name: 'connection', authenticity_score: 0.8 });
    }
    if (lowerText.includes('learn') || lowerText.includes('grow')) {
      implicitValues.push({ name: 'growth', authenticity_score: 0.8 });
    }
    if (lowerText.includes('create') || lowerText.includes('art')) {
      implicitValues.push({ name: 'creativity', authenticity_score: 0.8 });
    }
    
    return implicitValues;
  }

  async identifyStressBasedValues(challenges) {
    // Identify values revealed through stress and challenges
    const stressValues = [];
    if (!challenges) return stressValues;
    
    const lowerText = challenges.toLowerCase();
    
    if (lowerText.includes('money') || lowerText.includes('financial')) {
      stressValues.push({ name: 'security', priority: 0.9 });
    }
    if (lowerText.includes('time') || lowerText.includes('busy')) {
      stressValues.push({ name: 'freedom', priority: 0.8 });
    }
    if (lowerText.includes('health') || lowerText.includes('sick')) {
      stressValues.push({ name: 'health', priority: 0.9 });
    }
    
    return stressValues;
  }

  async analyzeExpressedValues(exploration) {
    // Analyze explicitly expressed values
    const expressedValues = [];
    if (!exploration) return expressedValues;
    
    const valueKeywords = {
      'authenticity': ['authentic', 'real', 'true', 'genuine'],
      'freedom': ['free', 'independent', 'choice', 'autonomy'],
      'connection': ['connect', 'relationship', 'community', 'love'],
      'growth': ['grow', 'learn', 'develop', 'evolve'],
      'creativity': ['create', 'creative', 'art', 'express'],
    };
    
    const lowerText = exploration.toLowerCase();
    
    Object.entries(valueKeywords).forEach(([value, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        expressedValues.push({
          name: value,
          authenticity_score: matches.length / keywords.length,
        });
      }
    });
    
    return expressedValues;
  }

  async calculateContextualWeights(coreValues, lifeSituation, currentGoals) {
    // Calculate contextual weights for values based on current situation
    const weights = {};
    
    coreValues.forEach(value => {
      weights[value.name] = 0.5; // baseline
      
      // Adjust based on life situation
      if (lifeSituation && lifeSituation.toLowerCase().includes('career')) {
        if (['achievement', 'growth', 'excellence'].includes(value.name)) {
          weights[value.name] += 0.3;
        }
      }
      
      if (lifeSituation && lifeSituation.toLowerCase().includes('relationship')) {
        if (['connection', 'family', 'compassion'].includes(value.name)) {
          weights[value.name] += 0.3;
        }
      }
    });
    
    return weights;
  }
}
