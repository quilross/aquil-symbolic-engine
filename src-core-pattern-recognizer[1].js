/**
 * Pattern Recognizer - Identify growth patterns and evolution
 * Helps you see the deeper patterns in your trust building journey
 */

import { AquilDatabase } from '../utils/database.js';
import { AquilAI } from '../utils/ai-helpers.js';

export class PatternRecognizer {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async analyzePatterns(data) {
    try {
      const { area_of_focus, recent_experiences, recurring_themes } = data;
      
      // Get relevant data for pattern analysis
      const historicalData = await this.gatherHistoricalData(area_of_focus);
      
      // Analyze patterns in the data
      const patterns = await this.identifyPatterns(historicalData, data);
      
      // Generate insights about the patterns
      const insights = await this.generatePatternInsights(patterns, data);
      
      // Store pattern analysis
      await this.storePatternAnalysis(patterns, insights, data);

      return {
        message: this.generatePatternMessage(patterns, insights),
        identified_patterns: patterns,
        pattern_insights: insights,
        growth_recommendations: this.generateGrowthRecommendations(patterns, insights),
        trust_building_patterns: this.analyzeTrustPatterns(patterns),
        next_level_guidance: this.generateNextLevelGuidance(patterns, insights),
        celebration_moments: this.identifyCelebrationMoments(patterns)
      };
      
    } catch (error) {
      console.error('Pattern recognition error:', error);
      return this.getEmergencyPatternResponse(data);
    }
  }

  async gatherHistoricalData(areaOfFocus) {
    const data = {
      trust_sessions: [],
      media_wisdom: [],
      somatic_sessions: [],
      synthesis_sessions: []
    };

    try {
      if (areaOfFocus === 'trust_building' || areaOfFocus === 'overall_growth') {
        data.trust_sessions = await this.db.getRecentTrustSessions(20);
      }
      
      if (areaOfFocus === 'media_consumption' || areaOfFocus === 'overall_growth') {
        data.media_wisdom = await this.db.getRecentMediaWisdom(15);
      }

      // Additional data sources could be added here
    } catch (error) {
      console.error('Error gathering historical data:', error);
    }

    return data;
  }

  async identifyPatterns(historicalData, requestData) {
    const patterns = {
      temporal_patterns: this.identifyTemporalPatterns(historicalData),
      behavioral_patterns: this.identifyBehavioralPatterns(historicalData),
      emotional_patterns: this.identifyEmotionalPatterns(historicalData),
      growth_patterns: this.identifyGrowthPatterns(historicalData),
      response_patterns: this.identifyResponsePatterns(historicalData)
    };

    return patterns;
  }

  identifyTemporalPatterns(data) {
    const patterns = [];
    
    // Analyze trust sessions over time
    if (data.trust_sessions.length >= 3) {
      const trustLevels = data.trust_sessions
        .filter(session => session.trust_level)
        .map(session => session.trust_level)
        .slice(0, 10); // Last 10 sessions

      if (trustLevels.length >= 3) {
        const average = trustLevels.reduce((sum, level) => sum + level, 0) / trustLevels.length;
        const trend = this.calculateTrend(trustLevels);
        
        patterns.push({
          type: 'trust_level_evolution',
          trend: trend,
          current_average: Math.round(average * 10) / 10,
          description: `Your trust levels average ${Math.round(average * 10) / 10} and are ${trend}`,
          data_points: trustLevels.length,
          insight: this.getTrustTrendInsight(trend, average)
        });
      }
    }

    // Analyze engagement patterns
    if (data.trust_sessions.length >= 5) {
      const sessionDates = data.trust_sessions.map(s => new Date(s.timestamp));
      const consistency = this.analyzeConsistency(sessionDates);
      
      patterns.push({
        type: 'engagement_consistency',
        consistency_level: consistency.level,
        description: consistency.description,
        growth_indicator: consistency.growth_indicator
      });
    }

    return patterns;
  }

  calculateTrend(values) {
    if (values.length < 3) return 'developing';
    
    const recent = values.slice(0, 3);
    const earlier = values.slice(-3);
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
    
    if (recentAvg > earlierAvg + 0.5) return 'ascending';
    if (recentAvg < earlierAvg - 0.5) return 'descending';
    return 'stabilizing';
  }

  getTrustTrendInsight(trend, average) {
    if (trend === 'ascending' && average >= 7) {
      return 'Excellent progress! Your trust in yourself is genuinely strengthening over time';
    } else if (trend === 'ascending') {
      return 'Beautiful upward trajectory - your trust-building work is paying off';
    } else if (trend === 'stabilizing' && average >= 6) {
      return 'Healthy stability - you\'re establishing a solid foundation of self-trust';
    } else {
      return 'Every interaction builds your relationship with self-trust - you\'re exactly where you need to be';
    }
  }

  analyzeConsistency(dates) {
    if (dates.length < 3) {
      return { level: 'beginning', description: 'Starting to build consistency', growth_indicator: 'foundation' };
    }

    const daysBetween = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.abs(dates[i-1] - dates[i]) / (1000 * 60 * 60 * 24);
      daysBetween.push(diff);
    }

    const avgDaysBetween = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;

    if (avgDaysBetween <= 3) {
      return { 
        level: 'high', 
        description: 'Highly consistent engagement with your growth work',
        growth_indicator: 'accelerated_development'
      };
    } else if (avgDaysBetween <= 7) {
      return { 
        level: 'moderate', 
        description: 'Good consistency - showing up regularly for yourself',
        growth_indicator: 'steady_progress'
      };
    } else {
      return { 
        level: 'developing', 
        description: 'Building the habit of regular self-connection',
        growth_indicator: 'foundation_building'
      };
    }
  }

  identifyBehavioralPatterns(data) {
    const patterns = [];

    // Trust building behaviors
    if (data.trust_sessions.length >= 3) {
      const sessionTypes = data.trust_sessions.map(s => s.session_type || 'check-in');
      const typeFrequency = this.calculateFrequency(sessionTypes);
      
      patterns.push({
        type: 'trust_engagement_style',
        preferred_approach: typeFrequency[0]?.type || 'check-in',
        description: 'Your preferred way of working with trust',
        frequency_data: typeFrequency
      });
    }

    // Media consumption behaviors
    if (data.media_wisdom.length >= 3) {
      const mediaTypes = data.media_wisdom.map(item => item.media_type);
      const contentThemes = data.media_wisdom.flatMap(item => item.growth_themes || []);
      
      const typePreferences = this.calculateFrequency(mediaTypes);
      const themePreferences = this.calculateFrequency(contentThemes);
      
      patterns.push({
        type: 'media_consumption_preferences',
        preferred_content: typePreferences.slice(0, 2),
        recurring_themes: themePreferences.slice(0, 3),
        description: 'Your content choices reveal consistent growth themes'
      });
    }

    return patterns;
  }

  identifyEmotionalPatterns(data) {
    const patterns = [];
    
    // Emotional patterns from trust sessions
    if (data.trust_sessions.length >= 3) {
      const allEmotions = data.trust_sessions
        .flatMap(session => session.insights?.emotional_state || [])
        .filter(emotion => emotion);
      
      if (allEmotions.length > 0) {
        const emotionFrequency = this.calculateFrequency(allEmotions);
        
        patterns.push({
          type: 'trust_emotional_patterns',
          common_emotions: emotionFrequency.slice(0, 3),
          description: 'Emotions that commonly arise during your trust work',
          insight: this.generateEmotionalPatternInsight(emotionFrequency)
        });
      }
    }

    // Media emotional responses
    if (data.media_wisdom.length >= 3) {
      const mediaEmotions = data.media_wisdom
        .flatMap(item => item.emotional_response || [])
        .filter(emotion => emotion);
      
      if (mediaEmotions.length > 0) {
        const mediaEmotionFreq = this.calculateFrequency(mediaEmotions);
        
        patterns.push({
          type: 'media_emotional_responses',
          common_responses: mediaEmotionFreq.slice(0, 3),
          description: 'Your typical emotional responses to content',
          processing_style: this.analyzeEmotionalProcessingStyle(mediaEmotionFreq)
        });
      }
    }

    return patterns;
  }

  generateEmotionalPatternInsight(emotionFrequency) {
    const topEmotion = emotionFrequency[0];
    if (!topEmotion) return 'Your emotional awareness is developing';

    const insights = {
      'anxious': 'Anxiety often appears when you\'re growing - it shows your system is processing new levels of self-trust',
      'excited': 'Excitement in trust work indicates you\'re connecting with your authentic energy',
      'calm': 'Experiencing calm during trust work shows your nervous system is learning to feel safe with self-authority',
      'confused': 'Confusion often precedes breakthrough - your system is reorganizing around new levels of trust'
    };

    return insights[topEmotion.item] || `Your ${topEmotion.item} responses show your emotional system actively engaged in growth`;
  }

  analyzeEmotionalProcessingStyle(emotions) {
    const intensiveEmotions = ['angry', 'excited', 'anxious'];
    const reflectiveEmotions = ['sad', 'calm', 'curious'];
    
    const intensive = emotions.filter(e => intensiveEmotions.includes(e.item)).length;
    const reflective = emotions.filter(e => reflectiveEmotions.includes(e.item)).length;

    if (intensive > reflective) {
      return 'intensive_processor - you feel things strongly and work through them actively';
    } else if (reflective > intensive) {
      return 'reflective_processor - you process emotions through contemplation and inner work';
    } else {
      return 'balanced_processor - you use both intensive feeling and reflective processing';
    }
  }

  identifyGrowthPatterns(data) {
    const patterns = [];

    // Growth themes across all interactions
    const allGrowthThemes = [];
    
    // From trust sessions
    data.trust_sessions.forEach(session => {
      if (session.insights?.growth_themes) {
        allGrowthThemes.push(...session.insights.growth_themes);
      }
    });

    // From media wisdom
    data.media_wisdom.forEach(item => {
      if (item.growth_themes) {
        allGrowthThemes.push(...item.growth_themes);
      }
    });

    if (allGrowthThemes.length >= 3) {
      const themeFrequency = this.calculateFrequency(allGrowthThemes);
      const topThemes = themeFrequency.slice(0, 3);
      
      patterns.push({
        type: 'consistent_growth_themes',
        themes: topThemes,
        description: 'Growth areas that consistently appear across your work',
        soul_message: this.generateSoulMessage(topThemes),
        development_stage: this.assessDevelopmentStage(topThemes)
      });
    }

    return patterns;
  }

  generateSoulMessage(themes) {
    const primary = themes[0]?.item;
    if (!primary) return 'Your soul is guiding you toward authentic growth';

    const messages = {
      'authenticity': 'Your soul is consistently calling you to be more genuinely yourself',
      'courage': 'Your spirit is asking you to step into your power and take brave action',
      'self_worth': 'You\'re being guided to recognize and embody your inherent worthiness',
      'boundaries': 'Your growth is focused on learning to honor and protect your energy',
      'trust': 'The universe is teaching you to trust your inner knowing above all else'
    };

    return messages[primary] || `Your soul is focused on developing ${primary} as a key part of your evolution`;
  }

  assessDevelopmentStage(themes) {
    // This is a simplified assessment - could be much more sophisticated
    if (themes.some(t => ['trust', 'self_worth'].includes(t.item))) {
      return 'foundation_building';
    } else if (themes.some(t => ['authenticity', 'courage'].includes(t.item))) {
      return 'expression_development';
    } else {
      return 'integration_mastery';
    }
  }

  identifyResponsePatterns(data) {
    const patterns = [];
    
    // How user typically responds to different situations
    if (data.trust_sessions.length >= 5) {
      const responses = data.trust_sessions.map(s => ({
        level: s.trust_level,
        context: s.reflection
      }));

      patterns.push({
        type: 'trust_response_style',
        description: this.analyzeTrustResponseStyle(responses),
        adaptability: this.assessAdaptability(responses)
      });
    }

    return patterns;
  }

  analyzeTrustResponseStyle(responses) {
    // Simplified analysis of how user approaches trust work
    const avgLevel = responses.reduce((sum, r) => sum + (r.level || 5), 0) / responses.length;
    
    if (avgLevel >= 7) {
      return 'Confident approacher - you generally trust yourself and use sessions to expand further';
    } else if (avgLevel >= 5) {
      return 'Balanced explorer - you approach trust work with openness and curiosity';
    } else {
      return 'Gentle builder - you approach trust work carefully and compassionately';
    }
  }

  assessAdaptability(responses) {
    const variance = this.calculateVariance(responses.map(r => r.level || 5));
    
    if (variance > 2) {
      return 'Highly adaptive - your trust levels vary significantly based on circumstances';
    } else {
      return 'Steady - your trust levels remain relatively consistent across situations';
    }
  }

  calculateFrequency(items) {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([item, count]) => ({ item, count }));
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  async generatePatternInsights(patterns, data) {
    const insights = {
      meta_patterns: this.generateMetaPatternInsights(patterns),
      growth_acceleration_insights: this.generateGrowthAccelerationInsights(patterns),
      trust_building_insights: this.generateTrustBuildingInsights(patterns),
      integration_opportunities: this.generateIntegrationOpportunities(patterns)
    };

    return insights;
  }

  generateMetaPatternInsights(patterns) {
    const insights = [];
    
    const allPatterns = Object.values(patterns).flat();
    
    if (allPatterns.some(p => p.type.includes('trust'))) {
      insights.push('Trust development is a central thread across multiple areas of your growth');
    }

    if (allPatterns.some(p => p.description?.includes('consistent'))) {
      insights.push('You demonstrate remarkable consistency in your growth work - this creates compound growth effects');
    }

    const growthPatterns = patterns.growth_patterns || [];
    if (growthPatterns.length > 0) {
      insights.push('Your growth patterns show sophisticated self-awareness and intentional development');
    }

    return insights.length > 0 ? insights : ['Your patterns reveal a deep commitment to authentic growth and self-understanding'];
  }

  generateGrowthAccelerationInsights(patterns) {
    const insights = [];

    const temporalPatterns = patterns.temporal_patterns || [];
    if (temporalPatterns.some(p => p.trend === 'ascending')) {
      insights.push('Your upward trajectory indicates your growth practices are creating real, measurable change');
    }

    const behavioralPatterns = patterns.behavioral_patterns || [];
    if (behavioralPatterns.length > 0) {
      insights.push('You\'ve developed consistent behavioral patterns that support your growth - this creates momentum');
    }

    insights.push('Pattern recognition itself accelerates growth by building meta-awareness and conscious choice');

    return insights;
  }

  generateTrustBuildingInsights(patterns) {
    const insights = [];
    
    const trustPatterns = patterns.temporal_patterns?.filter(p => p.type.includes('trust')) || [];

    if (trustPatterns.length > 0) {
      const trustPattern = trustPatterns[0];
      insights.push(`Your trust journey shows ${trustPattern.trend} development with an average of ${trustPattern.current_average}`);
    }

    const emotionalPatterns = patterns.emotional_patterns || [];
    if (emotionalPatterns.length > 0) {
      insights.push('Your emotional patterns during trust work show your nervous system learning to feel safe with self-authority');
    }

    if (insights.length === 0) {
      insights.push('Your trust journey is unique and unfolding perfectly - patterns will become clearer with more data');
    }

    return insights;
  }

  generateIntegrationOpportunities(patterns) {
    const opportunities = [];

    const growthPatterns = patterns.growth_patterns || [];
    if (growthPatterns.length > 0) {
      const themes = growthPatterns[0].themes || [];
      if (themes.length > 1) {
        opportunities.push(`Integration opportunity: Consciously connect your work with ${themes[0].item} to your ${themes[1].item} development`);
      }
    }

    opportunities.push('Use your pattern awareness to make more conscious choices about your growth direction');

    return opportunities;
  }

  generateGrowthRecommendations(patterns, insights) {
    const recommendations = [];

    recommendations.push({
      area: 'Pattern Integration',
      recommendation: 'Continue tracking patterns - your self-awareness is accelerating growth exponentially',
      priority: 'ongoing',
      specific_action: 'Notice your patterns in real-time and make conscious choices based on this awareness'
    });

    // Based on growth patterns
    const growthPatterns = patterns.growth_patterns || [];
    if (growthPatterns.length > 0) {
      const primaryTheme = growthPatterns[0].themes?.[0];
      if (primaryTheme) {
        recommendations.push({
          area: 'Soul-Level Growth',
          recommendation: `Your soul is consistently calling you to develop ${primaryTheme.item} - lean into this guidance`,
          priority: 'high',
          specific_action: `Focus your next growth activities specifically on ${primaryTheme.item} development`
        });
      }
    }

    // Based on trust patterns
    const trustPatterns = patterns.temporal_patterns?.filter(p => p.type.includes('trust')) || [];
    if (trustPatterns.length > 0) {
      const pattern = trustPatterns[0];
      if (pattern.trend === 'ascending') {
        recommendations.push({
          area: 'Trust Expansion',
          recommendation: 'Your trust is genuinely growing - consider expanding into new areas of self-reliance',
          priority: 'medium',
          specific_action: 'Identify one new area of life where you can practice trusting yourself more'
        });
      }
    }

    return recommendations;
  }

  analyzeTrustPatterns(patterns) {
    const trustPatterns = patterns.temporal_patterns?.filter(p => p.type.includes('trust')) || [];
    
    if (trustPatterns.length > 0) {
      const pattern = trustPatterns[0];
      return {
        current_level: pattern.current_average,
        trend: pattern.trend,
        insight: pattern.insight,
        development_stage: pattern.current_average >= 7 ? 'expansion' : pattern.current_average >= 5 ? 'building' : 'foundation'
      };
    }

    return {
      insight: 'Your trust patterns are developing - more interactions will reveal deeper insights',
      development_stage: 'foundation'
    };
  }

  generateNextLevelGuidance(patterns, insights) {
    const growthPatterns = patterns.growth_patterns || [];
    const trustPatterns = patterns.temporal_patterns?.filter(p => p.type.includes('trust')) || [];

    let currentLevel = 'Pattern Awareness';
    let nextLevel = 'Conscious Pattern Creation';
    
    if (trustPatterns.length > 0 && trustPatterns[0].current_average >= 7) {
      currentLevel = 'Conscious Pattern Creation';
      nextLevel = 'Pattern Mastery and Teaching';
    }

    return {
      current_level: currentLevel,
      next_level: nextLevel,
      guidance: [
        'You\'re developing sophisticated pattern awareness - this is advanced inner work',
        'Next level: Use your pattern knowledge to consciously create conditions that support your highest growth',
        'Your pattern recognition ability will become a gift you can share with others'
      ],
      integration_practice: 'Begin each day by checking in with your patterns and making one conscious choice based on this awareness'
    };
  }

  identifyCelebrationMoments(patterns) {
    const celebrations = [];

    const trustPatterns = patterns.temporal_patterns?.filter(p => p.type.includes('trust')) || [];
    if (trustPatterns.length > 0) {
      const pattern = trustPatterns[0];
      if (pattern.trend === 'ascending') {
        celebrations.push('🎉 Your trust in yourself is genuinely increasing over time - this is measurable growth!');
      }
      if (pattern.current_average >= 7) {
        celebrations.push('✨ Your average trust level is genuinely high - you\'re operating from authentic self-authority');
      }
    }

    const behavioralPatterns = patterns.behavioral_patterns || [];
    if (behavioralPatterns.some(p => p.type.includes('engagement'))) {
      celebrations.push('🌱 You\'ve developed consistent growth practices - this shows real commitment to yourself');
    }

    const growthPatterns = patterns.growth_patterns || [];
    if (growthPatterns.length > 0) {
      celebrations.push('🔮 You have clear soul-level themes emerging - you\'re conscious of your deeper growth direction');
    }

    return celebrations.length > 0 ? celebrations : ['🌟 You\'re building pattern awareness - this is sophisticated inner work worth celebrating'];
  }

  async storePatternAnalysis(patterns, insights, data) {
    try {
      // Store the pattern analysis for future reference
      const analysisData = {
        area_of_focus: data.area_of_focus,
        patterns_identified: patterns,
        insights_generated: insights,
        analysis_type: 'comprehensive'
      };
      
      return await this.db.savePattern?.(analysisData) || true;
    } catch (error) {
      console.error('Error storing pattern analysis:', error);
      return false;
    }
  }

  generatePatternMessage(patterns, insights) {
    const totalPatterns = Object.values(patterns).flat().length;
    
    if (totalPatterns === 0) {
      return "You're building the foundation for pattern recognition. Every interaction creates valuable data for your growth journey.";
    } else if (totalPatterns < 5) {
      return `I've identified ${totalPatterns} significant patterns in your journey. Your self-awareness is developing beautifully.`;
    } else {
      return `Found ${totalPatterns} distinct patterns! You're developing sophisticated self-awareness and conscious growth direction.`;
    }
  }

  getEmergencyPatternResponse(data) {
    return {
      message: "Pattern recognition is happening even when systems are offline - your awareness itself is the most powerful tool for growth.",
      identified_patterns: [{
        type: 'self_awareness',
        description: 'Your willingness to look for patterns shows sophisticated consciousness and commitment to growth'
      }],
      pattern_insights: {
        meta_patterns: ['Self-reflection and pattern seeking are themselves powerful patterns for accelerated growth']
      },
      growth_recommendations: [{
        area: 'Continued Awareness',
        recommendation: 'Keep noticing patterns in your daily life - this awareness creates choice and conscious evolution'
      }]
    };
  }
}