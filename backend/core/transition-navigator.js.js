/**
 * Transition Navigator - Advanced consciousness work for navigating life transitions
 * Part of ARK 2.0's metabolizing system for transforming change into growth and evolution
 */

import { AquilDatabase } from "./utils/database.js";
import { AquilAI } from "./utils/ai-helpers.js";

export class TransitionNavigator {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async navigate(data) {
    // Validate required fields
    if (!data || (!data.transition_type && !data.current_transition && !data.life_change_description)) {
      throw new Error("transition_type, current_transition, or life_change_description required");
    }

    try {
      const transitionAnalysis = await this.analyzeTransition(data);
      const navigationMap = await this.createNavigationMap(transitionAnalysis);
      const supportStrategies = await this.generateSupportStrategies(navigationMap);
      const transitionPractices = await this.createTransitionPractices(supportStrategies);
      const metamorphicGuidance = await this.generateMetamorphicGuidance(transitionAnalysis);

      // Save transition session to database
      const sessionData = {
        transition_analysis: transitionAnalysis,
        navigation_map: navigationMap,
        support_strategies: supportStrategies,
        session_type: "transition-navigation",
        insights: {
          transition_stage: transitionAnalysis.stage,
          navigation_pathways: navigationMap.pathways,
          metamorphic_opportunities: metamorphicGuidance,
        },
        transition_practices: transitionPractices,
        transformation_markers: this.identifyTransformationMarkers(transitionAnalysis),
      };

      await this.db.saveTransitionSession(sessionData);

      return {
        message: this.generatePersonalizedMessage(transitionAnalysis, metamorphicGuidance),
        transition_analysis: transitionAnalysis,
        navigation_map: navigationMap,
        support_strategies: supportStrategies,
        transition_practices: transitionPractices,
        metamorphic_guidance: metamorphicGuidance,
        consciousness_insights: this.generateConsciousnessInsights(transitionAnalysis),
        somatic_navigation: this.generateSomaticNavigation(transitionAnalysis),
        identity_evolution: this.mapIdentityEvolution(transitionAnalysis),
        next_navigation_steps: this.suggestNextNavigationSteps(supportStrategies),
        standing_tall_connection: this.connectToStandingTall(metamorphicGuidance),
      };
    } catch (error) {
      console.error("Transition navigation error:", error);
      throw error;
    }
  }

  async analyzeTransition(data) {
    const { transition_type, current_transition, life_change_description, transition_timeline, emotional_state } = data;
    
    // Deep analysis of the transition process and stage
    const transitionType = await this.identifyTransitionType(transition_type, current_transition, life_change_description);
    const transitionStage = await this.assessTransitionStage(data);
    const emotionalLandscape = await this.mapEmotionalLandscape(emotional_state, data);
    const resistancePatterns = await this.identifyResistancePatterns(data);
    const growthOpportunities = await this.identifyGrowthOpportunities(transitionType, data);

    return {
      transition_type: transitionType,
      stage: transitionStage,
      emotional_landscape: emotionalLandscape,
      resistance_patterns: resistancePatterns,
      growth_opportunities: growthOpportunities,
      timeline: transition_timeline,
      complexity_level: this.assessComplexityLevel(data),
      support_needs: this.assessSupportNeeds(emotionalLandscape, resistancePatterns),
      metamorphic_potential: this.assessMetamorphicPotential(transitionType, transitionStage),
    };
  }

  async identifyTransitionType(transitionType, currentTransition, description) {
    const transitionTypes = {
      'career_transition': ['job', 'career', 'work', 'profession', 'employment'],
      'relationship_transition': ['relationship', 'marriage', 'divorce', 'breakup', 'partner'],
      'life_stage_transition': ['age', 'midlife', 'retirement', 'empty nest', 'aging'],
      'health_transition': ['health', 'illness', 'recovery', 'diagnosis', 'medical'],
      'spiritual_transition': ['spiritual', 'awakening', 'faith', 'beliefs', 'meaning'],
      'identity_transition': ['identity', 'who am I', 'self', 'purpose', 'calling'],
      'loss_transition': ['death', 'grief', 'loss', 'mourning', 'bereavement'],
      'creative_transition': ['creative', 'artistic', 'expression', 'creativity', 'art'],
      'financial_transition': ['money', 'financial', 'wealth', 'poverty', 'abundance'],
      'location_transition': ['move', 'relocate', 'home', 'place', 'geography'],
    };

    const text = `${transitionType} ${currentTransition} ${description}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(transitionTypes)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return {
          primary_type: type,
          confidence: 0.8,
          indicators: keywords.filter(keyword => text.includes(keyword)),
          description: this.getTransitionDescription(type),
        };
      }
    }

    return {
      primary_type: 'general_life_transition',
      confidence: 0.5,
      indicators: ['life_change_detected'],
      description: 'A significant life change requiring navigation and support',
    };
  }

  async assessTransitionStage(data) {
    const { transition_timeline, current_feelings, decision_status, action_taken } = data;
    
    // Identify which stage of transition the person is in
    const stages = {
      'pre_transition': 'Sensing change is needed but not yet committed',
      'initiation': 'Beginning to take action and make changes',
      'chaos': 'In the midst of uncertainty and upheaval',
      'integration': 'Finding new patterns and stability',
      'completion': 'Fully established in the new reality',
    };

    // Simple stage assessment based on indicators
    if (current_feelings && current_feelings.includes('uncertain')) return 'pre_transition';
    if (action_taken === 'just_started') return 'initiation';
    if (current_feelings && current_feelings.includes('overwhelmed')) return 'chaos';
    if (current_feelings && current_feelings.includes('settling')) return 'integration';
    if (current_feelings && current_feelings.includes('stable')) return 'completion';

    return 'chaos'; // Default to chaos as most people seek help during this stage
  }

  async mapEmotionalLandscape(emotionalState, data) {
    const { fears, hopes, grief_elements, excitement_areas } = data;
    
    return {
      primary_emotions: this.identifyPrimaryEmotions(emotionalState),
      fear_patterns: this.analyzeFearPatterns(fears),
      hope_elements: this.analyzeHopeElements(hopes),
      grief_process: this.assessGriefProcess(grief_elements),
      excitement_indicators: this.identifyExcitementIndicators(excitement_areas),
      emotional_complexity: this.assessEmotionalComplexity(emotionalState),
      support_emotions: this.identifySupportEmotions(data),
    };
  }

  async identifyResistancePatterns(data) {
    const { resistance_areas, comfort_zone_attachments, change_fears } = data;
    
    return {
      resistance_types: this.identifyResistanceTypes(resistance_areas),
      comfort_zone_patterns: this.analyzeComfortZonePatterns(comfort_zone_attachments),
      change_fears: this.analyzeChangeFears(change_fears),
      unconscious_resistance: this.identifyUnconsciousResistance(data),
      resistance_gifts: this.identifyResistanceGifts(resistance_areas),
    };
  }

  async createNavigationMap(transitionAnalysis) {
    const { stage, transition_type, emotional_landscape } = transitionAnalysis;
    
    const pathways = {
      emotional_pathways: this.createEmotionalPathways(emotional_landscape),
      practical_pathways: this.createPracticalPathways(transition_type, stage),
      spiritual_pathways: this.createSpiritualPathways(transitionAnalysis),
      somatic_pathways: this.createSomaticPathways(transitionAnalysis),
      community_pathways: this.createCommunityPathways(transitionAnalysis),
    };

    return {
      pathways,
      primary_pathway: this.selectPrimaryPathway(pathways, stage),
      supporting_pathways: this.selectSupportingPathways(pathways, stage),
      navigation_sequence: this.createNavigationSequence(pathways, stage),
      milestone_markers: this.createMilestoneMarkers(transitionAnalysis),
    };
  }

  async generateSupportStrategies(navigationMap) {
    const { pathways, primary_pathway, milestone_markers } = navigationMap;
    
    return {
      immediate_support: this.createImmediateSupport(primary_pathway),
      daily_navigation: this.createDailyNavigation(pathways),
      weekly_practices: this.createWeeklyPractices(navigationMap),
      milestone_celebrations: this.createMilestoneCelebrations(milestone_markers),
      crisis_support: this.createCrisisSupport(navigationMap),
      integration_support: this.createIntegrationSupport(pathways),
    };
  }

  async createTransitionPractices(strategies) {
    return {
      morning_orientation: {
        title: 'Morning Transition Orientation',
        description: 'Start each day with clarity and intention during transition',
        practices: [
          'Check in with your emotional state',
          'Set intention for navigating the day',
          'Connect with your transition purpose',
          'Ground yourself in what remains stable',
        ],
        duration: '10-15 minutes',
      },
      uncertainty_alchemy: {
        title: 'Uncertainty Alchemy Practice',
        description: 'Transform uncertainty into curiosity and possibility',
        practices: [
          'Notice uncertainty without trying to fix it',
          'Breathe into the unknown with curiosity',
          'Ask: "What wants to emerge through this uncertainty?"',
          'Take one small step forward despite not knowing',
        ],
        duration: '10 minutes as needed',
      },
      transition_integration: {
        title: 'Transition Integration Ritual',
        description: 'Weekly practice to integrate transition experiences',
        practices: [
          'Reflect on the week\'s transition experiences',
          'Honor what you\'re leaving behind',
          'Welcome what is emerging',
          'Celebrate your courage in navigating change',
        ],
        duration: '20-30 minutes weekly',
      },
    };
  }

  async generateMetamorphicGuidance(transitionAnalysis) {
    const { transition_type, stage, metamorphic_potential } = transitionAnalysis;
    
    return {
      metamorphic_opportunity: this.identifyMetamorphicOpportunity(transition_type),
      transformation_catalyst: this.identifyTransformationCatalyst(transitionAnalysis),
      identity_evolution: this.mapIdentityEvolution(transitionAnalysis),
      consciousness_expansion: this.identifyConsciousnessExpansion(transitionAnalysis),
      metamorphic_practices: this.createMetamorphicPractices(transitionAnalysis),
    };
  }

  // Helper methods for transition navigation
  getTransitionDescription(type) {
    const descriptions = {
      'career_transition': 'A shift in professional path, work identity, or career direction',
      'relationship_transition': 'Changes in intimate relationships, family dynamics, or social connections',
      'life_stage_transition': 'Moving between major life phases and developmental stages',
      'health_transition': 'Navigating health challenges, recovery, or wellness transformations',
      'spiritual_transition': 'Evolution in spiritual beliefs, practices, or consciousness',
      'identity_transition': 'Fundamental shifts in self-concept, purpose, or life direction',
      'loss_transition': 'Processing grief, loss, and the reorganization that follows',
      'creative_transition': 'Changes in creative expression, artistic identity, or creative work',
      'financial_transition': 'Shifts in financial circumstances, money relationship, or abundance',
      'location_transition': 'Physical relocation and the identity shifts that accompany it',
    };
    
    return descriptions[type] || 'A significant life change requiring navigation and support';
  }

  assessComplexityLevel(data) {
    const { multiple_transitions, support_system, previous_transition_experience } = data;
    
    let complexity = 0.5; // baseline
    
    if (multiple_transitions === 'yes') complexity += 0.3;
    if (support_system === 'weak') complexity += 0.2;
    if (previous_transition_experience === 'none') complexity += 0.2;
    
    return Math.min(complexity, 1.0);
  }

  assessSupportNeeds(emotionalLandscape, resistancePatterns) {
    return {
      emotional_support: emotionalLandscape.emotional_complexity > 0.7 ? 'high' : 'moderate',
      practical_support: resistancePatterns.resistance_types.length > 2 ? 'high' : 'moderate',
      spiritual_support: 'moderate',
      community_support: 'high',
    };
  }

  assessMetamorphicPotential(transitionType, stage) {
    // Assess the potential for deep transformation
    const highPotentialTypes = ['identity_transition', 'spiritual_transition', 'loss_transition'];
    const highPotentialStages = ['chaos', 'integration'];
    
    let potential = 0.5;
    
    if (highPotentialTypes.includes(transitionType.primary_type)) potential += 0.3;
    if (highPotentialStages.includes(stage)) potential += 0.2;
    
    return Math.min(potential, 1.0);
  }

  generatePersonalizedMessage(transitionAnalysis, metamorphicGuidance) {
    const { stage, transition_type } = transitionAnalysis;
    const { metamorphic_opportunity } = metamorphicGuidance;
    
    const stageMessages = {
      'pre_transition': `You're sensing the call for change in your ${transition_type.primary_type.replace('_', ' ')}. This is sacred ground - the space between what was and what could be.`,
      'initiation': `You've courageously begun your ${transition_type.primary_type.replace('_', ' ')} journey. Each step forward is an act of faith in your evolution.`,
      'chaos': `You're in the fertile chaos of transformation. This uncertainty in your ${transition_type.primary_type.replace('_', ' ')} is where new possibilities are born.`,
      'integration': `You're beautifully integrating your ${transition_type.primary_type.replace('_', ' ')} transformation. New patterns of being are taking root.`,
      'completion': `You've successfully navigated your ${transition_type.primary_type.replace('_', ' ')} transition. You are not the same person who began this journey.`,
    };
    
    return stageMessages[stage] || `Your transition journey is a powerful opportunity for growth and transformation.`;
  }

  generateConsciousnessInsights(transitionAnalysis) {
    return {
      transition_consciousness_level: this.assessTransitionConsciousness(transitionAnalysis),
      identity_evolution: 'Transitions are portals for identity expansion and consciousness evolution',
      metamorphic_awareness: 'Change is the universe\'s way of supporting your becoming',
      transition_wisdom: this.extractTransitionWisdom(transitionAnalysis),
      consciousness_expansion: this.identifyConsciousnessExpansion(transitionAnalysis),
    };
  }

  generateSomaticNavigation(transitionAnalysis) {
    return {
      body_awareness: 'Notice how transition feels in your body - tension, expansion, contraction',
      somatic_practices: this.generateSomaticPractices(transitionAnalysis),
      embodied_navigation: 'Use body wisdom to navigate transition choices',
      energetic_support: 'Support your nervous system through transition stress',
      somatic_integration: 'Integrate transition changes through body awareness',
    };
  }

  suggestNextNavigationSteps(strategies) {
    return [
      'Choose one immediate support strategy and implement today',
      'Establish daily transition navigation practices',
      'Identify your primary support needs and seek appropriate help',
      'Honor both what you\'re leaving behind and what\'s emerging',
      'Connect with others who have navigated similar transitions',
    ];
  }

  connectToStandingTall(metamorphicGuidance) {
    return {
      standing_tall_connection: 'Stand tall in the courage it takes to navigate life transitions',
      transition_presence: 'Feel your strength and resilience as embodied presence',
      metamorphic_stance: 'Stand tall in the truth of your ongoing transformation',
      evolutionary_posture: 'Let your transition courage lift you into powerful presence',
    };
  }

  // Additional helper methods (simplified implementations)
  identifyPrimaryEmotions(state) { return state ? [state] : ['mixed']; }
  analyzeFearPatterns(fears) { return fears || []; }
  analyzeHopeElements(hopes) { return hopes || []; }
  assessGriefProcess(grief) { return grief || 'not_applicable'; }
  identifyExcitementIndicators(excitement) { return excitement || []; }
  assessEmotionalComplexity(state) { return state ? 0.7 : 0.5; }
  identifySupportEmotions(data) { return ['courage', 'hope', 'resilience']; }
  identifyResistanceTypes(areas) { return areas || []; }
  analyzeComfortZonePatterns(attachments) { return attachments || []; }
  analyzeChangeFears(fears) { return fears || []; }
  identifyUnconsciousResistance(data) { return []; }
  identifyResistanceGifts(areas) { return ['protection', 'wisdom', 'discernment']; }
  identifyGrowthOpportunities(type, data) { return ['identity_expansion', 'consciousness_evolution']; }
  createEmotionalPathways(landscape) { return ['emotional_support', 'feeling_processing']; }
  createPracticalPathways(type, stage) { return ['practical_steps', 'resource_gathering']; }
  createSpiritualPathways(analysis) { return ['meaning_making', 'spiritual_support']; }
  createSomaticPathways(analysis) { return ['body_awareness', 'nervous_system_support']; }
  createCommunityPathways(analysis) { return ['peer_support', 'professional_guidance']; }
  selectPrimaryPathway(pathways, stage) { return pathways.emotional_pathways; }
  selectSupportingPathways(pathways, stage) { return [pathways.practical_pathways]; }
  createNavigationSequence(pathways, stage) { return ['emotional', 'practical', 'spiritual']; }
  createMilestoneMarkers(analysis) { return ['decision_made', 'action_taken', 'integration_begun']; }
  createImmediateSupport(pathway) { return ['emotional_check_in', 'grounding_practice']; }
  createDailyNavigation(pathways) { return ['morning_intention', 'evening_reflection']; }
  createWeeklyPractices(map) { return ['transition_review', 'support_connection']; }
  createMilestoneCelebrations(markers) { return markers.map(m => `Celebrate ${m}`); }
  createCrisisSupport(map) { return ['emergency_grounding', 'crisis_resources']; }
  createIntegrationSupport(pathways) { return ['integration_practices', 'new_identity_support']; }
  identifyMetamorphicOpportunity(type) { return `${type.primary_type} as catalyst for consciousness evolution`; }
  identifyTransformationCatalyst(analysis) { return 'Uncertainty as transformation catalyst'; }
  mapIdentityEvolution(analysis) { return 'Identity expanding through transition navigation'; }
  identifyConsciousnessExpansion(analysis) { return 'Consciousness expanding through change navigation'; }
  createMetamorphicPractices(analysis) { return ['metamorphic_meditation', 'transformation_ritual']; }
  assessTransitionConsciousness(analysis) { return 'developing'; }
  extractTransitionWisdom(analysis) { return 'Every transition is a death and rebirth'; }
  generateSomaticPractices(analysis) { return ['transition_breathing', 'grounding_practices']; }
  identifyTransformationMarkers(analysis) { return ['transition_awareness', 'navigation_skills']; }
}
