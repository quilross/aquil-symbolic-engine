/**
 * Aquil Core System - The heart of your personal AI wisdom builder
 * Orchestrates all wisdom systems and maintains your personal growth journey
 */

import { AquilDatabase } from "./utils/database.js";
import { AquilAI } from "./utils/ai-helpers.js";

// Simple logger for ARK system
const logger = {
  info: (msg, data) => console.log(`[ARK INFO] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ARK ERROR] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[ARK WARN] ${msg}`, data || '')
};

export class AquilCore {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
    this.initialized = false;
    this.userProfile = null;
  }

  async initialize() {
    if (this.initialized) return;

    logger.info("Initializing Aquil Core System...");

    // Load or create user profile
    this.userProfile = await this.db.getUserProfile();
    if (!this.userProfile) {
      await this.createInitialProfile();
      this.userProfile = await this.db.getUserProfile();
    }

    this.initialized = true;
    logger.info("Aquil Core System initialized");
  }

  async createInitialProfile() {
    const initialProfile = {
      preferences: {
        communication_style: "direct_comprehensive",
        frameworks: [
          "human_design",
          "gene_keys",
          "astrology",
          "somatic_wisdom",
        ],
        focus_areas: [
          "internal_trust",
          "standing_tall",
          "media_wisdom",
          "body_awareness",
        ],
      },
      personality_data: {
        human_design: {
          type: "unknown",
          strategy: "explore",
          authority: "inner_knowing",
        },
        gene_keys: {
          life_work: "authentic_expression",
          evolution: "trust_building",
        },
        astrology: { focus: "personal_development" },
        somatic: { primary_modality: "body_awareness" },
      },
      trust_baseline: 5,
      standing_tall_goal:
        "Build unshakeable internal trust as my primary navigation system",
    };

    await this.db.updateUserProfile(initialProfile);
    logger.info("Initial user profile created");
  }

  // Daily wisdom synthesis
  async runDailySynthesis() {
    logger.info("Running daily wisdom synthesis...");

    try {
      const trustSessions = await this.db.getRecentTrustSessions(7);
      const mediaWisdom = await this.db.getRecentMediaWisdom(7);

      const patterns = await this.analyzeWeeklyPatterns(
        trustSessions,
        mediaWisdom,
      );
      const synthesis = await this.generateWisdomSynthesis(patterns);

      await this.storeWisdomCompilation(synthesis);

      logger.info("Daily wisdom synthesis complete");
      return synthesis;
    } catch (error) {
      logger.error("Daily synthesis error", { error: error.message });
      return null;
    }
  }

  async analyzeWeeklyPatterns(trustSessions, mediaWisdom) {
    return {
      trust_trends: this.analyzeTrustTrends(trustSessions),
      media_themes: this.analyzeMediaThemes(mediaWisdom),
      growth_areas: this.identifyGrowthAreas(trustSessions, mediaWisdom),
      standing_tall_progress: this.assessStandingTallProgress(trustSessions),
    };
  }

  analyzeTrustTrends(sessions) {
    if (sessions.length === 0)
      return { trend: "stable", message: "Starting your trust journey" };

    const trustLevels = sessions.map((s) => s.trust_level).filter((l) => l);
    if (trustLevels.length === 0)
      return { trend: "exploring", message: "Building awareness" };

    const average =
      trustLevels.reduce((sum, level) => sum + level, 0) / trustLevels.length;

    return {
      trend: "developing",
      average: Math.round(average * 10) / 10,
      message: `Your trust in yourself is at ${Math.round(average * 10) / 10}. Keep building!`,
    };
  }

  analyzeMediaThemes(mediaWisdom) {
    if (mediaWisdom.length === 0)
      return { themes: [], message: "Start tracking your media wisdom" };

    const allThemes = mediaWisdom.flatMap((item) => item.growth_themes || []);
    const themeCount = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {});

    const topThemes = Object.entries(themeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);

    return {
      themes: topThemes,
      message:
        topThemes.length > 0
          ? `Your content consistently explores ${topThemes[0]}`
          : "Building your media wisdom database",
    };
  }

  identifyGrowthAreas(trustSessions, mediaWisdom) {
    const areas = [];

    if (trustSessions.length > 0) {
      const avgTrust =
        trustSessions.reduce((sum, s) => sum + (s.trust_level || 5), 0) /
        trustSessions.length;
      if (avgTrust < 6) areas.push("trust_building");
      if (avgTrust >= 7) areas.push("trust_expansion");
    }

    if (mediaWisdom.length > 2) {
      areas.push("media_integration");
    }

    return areas.length > 0 ? areas : ["foundation_building"];
  }

  assessStandingTallProgress(sessions) {
    return {
      current_focus:
        "Building awareness of shrinking vs standing tall patterns",
      progress: "In development - every check-in builds this capacity",
    };
  }

  async generateWisdomSynthesis(patterns) {
    return {
      date: new Date().toISOString().split("T")[0],
      trust_evolution: patterns.trust_trends,
      media_insights: patterns.media_themes,
      standing_tall_progress: patterns.standing_tall_progress,
      growth_focus: patterns.growth_areas,
      celebration: this.generateCelebration(patterns),
      intention: this.generateIntention(patterns),
    };
  }

  generateCelebration(patterns) {
    const celebrations = [
      "You showed up for your growth by engaging with Aquil - that itself is worth celebrating",
    ];

    if (patterns.trust_trends.average >= 7) {
      celebrations.push("Your trust in yourself is genuinely strong right now");
    }

    if (patterns.media_themes.themes.length > 0) {
      celebrations.push(
        "You are successfully extracting wisdom from your content consumption",
      );
    }

    return celebrations;
  }

  generateIntention(patterns) {
    if (patterns.growth_areas.includes("trust_building")) {
      return "I trust my inner knowing as my primary guidance system";
    }

    if (patterns.growth_areas.includes("trust_expansion")) {
      return "I stand tall in my truth and take up my rightful space in the world";
    }

    return "I am building a loving, trusting relationship with myself";
  }

  async storeWisdomCompilation(synthesis) {
    // This would store in the wisdom_compilation table
    return synthesis;
  }

  async generateWisdomCompilation() {
    logger.info("Generating wisdom compilation...");
    // Daily compilation logic would go here
    return { status: "Wisdom compiled for today" };
  }

  getUserPreferences() {
    return (
      this.userProfile?.preferences || {
        communication_style: "direct_comprehensive",
        frameworks: [
          "human_design",
          "gene_keys",
          "astrology",
          "somatic_wisdom",
        ],
      }
    );
  }

  async synthesizeWisdom(data) {
    await this.initialize();
    
    const { insights = [], experiences = [], patterns = [] } = data;
    
    // Synthesize wisdom from provided insights and experiences
    const synthesis = {
      timestamp: new Date().toISOString(),
      wisdom_threads: [],
      integration_opportunities: [],
      growth_edges: [],
      celebration_moments: []
    };

    // Process insights into wisdom threads
    for (const insight of insights) {
      synthesis.wisdom_threads.push({
        source: insight.source || "user_reflection",
        wisdom: insight.content || insight,
        archetypal_pattern: this.identifyArchetypalPattern(insight.content || insight),
        integration_practice: this.suggestIntegrationPractice(insight.content || insight)
      });
    }

    // Identify growth edges from experiences
    for (const experience of experiences) {
      const growthEdge = this.extractGrowthEdge(experience);
      if (growthEdge) {
        synthesis.growth_edges.push(growthEdge);
      }
    }

    // Generate integration opportunities
    synthesis.integration_opportunities = this.generateIntegrationOpportunities(
      synthesis.wisdom_threads,
      synthesis.growth_edges
    );

    // Store synthesis for future reference
    await this.db.storeWisdomSynthesis(synthesis);

    return {
      synthesis,
      next_steps: this.generateNextSteps(synthesis),
      reflection_prompt: "How do these wisdom threads want to weave together in your life?"
    };
  }

  async generateDailySynthesis() {
    await this.initialize();
    
    // Retrieve recent logs and patterns
    const recentLogs = await this.db.getRecentLogs(24); // Last 24 hours
    const patterns = await this.analyzeRecentPatterns(recentLogs);
    
    const dailySynthesis = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      insights: [],
      patterns_observed: patterns,
      growth_moments: [],
      integration_invitations: [],
      tomorrow_intention: ""
    };

    // Extract insights from recent activity
    for (const log of recentLogs) {
      if (log.kind === 'breakthrough' || log.kind === 'insight') {
        dailySynthesis.insights.push({
          content: log.detail,
          timestamp: log.timestamp,
          voice: log.voice
        });
      }
    }

    // Identify growth moments
    dailySynthesis.growth_moments = this.identifyGrowthMoments(recentLogs);
    
    // Generate integration invitations
    dailySynthesis.integration_invitations = this.generateIntegrationInvitations(patterns);
    
    // Create tomorrow's intention
    dailySynthesis.tomorrow_intention = this.generateTomorrowIntention(patterns, dailySynthesis.insights);

    await this.db.storeDailySynthesis(dailySynthesis);

    return dailySynthesis;
  }

  async generateInsights() {
    await this.initialize();
    
    // Retrieve recent patterns and user journey
    const recentPatterns = await this.db.getRecentPatterns(7); // Last 7 days
    const userJourney = await this.db.getUserJourney();
    
    const insights = {
      timestamp: new Date().toISOString(),
      pattern_insights: [],
      growth_insights: [],
      wisdom_insights: [],
      next_exploration: ""
    };

    // Generate pattern-based insights
    insights.pattern_insights = this.generatePatternInsights(recentPatterns);
    
    // Generate growth insights from user journey
    insights.growth_insights = this.generateGrowthInsights(userJourney);
    
    // Generate wisdom insights from accumulated experiences
    insights.wisdom_insights = this.generateWisdomInsights(recentPatterns, userJourney);
    
    // Suggest next exploration area
    insights.next_exploration = this.suggestNextExploration(insights);

    return insights;
  }

  identifyArchetypalPattern(content) {
    const patterns = {
      "trust": ["trust", "faith", "belief", "confidence"],
      "transformation": ["change", "growth", "evolve", "transform"],
      "shadow": ["fear", "doubt", "resistance", "block"],
      "integration": ["balance", "harmony", "wholeness", "unity"],
      "expression": ["voice", "speak", "express", "create"],
      "wisdom": ["learn", "understand", "insight", "clarity"]
    };

    for (const [pattern, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        return pattern;
      }
    }
    return "integration";
  }

  suggestIntegrationPractice(content) {
    const practices = {
      "trust": "Place hand on heart and ask: 'What does my inner wisdom know about this?'",
      "transformation": "Journal about: 'How is this experience changing me?'",
      "shadow": "Breathe with the discomfort and ask: 'What is this trying to teach me?'",
      "integration": "Reflect on: 'How can I honor both sides of this experience?'",
      "expression": "Ask yourself: 'What wants to be expressed through me right now?'",
      "wisdom": "Pause and inquire: 'What deeper understanding is emerging?'"
    };

    const pattern = this.identifyArchetypalPattern(content);
    return practices[pattern] || practices.integration;
  }

  extractGrowthEdge(experience) {
    if (!experience || typeof experience !== 'object') return null;
    
    return {
      area: experience.area || "self_awareness",
      challenge: experience.challenge || "Unknown challenge",
      opportunity: experience.opportunity || "Opportunity for growth",
      support_needed: experience.support_needed || "Self-compassion and patience"
    };
  }

  generateIntegrationOpportunities(wisdomThreads, growthEdges) {
    const opportunities = [];
    
    // Create opportunities based on wisdom threads
    for (const thread of wisdomThreads) {
      opportunities.push({
        type: "wisdom_integration",
        description: `Integrate the wisdom: "${thread.wisdom}"`,
        practice: thread.integration_practice,
        timeline: "This week"
      });
    }

    // Create opportunities based on growth edges
    for (const edge of growthEdges) {
      opportunities.push({
        type: "growth_integration",
        description: `Explore growth edge: ${edge.area}`,
        practice: `Focus on: ${edge.opportunity}`,
        timeline: "Ongoing"
      });
    }

    return opportunities.slice(0, 3); // Return top 3 opportunities
  }

  generateNextSteps(synthesis) {
    return [
      "Choose one wisdom thread to focus on this week",
      "Practice the suggested integration exercise daily",
      "Notice how this wisdom shows up in your daily life",
      "Journal about your integration experience"
    ];
  }

  async analyzeRecentPatterns(logs) {
    const patterns = {
      emotional_themes: [],
      behavioral_patterns: [],
      growth_areas: [],
      recurring_challenges: []
    };

    // Analyze logs for patterns
    for (const log of logs) {
      if (log.kind === 'emotional_processing') {
        patterns.emotional_themes.push(log.detail);
      } else if (log.kind === 'behavioral_insight') {
        patterns.behavioral_patterns.push(log.detail);
      } else if (log.kind === 'growth_moment') {
        patterns.growth_areas.push(log.detail);
      }
    }

    return patterns;
  }

  identifyGrowthMoments(logs) {
    return logs
      .filter(log => log.kind === 'breakthrough' || log.kind === 'insight' || log.kind === 'growth_moment')
      .map(log => ({
        moment: log.detail,
        timestamp: log.timestamp,
        significance: "Personal growth milestone"
      }));
  }

  generateIntegrationInvitations(patterns) {
    const invitations = [];
    
    if (patterns.emotional_themes.length > 0) {
      invitations.push({
        area: "Emotional Integration",
        invitation: "How can you honor and integrate your emotional experiences?",
        practice: "Daily emotional check-ins with yourself"
      });
    }

    if (patterns.behavioral_patterns.length > 0) {
      invitations.push({
        area: "Behavioral Awareness",
        invitation: "What behavioral patterns are ready for conscious evolution?",
        practice: "Mindful observation of your automatic responses"
      });
    }

    return invitations;
  }

  generateTomorrowIntention(patterns, insights) {
    if (insights.length > 0) {
      return `Tomorrow I will integrate the wisdom: "${insights[0].content}"`;
    }
    
    if (patterns.growth_areas.length > 0) {
      return `Tomorrow I will focus on growing in: ${patterns.growth_areas[0]}`;
    }

    return "Tomorrow I will trust my inner wisdom and stay present to what emerges";
  }

  generatePatternInsights(patterns) {
    return patterns.map(pattern => ({
      pattern: pattern.name || "Unnamed pattern",
      insight: `This pattern reveals an opportunity for ${pattern.growth_area || 'self-awareness'}`,
      integration: `Practice: ${pattern.suggested_practice || 'Mindful observation'}`
    }));
  }

  generateGrowthInsights(journey) {
    if (!journey || !journey.milestones) {
      return [{
        insight: "Your growth journey is unique and unfolding perfectly",
        integration: "Trust the timing of your personal evolution"
      }];
    }

    return journey.milestones.map(milestone => ({
      insight: `Growth milestone: ${milestone.description}`,
      integration: `Celebrate: ${milestone.celebration || 'Acknowledge your progress'}`
    }));
  }

  generateWisdomInsights(patterns, journey) {
    return [
      {
        insight: "Your challenges are invitations for deeper self-understanding",
        integration: "Ask: 'What is this experience trying to teach me?'"
      },
      {
        insight: "Every pattern in your life serves a purpose until it doesn't",
        integration: "Practice: 'Thank you for protecting me. I'm ready to evolve now.'"
      },
      {
        insight: "Your body holds infinite wisdom about what's right for you",
        integration: "Daily practice: Check in with your body before making decisions"
      }
    ];
  }

  suggestNextExploration(insights) {
    const areas = ["trust building", "creative expression", "somatic awareness", "pattern recognition", "values clarification"];
    return areas[Math.floor(Math.random() * areas.length)];
  }
}
