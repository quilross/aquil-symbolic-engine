/**
 * Media Wisdom Extractor - Transform content consumption into personal growth
 * Making your TV shows, movies, books, podcasts, and music useful for standing tall
 */

import { AquilDatabase } from './utils/database.js';
import { AquilAI } from './utils/ai-helpers.js';

export class MediaWisdomExtractor {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async extractWisdom(data) {
    try {
      const { media_type, title, your_reaction, content_summary } = data;
      
      // Core analysis
      const analysis = await this.analyzeMediaConsumption(data);
      
      // Extract wisdom themes
      const wisdom = await this.extractWisdomThemes(analysis);
      
      // Connect to trust building
      const trustConnections = await this.connectToTrustBuilding(analysis);
      
      // Generate actionable insights
      const actionItems = await this.generateActionItems(analysis, wisdom);
      
      // Store in database
      const wisdomData = {
        media_type,
        title,
        content_summary: content_summary || '',
        personal_reaction: your_reaction,
        emotional_response: analysis.emotions,
        wisdom_extracted: wisdom,
        trust_connections: trustConnections,
        action_items: actionItems,
        growth_themes: analysis.growth_themes,
        resonance_score: analysis.resonance_score
      };
      
      await this.db.saveMediaWisdom(wisdomData);

      return {
        message: this.generateOpeningMessage(analysis),
        wisdom_analysis: analysis,
        extracted_wisdom: wisdom,
        trust_building_connections: trustConnections,
        actionable_insights: actionItems,
        standing_tall_relevance: this.connectToStandingTall(analysis),
        reflection_questions: this.generateReflectionQuestions(analysis),
        integration_practices: this.generateIntegrationPractices(analysis)
      };
      
    } catch (error) {
      console.error('Media wisdom extraction error:', error);
      return this.getEmergencyWisdomResponse(data);
    }
  }

  async analyzeMediaConsumption(data) {
    const { your_reaction } = data;
    
    return {
      emotions: this.ai.extractEmotions(your_reaction),
      growth_themes: this.ai.identifyGrowthThemes(your_reaction),
      resonance_score: this.calculateResonance(your_reaction),
      personal_relevance: this.calculatePersonalRelevance(your_reaction),
      transformation_potential: this.assessTransformationPotential(your_reaction),
      trust_indicators: this.ai.calculateTrustRelevance(your_reaction),
      activation_level: this.assessActivationLevel(your_reaction)
    };
  }

  calculateResonance(reaction) {
    const intensityWords = ['deeply', 'really', 'very', 'extremely', 'totally', 'completely'];
    const emotionalWords = ['moved', 'touched', 'affected', 'impacted', 'struck'];
    const lowerText = reaction.toLowerCase();
    
    let score = 5;
    intensityWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    emotionalWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    return Math.min(10, score);
  }

  calculatePersonalRelevance(reaction) {
    const relevanceIndicators = ['reminds me', 'like me', 'relate', 'understand', 'similar', 'recognize'];
    const lowerText = reaction.toLowerCase();
    
    const matches = relevanceIndicators.filter(indicator => lowerText.includes(indicator));
    return matches.length > 0 ? 'highly_relevant' : 'generally_relevant';
  }

  assessTransformationPotential(reaction) {
    const transformationWords = ['changed', 'shift', 'realize', 'understand', 'different', 'new perspective', 'see now'];
    const lowerText = reaction.toLowerCase();
    
    const matches = transformationWords.filter(word => lowerText.includes(word));
    
    if (matches.length >= 2) return 'high';
    if (matches.length >= 1) return 'medium';
    return 'emerging';
  }

  assessActivationLevel(reaction) {
    const activationWords = ['angry', 'frustrated', 'excited', 'energized', 'triggered', 'activated'];
    const lowerText = reaction.toLowerCase();
    
    const matches = activationWords.filter(word => lowerText.includes(word));
    return matches.length > 0 ? 'high' : 'moderate';
  }

  async extractWisdomThemes(analysis) {
    return {
      primary_themes: analysis.growth_themes.slice(0, 3),
      emotional_teachings: this.generateEmotionalTeachings(analysis.emotions),
      life_applications: this.generateLifeApplications(analysis.growth_themes),
      resonance_insights: this.generateResonanceInsights(analysis.resonance_score),
      mirror_work: this.generateMirrorWork(analysis)
    };
  }

  generateEmotionalTeachings(emotions) {
    const teachings = [];
    
    emotions.forEach(emotion => {
      switch (emotion) {
        case 'anxious':
          teachings.push('Anxiety often reflects areas of concern or activation - what is this anxiety trying to protect or alert you to?');
          break;
        case 'excited':
          teachings.push('Excitement shows you what energizes you and points toward your values - this is directional information');
          break;
        case 'sad':
          teachings.push('Sadness connects you to your heart and what matters most - it can be a doorway to compassion and meaning');
          break;
        case 'angry':
          teachings.push('Anger often signals boundaries being crossed or values being threatened - what needs protection or honoring?');
          break;
        case 'hopeful':
          teachings.push('Hope reveals your vision for what\'s possible - this is your inner guidance pointing toward growth and possibility');
          break;
        default:
          teachings.push(`Your ${emotion} response contains important information about your inner landscape and current growth needs`);
      }
    });

    return teachings.length > 0 ? teachings : ['Your emotional response to content is always meaningful data about your inner world and values'];
  }

  generateLifeApplications(themes) {
    const applications = [];
    
    themes.forEach(theme => {
      switch (theme) {
        case 'authenticity':
          applications.push('Where in your life are you being called to be more authentic and true to yourself?');
          break;
        case 'courage':
          applications.push('What would you do if you had the courage you witnessed or felt in this content?');
          break;
        case 'boundaries':
          applications.push('How might this content be reflecting your own relationship with boundaries and limits?');
          break;
        case 'self_worth':
          applications.push('What does this content reveal about your relationship with your own worthiness and value?');
          break;
        case 'relationships':
          applications.push('How do the relationship dynamics in this content mirror or contrast with your own patterns?');
          break;
        default:
          applications.push(`How does the theme of ${theme} apply to your current life situation or growth journey?`);
      }
    });

    return applications.length > 0 ? applications : ['Consider how the main themes in this content relate to your personal growth journey'];
  }

  generateResonanceInsights(score) {
    if (score >= 8) {
      return 'This high resonance indicates the content touched something significant in your psyche - pay attention to what it activated and what wants to emerge';
    } else if (score >= 6) {
      return 'The moderate resonance suggests this content has meaningful lessons for your current journey and areas of development';
    } else {
      return 'Even subtle resonance contains wisdom - sometimes the quieter responses reveal the most important insights';
    }
  }

  generateMirrorWork(analysis) {
    const mirrors = [];

    if (analysis.growth_themes.includes('courage')) {
      mirrors.push('This content mirrors your own journey of developing courage and trusting yourself enough to take authentic action');
    }
    
    if (analysis.growth_themes.includes('authenticity')) {
      mirrors.push('The authenticity themes reflect your own process of trusting your true self enough to express it fully');
    }

    if (analysis.resonance_score >= 7) {
      mirrors.push('Your strong resonance shows your inner wisdom recognizing truth - trust this recognition as valid guidance');
    }

    if (analysis.activation_level === 'high') {
      mirrors.push('Strong activation often indicates content that\'s touching your growth edge or areas ready for evolution');
    }

    mirrors.push('Your choice to consume this content and extract wisdom from it reflects your inner guidance system actively working');

    return mirrors;
  }

  async connectToTrustBuilding(analysis) {
    return {
      trust_mirrors: this.identifyTrustMirrors(analysis),
      self_authority_lessons: this.generateSelfAuthorityLessons(analysis),
      internal_guidance_connections: this.connectToInternalGuidance(analysis),
      confidence_building: this.extractConfidenceBuilding(analysis)
    };
  }

  identifyTrustMirrors(analysis) {
    const mirrors = [];

    if (analysis.growth_themes.includes('courage')) {
      mirrors.push('This content mirrors your own journey of trusting yourself enough to be brave and take authentic action in your life');
    }
    
    if (analysis.growth_themes.includes('authenticity')) {
      mirrors.push('The authenticity themes reflect your own process of trusting your true self enough to express it without apology');
    }

    if (analysis.resonance_score >= 7) {
      mirrors.push('Your strong resonance shows your inner wisdom recognizing truth - this is evidence of your trustworthy internal guidance');
    }

    if (analysis.personal_relevance === 'highly_relevant') {
      mirrors.push('The personal relevance you feel is your internal guidance system recognizing important information for your trust journey');
    }

    mirrors.push('Your unique response to this content is evidence of your individual wisdom and perspective - trust your interpretation');

    return mirrors;
  }

  generateSelfAuthorityLessons(analysis) {
    return [
      'Your unique response to this content demonstrates your individual wisdom and perspective working',
      'Strong reactions indicate your inner authority responding to what resonates or conflicts with your truth',
      'The fact that this content "chose you" (you were drawn to it) shows your intuitive guidance system functioning well',
      'Your ability to extract meaning demonstrates your capacity for self-directed learning and personal authority'
    ];
  }

  connectToInternalGuidance(analysis) {
    if (analysis.personal_relevance === 'highly_relevant') {
      return 'The personal relevance you feel is your internal guidance system recognizing important information for your current journey';
    }
    
    if (analysis.transformation_potential === 'high') {
      return 'This high transformation potential suggests your inner guidance led you to content that can support your current evolution';
    }
    
    return 'Your internal guidance led you to this content at this time - trust that there\'s wisdom here for you to discover';
  }

  extractConfidenceBuilding(analysis) {
    const elements = [];

    if (analysis.growth_themes.includes('courage')) {
      elements.push('Witnessing courage in content can activate your own courageous capacities');
    }

    if (analysis.resonance_score >= 7) {
      elements.push('Your strong response demonstrates your capacity for deep feeling and authentic engagement');
    }

    elements.push('Your willingness to analyze your content consumption shows sophisticated self-awareness');

    return elements;
  }

  async generateActionItems(analysis, wisdom) {
    const items = [];

    // Always include reflection
    items.push({
      type: 'reflection',
      action: 'Journal about what this content reflected back to you about your current growth journey and life situation',
      purpose: 'Deepen self-understanding and integrate insights',
      timeframe: 'Today'
    });

    // Theme-specific actions
    if (analysis.growth_themes.includes('authenticity')) {
      items.push({
        type: 'practice',
        action: 'Identify one area where you can be more authentic this week based on what you witnessed in this content',
        purpose: 'Apply authenticity insights to real life',
        timeframe: 'This week'
      });
    }

    if (analysis.growth_themes.includes('courage')) {
      items.push({
        type: 'exploration',
        action: 'What would you do if you had the courage demonstrated in this content? Take one small step in that direction',
        purpose: 'Translate inspiration into action',
        timeframe: 'Within 3 days'
      });
    }

    if (analysis.resonance_score >= 8) {
      items.push({
        type: 'integration',
        action: 'The high resonance suggests deep relevance - sit with this content and let it continue working on you over time',
        purpose: 'Allow profound insights to integrate naturally',
        timeframe: 'Ongoing'
      });
    }

    if (analysis.trust_indicators.length > 0) {
      items.push({
        type: 'trust_building',
        action: 'Notice how your response to this content demonstrates your inner knowing working - trust your interpretation',
        purpose: 'Build evidence of your trustworthy internal guidance',
        timeframe: 'Today'
      });
    }

    return items.slice(0, 4);
  }

  connectToStandingTall(analysis) {
    if (analysis.resonance_score >= 8) {
      return "High resonance often reflects parts of yourself that want to stand tall and be expressed. Strong responses to content can reveal aspects of your authentic self that are ready to emerge more fully.";
    } else if (analysis.growth_themes.includes('courage') || analysis.growth_themes.includes('authenticity')) {
      return "The themes that drew you reflect your own journey toward standing tall in your truth and authentic expression. Let this content inspire your own courage.";
    } else if (analysis.activation_level === 'high') {
      return "Strong activation through content often indicates areas where you're ready to stand taller or express more authentically. What wants to be activated in your own life?";
    } else {
      return "Choosing to extract wisdom from your consumption is itself an act of standing tall - you're taking agency in your growth rather than being passive.";
    }
  }

  generateReflectionQuestions(analysis) {
    const questions = [
      'What part of this content most strongly resonated with you and why?',
      'If you fully trusted your reaction to this content, what would you do differently in your life?',
      'How does your choice to consume this content reflect your inner guidance working?'
    ];

    if (analysis.growth_themes.includes('authenticity')) {
      questions.push('What aspects of authenticity did you witness that you want to embody more fully in your own life?');
    }

    if (analysis.growth_themes.includes('courage')) {
      questions.push('What would change in your life if you had the courage you observed in this content?');
    }

    if (analysis.resonance_score >= 7) {
      questions.push('What is this strong resonance trying to tell you about your current growth needs or readiness?');
    }

    return questions.slice(0, 4);
  }

  generateIntegrationPractices(analysis) {
    const practices = [];

    practices.push({
      name: 'Wisdom Integration Journal',
      instruction: 'Write for 10 minutes about how the themes in this content apply to your current life situation',
      frequency: 'After consuming meaningful content'
    });

    if (analysis.growth_themes.includes('courage')) {
      practices.push({
        name: 'Courage Activation Practice',
        instruction: 'Identify one small way to express the courage you witnessed and take that action within 24 hours',
        frequency: 'When inspired by courageous content'
      });
    }

    if (analysis.resonance_score >= 7) {
      practices.push({
        name: 'Resonance Tracking',
        instruction: 'Keep a note of content that strongly resonates with you - look for patterns over time',
        frequency: 'Ongoing'
      });
    }

    practices.push({
      name: 'Trust Your Response',
      instruction: 'Before seeking others\' opinions about content, first honor your own reaction and interpretation',
      frequency: 'After consuming any content'
    });

    return practices.slice(0, 3);
  }

  generateOpeningMessage(analysis) {
    if (analysis.resonance_score >= 8) {
      return "This content clearly touched something important in you! Strong reactions are goldmines for personal growth and self-understanding. Let's mine the wisdom together.";
    } else if (analysis.transformation_potential === 'high') {
      return "I can sense this content has shifted something in your perspective. Let's explore what wisdom it has for your growth journey and how to integrate it.";
    } else if (analysis.activation_level === 'high') {
      return "Strong activation through content often indicates it's touching your growth edge. Let's explore what wants to be activated in your own life.";
    } else {
      return "Every piece of content you consume is an opportunity for wisdom extraction. Your reaction always contains valuable information about your inner world and current needs.";
    }
  }

  getEmergencyWisdomResponse(data) {
    const { title, your_reaction } = data;
    
    return {
      message: `Your reaction to "${title}" is valuable data about your inner world and current growth needs. Every response teaches you something about yourself.`,
      wisdom_analysis: { 
        message: 'Your willingness to reflect on your content consumption is wisdom in action',
        resonance_score: 5
      },
      extracted_wisdom: {
        primary_themes: ['self_reflection'],
        emotional_teachings: ['Your emotional response to content always contains information about your values and growth areas'],
        life_applications: ['Notice how your content choices reflect your current interests and growth needs']
      },
      trust_building_connections: {
        trust_mirrors: ['Your choice to examine your reactions shows you trust your inner wisdom enough to explore it']
      },
      reflection_questions: [
        'What about this content most strongly affected you?',
        'How does your reaction connect to your current life situation?',
        'What is this reaction trying to teach you about yourself?'
      ],
      standing_tall_relevance: 'Taking the time to extract wisdom from your consumption is an act of standing tall in your own growth and learning.'
    };
  }
}