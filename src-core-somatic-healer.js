/**
 * Somatic Healer - Body-based wisdom and healing integration
 * Connect with your body's intelligence for trust building and standing tall
 */

import { AquilDatabase } from '../utils/database.js';
import { AquilAI } from '../utils/ai-helpers.js';

export class SomaticHealer {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async generateSession(data) {
    try {
      const { body_state, emotions, intention } = data;
      
      const analysis = await this.analyzeBodyState(data);
      const session = await this.createSomaticSession(analysis);
      const trustIntegration = await this.integrateTrustBuilding(analysis, session);
      
      // Store session data
      const sessionData = {
        body_state: analysis.body_awareness,
        emotions_present: analysis.emotions,
        intention,
        session_structure: session,
        body_insights: analysis.body_insights,
        trust_building_elements: trustIntegration
      };
      
      await this.db.saveSomaticSession(sessionData);

      return {
        message: this.generateWelcomeMessage(analysis),
        body_analysis: analysis,
        somatic_session: session,
        trust_integration: trustIntegration,
        standing_tall_connection: this.connectToStandingTall(analysis),
        daily_body_practices: this.generateDailyPractices(analysis)
      };
      
    } catch (error) {
      console.error('Somatic session generation error:', error);
      return this.getEmergencySomaticResponse(data);
    }
  }

  async analyzeBodyState(data) {
    const { body_state, emotions, intention } = data;
    
    return {
      body_awareness: this.ai.extractBodySensations(body_state),
      emotions: this.ai.extractEmotions(emotions),
      energy_level: this.assessEnergyLevel(body_state),
      tension_patterns: this.identifyTensionPatterns(body_state),
      readiness_for_work: this.assessReadinessForBodyWork(body_state, emotions),
      body_insights: this.generateInitialBodyInsights(body_state, emotions),
      nervous_system_state: this.assessNervousSystemState(body_state, emotions)
    };
  }

  assessEnergyLevel(bodyState) {
    const lowerText = bodyState.toLowerCase();
    
    if (['energized', 'buzzing', 'vibrant', 'alive', 'electric'].some(word => lowerText.includes(word))) return 'high';
    if (['tired', 'drained', 'exhausted', 'heavy', 'depleted'].some(word => lowerText.includes(word))) return 'low';
    if (['calm', 'centered', 'steady', 'grounded', 'balanced'].some(word => lowerText.includes(word))) return 'balanced';
    
    return 'moderate';
  }

  identifyTensionPatterns(bodyState) {
    const lowerText = bodyState.toLowerCase();
    const patterns = [];

    const tensionMap = {
      'upper_body': ['shoulders', 'neck', 'jaw', 'head', 'arms'],
      'core': ['chest', 'heart', 'stomach', 'belly', 'ribs'],
      'lower_body': ['hips', 'legs', 'feet', 'pelvis'],
      'back': ['back', 'spine', 'lower back']
    };

    Object.entries(tensionMap).forEach(([area, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword) && 
          (lowerText.includes('tense') || lowerText.includes('tight') || lowerText.includes('pain')))) {
        patterns.push(area);
      }
    });

    return patterns;
  }

  assessReadinessForBodyWork(bodyState, emotions) {
    const lowerBodyText = bodyState.toLowerCase();
    const lowerEmotions = emotions.toLowerCase();

    if (lowerBodyText.includes('ready') || lowerEmotions.includes('curious') || lowerEmotions.includes('open')) return 'high';
    if (lowerBodyText.includes('resist') || lowerEmotions.includes('overwhelmed') || lowerEmotions.includes('scared')) return 'low';
    return 'moderate';
  }

  assessNervousSystemState(bodyState, emotions) {
    const combinedText = `${bodyState} ${emotions}`.toLowerCase();
    
    if (['activated', 'anxious', 'buzzing', 'wired', 'restless'].some(word => combinedText.includes(word))) {
      return 'activated';
    } else if (['numb', 'disconnected', 'frozen', 'shut down', 'empty'].some(word => combinedText.includes(word))) {
      return 'hypoactivated';
    } else if (['calm', 'centered', 'grounded', 'present', 'peaceful'].some(word => combinedText.includes(word))) {
      return 'regulated';
    }
    
    return 'mixed';
  }

  generateInitialBodyInsights(bodyState, emotions) {
    const insights = [];

    if (bodyState.includes('tension') || bodyState.includes('tight')) {
      insights.push('Tension is your body\'s way of protecting you - let\'s work with it compassionately rather than forcing release');
    }

    if (emotions.includes('anxious') && bodyState.includes('chest')) {
      insights.push('Anxiety in the chest often indicates your heart wanting protection while staying open to life');
    }

    if (bodyState.includes('heavy')) {
      insights.push('Heaviness in the body can be a sign of unexpressed emotions or energy that needs movement');
    }

    if (bodyState.includes('disconnected') || bodyState.includes('numb')) {
      insights.push('Disconnection is a protective strategy - your body will reconnect when it feels safe to do so');
    }

    return insights.length > 0 ? insights : ['Your body is always communicating - let\'s listen together with curiosity and compassion'];
  }

  async createSomaticSession(analysis) {
    const session = {
      title: `Body Wisdom Session: ${analysis.energy_level} energy, ${analysis.nervous_system_state} nervous system`,
      duration: '15-20 minutes',
      phases: this.generateSessionPhases(analysis)
    };

    return session;
  }

  generateSessionPhases(analysis) {
    const phases = [];
    
    // Phase 1: Arrival and Safety
    phases.push({
      name: 'Arrival and Safety Creation',
      duration: '3-4 minutes',
      purpose: 'Coming into presence with your body and creating internal safety',
      instructions: this.getArrivalInstructions(analysis)
    });

    // Phase 2: Body Dialogue
    phases.push({
      name: 'Body Dialogue and Listening',
      duration: '6-8 minutes',
      purpose: 'Developing relationship with your body\'s communication and wisdom',
      instructions: this.getBodyDialogueInstructions(analysis)
    });

    // Phase 3: Integration and Trust Building
    phases.push({
      name: 'Integration and Trust Building',
      duration: '4-5 minutes',
      purpose: 'Integrating the session and building trust with your body\'s guidance',
      instructions: this.getIntegrationInstructions(analysis)
    });

    return phases;
  }

  getArrivalInstructions(analysis) {
    const baseInstructions = [
      'Find a comfortable position where you can be still',
      'Take three natural breaths without trying to change anything',
      'Give yourself permission to be exactly as you are right now'
    ];

    if (analysis.nervous_system_state === 'activated') {
      baseInstructions.push('Notice that you\'re activated and that this is okay - you\'re not trying to calm down, just acknowledging');
    } else if (analysis.nervous_system_state === 'hypoactivated') {
      baseInstructions.push('If you feel disconnected, that\'s okay too - simply notice what\'s available to feel right now');
    }

    return baseInstructions;
  }

  getBodyDialogueInstructions(analysis) {
    const instructions = [
      'Gently scan from head to toes, noticing without trying to change anything',
      'When you find areas of sensation, pause and simply be present with them',
      'Ask your body: "What do you want me to know?" and listen for any response'
    ];

    if (analysis.tension_patterns.includes('upper_body')) {
      instructions.push('Pay special attention to your shoulders and neck - what are they holding for you?');
    }

    if (analysis.tension_patterns.includes('core')) {
      instructions.push('Notice your chest and belly - how does your core feel right now?');
    }

    instructions.push('Remember: your body speaks in sensations, not words - trust whatever comes');

    return instructions;
  }

  getIntegrationInstructions(analysis) {
    return [
      'Notice how your body feels compared to when you started',
      'Ask: "What did my body teach me today?"',
      'Thank your body for its wisdom and communication',
      'Take one insight from this session to carry with you'
    ];
  }

  async integrateTrustBuilding(analysis, session) {
    return {
      body_trust_insights: [
        'Your body is constantly communicating about safety, needs, and desires - this is a form of inner knowing',
        'Physical sensations are direct access to your intuitive guidance system',
        'Trusting your body helps you trust yourself in all areas of life',
        'Your body never lies - it always tells you the truth about your current state'
      ],
      trust_building_practices: [
        'Before making decisions, pause and notice how each option feels in your body',
        'Honor your body\'s signals for rest, movement, nourishment, and boundaries',
        'Use your body as a truth detector - notice expansion (yes) and contraction (no)',
        'Practice listening to your body\'s wisdom without immediately trying to fix or change anything'
      ],
      standing_tall_connections: this.generateStandingTallBodyConnections(analysis)
    };
  }

  generateStandingTallBodyConnections(analysis) {
    const connections = [
      'Standing tall begins with feeling safe and grounded in your body',
      'Physical posture directly affects emotional and mental states - your body teaches presence'
    ];

    if (analysis.tension_patterns.includes('upper_body')) {
      connections.push('Upper body tension often reflects holding yourself up alone - true standing tall comes from internal support and groundedness');
    }

    if (analysis.energy_level === 'low') {
      connections.push('Honor your body\'s energy levels - standing tall sometimes means resting so you can show up authentically');
    }

    connections.push('Every time you listen to your body with respect, you\'re practicing the self-trust that allows authentic presence');

    return connections;
  }

  connectToStandingTall(analysis) {
    let connection = "Your relationship with your body directly affects your ability to stand tall in the world. ";
    
    if (analysis.tension_patterns.includes('upper_body')) {
      connection += "Upper body tension often reflects the effort of holding yourself up alone. True standing tall comes from feeling supported from within your own body. ";
    }
    
    if (analysis.nervous_system_state === 'regulated') {
      connection += "A regulated nervous system is the foundation for authentic presence and confident expression. ";
    }
    
    connection += "Every moment you spend listening to your body with curiosity and respect builds the internal trust that allows you to stand in your power.";
    
    return connection;
  }

  generateDailyPractices(analysis) {
    const practices = [];
    
    practices.push({
      name: 'Morning Body Check-in',
      instruction: 'Before getting out of bed, ask your body: "How are you today? What do you need?"',
      timing: 'Every morning',
      purpose: 'Start the day connected to your body\'s wisdom'
    });
    
    practices.push({
      name: 'Body Decision Making',
      instruction: 'Before important choices, pause and notice: does this option create expansion or contraction in your body?',
      timing: 'Before decisions',
      purpose: 'Use your body as a guidance system for trust building'
    });

    if (analysis.tension_patterns.length > 0) {
      practices.push({
        name: 'Tension Appreciation',
        instruction: 'Thank your areas of tension for protecting you, then ask what they need',
        timing: 'When you notice tension',
        purpose: 'Build a collaborative relationship with your body\'s protective mechanisms'
      });
    }

    if (analysis.nervous_system_state === 'activated') {
      practices.push({
        name: 'Activation Acknowledgment',
        instruction: 'When activated, place a hand on your heart and say "I see you, I\'m here with you"',
        timing: 'During activation',
        purpose: 'Build safety and self-connection during heightened states'
      });
    }

    return practices;
  }

  generateWelcomeMessage(analysis) {
    if (analysis.readiness_for_work === 'high' && analysis.nervous_system_state === 'regulated') {
      return "I love that you\'re ready to connect with your body\'s wisdom! Your openness and regulated state create perfect conditions for deep body dialogue.";
    } else if (analysis.readiness_for_work === 'low') {
      return "I honor your protective instincts. Your body will only share what feels safe to share. Let\'s work gently and let your body lead.";
    } else if (analysis.nervous_system_state === 'activated') {
      return "I notice your system is activated right now. That\'s valuable information - let\'s work with your activation rather than against it.";
    } else {
      return "Your body contains profound wisdom and intelligence. Let\'s create space to listen to what it has to share with curiosity and compassion.";
    }
  }

  getEmergencySomaticResponse(data) {
    return {
      message: "Your body\'s wisdom is always available, even when systems are offline. The most important thing is your willingness to listen.",
      body_analysis: { 
        message: "Your body is constantly communicating - simply noticing this is valuable body awareness" 
      },
      somatic_session: {
        title: "Basic Body Connection",
        duration: "5 minutes",
        phases: [{
          name: "Simple Body Check-in",
          instructions: [
            "Place one hand on your heart, one on your belly",
            "Take five natural breaths",
            "Ask your body: 'What do you want me to know right now?'",
            "Listen without trying to fix or change anything"
          ]
        }]
      },
      trust_integration: {
        body_trust_insights: ["Your body is always telling you the truth about your current state"],
        trust_building_practices: ["Trust whatever your body shares - it\'s always valid information"]
      },
      daily_body_practices: [{
        name: "Body Wisdom Check",
        instruction: "Ask your body one question each day and listen with curiosity for the response",
        timing: "Daily"
      }]
    };
  }
}
