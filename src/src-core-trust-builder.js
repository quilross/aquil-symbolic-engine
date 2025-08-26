/**
 * Trust Builder - Core system for building unshakeable internal trust
 * Your personal companion for developing self-authority and inner knowing
 */

import { AquilDatabase } from './utils/database.js';
import { AquilAI } from './utils/ai-helpers.js';

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
      const patterns = await this.identifyTrustPatterns(analysis);
      
      // Save session to database
      const sessionData = {
        trust_level: analysis.trust_level,
        reflection: data.current_state,
        session_type: 'check-in',
        insights: {
          analysis: analysis,
          guidance: guidance,
          patterns_identified: patterns
        },
        exercises_completed: exercises,
        next_steps: guidance.next_steps
      };
      
      await this.db.saveTrustSession(sessionData);

      return {
        message: guidance.main_message,
        trust_analysis: analysis,
        personalized_guidance: guidance,
        trust_exercises: exercises,
        patterns_identified: patterns,
        next_steps: guidance.next_steps,
        affirmations: this.ai.generateAffirmations(analysis),
        standing_tall_connection: this.connectToStandingTall(analysis),
        celebration_moments: this.identifyCelebrationMoments(analysis),
        growth_insights: this.generateGrowthInsights(analysis)
      };
      
    } catch (error) {
      console.error('Trust check-in processing error:', error);
      return this.getEmergencyTrustResponse(data);
    }
  }

  async analyzeTrustState(data) {
    const { current_state, trust_level, specific_situation, body_sensations } = data;
    
    const analysis = {
      trust_level: trust_level || this.ai.analyzeTrustLevel(current_state),
      emotional_state: this.ai.extractEmotions(current_state),
      body_awareness: body_sensations ? this.ai.extractBodySensations(body_sensations) : [],
      growth_themes: this.ai.identifyGrowthThemes(current_state),
      situation_context: specific_situation || 'general trust building',
      readiness_level: this.assessReadinessLevel(current_state),
      confidence_indicators: this.identifyConfidenceIndicators(current_state),
      trust_blocks: this.identifyTrustBlocks(current_state),
      internal_vs_external: this.assessInternalVsExternal(current_state)
    };

    // Add contextual analysis based on situation
    if (specific_situation) {
      analysis.situational_analysis = this.analyzeSituation(specific_situation);
    }

    return analysis;
  }

  assessReadinessLevel(text) {
    const lowerText = text.toLowerCase();
    
    if (['ready', 'excited', 'motivated', 'committed', 'willing'].some(word => lowerText.includes(word))) return 'high';
    if (['overwhelmed', 'tired', 'stuck', 'resistant', 'scared'].some(word => lowerText.includes(word))) return 'low';
    return 'moderate';
  }

  identifyConfidenceIndicators(text) {
    const lowerText = text.toLowerCase();
    const indicators = [];

    const positiveIndicators = {
      'self_knowledge': ['i know', 'i understand', 'i realize', 'i see'],
      'inner_authority': ['my gut says', 'i feel', 'intuition', 'inner knowing'],
      'past_success': ['before', 'previously', 'have done', 'succeeded'],
      'present_strength': ['can do', 'able to', 'capable', 'strong enough']
    };

    Object.entries(positiveIndicators).forEach(([indicator, phrases]) => {
      if (phrases.some(phrase => lowerText.includes(phrase))) {
        indicators.push(indicator);
      }
    });

    return indicators;
  }

  identifyTrustBlocks(text) {
    const lowerText = text.toLowerCase();
    const blocks = [];

    const blockPatterns = {
      'external_validation': ['what others think', 'approval', 'validation', 'others opinions'],
      'perfectionism': ['perfect', 'right way', 'mistake', 'wrong'],
      'past_disappointment': ['before', 'last time', 'always', 'never works'],
      'fear_of_failure': ['fail', 'mess up', 'wrong choice', 'regret'],
      'imposter_syndrome': ['not qualified', 'not enough', 'fraud', 'don\'t deserve']
    };

    Object.entries(blockPatterns).forEach(([block, phrases]) => {
      if (phrases.some(phrase => lowerText.includes(phrase))) {
        blocks.push(block);
      }
    });

    return blocks;
  }

  assessInternalVsExternal(text) {
    const lowerText = text.toLowerCase();
    
    const internalCues = ['i feel', 'gut', 'intuition', 'inner knowing', 'body tells me'];
    const externalCues = ['others think', 'should', 'supposed to', 'everyone says'];
    
    const internalScore = internalCues.filter(cue => lowerText.includes(cue)).length;
    const externalScore = externalCues.filter(cue => lowerText.includes(cue)).length;
    
    if (internalScore > externalScore) return 'internal_focused';
    if (externalScore > internalScore) return 'external_focused';
    return 'mixed';
  }

  analyzeSituation(situation) {
    const lowerSituation = situation.toLowerCase();
    
    const situationTypes = {
      'relationship': ['relationship', 'partner', 'friend', 'family'],
      'career': ['work', 'job', 'career', 'boss', 'colleague'],
      'creative': ['creative', 'art', 'express', 'share', 'create'],
      'decision': ['decide', 'choice', 'option', 'path'],
      'conflict': ['conflict', 'disagreement', 'argue', 'confrontation'],
      'boundary': ['boundary', 'say no', 'limit', 'protect']
    };

    const matchedTypes = Object.entries(situationTypes)
      .filter(([type, keywords]) => keywords.some(keyword => lowerSituation.includes(keyword)))
      .map(([type]) => type);

    return {
      situation_types: matchedTypes,
      complexity: matchedTypes.length > 1 ? 'complex' : 'focused',
      growth_opportunity: this.identifyGrowthOpportunity(matchedTypes)
    };
  }

  identifyGrowthOpportunity(situationTypes) {
    const opportunities = {
      'relationship': 'Practice authentic communication and healthy boundaries',
      'career': 'Align work choices with internal values and authority',
      'creative': 'Trust your unique creative expression and share your gifts',
      'decision': 'Use body wisdom and gut feeling as primary decision tools',
      'conflict': 'Stand in your truth while remaining open to others\' perspectives',
      'boundary': 'Honor your energy and needs as valid and important'
    };

    return situationTypes.map(type => opportunities[type] || 'Trust your inner knowing in this situation');
  }

  async generateTrustGuidance(analysis) {
    const { trust_level, readiness_level, trust_blocks } = analysis;

    // Generate main message based on trust level
    let main_message = this.generateMainMessage(trust_level, readiness_level);
    
    // Generate specific guidance for trust blocks
    const block_guidance = this.generateBlockGuidance(trust_blocks);
    
    // Generate next steps
    const next_steps = this.generateNextSteps(analysis);
    
    return {
      main_message,
      trust_level_insight: this.getTrustLevelInsight(trust_level),
      block_guidance,
      next_steps,
      confidence_building: this.generateConfidenceBuilding(analysis),
      internal_authority_guidance: this.generateInternalAuthorityGuidance(analysis)
    };
  }

  generateMainMessage(trustLevel, readinessLevel) {
    if (trustLevel >= 8 && readinessLevel === 'high') {
      return "You're in a beautiful space of trusting yourself and ready for expansion. This is your natural state - powerful, grounded, and authentic.";
    } else if (trustLevel >= 7) {
      return "You're operating from genuine self-trust right now. Feel how good this feels - this is what you're building toward as your new normal.";
    } else if (trustLevel >= 5 && readinessLevel === 'high') {
      return "Your willingness to grow combined with solid foundation trust creates perfect conditions for breakthrough. You're ready to trust yourself more.";
    } else if (trustLevel >= 5) {
      return "You're in the beautiful middle ground of trust building. This is exactly how trust develops - gradually, with awareness and practice.";
    } else if (readinessLevel === 'low') {
      return "You're being gentle with yourself right now, and that's exactly right. Trust builds when we honor where we are while staying open to growth.";
    } else {
      return "You're in the foundational phase of trust building. Every moment of awareness like this is strengthening your inner authority.";
    }
  }

  getTrustLevelInsight(level) {
    if (level >= 8) {
      return "You're operating from strong self-trust. Use this as a foundation to take on bigger challenges and expand your comfort zone.";
    } else if (level >= 6) {
      return "Your trust is growing steadily. This is the sweet spot for gentle expansion - you have foundation and room to grow.";
    } else if (level >= 4) {
      return "You're building trust brick by brick. Focus on small wins and celebrating progress rather than pushing for big changes.";
    } else {
      return "Trust feels challenging right now, which makes complete sense. Small, gentle steps and self-compassion are exactly right.";
    }
  }

  generateBlockGuidance(trustBlocks) {
    const guidance = {};

    trustBlocks.forEach(block => {
      switch (block) {
        case 'external_validation':
          guidance[block] = {
            insight: "Looking outside for validation is a learned pattern, not a character flaw.",
            practice: "Before seeking others' opinions, pause and ask: 'What do I think about this?'",
            reframe: "Others' opinions are data points, not the final authority on your choices."
          };
          break;
        case 'perfectionism':
          guidance[block] = {
            insight: "Perfectionism often masks fear of judgment or failure - it's a protection strategy.",
            practice: "Practice 'good enough' - take action with 80% certainty rather than waiting for 100%.",
            reframe: "Imperfect action teaches you more than perfect planning."
          };
          break;
        case 'past_disappointment':
          guidance[block] = {
            insight: "Past experiences inform but don't determine future outcomes. You've grown since then.",
            practice: "Acknowledge the past disappointment and also notice how you've evolved.",
            reframe: "Previous disappointments were learning experiences, not predictions of future failure."
          };
          break;
        case 'fear_of_failure':
          guidance[block] = {
            insight: "Fear of failure often indicates you care deeply about the outcome - that's beautiful.",
            practice: "Reframe failure as 'valuable learning data' rather than personal inadequacy.",
            reframe: "Every successful person has a history of failures that taught them what works."
          };
          break;
        case 'imposter_syndrome':
          guidance[block] = {
            insight: "Imposter syndrome often appears when you're growing into new levels of capability.",
            practice: "List evidence of your qualifications and past successes - you belong here.",
            reframe: "Feeling like an imposter means you're expanding beyond your comfort zone - that's growth."
          };
          break;
      }
    });

    return guidance;
  }

  generateNextSteps(analysis) {
    const steps = [];
    const { trust_level, readiness_level, trust_blocks } = analysis;
    
    // Universal first step
    steps.push('Acknowledge yourself for doing this trust check-in - this itself is an act of self-care and growth');
    
    // Trust level specific steps
    if (trust_level >= 7 && readiness_level === 'high') {
      steps.push('Choose one area where you could trust yourself more and take one small action there today');
      steps.push('Notice how it feels to operate from this level of self-trust - this is your natural state');
    } else if (trust_level >= 5) {
      steps.push('Practice the trust temperature check exercise: pause three times today and ask "How much do I trust myself right now?"');
      steps.push('Make one small decision purely from your gut feeling - like which route to take or what to eat');
    } else {
      steps.push('Practice micro-trust building: trust yourself with one tiny decision today');
      steps.push('Notice one decision you made recently that worked out - you can trust yourself more than you think');
    }
    
    // Block-specific steps
    if (trust_blocks.includes('external_validation')) {
      steps.push('Before asking others for advice today, first ask yourself: "What do I think about this?"');
    }
    
    if (trust_blocks.includes('perfectionism')) {
      steps.push('Take one imperfect action today - something that\'s "good enough" rather than perfect');
    }

    // Readiness-based steps
    if (readiness_level === 'high') {
      steps.push('Your high readiness creates perfect conditions for growth - choose one trust exercise to practice today');
    } else if (readiness_level === 'low') {
      steps.push('Honor your low energy by being extra gentle with yourself - trust building happens in rest too');
    }

    return steps.slice(0, 5); // Return top 5 steps
  }

  generateConfidenceBuilding(analysis) {
    return {
      strengths_identified: this.identifyCurrentStrengths(analysis),
      confidence_practices: this.generateConfidencePractices(analysis),
      evidence_building: this.generateEvidenceBuilding(analysis)
    };
  }

  identifyCurrentStrengths(analysis) {
    const strengths = [];
    
    if (analysis.confidence_indicators.includes('self_knowledge')) {
      strengths.push('You demonstrate clear self-awareness and understanding');
    }
    
    if (analysis.confidence_indicators.includes('inner_authority')) {
      strengths.push('You have access to your intuition and gut wisdom');
    }
    
    if (analysis.trust_level >= 6) {
      strengths.push('You have a solid foundation of self-trust to build on');
    }
    
    if (analysis.readiness_level === 'high') {
      strengths.push('Your willingness and motivation for growth are powerful assets');
    }
    
    strengths.push('You have the courage to examine your trust patterns - this shows emotional intelligence');
    
    return strengths;
  }

  generateConfidencePractices(analysis) {
    const practices = [
      {
        name: 'Daily Trust Temperature Check',
        instruction: 'Three times today, pause and ask: "How much do I trust myself right now?" Just notice, no judgment.',
        purpose: 'Build awareness of your trust levels throughout the day'
      }
    ];

    if (analysis.trust_level >= 6) {
      practices.push({
        name: 'Trust Expansion Practice',
        instruction: 'Identify one area where you could trust yourself 10% more and take one small action there.',
        purpose: 'Gradually expand your comfort zone with self-trust'
      });
    } else {
      practices.push({
        name: 'Micro-Trust Building',
        instruction: 'Make one tiny decision today purely from your gut feeling - like which route to take.',
        purpose: 'Practice trusting yourself in low-stakes situations'
      });
    }

    if (analysis.body_awareness.length > 0) {
      practices.push({
        name: 'Body Wisdom Check-In',
        instruction: 'Before decisions, place hand on belly and notice: does this option create expansion or contraction?',
        purpose: 'Use your body as a trust and decision-making tool'
      });
    }

    return practices.slice(0, 3);
  }

  generateEvidenceBuilding(analysis) {
    return [
      'Keep a daily note of one decision you made that worked out - build evidence of your good judgment',
      'Notice when your gut feeling was right about something - your intuition is more accurate than you think',
      'Acknowledge moments when you trusted yourself, even in small ways - these count as trust victories',
      'Track your trust check-ins over time - you\'ll see patterns of growth and increasing self-authority'
    ];
  }

  generateInternalAuthorityGuidance(analysis) {
    const guidance = {
      current_level: this.assessInternalAuthorityLevel(analysis),
      development_practices: this.getInternalAuthorityPractices(analysis),
      integration_steps: this.getIntegrationSteps(analysis)
    };

    return guidance;
  }

  assessInternalAuthorityLevel(analysis) {
    if (analysis.internal_vs_external === 'internal_focused' && analysis.trust_level >= 7) {
      return 'advanced - you primarily reference your inner knowing';
    } else if (analysis.internal_vs_external === 'internal_focused') {
      return 'developing - you access inner knowing but could trust it more';
    } else if (analysis.internal_vs_external === 'mixed') {
      return 'transitioning - moving from external to internal authority';
    } else {
      return 'beginning - learning to develop internal reference points';
    }
  }

  getInternalAuthorityPractices(analysis) {
    const practices = [];

    if (analysis.internal_vs_external === 'external_focused') {
      practices.push('Before seeking outside advice, spend 5 minutes journaling your own thoughts first');
      practices.push('Practice making small decisions without consulting others - like what to wear or eat');
    }

    if (analysis.body_awareness.length === 0) {
      practices.push('Develop body awareness: pause before decisions and notice physical sensations');
    }

    practices.push('End each day by asking: "What did I learn about trusting myself today?"');

    return practices;
  }

  getIntegrationSteps(analysis) {
    return [
      'Start with trusting yourself in areas where you already have evidence of good judgment',
      'Gradually expand to slightly more challenging decisions as your trust foundation strengthens',
      'Notice the difference between fear-based and wisdom-based inner voices',
      'Practice patience with your trust-building process - it develops over time with consistent practice'
    ];
  }

  async identifyTrustPatterns(analysis) {
    try {
      // Get recent trust sessions to identify patterns
      const recentSessions = await this.db.getRecentTrustSessions(10);
      
      const patterns = {
        trust_level_pattern: this.analyzeTrustLevelPattern(recentSessions, analysis.trust_level),
        recurring_blocks: this.analyzeRecurringBlocks(recentSessions, analysis.trust_blocks),
        growth_trajectory: this.analyzeGrowthTrajectory(recentSessions),
        readiness_patterns: this.analyzeReadinessPattern(recentSessions, analysis.readiness_level)
      };

      return patterns;
    } catch (error) {
      console.error('Error identifying trust patterns:', error);
      return { message: 'Pattern analysis building - more check-ins will reveal deeper insights' };
    }
  }

  analyzeTrustLevelPattern(sessions, currentLevel) {
    if (sessions.length < 3) {
      return { pattern: 'establishing_baseline', message: 'Building your trust level baseline' };
    }

    const levels = sessions.map(s => s.trust_level).filter(l => l);
    const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    
    if (currentLevel > average + 0.5) {
      return { pattern: 'ascending', message: 'Your trust in yourself is genuinely increasing' };
    } else if (currentLevel < average - 0.5) {
      return { pattern: 'fluctuating', message: 'Trust levels vary - this is normal and part of the process' };
    } else {
      return { pattern: 'stabilizing', message: 'Your trust level is stabilizing at a healthy baseline' };
    }
  }

  analyzeRecurringBlocks(sessions, currentBlocks) {
    const allBlocks = sessions.flatMap(s => s.insights?.trust_blocks || []);
    const blockFrequency = this.ai.calculateFrequency(allBlocks);
    
    const recurringBlocks = blockFrequency.filter(block => block.count >= 2);
    
    if (recurringBlocks.length > 0) {
      return {
        blocks: recurringBlocks,
        message: `Your primary trust development area is working with ${recurringBlocks[0].item}`,
        growth_opportunity: 'Recurring blocks show consistent growth edges - these are your development priorities'
      };
    }

    return { message: 'No recurring blocks identified yet - keep tracking for patterns' };
  }

  analyzeGrowthTrajectory(sessions) {
    if (sessions.length < 5) {
      return { trajectory: 'early_stage', message: 'Building data for trajectory analysis' };
    }

    const recentAvg = sessions.slice(0, 3).reduce((sum, s) => sum + (s.trust_level || 5), 0) / 3;
    const earlierAvg = sessions.slice(-3).reduce((sum, s) => sum + (s.trust_level || 5), 0) / 3;

    if (recentAvg > earlierAvg + 0.5) {
      return { trajectory: 'strong_growth', message: 'Clear upward trajectory in trust development' };
    } else if (recentAvg > earlierAvg) {
      return { trajectory: 'steady_growth', message: 'Consistent, steady progress in building self-trust' };
    } else {
      return { trajectory: 'stabilizing', message: 'Establishing a stable foundation of self-trust' };
    }
  }

  analyzeReadinessPattern(sessions, currentReadiness) {
    const readinessLevels = sessions.map(s => s.insights?.readiness_level || 'moderate');
    const highReadiness = readinessLevels.filter(r => r === 'high').length;
    
    if (highReadiness >= 2 && currentReadiness === 'high') {
      return { pattern: 'high_engagement', message: 'You consistently show up ready for growth - this accelerates development' };
    } else if (currentReadiness === 'high') {
      return { pattern: 'ready_for_breakthrough', message: 'Your high readiness creates perfect conditions for significant progress' };
    } else {
      return { pattern: 'building_readiness', message: 'Readiness fluctuates naturally - honor your current capacity' };
    }
  }

  connectToStandingTall(analysis) {
    const { trust_level, confidence_indicators, internal_vs_external } = analysis;

    if (trust_level >= 7 && internal_vs_external === 'internal_focused') {
      return "This level of self-trust is exactly what allows you to stand tall in the world. When you trust your inner authority, you naturally take up your rightful space without shrinking.";
    } else if (trust_level >= 5) {
      return "As your trust in yourself grows, you'll naturally find yourself standing taller. Trust and authentic presence go hand in hand - they develop together.";
    } else {
      return "Standing tall begins with trusting that your inner knowing is valid and valuable. Each trust-building step helps you take up more space in the world.";
    }
  }

  identifyCelebrationMoments(analysis) {
    const celebrations = [];

    if (analysis.trust_level >= 7) {
      celebrations.push('🎉 Your trust level is genuinely high - this is real progress worth celebrating!');
    }

    if (analysis.readiness_level === 'high') {
      celebrations.push('✨ Your readiness for growth shows beautiful self-compassion and courage');
    }

    if (analysis.confidence_indicators.length > 0) {
      celebrations.push('💪 You demonstrated clear confidence indicators - you trust yourself more than you realize');
    }

    if (analysis.internal_vs_external === 'internal_focused') {
      celebrations.push('🌟 You\'re primarily referencing your inner authority - this is sophisticated emotional intelligence');
    }

    celebrations.push('🌱 You chose to do this trust check-in - this decision itself shows self-care and growth commitment');

    return celebrations.slice(0, 3);
  }

  generateGrowthInsights(analysis) {
    const insights = [];

    if (analysis.situational_analysis) {
      insights.push(`This ${analysis.situational_analysis.situation_types[0]} situation is perfect for practicing trust in real-world application`);
    }

    if (analysis.trust_blocks.length > 0) {
      insights.push(`Working with ${analysis.trust_blocks[0]} is your current growth edge - it's showing you where trust wants to expand`);
    }

    if (analysis.body_awareness.length > 0) {
      insights.push('Your body awareness gives you direct access to wisdom - this is a powerful trust-building tool');
    }

    insights.push('Every trust check-in strengthens your internal authority and builds evidence of your capacity for self-guidance');

    return insights;
  }

  async createPersonalizedExercises(analysis) {
    const exercises = [];

    // Universal trust exercise
    exercises.push({
      name: 'Trust Temperature Check',
      instruction: 'Three times today, pause and ask: "How much do I trust myself right now?" Just notice without judgment.',
      purpose: 'Build awareness of your trust levels throughout the day',
      frequency: 'Daily',
      difficulty: 'Easy'
    });

    // Trust level specific exercises
    if (analysis.trust_level <= 4) {
      exercises.push({
        name: 'Micro-Trust Building',
        instruction: 'Make one tiny decision today purely from your gut feeling - like which route to take or what to eat first.',
        purpose: 'Practice trusting yourself in low-stakes situations',
        frequency: 'Daily',
        difficulty: 'Easy'
      });
    } else if (analysis.trust_level >= 6) {
      exercises.push({
        name: 'Trust Expansion Challenge',
        instruction: 'Identify one area where you could trust yourself 10% more and take one small action there today.',
        purpose: 'Expand your trust into new areas of life',
        frequency: 'Weekly',
        difficulty: 'Medium'
      });
    }

    // Block-specific exercises
    if (analysis.trust_blocks.includes('external_validation')) {
      exercises.push({
        name: 'Internal Authority Practice',
        instruction: 'Before seeking others\' opinions today, spend 5 minutes writing your own thoughts first.',
        purpose: 'Develop internal reference points before external consultation',
        frequency: 'As needed',
        difficulty: 'Medium'
      });
    }

    if (analysis.trust_blocks.includes('perfectionism')) {
      exercises.push({
        name: 'Good Enough Practice',
        instruction: 'Take one action today at 80% certainty rather than waiting for 100% - notice what happens.',
        purpose: 'Build tolerance for imperfection and practice taking action despite uncertainty',
        frequency: 'Daily',
        difficulty: 'Medium'
      });
    }

    // Body awareness exercise if relevant
    if (analysis.body_awareness.length > 0) {
      exercises.push({
        name: 'Body Wisdom Decision Making',
        instruction: 'Before your next decision, place hand on belly, present options, notice expansion (yes) or contraction (no).',
        purpose: 'Use your body as a trust and decision-making tool',
        frequency: 'Before decisions',
        difficulty: 'Easy'
      });
    }

    return exercises.slice(0, 4); // Return top 4 exercises
  }

  getEmergencyTrustResponse(data) {
    return {
      message: "Your willingness to check in with your trust levels shows beautiful self-awareness. The most important thing: you are already whole and worthy of your own trust.",
      trust_analysis: { 
        trust_level: 5, 
        message: "Your self-care in doing this check-in is evidence of your capacity for self-trust",
        emotional_state: ['curious', 'caring']
      },
      personalized_guidance: { 
        main_message: "Trust building happens in small moments of choosing yourself over doubt.",
        next_steps: [
          "Take three deep breaths and remind yourself: 'I am learning to trust myself'",
          "Notice one decision you made recently that worked out - you can trust yourself more than you think"
        ]
      },
      trust_exercises: [{
        name: 'Basic Trust Acknowledgment',
        instruction: 'End today by naming one way you trusted yourself, even if it felt small',
        purpose: 'Build evidence of your existing trustworthiness'
      }],
      affirmations: [
        "I trust the process of learning to trust myself",
        "My inner wisdom is always available to me",
        "I am worthy of my own trust and care"
      ],
      standing_tall_connection: "Every moment you honor your inner experience, you practice standing tall in your truth."
    };
  }
}