/**
 * Trust Builder - Core system for building unshakeable internal trust
 * Your personal companion for developing self-authority and inner knowing
 */

import { AquilDatabase } from '../utils/database.js';
import { AquilAI } from '../utils/ai-helpers.js';

export class TrustBuilder {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async processCheckIn(data) {
    try {
      const analysis = await this.analyzeTrustState(data);
      const guidance = await this.generateTrustGuidance(analysis);
      const exercises = await this.createPersonalizedExercises(analysis);
      
      // Save session to database
      const sessionData = {
        trust_level: analysis.trust_level,
        reflection: data.current_state,
        session_type: 'check-in',
        insights: guidance,
        exercises_completed: exercises
      };
      
      await this.db.saveTrustSession(sessionData);

      return {
        message: guidance.main_message,
        trust_analysis: analysis,
        personalized_guidance: guidance,
        trust_exercises: exercises,
        next_steps: guidance.next_steps,
        affirmations: this.generatePersonalAffirmations(analysis),
        standing_tall_connection: this.connectToStandingTall(analysis)
      };
      
    } catch (error) {
      console.error('Trust check-in processing error:', error);
      return this.getEmergencyTrustResponse(data);
    }
  }

  async analyzeTrustState(data) {
    const { current_state, trust_level, specific_situation, body_sensations } = data;
    
    return {
      trust_level: trust_level || this.ai.analyzeTrustLevel(current_state),
      emotional_state: this.ai.extractEmotions(current_state),
      body_awareness: body_sensations ? this.ai.extractBodySensations(body_sensations) : [],
      growth_themes: this.ai.identifyGrowthThemes(current_state),
      situation_context: specific_situation || 'general trust building',
      readiness_level: this.assessReadinessLevel(current_state)
    };
  }

  assessReadinessLevel(text) {
    const lowerText = text.toLowerCase();
    
    if (['ready', 'excited', 'motivated', 'committed'].some(word => lowerText.includes(word))) return 'high';
    if (['overwhelmed', 'tired', 'stuck', 'resistant'].some(word => lowerText.includes(word))) return 'low';
    return 'medium';
  }

  async generateTrustGuidance(analysis) {
    const { trust_level } = analysis;

    let main_message = "";
    
    if (trust_level >= 8) {
      main_message = "You're in a beautiful space of trusting yourself right now. This is your natural state - powerful and grounded.";
    } else if (trust_level >= 6) {
      main_message = "You're building real momentum in trusting yourself. This is exactly how trust develops - gradually, with practice.";
    } else if (trust_level >= 4) {
      main_message = "You're in the learning phase of trust building. Every moment of awareness like this is strengthening your inner authority.";
    } else {
      main_message = "Trust feels challenging right now, and that's completely understandable. You're not broken - you're human.";
    }

    return {
      main_message,
      next_steps: this.generateNextSteps(analysis),
      trust_level_insight: this.getTrustLevelInsight(trust_level)
    };
  }

  getTrustLevelInsight(level) {
    if (level >= 8) {
      return "You're operating from strong self-trust. Consider how you can use this foundation to take on bigger challenges.";
    } else if (level >= 6) {
      return "Your trust is growing steadily. This is the sweet spot for gentle expansion.";
    } else if (level >= 4) {
      return "You're building trust brick by brick. Focus on small wins and celebrating progress.";
    } else {
      return "Trust feels low right now, which makes sense. Small, gentle steps are exactly right.";
    }
  }

  async createPersonalizedExercises(analysis) {
    const exercises = [];

    exercises.push({
      name: 'Trust Temperature Check',
      instruction: 'Three times today, pause and ask: "How much do I trust myself right now?" Just notice, no judgment.',
      purpose: 'Build awareness of your trust levels throughout the day'
    });

    if (analysis.trust_level <= 4) {
      exercises.push({
        name: 'Micro-Trust Building',
        instruction: 'Make one tiny decision today purely from your gut feeling - like which route to take or what to eat.',
        purpose: 'Practice trusting yourself in low-stakes situations'
      });
    }

    if (analysis.trust_level >= 6) {
      exercises.push({
        name: 'Trust Expansion',
        instruction: 'Identify one area where you could trust yourself more and take one small action there.',
        purpose: 'Expand your trust into new areas of life'
      });
    }

    return exercises;
  }

  generateNextSteps(analysis) {
    const steps = [];
    
    if (analysis.readiness_level === 'high') {
      steps.push('Choose one trust exercise to practice today');
      steps.push('Notice one decision where you can trust your first instinct');
    } else if (analysis.readiness_level === 'low') {
      steps.push('Simply notice when you do trust yourself - no action required');
      steps.push('Be gentle with yourself - trust building takes time');
    } else {
      steps.push('Practice the trust temperature check exercise');
      steps.push('Acknowledge yourself for doing this check-in');
    }

    return steps;
  }

  generatePersonalAffirmations(analysis) {
    const affirmations = [
      'I trust the wisdom that lives within me',
      'My inner knowing guides me toward my highest good',
      'I am learning to trust myself, and that learning is valuable'
    ];

    if (analysis.trust_level >= 7) {
      affirmations.push('I stand in my power and trust my decisions');
    } else {
      affirmations.push('Every moment of self-awareness builds my trust');
    }

    return affirmations;
  }

  connectToStandingTall(analysis) {
    const { trust_level } = analysis;

    if (trust_level >= 7) {
      return "This level of self-trust is what allows you to stand tall in the world. You're not shrinking - you're taking up your rightful space.";
    } else {
      return "As your trust in yourself grows, you'll naturally find yourself standing taller. Trust and presence go hand in hand.";
    }
  }

  getEmergencyTrustResponse(data) {
    return {
      message: "Your willingness to check in shows self-care. The most important thing: you are already whole and worthy of your own trust.",
      trust_analysis: { trust_level: 5, message: "Your willingness to check in shows self-care" },
      personalized_guidance: { 
        main_message: "Trust building happens in small moments of choosing yourself.",
        next_steps: ["Take three deep breaths and remind yourself: 'I am learning to trust myself'"]
      },
      affirmations: [
        "I trust the process of learning to trust myself",
        "My inner wisdom is always available to me"
      ]
    };
  }
}