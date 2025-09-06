/**
 * Values Clarifier - Helps identify and prioritize core values
 * Your personal guide for discovering what truly matters to you
 */

import { AquilDatabase } from "../utils/database.js";
import { AquilAI } from "../utils/ai-helpers.js";

export class ValuesClarifier {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async clarify(data) {
    // Validate required fields
    if (!data || (!data.values_list && !data.life_situation && !data.current_challenges)) {
      throw new Error("values_list, life_situation, or current_challenges required");
    }

    try {
      const analysis = await this.analyzeValues(data);
      const prioritization = await this.prioritizeValues(analysis);
      const guidance = await this.generateValuesGuidance(prioritization);
      const exercises = await this.createValuesExercises(prioritization);

      // Save session to database
      const sessionData = {
        values_identified: analysis.core_values,
        prioritization_method: prioritization.method,
        top_values: prioritization.top_values,
        session_type: "values-clarification",
        insights: {
          analysis: analysis,
          prioritization: prioritization,
          guidance: guidance,
        },
        exercises_completed: exercises,
        next_steps: guidance.next_steps,
      };

      await this.db.saveValuesSession(sessionData);

      return {
        message: guidance.main_message,
        values_analysis: analysis,
        prioritized_values: prioritization.top_values,
        values_guidance: guidance,
        values_exercises: exercises,
        conflicts_identified: this.identifyValuesConflicts(prioritization),
        alignment_opportunities: this.findAlignmentOpportunities(prioritization),
        next_steps: guidance.next_steps,
        affirmations: this.ai.generateValuesAffirmations(prioritization),
        integration_practices: this.createIntegrationPractices(prioritization),
      };
    } catch (error) {
      console.error("Values clarification error:", error);
      throw error;
    }
  }

  async analyzeValues(data) {
    const { values_list = [], life_situation = "", current_challenges = "" } = data;
    
    // Core values framework
    const coreValuesFramework = [
      "authenticity", "freedom", "security", "growth", "connection", "creativity",
      "justice", "compassion", "excellence", "adventure", "stability", "service",
      "independence", "family", "achievement", "spirituality", "health", "beauty",
      "knowledge", "integrity", "fun", "tradition", "innovation", "peace"
    ];

    let identifiedValues = [];
    
    if (values_list.length > 0) {
      identifiedValues = values_list;
    } else {
      // Extract values from life situation and challenges
      identifiedValues = await this.ai.extractValuesFromText(
        `${life_situation} ${current_challenges}`,
        coreValuesFramework
      );
    }

    return {
      core_values: identifiedValues,
      values_source: values_list.length > 0 ? "explicit" : "extracted",
      context: {
        life_situation,
        current_challenges,
      },
      framework_used: coreValuesFramework,
    };
  }

  async prioritizeValues(analysis) {
    const { core_values } = analysis;
    
    // Use multiple prioritization methods
    const methods = {
      frequency: this.prioritizeByFrequency(core_values),
      life_impact: this.prioritizeByLifeImpact(core_values),
      current_alignment: this.prioritizeByCurrentAlignment(core_values, analysis.context),
    };

    // Combine methods for final prioritization
    const combinedScores = {};
    core_values.forEach(value => {
      combinedScores[value] = (
        (methods.frequency[value] || 0) +
        (methods.life_impact[value] || 0) +
        (methods.current_alignment[value] || 0)
      ) / 3;
    });

    const sortedValues = Object.entries(combinedScores)
      .sort(([,a], [,b]) => b - a)
      .map(([value]) => value);

    return {
      method: "combined_scoring",
      top_values: sortedValues.slice(0, 5),
      all_values_ranked: sortedValues,
      scoring_breakdown: methods,
      combined_scores: combinedScores,
    };
  }

  prioritizeByFrequency(values) {
    // Simple frequency-based scoring
    const scores = {};
    values.forEach(value => {
      scores[value] = (scores[value] || 0) + 1;
    });
    return scores;
  }

  prioritizeByLifeImpact(values) {
    // Score based on potential life impact
    const impactScores = {
      "authenticity": 9, "freedom": 8, "security": 7, "growth": 9, "connection": 8,
      "creativity": 7, "justice": 6, "compassion": 8, "excellence": 7, "adventure": 6,
      "stability": 7, "service": 6, "independence": 7, "family": 9, "achievement": 7,
      "spirituality": 8, "health": 9, "beauty": 5, "knowledge": 7, "integrity": 9,
      "fun": 6, "tradition": 5, "innovation": 7, "peace": 8
    };

    const scores = {};
    values.forEach(value => {
      scores[value] = impactScores[value.toLowerCase()] || 5;
    });
    return scores;
  }

  prioritizeByCurrentAlignment(values, context) {
    // Score based on current life situation alignment
    const { life_situation = "", current_challenges = "" } = context;
    const contextText = `${life_situation} ${current_challenges}`.toLowerCase();
    
    const scores = {};
    values.forEach(value => {
      let score = 5; // baseline
      
      // Boost score if value appears in context
      if (contextText.includes(value.toLowerCase())) {
        score += 3;
      }
      
      // Contextual relevance scoring
      if (contextText.includes("stress") && ["peace", "stability", "health"].includes(value.toLowerCase())) {
        score += 2;
      }
      if (contextText.includes("career") && ["achievement", "growth", "excellence"].includes(value.toLowerCase())) {
        score += 2;
      }
      if (contextText.includes("relationship") && ["connection", "family", "compassion"].includes(value.toLowerCase())) {
        score += 2;
      }
      
      scores[value] = score;
    });
    
    return scores;
  }

  async generateValuesGuidance(prioritization) {
    const { top_values } = prioritization;
    
    const guidance = {
      main_message: `Your top values are ${top_values.slice(0, 3).join(", ")}. These form the foundation of your authentic self.`,
      detailed_insights: top_values.map(value => ({
        value,
        meaning: this.getValueMeaning(value),
        life_applications: this.getValueApplications(value),
        potential_challenges: this.getValueChallenges(value),
      })),
      integration_strategies: this.createIntegrationStrategies(top_values),
      next_steps: [
        "Reflect on how your top 3 values show up in your daily life",
        "Identify one area where you can better align with your core values",
        "Practice making decisions through your values lens",
        "Share your values with someone you trust",
      ],
    };

    return guidance;
  }

  getValueMeaning(value) {
    const meanings = {
      "authenticity": "Being true to yourself and expressing your genuine self",
      "freedom": "Having autonomy and the ability to make your own choices",
      "security": "Feeling safe, stable, and protected in life",
      "growth": "Continuously learning, evolving, and expanding your potential",
      "connection": "Building meaningful relationships and feeling understood",
      "creativity": "Expressing yourself and bringing new ideas into the world",
      "justice": "Fairness, equality, and standing up for what's right",
      "compassion": "Showing kindness and understanding to yourself and others",
      "excellence": "Striving for quality and doing your best in all endeavors",
      "adventure": "Seeking new experiences and embracing the unknown",
      "stability": "Creating consistency and reliability in your life",
      "service": "Contributing to something greater than yourself",
      "independence": "Self-reliance and the ability to stand on your own",
      "family": "Prioritizing close relationships and belonging",
      "achievement": "Accomplishing goals and reaching your potential",
      "spirituality": "Connecting with something greater and finding deeper meaning",
      "health": "Maintaining physical, mental, and emotional well-being",
      "beauty": "Appreciating and creating aesthetic experiences",
      "knowledge": "Learning, understanding, and expanding your awareness",
      "integrity": "Acting in alignment with your principles and values",
      "fun": "Enjoying life and finding joy in experiences",
      "tradition": "Honoring heritage and established ways of being",
      "innovation": "Creating new solutions and pushing boundaries",
      "peace": "Finding inner calm and harmony in life",
    };
    
    return meanings[value.toLowerCase()] || "A core principle that guides your life decisions";
  }

  getValueApplications(value) {
    const applications = {
      "authenticity": ["Express your true opinions", "Dress in a way that feels like you", "Choose work that aligns with your nature"],
      "freedom": ["Make independent choices", "Create flexible schedules", "Pursue your own path"],
      "security": ["Build emergency savings", "Create stable routines", "Invest in reliable relationships"],
      "growth": ["Take on new challenges", "Learn new skills", "Seek feedback and reflection"],
      "connection": ["Schedule regular time with loved ones", "Practice active listening", "Join communities"],
    };
    
    return applications[value.toLowerCase()] || ["Integrate this value into daily decisions", "Find ways to express this value at work", "Share this value with others"];
  }

  getValueChallenges(value) {
    const challenges = {
      "authenticity": ["Fear of judgment", "Pressure to conform", "Uncertainty about true self"],
      "freedom": ["Need for structure", "Financial constraints", "Relationship commitments"],
      "security": ["Risk aversion", "Over-planning", "Fear of change"],
      "growth": ["Comfort zone resistance", "Fear of failure", "Overwhelm from too many options"],
      "connection": ["Vulnerability fears", "Time constraints", "Social anxiety"],
    };
    
    return challenges[value.toLowerCase()] || ["Balancing with other values", "External pressures", "Internal resistance"];
  }

  createIntegrationStrategies(topValues) {
    return [
      {
        strategy: "Daily Values Check-in",
        description: "Each morning, ask: 'How can I honor my values today?'",
        values_addressed: topValues.slice(0, 3),
      },
      {
        strategy: "Values-Based Decision Making",
        description: "When facing choices, evaluate options against your top values",
        values_addressed: topValues,
      },
      {
        strategy: "Values Journaling",
        description: "Weekly reflection on how your values showed up in your life",
        values_addressed: topValues,
      },
    ];
  }

  async createValuesExercises(prioritization) {
    const { top_values } = prioritization;
    
    return [
      {
        title: "Values Visualization",
        description: "Imagine your ideal day living fully aligned with your top 3 values",
        duration: "10 minutes",
        values_focus: top_values.slice(0, 3),
      },
      {
        title: "Values Conflict Resolution",
        description: "Identify a current situation where your values might be in conflict and explore solutions",
        duration: "15 minutes",
        values_focus: top_values,
      },
      {
        title: "Values Expression Practice",
        description: "Choose one value and find three ways to express it more fully this week",
        duration: "Ongoing",
        values_focus: [top_values[0]],
      },
    ];
  }

  identifyValuesConflicts(prioritization) {
    const { top_values } = prioritization;
    const conflicts = [];
    
    // Common value conflicts
    const conflictPairs = [
      ["freedom", "security"],
      ["independence", "connection"],
      ["adventure", "stability"],
      ["achievement", "peace"],
      ["authenticity", "tradition"],
    ];
    
    conflictPairs.forEach(([value1, value2]) => {
      if (top_values.includes(value1) && top_values.includes(value2)) {
        conflicts.push({
          values: [value1, value2],
          description: `Tension between ${value1} and ${value2}`,
          resolution_strategies: this.getConflictResolution(value1, value2),
        });
      }
    });
    
    return conflicts;
  }

  getConflictResolution(value1, value2) {
    const resolutions = {
      "freedom_security": ["Create secure base to enable freedom", "Take calculated risks", "Build flexible security"],
      "independence_connection": ["Maintain autonomy within relationships", "Communicate needs clearly", "Balance alone time with together time"],
      "adventure_stability": ["Plan adventures within stable framework", "Create routine around exploration", "Find adventure in familiar places"],
    };
    
    const key = `${value1}_${value2}`;
    return resolutions[key] || resolutions[`${value2}_${value1}`] || ["Find creative ways to honor both values", "Look for win-win solutions", "Alternate focus between values"];
  }

  findAlignmentOpportunities(prioritization) {
    const { top_values } = prioritization;
    
    return [
      {
        area: "Career",
        opportunities: top_values.map(value => `Find work that honors ${value}`),
      },
      {
        area: "Relationships",
        opportunities: top_values.map(value => `Build connections that support ${value}`),
      },
      {
        area: "Lifestyle",
        opportunities: top_values.map(value => `Create daily practices that express ${value}`),
      },
    ];
  }

  createIntegrationPractices(prioritization) {
    const { top_values } = prioritization;
    
    return top_values.slice(0, 3).map(value => ({
      value,
      daily_practice: this.getDailyPractice(value),
      weekly_practice: this.getWeeklyPractice(value),
      monthly_practice: this.getMonthlyPractice(value),
    }));
  }

  getDailyPractice(value) {
    const practices = {
      "authenticity": "Share one genuine thought or feeling with someone",
      "freedom": "Make one choice based purely on your preference",
      "security": "Do one thing that contributes to your stability",
      "growth": "Learn something new or try a different approach",
      "connection": "Have one meaningful conversation",
    };
    
    return practices[value.toLowerCase()] || `Find one way to express ${value} today`;
  }

  getWeeklyPractice(value) {
    const practices = {
      "authenticity": "Reflect on moments when you felt most like yourself",
      "freedom": "Evaluate your commitments and adjust as needed",
      "security": "Review and strengthen your support systems",
      "growth": "Set a new learning goal or challenge",
      "connection": "Reach out to someone you care about",
    };
    
    return practices[value.toLowerCase()] || `Dedicate time to exploring ${value} more deeply`;
  }

  getMonthlyPractice(value) {
    const practices = {
      "authenticity": "Make one significant change that aligns with your true self",
      "freedom": "Eliminate or modify something that feels restrictive",
      "security": "Strengthen one area of your life foundation",
      "growth": "Take on a meaningful challenge or project",
      "connection": "Deepen an important relationship",
    };
    
    return practices[value.toLowerCase()] || `Make a significant commitment to living ${value} more fully`;
  }
}
