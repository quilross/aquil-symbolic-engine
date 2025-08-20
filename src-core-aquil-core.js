/**
 * Aquil Core System - The heart of your personal AI wisdom builder
 * Orchestrates all wisdom systems and maintains your personal growth journey
 */

import { AquilDatabase } from '../utils/database.js';
import { AquilAI } from '../utils/ai-helpers.js';

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

    console.log('🌱 Initializing Aquil Core System...');
    
    // Load or create user profile
    this.userProfile = await this.db.getUserProfile();
    if (!this.userProfile) {
      await this.createInitialProfile();
      this.userProfile = await this.db.getUserProfile();
    }

    this.initialized = true;
    console.log('✅ Aquil Core System initialized');
  }

  async createInitialProfile() {
    const initialProfile = {
      preferences: {
        communication_style: 'direct_comprehensive',
        frameworks: ['human_design', 'gene_keys', 'astrology', 'somatic_wisdom'],
        focus_areas: ['internal_trust', 'standing_tall', 'media_wisdom', 'body_awareness']
      },
      personality_data: {
        human_design: { type: 'unknown', strategy: 'explore', authority: 'inner_knowing' },
        gene_keys: { life_work: 'authentic_expression', evolution: 'trust_building' },
        astrology: { focus: 'personal_development' },
        somatic: { primary_modality: 'body_awareness' }
      },
      trust_baseline: 5,
      standing_tall_goal: 'Build unshakeable internal trust as my primary navigation system'
    };

    await this.db.updateUserProfile(initialProfile);
    console.log('✅ Initial user profile created');
  }

  // Daily wisdom synthesis
  async runDailySynthesis() {
    console.log('🌅 Running daily wisdom synthesis...');
    
    try {
      const trustSessions = await this.db.getRecentTrustSessions(7);
      const mediaWisdom = await this.db.getRecentMediaWisdom(7);
      
      const patterns = await this.analyzeWeeklyPatterns(trustSessions, mediaWisdom);
      const synthesis = await this.generateWisdomSynthesis(patterns);
      
      await this.storeWisdomCompilation(synthesis);
      
      console.log('✅ Daily wisdom synthesis complete');
      return synthesis;
    } catch (error) {
      console.error('Daily synthesis error:', error);
      return null;
    }
  }

  async analyzeWeeklyPatterns(trustSessions, mediaWisdom) {
    return {
      trust_trends: this.analyzeTrustTrends(trustSessions),
      media_themes: this.analyzeMediaThemes(mediaWisdom),
      growth_areas: this.identifyGrowthAreas(trustSessions, mediaWisdom),
      standing_tall_progress: this.assessStandingTallProgress(trustSessions)
    };
  }

  analyzeTrustTrends(sessions) {
    if (sessions.length === 0) return { trend: 'stable', message: 'Starting your trust journey' };

    const trustLevels = sessions.map(s => s.trust_level).filter(l => l);
    if (trustLevels.length === 0) return { trend: 'exploring', message: 'Building awareness' };

    const average = trustLevels.reduce((sum, level) => sum + level, 0) / trustLevels.length;
    
    return {
      trend: 'developing',
      average: Math.round(average * 10) / 10,
      message: `Your trust in yourself is at ${Math.round(average * 10) / 10}. Keep building!`
    };
  }

  analyzeMediaThemes(mediaWisdom) {
    if (mediaWisdom.length === 0) return { themes: [], message: 'Start tracking your media wisdom' };

    const allThemes = mediaWisdom.flatMap(item => item.growth_themes || []);
    const themeCount = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {});

    const topThemes = Object.entries(themeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);

    return {
      themes: topThemes,
      message: topThemes.length > 0 ? `Your content consistently explores ${topThemes[0]}` : 'Building your media wisdom database'
    };
  }

  identifyGrowthAreas(trustSessions, mediaWisdom) {
    const areas = [];

    if (trustSessions.length > 0) {
      const avgTrust = trustSessions.reduce((sum, s) => sum + (s.trust_level || 5), 0) / trustSessions.length;
      if (avgTrust < 6) areas.push('trust_building');
      if (avgTrust >= 7) areas.push('trust_expansion');
    }

    if (mediaWisdom.length > 2) {
      areas.push('media_integration');
    }

    return areas.length > 0 ? areas : ['foundation_building'];
  }

  assessStandingTallProgress(sessions) {
    return {
      current_focus: 'Building awareness of shrinking vs standing tall patterns',
      progress: 'In development - every check-in builds this capacity'
    };
  }

  async generateWisdomSynthesis(patterns) {
    return {
      date: new Date().toISOString().split('T')[0],
      trust_evolution: patterns.trust_trends,
      media_insights: patterns.media_themes,
      standing_tall_progress: patterns.standing_tall_progress,
      growth_focus: patterns.growth_areas,
      celebration: this.generateCelebration(patterns),
      intention: this.generateIntention(patterns)
    };
  }

  generateCelebration(patterns) {
    const celebrations = ['You showed up for your growth by engaging with Aquil - that itself is worth celebrating'];
    
    if (patterns.trust_trends.average >= 7) {
      celebrations.push('Your trust in yourself is genuinely strong right now');
    }
    
    if (patterns.media_themes.themes.length > 0) {
      celebrations.push('You are successfully extracting wisdom from your content consumption');
    }

    return celebrations;
  }

  generateIntention(patterns) {
    if (patterns.growth_areas.includes('trust_building')) {
      return 'I trust my inner knowing as my primary guidance system';
    }
    
    if (patterns.growth_areas.includes('trust_expansion')) {
      return 'I stand tall in my truth and take up my rightful space in the world';
    }

    return 'I am building a loving, trusting relationship with myself';
  }

  async storeWisdomCompilation(synthesis) {
    // This would store in the wisdom_compilation table
    return synthesis;
  }

  async generateWisdomCompilation() {
    console.log('📝 Generating wisdom compilation...');
    // Daily compilation logic would go here
    return { status: 'Wisdom compiled for today' };
  }

  getUserPreferences() {
    return this.userProfile?.preferences || {
      communication_style: 'direct_comprehensive',
      frameworks: ['human_design', 'gene_keys', 'astrology', 'somatic_wisdom']
    };
  }
}
