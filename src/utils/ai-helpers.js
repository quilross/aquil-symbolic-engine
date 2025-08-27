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
}
