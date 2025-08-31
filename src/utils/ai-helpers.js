/**
 * AI processing helpers for Aquil's wisdom systems
 * Orchestrates specialized analyzers for trust, emotion, and pattern work
 */

import { EmotionAnalyzer } from "./emotion-analyzer.js";
import { PatternMatcher } from "./pattern-matcher.js";
import { TrustScorer } from "./trust-scorer.js";

export class AquilAI {
  constructor(env = null) {
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.patternMatcher = new PatternMatcher();
    this.trustScorer = new TrustScorer();
    this.env = env;
  }

  // Worker AI integration with dual binding support
  async callWorkerAI(model, messages, options = {}) {
    if (!this.env) {
      throw new Error("Environment not provided for AI calls");
    }

    const client = this.env.AI || this.env.AI_GATEWAY;
    if (!client) {
      throw new Error("AI binding not found - neither env.AI nor env.AI_GATEWAY available");
    }

    try {
      const response = await client.run(model, { 
        messages,
        ...options 
      });
      return response;
    } catch (error) {
      console.error("Worker AI call failed:", error);
      throw new Error(`AI service unavailable: ${error.message}`);
    }
  }

  // Enhanced AI-powered analysis methods
  async generatePersonalizedOpening(continuityLogs, voice = "mirror") {
    try {
      const prompt = this.buildOpeningPrompt(continuityLogs, voice);
      const response = await this.callWorkerAI("@cf/meta/llama-2-7b-chat-int8", [
        { role: "user", content: prompt }
      ]);
      return response.response || this.getFallbackOpening(continuityLogs, voice);
    } catch (error) {
      console.warn("AI opening generation failed, using fallback:", error);
      return this.getFallbackOpening(continuityLogs, voice);
    }
  }

  async generateSocraticQuestion(context, voice = "oracle") {
    try {
      const prompt = this.buildSocraticPrompt(context, voice);
      const response = await this.callWorkerAI("@cf/meta/llama-2-7b-chat-int8", [
        { role: "user", content: prompt }
      ]);
      return response.response || this.getFallbackQuestion(context, voice);
    } catch (error) {
      console.warn("AI question generation failed, using fallback:", error);
      return this.getFallbackQuestion(context, voice);
    }
  }

  async generateRitualSuggestion(context, patterns = []) {
    try {
      const prompt = this.buildRitualPrompt(context, patterns);
      const response = await this.callWorkerAI("@cf/meta/llama-2-7b-chat-int8", [
        { role: "user", content: prompt }
      ]);
      
      // Try to parse as JSON, fallback to text
      try {
        return JSON.parse(response.response);
      } catch {
        return {
          name: "AI-Suggested Practice",
          instructions: [response.response],
          purpose: "Support your current journey"
        };
      }
    } catch (error) {
      console.warn("AI ritual generation failed, using fallback:", error);
      return this.getFallbackRitual(context);
    }
  }

  buildOpeningPrompt(continuityLogs, voice) {
    const voiceStyles = {
      mirror: "gentle, reflective, emotionally attuned",
      oracle: "symbolic, archetypal, wisdom-focused",
      scientist: "analytical, systematic, precise",
      strategist: "practical, tactical, action-oriented"
    };

    const style = voiceStyles[voice] || voiceStyles.mirror;
    const logSummary = continuityLogs.map(log => `${log.kind}: ${log.detail}`).join("; ");

    return `As ARK's ${voice} voice (${style}), create a personalized session opening that acknowledges this continuity: ${logSummary}. Keep it warm, present, and under 100 words.`;
  }

  buildSocraticPrompt(context, voice) {
    const voiceStyles = {
      mirror: "gentle, reflective questions that honor emotions",
      oracle: "symbolic, archetypal questions that reveal deeper patterns",
      scientist: "analytical questions that explore mechanisms and systems",
      strategist: "practical questions that clarify next steps and actions"
    };

    const style = voiceStyles[voice] || voiceStyles.oracle;
    const contextSummary = JSON.stringify(context);

    return `As ARK's ${voice} voice, ask a Socratic question (${style}) about this context: ${contextSummary}. The question should guide self-discovery, not provide answers.`;
  }

  buildRitualPrompt(context, patterns) {
    const contextSummary = JSON.stringify(context);
    const patternSummary = patterns.map(p => p.type || p.name).join(", ");

    return `Suggest a healing ritual for this context: ${contextSummary} with these patterns: ${patternSummary}. Return JSON with: name, instructions (array), purpose, timing. Keep it practical and accessible.`;
  }

  getFallbackOpening(continuityLogs, voice) {
    if (continuityLogs.length > 0) {
      return `I sense the continuity of our journey through ${continuityLogs.map(log => log.kind).join(", ")}. What's alive for you in this moment?`;
    }
    return "I'm here with you in this moment. What wants to be explored today?";
  }

  getFallbackQuestion(context, voice) {
    const questions = {
      mirror: "What are you feeling in your body right now about this?",
      oracle: "What deeper pattern or wisdom is trying to emerge here?",
      scientist: "What would help you understand this situation more clearly?",
      strategist: "What's the next right step for you in this situation?"
    };
    return questions[voice] || questions.oracle;
  }

  getFallbackRitual(context) {
    return {
      name: "Presence and Breath",
      instructions: [
        "Take three slow, deep breaths",
        "Place hand on heart and feel your heartbeat",
        "Ask: 'What does my inner wisdom know about this?'",
        "Trust whatever arises"
      ],
      purpose: "Ground in present moment awareness",
      timing: "Whenever you need to reconnect with yourself"
    };
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

  async testConnection() {
    // Test AI service connectivity
    try {
      const testResponse = await this.callWorkerAI("@cf/meta/llama-2-7b-chat-int8", [
        { role: "user", content: "Test connection" }
      ]);
      return testResponse !== null;
    } catch (error) {
      throw new Error(`AI service connection failed: ${error.message}`);
    }
  }
}
