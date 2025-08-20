/**
 * Media Wisdom Extractor - Transform content consumption into personal growth
 * Making your TV shows, movies, books, podcasts, and music useful for standing tall
 */

import { AquilDatabase } from '../utils/database.js';
import { AquilAI } from '../utils/ai-helpers.js';

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
        reflection_questions: this.generateReflectionQuestions(analysis)
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
      transformation_potential: this.assessTransformationPotential(your_reaction)
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
    const relevanceIndicators = ['reminds me', 'like me', 'relate', 'understand', 'similar'];
    const lowerText = reaction.toLowerCase();
    
    const matches = relevanceIndicators.filter(indicator => lowerText.includes(indicator));
    return matches.length > 0 ? 'highly_relevant' : 'generally_relevant';
  }

  assessTransformationPotential(reaction) {
    const transformationWords = ['changed', 'shift', 'realize', 'understand', 'different', 'new perspective'];
    const lowerText = reaction.toLowerCase();
    
    const matches = transformationWords.filter(word => lowerText.includes(word));
    
    if (matches.length >= 2) return 'high';
    if (matches.length >= 1) return 'medium';
    return 'emerging';
  }

  async extractWisdomThemes(analysis) {
    return {
      primary_themes: analysis.growth_themes.slice(0, 3),
      emotional_teachings: this.generateEmotionalTeachings(analysis.emotions),
      life_applications: this.generateLifeApplications(analysis.growth_themes),
      resonance_insights: this.generateResonanceInsights(analysis.resonance_score)
    };
  }

  generateEmotionalTeachings(emotions) {
    const teachings = [];
    
    emotions.forEach(emotion => {
      switch (emotion) {
        case 'anxious':
          teachings.push('Anxiety often reflects areas of concern - what is your anxiety trying to protect or alert you to?');
          break;
        case 'excited':
          teachings.push('Excitement shows you what you value and what energizes you - this is directional information');
          break;
        case 'sad':
          teachings.push('Sadness connects you to your heart and what matters most - it can be a doorway to compassion');
          break;
        case 'angry':
          teachings.push('Anger often signals boundaries being crossed or values being threatened - what needs protection?');
          break;
        case 'hopeful':
          teachings.push('Hope reveals your vision for what\'s possible - this is your inner guidance pointing toward growth');
          break;
        default:
          teachings.push(`Your ${emotion} response contains information about your inner landscape and values`);
      }
    });

    return teachings.length > 0 ? teachings : ['Your emotional response to content is always meaningful data about your inner world'];
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
          applications.push('What does this content reveal about your relationship with your own worthiness?');
          break;
        case 'relationships':
          applications.push('How do the relationship dynamics in this content mirror or contrast with your own?');
          break;
        default:
          applications.push(`How does the theme of ${theme} apply to your current life situation or growth?`);
      }
    });

    return applications.length > 0 ? applications : ['Consider how the main themes relate to your personal growth journey'];
  }

  generateResonanceInsights(score) {
    if (score >= 8) {
      return 'This high resonance indicates the content touched something significant in your psyche - pay attention to what it activated';
    } else if (score >= 6) {
      return 'The moderate resonance suggests this content has meaningful lessons for your current journey';
    } else {
      return 'Even subtle resonance contains wisdom - sometimes the quieter responses are the most important';
    }
  }

  async connectToTrustBuilding(analysis) {
    return {
      trust_mirrors: this.identifyTrustMirrors(analysis),
      self_authority_lessons: this.generateSelfAuthorityLessons(analysis),
      internal_guidance_connections: this.connectToInternalGuidance(analysis)
    };
  }

  identifyTrustMirrors(analysis) {
    const mirrors = [];

    if (analysis.growth_themes.includes('courage')) {
      mirrors.push('This content mirrors your own journey of trusting yourself enough to be brave and take authentic action');
    }
    
    if (analysis.growth_themes.includes('authenticity')) {
      mirrors.push('The authenticity themes reflect your own process of trusting your true self enough to express it');
    }

    if (analysis.resonance_score >= 7) {
      mirrors.push('Your strong resonance shows your inner wisdom recognizing truth - trust this recognition');
    }

    mirrors.push('Your choice to consume this content and extract wisdom from it reflects your inner guidance system at work');

    return mirrors;
  }

  generateSelfAuthorityLessons(analysis) {
    return [
      'Your unique response to this content is evidence of your individual wisdom and perspective',
      'Strong reactions indicate your inner authority responding to what resonates or conflicts with your truth',
      'The fact that this content "chose you" (you were drawn to it) shows your intuitive guidance system functioning',
      'Your ability to extract meaning demonstrates your capacity for self-directed learning and growth'
    ];
  }

  connectToInternalGuidance(analysis) {
    if (analysis.personal_relevance === 'highly_relevant') {
      return 'The personal relevance you feel is your internal guidance system recognizing important information for your journey';
    }
    return 'Your internal guidance led you to this content at this time - trust that there\'s wisdom here for you';
  }

  async generateActionItems(analysis, wisdom) {
    const items = [];

    // Always include reflection
    items.push({
      type: 'reflection',
      action: 'Journal about what this content reflected back to you about your current growth journey',
      purpose: 'Deepen self-understanding and integration'
    });

    // Theme-specific actions
    if (analysis.growth_themes.includes('authenticity')) {
      items.push({
        type: 'practice',
        action: 'Identify one area where you can be more authentic this week based on what you witnessed',
        purpose: 'Apply authenticity insights to real life'
      });
    }

    if (analysis.growth_themes.includes('courage')) {
      items.push({
        type: 'exploration',
        action: 'What would you do if you had the courage you saw demonstrated? Take one small step in that direction',
        purpose: 'Translate inspiration into action'
      });
    }

    if (analysis.resonance_score >= 8) {
      items.push({
        type: 'integration',
        action: 'The high resonance suggests deep relevance - sit with this content and let it continue working on you',
        purpose: 'Allow profound insights to integrate over time'
      });
    }

    return items;
  }

  connectToStandingTall(analysis) {
    if (analysis.resonance_score >= 8) {
      return "High resonance often reflects parts of yourself that want to stand tall and be expressed. Strong responses to content can reveal aspects of your authentic self that are ready to emerge.";
    } else if (analysis.growth_themes.includes('courage') || analysis.growth_themes.includes('authenticity')) {
      return "The themes that drew you reflect your own journey toward standing tall in your truth and authentic expression.";
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
      questions.push('What aspects of authenticity did you witness that you want to embody more fully?');
    }

    if (analysis.growth_themes.includes('courage')) {
      questions.push('What would change in your life if you had the courage you observed in this content?');
    }

    return questions.slice(0, 4); // Return top 4 questions
  }

  generateOpeningMessage(analysis) {
    if (analysis.resonance_score >= 8) {
      return "This content clearly touched something important in you! Strong reactions are goldmines for personal growth and self-understanding.";
    } else if (analysis.transformation_potential === 'high') {
      return "I can sense this content has shifted something in your perspective. Let's explore what wisdom it has for your journey.";
    } else {
      return "Every piece of content you consume is an opportunity for wisdom extraction. Your reaction always contains valuable information.";
    }
  }

  getEmergencyWisdomResponse(data) {
    const { title, your_reaction } = data;
    
    return {
      message: `Your reaction to "${title}" is valuable data about your inner world and current growth needs.`,
      wisdom_analysis: { 
        message: 'Your willingness to reflect on your content consumption is wisdom in action' 
      },
      extracted_wisdom: {
        primary_themes: ['self_reflection'],
        emotional_teachings: ['Your emotional response to content always contains information about your values and growth areas']
      },
      trust_building_connections: {
        trust_mirrors: ['Your choice to examine your reactions shows you trust your inner wisdom enough to explore it']
      },
      reflection_questions: [
        'What about this content most strongly affected you?',
        'How does your reaction connect to your current life situation?',
        'What is this reaction trying to teach you about yourself?'
      ]
    };
  }
}