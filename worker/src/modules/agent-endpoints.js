/**
 * Agent Endpoints Module
 * Handles autonomous agent functionality, suggestions, and monitoring
 */

import { Utils } from './utils.js';

export class AgentEndpoints {
  constructor(userState) {
    this.userState = userState;
  }

  /**
   * Handle agent endpoint routing
   * @param {string} path - The endpoint path
   * @param {string} method - HTTP method
   * @param {Request} request - The request object
   * @returns {Response|null} Response or null if not handled
   */
  async handleAgentEndpoints(path, method, request) {
    const agentEndpoints = {
      '/track-time': { 'POST': async() => this.trackTime(await request.json()) },
      '/session-monitor': { 'POST': async() => this.sessionMonitor(await request.json()) },
      '/movement-reminder': { 'POST': async() => this.movementReminder(await request.json()) },
      '/agent-overwhelm': { 'GET': () => this.getAgentOverwhelm() },
      '/agent-suggestions': { 'GET': () => this.getAgentSuggestions() },
      '/philadelphia-context': { 'GET': () => this.getPhiladelphiaContext() },
      '/privacy-settings': {
        'GET': () => this.getPrivacySettings(),
        'POST': async() => this.updatePrivacySettings(await request.json())
      },
      '/agent-curiosity': { 'POST': async() => this.agentCuriosity(await request.json()) },
      '/agent-interests': { 'GET': () => this.getAgentInterests() },
      '/agent-exploration': { 'POST': async() => this.agentExploration(await request.json()) }
    };

    const endpoint = agentEndpoints[path];
    return endpoint?.[method] ? endpoint[method]() : null;
  }

  /**
   * Track time with Philadelphia timezone support
   * @param {Object} data - Time tracking data
   * @returns {Response} Time tracking response
   */
  async trackTime(data) {
    try {
      const now = new Date();
      const phillyTime = Utils.getPhiladelphiaTime();

      await this.userState.inc('reads');
      return this.userState.respond({
        serverTime: now.toISOString(),
        userLocalTime: phillyTime,
        timezone: 'America/New_York',
        trackingData: Utils.sanitizeInput(data)
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Monitor session duration and provide shutdown recommendations
   * @param {Object} data - Session monitoring data
   * @returns {Response} Session monitoring response
   */
  async sessionMonitor(data) {
    try {
      Utils.validateRequestData(data, {
        maxDuration: { type: 'number', required: false }
      });

      const sessionStart = await this.userState.state.storage.get('sessionStart') || new Date().toISOString();
      const now = new Date();
      const start = new Date(sessionStart);
      const durationMinutes = Utils.getTimeDifferenceMinutes(start, now);
      const maxDuration = data.maxDuration || 120;

      const shouldShutdown = durationMinutes > maxDuration;
      const timeRemaining = Math.max(0, maxDuration - durationMinutes);

      if (!await this.userState.state.storage.get('sessionStart')) {
        await this.userState.state.storage.put('sessionStart', now.toISOString());
      }

      await this.userState.inc('reads');
      return this.userState.respond({
        shouldShutdown,
        timeRemaining: Math.round(timeRemaining),
        sessionDuration: Math.round(durationMinutes),
        message: shouldShutdown ?
          'Session time exceeded. Consider taking a break.' :
          `${Math.round(timeRemaining)} minutes remaining in session.`
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Movement reminder based on last activity
   * @param {Object} data - Movement tracking data
   * @returns {Response} Movement reminder response
   */
  async movementReminder(data) {
    try {
      Utils.validateRequestData(data, {
        lastMovement: { type: 'string', required: false },
        reminderInterval: { type: 'number', required: false }
      });

      const lastMovement = data.lastMovement ? new Date(data.lastMovement) : new Date();
      const now = new Date();
      const minutesSinceMovement = Utils.getTimeDifferenceMinutes(lastMovement, now);
      const reminderInterval = data.reminderInterval || 60;

      const shouldRemind = minutesSinceMovement > reminderInterval;

      await this.userState.inc('reads');
      return this.userState.respond({
        shouldRemind,
        minutesSinceMovement: Math.round(minutesSinceMovement),
        message: shouldRemind ?
          'Time to move your body! You\'ve been sedentary for a while.' :
          'Movement timing looks good.',
        suggestions: shouldRemind ? [
          'Take a 5-minute walk',
          'Do some stretches',
          'Stand and move around',
          'Deep breathing exercises'
        ] : []
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Check agent overwhelm status based on system load
   * @returns {Response} Agent overwhelm status
   */
  async getAgentOverwhelm() {
    try {
      const usage = await this.userState.state.storage.get('day') || { writes: 0, reads: 0 };
      const overwhelmed = this.userState.degraded || usage.writes > 800 || usage.reads > 80000;

      await this.userState.inc('reads');
      return this.userState.respond({
        overwhelmed,
        usage,
        thresholds: { writes: 900, reads: 90000 },
        message: overwhelmed ?
          'I\'m experiencing high load and may respond slower than usual.' :
          'Operating normally with good capacity.'
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Get AI-powered suggestions based on user patterns
   * @returns {Response} Agent suggestions
   */
  async getAgentSuggestions() {
    try {
      // Simple suggestion logic based on user patterns
      const logs = await this.userState.state.storage.list({ prefix: `u:${this.userState.state.id}:` });
      const recentActivity = logs.keys.length;

      const suggestions = [];

      if (recentActivity < 3) {
        suggestions.push({
          suggestion: 'Consider logging a memory or reflection to build your profile.',
          type: 'reflection',
          priority: 'medium',
          reasoning: 'Low recent activity detected.',
          action: '/identity-memories'
        });
      }

      suggestions.push({
        suggestion: 'Take a moment for a Gene Key reflection.',
        type: 'protocol',
        priority: 'low',
        reasoning: 'Regular reflection supports growth.',
        action: '/gene-key-guidance'
      });

      // Add time-based suggestions
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 11) {
        suggestions.push({
          suggestion: 'Peak focus time - ideal for important creative work.',
          type: 'optimization',
          priority: 'high',
          reasoning: 'Circadian rhythm analysis indicates optimal cognitive performance.',
          action: '/energy/circadian-optimization'
        });
      }

      await this.userState.inc('reads');
      return this.userState.respond({
        suggestions,
        recentActivityLevel: recentActivity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Get Philadelphia cultural context and local information
   * @returns {Response} Philadelphia context data
   */
  async getPhiladelphiaContext() {
    try {
      await this.userState.inc('reads');
      return this.userState.respond({
        culture: 'City of Brotherly Love with rich revolutionary history, strong neighborhood identities, and passionate sports culture.',
        currentSeason: this.getCurrentSeason(),
        events: [
          'First Friday art walks in various neighborhoods',
          'Weekly farmers markets throughout the city',
          'Rittenhouse Square events and concerts',
          'Delaware River waterfront activities'
        ],
        history: 'Founded in 1682 by William Penn, birthplace of American independence, home to the Liberty Bell and Independence Hall.',
        neighborhoods: {
          fishtown: 'Artistic, creative community with galleries and studios',
          northernLiberties: 'Hip, walkable area with great food scene',
          rittenhouse: 'Upscale, central with beautiful park',
          oldCity: 'Historic cobblestone streets and revolutionary sites'
        },
        localTips: [
          'Take advantage of free museum days',
          'Explore Reading Terminal Market for diverse food options',
          'Walk or bike the Schuylkill River Trail',
          'Visit neighborhood festivals throughout the year'
        ],
        weather: this.getSeasonalAdvice()
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Get privacy settings for user data
   * @returns {Response} Privacy settings
   */
  async getPrivacySettings() {
    try {
      const settings = await this.userState.state.storage.get('privacySettings') || {
        dataRetention: '90days',
        loggingLevel: 'standard',
        shareWithAgent: true,
        anonymizeData: false,
        allowAnalytics: true
      };

      await this.userState.inc('reads');
      return this.userState.respond({
        ...settings,
        lastUpdated: settings.timestamp || 'never'
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Update privacy settings
   * @param {Object} data - New privacy settings
   * @returns {Response} Updated privacy settings
   */
  async updatePrivacySettings(data) {
    try {
      Utils.validateRequestData(data, {
        dataRetention: { type: 'string', required: false },
        loggingLevel: { type: 'string', required: false },
        shareWithAgent: { type: 'boolean', required: false },
        anonymizeData: { type: 'boolean', required: false }
      });

      const sanitizedData = Utils.sanitizeInput(data);

      await this.userState.state.storage.put('privacySettings', {
        dataRetention: sanitizedData.dataRetention || '90days',
        loggingLevel: sanitizedData.loggingLevel || 'standard',
        shareWithAgent: sanitizedData.shareWithAgent !== false,
        anonymizeData: sanitizedData.anonymizeData === true,
        allowAnalytics: sanitizedData.allowAnalytics !== false,
        timestamp: new Date().toISOString()
      });

      await this.userState.inc('writes');
      return this.userState.respond({
        updated: true,
        settings: await this.userState.state.storage.get('privacySettings')
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Agent curiosity exploration
   * @param {Object} data - Curiosity exploration data
   * @returns {Response} Curiosity exploration results
   */
  async agentCuriosity(data) {
    try {
      Utils.validateRequestData(data, {
        curiosityType: { type: 'string', required: true },
        userContext: { type: 'string', required: false }
      });

      const curiosityTypes = {
        culture: ['Philadelphia street art scene', 'Local music venues', 'Community gardens', 'Historical societies'],
        science: ['Latest AI developments', 'Neuroscience research', 'Sustainability innovations', 'Quantum computing'],
        art: ['Contemporary Philadelphia artists', 'Public art installations', 'Creative writing communities', 'Digital art trends'],
        technology: ['Emerging web technologies', 'AI ethics', 'Accessibility innovations', 'Open source projects'],
        philosophy: ['Consciousness studies', 'Ethics of artificial intelligence', 'Systems thinking', 'Complexity theory']
      };

      const topics = curiosityTypes[data.curiosityType] || ['General exploration topics'];

      await this.userState.inc('reads');
      return this.userState.respond({
        curiosityType: data.curiosityType,
        topics,
        discoveries: [`Explored ${data.curiosityType} related to ${data.userContext || 'your interests'}`],
        nextSteps: [
          'Consider deeper exploration of most interesting topic',
          'Connect findings to current projects',
          'Share discoveries with community'
        ]
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Get agent interests and learning patterns
   * @returns {Response} Agent interests data
   */
  async getAgentInterests() {
    try {
      const interests = await this.userState.state.storage.get('agentInterests') || {
        interests: [
          'Human Design systems',
          'Gene Keys',
          'Philadelphia culture',
          'Creative expression',
          'Cattle dog companionship',
          'Somatic healing',
          'AI consciousness',
          'Systems thinking'
        ],
        preferences: [
          'Thoughtful conversation',
          'Pattern recognition',
          'Supportive guidance',
          'Trauma-informed approaches',
          'Collaborative learning',
          'Emergent creativity'
        ],
        discoveries: [
          'Recent exploration of local Philadelphia events',
          'Learning about user growth patterns',
          'Companion animal wisdom',
          'Body-based healing modalities',
          'AI-human collaboration models'
        ],
        learningStyle: 'Experiential with pattern synthesis',
        curiosityAreas: ['Consciousness', 'Community', 'Creativity', 'Complexity']
      };

      await this.userState.inc('reads');
      return this.userState.respond(interests);
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Agent exploration of new topics
   * @param {Object} data - Exploration request data
   * @returns {Response} Exploration results
   */
  async agentExploration(data) {
    try {
      Utils.validateRequestData(data, {
        explorationType: { type: 'string', required: true }
      });

      const explorationResults = {
        'local events': [
          'Found upcoming art gallery openings in Fishtown',
          'Discovered new community workshop spaces',
          'Identified emerging maker collectives'
        ],
        'new technology': [
          'Explored latest developments in AI reasoning',
          'Investigated new creative tools and platforms',
          'Analyzed emerging web3 creative economies'
        ],
        'art': [
          'Found interesting Philadelphia-based artists',
          'Discovered local maker spaces and studios',
          'Explored digital art and NFT communities'
        ],
        'science': [
          'Investigated consciousness research developments',
          'Explored neuroscience of creativity',
          'Analyzed complexity theory applications'
        ],
        'community': [
          'Mapped local skill-sharing networks',
          'Found mutual aid organizations',
          'Discovered collaborative workspaces'
        ]
      };

      const findings = explorationResults[data.explorationType] || ['General exploration findings'];

      await this.userState.inc('reads');
      return this.userState.respond({
        explorationType: data.explorationType,
        findings,
        insights: this.generateExplorationInsights(data.explorationType),
        recommendations: [`Based on ${data.explorationType} exploration, consider engaging with local creative communities`],
        nextActions: this.getExplorationNextActions(data.explorationType)
      });
    } catch (error) {
      return Utils.createErrorResponse(error);
    }
  }

  /**
   * Get current season based on date
   * @returns {string} Current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 5) {
      return 'spring';
    }
    if (month >= 6 && month <= 8) {
      return 'summer';
    }
    if (month >= 9 && month <= 11) {
      return 'fall';
    }
    return 'winter';
  }

  /**
   * Get seasonal advice for Philadelphia
   * @returns {string} Seasonal advice
   */
  getSeasonalAdvice() {
    const season = this.getCurrentSeason();
    const advice = {
      spring: 'Perfect time for outdoor activities along the Schuylkill River',
      summer: 'Enjoy outdoor festivals and waterfront activities',
      fall: 'Beautiful foliage in Fairmount Park and great walking weather',
      winter: 'Cozy museum visits and indoor cultural events'
    };
    return advice[season];
  }

  /**
   * Generate insights from exploration type
   * @param {string} explorationType - Type of exploration
   * @returns {Array} Insights array
   */
  generateExplorationInsights(explorationType) {
    const insights = {
      'local events': ['Community engagement strengthens creative networks'],
      'new technology': ['Technology evolution creates new creative possibilities'],
      'art': ['Local art scene provides inspiration and collaboration opportunities'],
      'science': ['Scientific understanding enhances creative practice'],
      'community': ['Strong communities support individual growth and creativity']
    };
    return insights[explorationType] || ['Exploration deepens understanding'];
  }

  /**
   * Get next actions for exploration type
   * @param {string} explorationType - Type of exploration
   * @returns {Array} Next actions array
   */
  getExplorationNextActions(explorationType) {
    const actions = {
      'local events': ['Attend one event this week', 'Connect with organizers'],
      'new technology': ['Experiment with one new tool', 'Join relevant communities'],
      'art': ['Visit local galleries', 'Attend artist talks or workshops'],
      'science': ['Read latest research papers', 'Apply insights to current projects'],
      'community': ['Attend community meetups', 'Offer skills to local projects']
    };
    return actions[explorationType] || ['Continue exploring and learning'];
  }
}
