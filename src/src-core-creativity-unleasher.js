/**
 * Creativity Unleasher - Advanced consciousness work for breaking through creative blocks
 * Part of ARK 2.0's metabolizing system for transforming creative resistance into flow
 */

import { AquilDatabase } from "./utils/database.js";
import { AquilAI } from "./utils/ai-helpers.js";

export class CreativityUnleasher {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async unleash(data) {
    // Validate required fields
    if (!data || (!data.creative_challenge && !data.block_description && !data.creative_goal)) {
      throw new Error("creative_challenge, block_description, or creative_goal required");
    }

    try {
      const blockAnalysis = await this.analyzeCreativeBlock(data);
      const flowPathways = await this.identifyFlowPathways(blockAnalysis);
      const unleasherStrategies = await this.generateUnleasherStrategies(blockAnalysis, flowPathways);
      const creativePractices = await this.createCreativePractices(unleasherStrategies);
      const energyActivation = await this.activateCreativeEnergy(blockAnalysis);

      // Save creativity session to database
      const sessionData = {
        block_analysis: blockAnalysis,
        flow_pathways: flowPathways,
        unleash_strategies: unleasherStrategies,
        session_type: "creativity-unleashing",
        insights: {
          block_patterns: blockAnalysis.patterns,
          flow_activators: flowPathways.activators,
          energy_shifts: energyActivation,
        },
        creative_practices: creativePractices,
        transformation_markers: this.identifyTransformationMarkers(blockAnalysis),
      };

      await this.db.saveCreativitySession(sessionData);

      return {
        message: this.generatePersonalizedMessage(blockAnalysis, energyActivation),
        creative_block_analysis: blockAnalysis,
        flow_pathways: flowPathways,
        unleashing_strategies: unleasherStrategies,
        creative_practices: creativePractices,
        energy_activation: energyActivation,
        consciousness_insights: this.generateConsciousnessInsights(blockAnalysis),
        metamorphic_opportunities: this.identifyMetamorphicOpportunities(blockAnalysis),
        somatic_unlocking: this.generateSomaticUnlocking(blockAnalysis),
        next_creative_steps: this.suggestNextCreativeSteps(unleasherStrategies),
        standing_tall_connection: this.connectToStandingTall(energyActivation),
      };
    } catch (error) {
      console.error("Creativity unleashing error:", error);
      throw error;
    }
  }

  async analyzeCreativeBlock(data) {
    const { creative_challenge, block_description, creative_goal, past_creative_experiences } = data;
    
    // Analyze the nature and source of the creative block
    const blockType = await this.identifyBlockType(block_description, creative_challenge);
    const blockSources = await this.identifyBlockSources(data);
    const creativePatterns = await this.analyzeCreativePatterns(past_creative_experiences);
    const resistanceMapping = await this.mapResistancePatterns(block_description);

    return {
      block_type: blockType,
      block_sources: blockSources,
      creative_patterns: creativePatterns,
      resistance_mapping: resistanceMapping,
      creative_goal: creative_goal,
      block_intensity: this.assessBlockIntensity(block_description),
      patterns: this.identifyRecurringPatterns(blockSources, creativePatterns),
      underlying_fears: this.extractUnderlyingFears(block_description),
      creative_identity_conflicts: this.identifyIdentityConflicts(data),
    };
  }

  async identifyBlockType(blockDescription, creativeChallenge) {
    const blockTypes = {
      'perfectionism': ['perfect', 'not good enough', 'standards', 'criticism', 'judgment'],
      'fear_of_failure': ['fail', 'wrong', 'mistake', 'embarrass', 'reject'],
      'overwhelm': ['too much', 'overwhelm', 'complex', 'don\'t know where', 'scattered'],
      'comparison': ['others', 'better', 'compare', 'not as good', 'everyone else'],
      'resource_scarcity': ['time', 'money', 'space', 'materials', 'support'],
      'identity_confusion': ['not creative', 'who am I', 'imposter', 'don\'t belong'],
      'energy_depletion': ['tired', 'drained', 'no energy', 'exhausted', 'burnt out'],
      'external_pressure': ['should', 'expect', 'pressure', 'deadline', 'others want'],
    };

    const text = `${blockDescription} ${creativeChallenge}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(blockTypes)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return {
          primary_type: type,
          confidence: 0.8,
          indicators: keywords.filter(keyword => text.includes(keyword)),
        };
      }
    }

    return {
      primary_type: 'general_resistance',
      confidence: 0.5,
      indicators: ['creative_resistance_detected'],
    };
  }

  async identifyBlockSources(data) {
    const { creative_history, current_life_situation, creative_environment } = data;
    
    return {
      internal_sources: this.identifyInternalSources(data),
      external_sources: this.identifyExternalSources(data),
      historical_sources: this.identifyHistoricalSources(creative_history),
      environmental_sources: this.identifyEnvironmentalSources(creative_environment),
      somatic_sources: this.identifySomaticSources(data),
    };
  }

  identifyInternalSources(data) {
    const { self_talk, creative_beliefs, past_creative_trauma } = data;
    
    return {
      limiting_beliefs: this.extractLimitingBeliefs(creative_beliefs),
      negative_self_talk: this.analyzeSelfTalk(self_talk),
      unprocessed_trauma: this.identifyCreativeTrauma(past_creative_trauma),
      perfectionism_patterns: this.assessPerfectionismPatterns(data),
      fear_patterns: this.identifyFearPatterns(data),
    };
  }

  identifyExternalSources(data) {
    const { social_environment, work_environment, family_dynamics } = data;
    
    return {
      social_pressure: this.analyzeSocialPressure(social_environment),
      work_constraints: this.analyzeWorkConstraints(work_environment),
      family_dynamics: this.analyzeFamilyDynamics(family_dynamics),
      cultural_conditioning: this.identifyCulturalConditioning(data),
      resource_limitations: this.assessResourceLimitations(data),
    };
  }

  async identifyFlowPathways(blockAnalysis) {
    const { block_type, block_sources } = blockAnalysis;
    
    // Generate specific pathways to flow based on block analysis
    const pathways = {
      somatic_pathways: this.generateSomaticPathways(blockAnalysis),
      cognitive_pathways: this.generateCognitivePathways(blockAnalysis),
      energetic_pathways: this.generateEnergeticPathways(blockAnalysis),
      environmental_pathways: this.generateEnvironmentalPathways(blockAnalysis),
      ritual_pathways: this.generateRitualPathways(blockAnalysis),
    };

    return {
      primary_pathway: this.selectPrimaryPathway(pathways, block_type),
      supporting_pathways: this.selectSupportingPathways(pathways, block_type),
      activators: this.identifyFlowActivators(blockAnalysis),
      flow_triggers: this.identifyFlowTriggers(blockAnalysis),
      pathway_sequence: this.createPathwaySequence(pathways),
    };
  }

  generateSomaticPathways(blockAnalysis) {
    const { block_type } = blockAnalysis;
    
    const somaticApproaches = {
      'perfectionism': ['Release tension in shoulders and jaw', 'Practice imperfect movement', 'Breathe into creative courage'],
      'fear_of_failure': ['Ground through feet', 'Expand chest and heart space', 'Practice brave body postures'],
      'overwhelm': ['Slow, deep breathing', 'Progressive muscle relaxation', 'Focus on one body sensation'],
      'comparison': ['Feel your unique creative essence', 'Practice self-compassion touch', 'Embody your authentic expression'],
      'energy_depletion': ['Gentle movement to activate', 'Restorative breathing', 'Energy cultivation practices'],
    };

    return somaticApproaches[block_type.primary_type] || ['Connect with body wisdom', 'Breathe into creative space', 'Feel creative energy in body'];
  }

  generateCognitivePathways(blockAnalysis) {
    const { block_type, underlying_fears } = blockAnalysis;
    
    return {
      reframing_practices: this.createReframingPractices(block_type),
      fear_inquiry: this.createFearInquiry(underlying_fears),
      creative_affirmations: this.generateCreativeAffirmations(blockAnalysis),
      perspective_shifts: this.createPerspectiveShifts(blockAnalysis),
      limiting_belief_work: this.createLimitingBeliefWork(blockAnalysis),
    };
  }

  generateEnergeticPathways(blockAnalysis) {
    return {
      energy_clearing: 'Clear stagnant creative energy through movement or sound',
      energy_activation: 'Activate creative fire through inspiration and passion',
      energy_circulation: 'Circulate creative energy through the body and being',
      energy_protection: 'Protect creative energy from external drains',
      energy_amplification: 'Amplify creative energy through connection and community',
    };
  }

  async generateUnleasherStrategies(blockAnalysis, flowPathways) {
    const { block_type, block_intensity } = blockAnalysis;
    const { primary_pathway, activators } = flowPathways;

    return {
      immediate_strategies: this.createImmediateStrategies(block_type, block_intensity),
      daily_practices: this.createDailyCreativePractices(primary_pathway),
      weekly_intensives: this.createWeeklyIntensives(blockAnalysis),
      breakthrough_techniques: this.createBreakthroughTechniques(blockAnalysis),
      flow_maintenance: this.createFlowMaintenance(activators),
      resistance_transformation: this.createResistanceTransformation(blockAnalysis),
    };
  }

  createImmediateStrategies(blockType, intensity) {
    const strategies = {
      'perfectionism': [
        'Set a timer for 10 minutes and create something intentionally imperfect',
        'Practice the "good enough" mantra',
        'Share something unfinished with a trusted friend',
      ],
      'fear_of_failure': [
        'Reframe failure as learning and growth',
        'Take one small creative risk today',
        'Celebrate attempts rather than outcomes',
      ],
      'overwhelm': [
        'Break the creative goal into the smallest possible step',
        'Focus on process, not product',
        'Create for 5 minutes without any agenda',
      ],
      'comparison': [
        'Unfollow accounts that trigger comparison',
        'Focus on your unique creative voice',
        'Practice gratitude for your creative journey',
      ],
    };

    const baseStrategies = strategies[blockType.primary_type] || [
      'Take one small creative action right now',
      'Connect with your creative why',
      'Practice self-compassion for the creative struggle',
    ];

    // Adjust intensity based on block severity
    if (intensity > 0.7) {
      baseStrategies.unshift('Start with the gentlest possible creative action');
    }

    return baseStrategies;
  }

  async createCreativePractices(strategies) {
    return {
      morning_activation: {
        title: 'Creative Morning Activation',
        description: 'Start each day by connecting with creative energy',
        practices: [
          'Write three pages of stream-of-consciousness',
          'Do 5 minutes of creative movement or dance',
          'Set a creative intention for the day',
        ],
        duration: '15-20 minutes',
      },
      resistance_alchemy: {
        title: 'Resistance Alchemy Practice',
        description: 'Transform creative resistance into creative fuel',
        practices: [
          'Name the resistance without judgment',
          'Feel where it lives in your body',
          'Breathe creative courage into that space',
          'Take one small action despite the resistance',
        ],
        duration: '10 minutes',
      },
      flow_cultivation: {
        title: 'Creative Flow Cultivation',
        description: 'Practices to enter and maintain creative flow',
        practices: [
          'Create a consistent creative ritual',
          'Eliminate distractions and create sacred space',
          'Start with warm-up exercises',
          'Follow curiosity and creative impulses',
        ],
        duration: 'Ongoing',
      },
    };
  }

  async activateCreativeEnergy(blockAnalysis) {
    const { block_type, creative_patterns } = blockAnalysis;
    
    return {
      energy_assessment: this.assessCreativeEnergy(blockAnalysis),
      activation_techniques: this.generateActivationTechniques(block_type),
      energy_maintenance: this.createEnergyMaintenance(creative_patterns),
      creative_fire_ignition: this.igniteCreativeFire(blockAnalysis),
      sustainable_practices: this.createSustainablePractices(blockAnalysis),
    };
  }

  // Helper methods for creativity unleashing
  assessBlockIntensity(blockDescription) {
    if (!blockDescription) return 0.5;
    
    const intensityMarkers = ['completely stuck', 'can\'t', 'impossible', 'never', 'always', 'terrible', 'hopeless'];
    const text = blockDescription.toLowerCase();
    
    const markerCount = intensityMarkers.filter(marker => text.includes(marker)).length;
    return Math.min(markerCount / intensityMarkers.length + 0.3, 1.0);
  }

  identifyRecurringPatterns(blockSources, creativePatterns) {
    // Analyze patterns across different sources
    return {
      perfectionism_pattern: this.detectPerfectionismPattern(blockSources, creativePatterns),
      avoidance_pattern: this.detectAvoidancePattern(blockSources, creativePatterns),
      comparison_pattern: this.detectComparisonPattern(blockSources, creativePatterns),
      energy_pattern: this.detectEnergyPattern(blockSources, creativePatterns),
    };
  }

  extractUnderlyingFears(blockDescription) {
    if (!blockDescription) return [];
    
    const fearMarkers = {
      'fear_of_judgment': ['judge', 'criticism', 'what others think', 'embarrass'],
      'fear_of_failure': ['fail', 'wrong', 'mistake', 'not good enough'],
      'fear_of_success': ['too much', 'responsibility', 'change', 'visible'],
      'fear_of_authenticity': ['real self', 'vulnerable', 'exposed', 'true'],
    };

    const text = blockDescription.toLowerCase();
    const identifiedFears = [];

    for (const [fear, markers] of Object.entries(fearMarkers)) {
      if (markers.some(marker => text.includes(marker))) {
        identifiedFears.push(fear);
      }
    }

    return identifiedFears;
  }

  identifyIdentityConflicts(data) {
    const { creative_identity, professional_identity, family_role } = data;
    
    return {
      creative_vs_practical: this.assessIdentityConflict(creative_identity, professional_identity),
      creative_vs_family: this.assessIdentityConflict(creative_identity, family_role),
      authentic_vs_expected: this.assessAuthenticityConflict(data),
    };
  }

  generatePersonalizedMessage(blockAnalysis, energyActivation) {
    const { block_type, block_intensity } = blockAnalysis;
    const { energy_assessment } = energyActivation;
    
    if (block_intensity > 0.8) {
      return `Your creative spirit is calling for gentle awakening. The ${block_type.primary_type} you're experiencing is actually creative energy seeking expression. Let's transform this resistance into creative fuel.`;
    } else if (block_intensity > 0.5) {
      return `Your creativity is ready to flow through the ${block_type.primary_type} pattern. This is a powerful moment for creative breakthrough and authentic expression.`;
    } else {
      return `Your creative energy is stirring and ready for activation. The gentle resistance you feel is creativity asking for permission to emerge more fully.`;
    }
  }

  generateConsciousnessInsights(blockAnalysis) {
    return {
      creative_consciousness_level: this.assessCreativeConsciousness(blockAnalysis),
      identity_evolution: 'Creative blocks are invitations for identity expansion',
      consciousness_shifts: this.identifyConsciousnessShifts(blockAnalysis),
      creative_awakening: 'Resistance patterns revealing deeper creative truth',
      metamorphic_potential: this.assessMetamorphicPotential(blockAnalysis),
    };
  }

  identifyMetamorphicOpportunities(blockAnalysis) {
    const { block_type, patterns } = blockAnalysis;
    
    return {
      transformation_type: 'creative_metamorphosis',
      metamorphic_indicators: [
        'Creative resistance as transformation catalyst',
        'Identity expansion through creative expression',
        'Fear patterns dissolving into creative courage',
      ],
      evolution_opportunities: this.identifyEvolutionOpportunities(block_type),
      consciousness_expansion: 'Creative blocks as doorways to expanded self-expression',
    };
  }

  generateSomaticUnlocking(blockAnalysis) {
    const { block_type } = blockAnalysis;
    
    return {
      body_awareness: 'Notice where creative energy feels stuck in your body',
      somatic_practices: this.generateSomaticPractices(block_type),
      energy_movement: 'Use breath and movement to circulate creative energy',
      embodied_creativity: 'Feel creativity as aliveness in your body',
      somatic_integration: 'Integrate creative breakthroughs through body awareness',
    };
  }

  suggestNextCreativeSteps(strategies) {
    return [
      'Choose one immediate strategy and take action within 24 hours',
      'Establish a daily creative practice, even if just 5 minutes',
      'Identify and address the primary block source',
      'Connect with creative community or support',
      'Celebrate small creative wins and progress',
    ];
  }

  connectToStandingTall(energyActivation) {
    return {
      standing_tall_connection: 'Stand tall in your creative truth and authentic expression',
      creative_presence: 'Feel your creative power as strength and aliveness in your body',
      embodied_creativity: 'Let your creative energy lift you into confident presence',
      creative_courage: 'Stand tall in the courage to create and express authentically',
    };
  }

  // Additional helper methods would be implemented here...
  extractLimitingBeliefs(beliefs) { return beliefs || []; }
  analyzeSelfTalk(selfTalk) { return selfTalk || 'neutral'; }
  identifyCreativeTrauma(trauma) { return trauma || []; }
  assessPerfectionismPatterns(data) { return 'moderate'; }
  identifyFearPatterns(data) { return []; }
  analyzeSocialPressure(env) { return env || 'neutral'; }
  analyzeWorkConstraints(env) { return env || 'neutral'; }
  analyzeFamilyDynamics(dynamics) { return dynamics || 'neutral'; }
  identifyCulturalConditioning(data) { return []; }
  assessResourceLimitations(data) { return []; }
  analyzeCreativePatterns(experiences) { return experiences || []; }
  mapResistancePatterns(description) { return { primary: 'general', secondary: [] }; }
  identifyHistoricalSources(history) { return history || []; }
  identifyEnvironmentalSources(env) { return env || []; }
  identifySomaticSources(data) { return []; }
  selectPrimaryPathway(pathways, blockType) { return pathways.somatic_pathways; }
  selectSupportingPathways(pathways, blockType) { return [pathways.cognitive_pathways]; }
  identifyFlowActivators(analysis) { return ['curiosity', 'play', 'experimentation']; }
  identifyFlowTriggers(analysis) { return ['ritual', 'music', 'movement']; }
  createPathwaySequence(pathways) { return ['somatic', 'cognitive', 'energetic']; }
  createReframingPractices(blockType) { return ['Reframe resistance as creative energy']; }
  createFearInquiry(fears) { return fears.map(fear => `What would I create if I weren't afraid of ${fear}?`); }
  generateCreativeAffirmations(analysis) { return ['I am a creative being', 'My creativity flows freely']; }
  createPerspectiveShifts(analysis) { return ['Blocks are creative energy in disguise']; }
  createLimitingBeliefWork(analysis) { return ['Question limiting beliefs about creativity']; }
  createDailyCreativePractices(pathway) { return ['Morning pages', 'Creative movement']; }
  createWeeklyIntensives(analysis) { return ['Creative retreat time', 'Deep creative work']; }
  createBreakthroughTechniques(analysis) { return ['Stream of consciousness', 'Creative constraints']; }
  createFlowMaintenance(activators) { return activators.map(a => `Maintain ${a} in creative practice`); }
  createResistanceTransformation(analysis) { return ['Transform resistance into fuel']; }
  assessCreativeEnergy(analysis) { return 'moderate'; }
  generateActivationTechniques(blockType) { return ['Movement', 'Breath', 'Sound']; }
  createEnergyMaintenance(patterns) { return ['Regular creative practice']; }
  igniteCreativeFire(analysis) { return 'Connect with creative passion and purpose'; }
  createSustainablePractices(analysis) { return ['Gentle daily practice']; }
  detectPerfectionismPattern(sources, patterns) { return 'moderate'; }
  detectAvoidancePattern(sources, patterns) { return 'low'; }
  detectComparisonPattern(sources, patterns) { return 'moderate'; }
  detectEnergyPattern(sources, patterns) { return 'variable'; }
  assessIdentityConflict(id1, id2) { return 'moderate'; }
  assessAuthenticityConflict(data) { return 'low'; }
  assessCreativeConsciousness(analysis) { return 'developing'; }
  identifyConsciousnessShifts(analysis) { return ['From resistance to flow']; }
  assessMetamorphicPotential(analysis) { return 'high'; }
  identifyEvolutionOpportunities(blockType) { return ['Creative courage development']; }
  generateSomaticPractices(blockType) { return ['Breathwork', 'Movement', 'Body awareness']; }
  generateEnvironmentalPathways(analysis) { return ['Create inspiring space', 'Remove distractions', 'Add creative stimuli']; }
  generateRitualPathways(analysis) { return ['Creative rituals', 'Flow activation ceremonies', 'Inspiration practices']; }
  identifyTransformationMarkers(analysis) { return ['Creative block awareness', 'Flow activation']; }
}
