/**
 * Standing Tall Coach - Confidence and empowerment practices
 * Helping you stand tall in the world instead of shrinking
 */

import { AquilDatabase } from "../utils/database.js";
import { AquilAI } from "../utils/ai-helpers.js";

export class StandingTall {
  constructor(env) {
    this.env = env;
    this.db = new AquilDatabase(env);
    this.ai = new AquilAI();
  }

  async generatePractice(data) {
    try {
      const { situation, fears_concerns, desired_outcome, past_successes } =
        data;

      // Analyze the standing tall challenge
      const analysis = await this.analyzeStandingTallChallenge(data);

      // Create personalized practice
      const practice = await this.createStandingTallPractice(analysis);

      // Generate confidence building elements
      const confidenceBuilding =
        await this.generateConfidenceBuilding(analysis);

      // Store practice session
      await this.storePracticeSession(analysis, practice, data);

      return {
        message: this.generateWelcomeMessage(analysis),
        situation_analysis: analysis,
        standing_tall_practice: practice,
        confidence_building: confidenceBuilding,
        fear_transformation: this.transformFearsIntoGuidance(analysis),
        daily_empowerment_practices: this.generateDailyPractices(analysis),
        trust_integration: this.integrateWithTrustBuilding(analysis),
      };
    } catch (error) {
      console.error("Standing tall practice error:", error);
      return this.getEmergencyStandingTallResponse(data);
    }
  }

  async analyzeStandingTallChallenge(data) {
    const { situation, fears_concerns, desired_outcome, past_successes } = data;

    return {
      shrinking_patterns: this.identifyShrinkingPatterns(
        situation,
        fears_concerns,
      ),
      fear_analysis: this.analyzeFears(fears_concerns || ""),
      existing_strengths: this.extractExistingStrengths(past_successes || ""),
      confidence_level: this.assessCurrentConfidenceLevel(data),
      readiness_for_growth: this.assessReadinessForGrowth(data),
      standing_tall_vision: this.clarifyStandingTallVision(desired_outcome),
      power_leaks: this.identifyPowerLeaks(situation, fears_concerns),
      authenticity_opportunities: this.identifyAuthenticityOpportunities(data),
    };
  }

  identifyShrinkingPatterns(situation, fears) {
    const combinedText = `${situation} ${fears || ""}`.toLowerCase();
    const patterns = [];

    const shrinkingIndicators = {
      people_pleasing: {
        keywords: [
          "please others",
          "what they think",
          "avoid conflict",
          "keep everyone happy",
        ],
        description: "Prioritizing others' comfort over your authenticity",
        transformation_opportunity:
          "Learning that authenticity serves others more than people-pleasing",
      },
      hiding: {
        keywords: ["hide", "invisible", "background", "blend in", "not seen"],
        description:
          "Making yourself small to avoid judgment or responsibility",
        transformation_opportunity:
          "Discovering that your visibility gives others permission to shine too",
      },
      perfectionism: {
        keywords: ["perfect", "right way", "mistake", "wrong", "flawless"],
        description:
          "Requiring perfection before feeling safe to act or be seen",
        transformation_opportunity:
          'Embracing "good enough" and trusting your natural excellence',
      },
      seeking_approval: {
        keywords: [
          "approval",
          "validation",
          "acceptance",
          "liked",
          "permission",
        ],
        description: "Looking outside yourself for validation and permission",
        transformation_opportunity:
          "Developing internal validation and self-authority",
      },
      minimizing: {
        keywords: [
          "not important",
          "doesn't matter",
          "small thing",
          "no big deal",
        ],
        description:
          "Making your needs, feelings, or contributions seem smaller than they are",
        transformation_opportunity:
          "Recognizing and claiming the full value of your presence and contributions",
      },
    };

    Object.entries(shrinkingIndicators).forEach(([pattern, config]) => {
      if (config.keywords.some((keyword) => combinedText.includes(keyword))) {
        patterns.push({
          pattern,
          description: config.description,
          transformation_opportunity: config.transformation_opportunity,
        });
      }
    });

    return patterns.length > 0
      ? patterns
      : [
          {
            pattern: "general_uncertainty",
            description:
              "Uncertainty about how to show up authentically and powerfully",
            transformation_opportunity:
              "Learning to trust your natural presence and authentic expression",
          },
        ];
  }

  analyzeFears(fearsText) {
    if (!fearsText) return { primary_fears: [], wisdom_in_fears: [] };

    const lowerFears = fearsText.toLowerCase();
    const fears = [];

    const fearMap = {
      judgment: {
        keywords: ["judge", "criticism", "what people think", "opinion"],
        wisdom:
          "Your fear of judgment shows you value authenticity and want to be seen truly",
        transformation:
          "Learning that others' judgments say more about them than about you",
        growth_edge:
          "What would you do if others' opinions had no power over you?",
      },
      rejection: {
        keywords: ["reject", "not liked", "abandoned", "excluded"],
        wisdom:
          "Your fear of rejection shows you value belonging and connection",
        transformation:
          "Discovering that the right people will appreciate your authenticity",
        growth_edge: "What if rejection is redirection toward your true tribe?",
      },
      failure: {
        keywords: ["fail", "wrong", "mistake", "mess up"],
        wisdom:
          "Your fear of failure shows you care about meaningful contribution",
        transformation:
          'Reframing "failure" as valuable learning data and course correction',
        growth_edge: "What would you attempt if failure was just information?",
      },
      visibility: {
        keywords: ["seen", "noticed", "attention", "spotlight", "visible"],
        wisdom:
          "Your fear of visibility often means you have important gifts that want to be shared",
        transformation:
          "Understanding that your visibility gives others permission to shine",
        growth_edge:
          "What wants to be expressed through you that the world needs to see?",
      },
      inadequacy: {
        keywords: ["not enough", "inadequate", "not qualified", "imposter"],
        wisdom:
          "Your fear of inadequacy shows you have high standards and want to contribute meaningfully",
        transformation:
          "Recognizing that everyone feels inadequate sometimes - it's part of growing",
        growth_edge:
          'What if your "inadequacy" is actually humility preparing you for greater service?',
      },
    };

    Object.entries(fearMap).forEach(([fear, config]) => {
      if (config.keywords.some((keyword) => lowerFears.includes(keyword))) {
        fears.push({
          fear,
          wisdom: config.wisdom,
          transformation: config.transformation,
          growth_edge: config.growth_edge,
        });
      }
    });

    return {
      primary_fears: fears.slice(0, 3),
      wisdom_in_fears: fears.map((f) => f.wisdom),
    };
  }

  extractExistingStrengths(pastSuccesses) {
    if (!pastSuccesses)
      return [
        "Your willingness to work on standing tall is already a significant strength",
      ];

    const strengths = [];
    const lowerSuccesses = pastSuccesses.toLowerCase();

    const strengthIndicators = {
      spoke_up: ["spoke", "said", "voiced", "expressed"],
      stood_ground: ["stood", "defended", "maintained", "held"],
      took_action: ["did", "acted", "took", "stepped"],
      helped_others: ["helped", "supported", "encouraged", "guided"],
    };

    Object.entries(strengthIndicators).forEach(([strength, keywords]) => {
      if (keywords.some((keyword) => lowerSuccesses.includes(keyword))) {
        switch (strength) {
          case "spoke_up":
            strengths.push(
              "You have demonstrated courage in speaking your truth",
            );
            break;
          case "stood_ground":
            strengths.push(
              "You have shown ability to stand firm in what matters to you",
            );
            break;
          case "took_action":
            strengths.push(
              "You have the capacity to move from intention into action",
            );
            break;
          case "helped_others":
            strengths.push(
              "You naturally support others - this shows your generous heart and leadership capacity",
            );
            break;
        }
      }
    });

    if (strengths.length === 0) {
      strengths.push(
        "You have succeeded before - these experiences are evidence of your capacity",
      );
    }

    strengths.push(
      "Your self-awareness about when you shrink shows sophisticated emotional intelligence",
    );

    return strengths;
  }

  assessCurrentConfidenceLevel(data) {
    const { past_successes, fears_concerns, situation } = data;
    let level = 5; // baseline

    if (past_successes && past_successes.length > 50) level += 2;
    if (past_successes && past_successes.length > 20) level += 1;
    if (fears_concerns && fears_concerns.includes("scared")) level -= 1;
    if (situation && situation.includes("confident")) level += 1;

    return Math.max(1, Math.min(10, level));
  }

  assessReadinessForGrowth(data) {
    const { situation, desired_outcome, fears_concerns } = data;
    const combinedText =
      `${situation} ${desired_outcome} ${fears_concerns || ""}`.toLowerCase();

    if (
      combinedText.includes("ready") ||
      combinedText.includes("willing") ||
      combinedText.includes("excited")
    )
      return "high";
    if (
      combinedText.includes("scared") ||
      combinedText.includes("overwhelming") ||
      combinedText.includes("too much")
    )
      return "gentle";
    return "moderate";
  }

  clarifyStandingTallVision(desiredOutcome) {
    if (!desiredOutcome) {
      return {
        vision:
          "Express yourself authentically and take up your rightful space in the world",
        embodied_version:
          "You naturally standing in your power with confidence and presence",
        identity_shift:
          "Becoming someone who naturally belongs wherever you are",
      };
    }

    return {
      vision: desiredOutcome,
      embodied_version: `Imagine yourself ${desiredOutcome.toLowerCase()} with complete ease and natural confidence`,
      identity_shift: `You becoming someone who naturally ${desiredOutcome.toLowerCase()} without effort or strain`,
    };
  }

  identifyPowerLeaks(situation, fears) {
    const leaks = [];
    const combinedText = `${situation} ${fears || ""}`.toLowerCase();

    if (combinedText.includes("apologize") || combinedText.includes("sorry")) {
      leaks.push({
        leak: "over_apologizing",
        description: "Apologizing for your existence or normal needs",
        reclaim: "Practice existing without apology - you belong here",
      });
    }

    if (
      combinedText.includes("quiet") ||
      combinedText.includes("don't speak")
    ) {
      leaks.push({
        leak: "voice_suppression",
        description: "Not speaking your truth when it matters",
        reclaim: "Your voice has value - practice sharing your perspective",
      });
    }

    if (leaks.length === 0) {
      leaks.push({
        leak: "presence_dimming",
        description:
          "General tendency to make yourself smaller than you naturally are",
        reclaim: "Practice taking up your natural amount of space",
      });
    }

    return leaks;
  }

  identifyAuthenticityOpportunities(data) {
    const { situation, desired_outcome } = data;

    return [
      "Express your true thoughts and feelings instead of what you think others want to hear",
      "Make choices based on your inner knowing rather than external expectations",
      "Take up physical and energetic space that matches your authentic presence",
      "Share your unique perspective and gifts instead of hiding them",
    ];
  }

  async createStandingTallPractice(analysis) {
    const practice = {
      title: "Personalized Standing Tall Practice",
      subtitle: `Working with ${analysis.shrinking_patterns[0]?.pattern || "authentic presence"}`,
      duration: "15-20 minutes",
      phases: this.generatePracticePhases(analysis),
    };

    return practice;
  }

  generatePracticePhases(analysis) {
    const phases = [];

    // Phase 1: Grounding in Worth
    phases.push({
      name: "Grounding in Your Inherent Worth",
      duration: "3-4 minutes",
      purpose: "Connecting with your fundamental right to exist and be seen",
      instructions: [
        "Stand with feet hip-width apart, feeling your connection to the ground",
        "Place one hand on your heart, one on your belly",
        'Take three deep breaths and say internally: "I belong here"',
        "Feel your natural right to take up space in the world",
        "Notice: you don't have to earn the right to exist - it's already yours",
      ],
    });

    // Phase 2: Fear Acknowledgment and Transformation
    if (analysis.fear_analysis.primary_fears.length > 0) {
      const primaryFear = analysis.fear_analysis.primary_fears[0];
      phases.push({
        name: "Fear Acknowledgment and Wisdom Extraction",
        duration: "4-5 minutes",
        purpose: "Honoring your fears while accessing their wisdom",
        instructions: [
          `Acknowledge your fear of ${primaryFear.fear} with compassion`,
          `Remember: ${primaryFear.wisdom}`,
          "Thank your fear for trying to protect you",
          'Breathe into your heart and say: "I can feel afraid and still choose courage"',
          `Ask yourself: ${primaryFear.growth_edge}`,
        ],
      });
    }

    // Phase 3: Posture and Presence Practice
    phases.push({
      name: "Embodying Your Standing Tall Vision",
      duration: "5-6 minutes",
      purpose: "Physically and energetically embodying your authentic power",
      instructions: [
        "Stand tall with shoulders relaxed but broad",
        "Lift the crown of your head toward the sky",
        "Breathe into your core and feel your natural stability",
        `Visualize yourself ${analysis.standing_tall_vision.vision || "standing in your power"} with complete confidence`,
        "How would you stand? How would you breathe? How would you hold your head?",
        "Embody this version of yourself right now",
        "Remember: this confident presence is not fake - it's your natural state",
      ],
    });

    // Phase 4: Integration and Commitment
    phases.push({
      name: "Integration and Daily Commitment",
      duration: "3-4 minutes",
      purpose:
        "Integrating the practice and setting intentions for standing tall",
      instructions: [
        "Notice how your body feels compared to when you started",
        "What did you learn about your natural presence in this practice?",
        "Choose one way you will practice standing tall today",
        "Thank yourself for choosing growth over shrinking",
        "Carry this embodied confidence with you into your day",
      ],
    });

    return phases;
  }

  async generateConfidenceBuilding(analysis) {
    return {
      foundational_beliefs: this.generateFoundationalBeliefs(analysis),
      confidence_experiments: this.generateConfidenceExperiments(analysis),
      posture_practices: this.generatePosturePractices(),
      energy_reclaiming: this.generateEnergyReclaimingPractices(analysis),
    };
  }

  generateFoundationalBeliefs(analysis) {
    const beliefs = [
      "I have a natural right to take up space in this world",
      "My voice and perspective add unique value",
      "I am worthy of being seen, heard, and respected",
      "Standing tall serves others by giving them permission to do the same",
    ];

    // Add specific beliefs based on patterns
    analysis.shrinking_patterns.forEach((pattern) => {
      switch (pattern.pattern) {
        case "people_pleasing":
          beliefs.push(
            "I can care deeply about others while honoring my own needs and truth",
          );
          break;
        case "perfectionism":
          beliefs.push(
            "My authentic effort is more valuable than perfect performance",
          );
          break;
        case "seeking_approval":
          beliefs.push(
            "My own approval of myself is the most important validation I can receive",
          );
          break;
        default:
          beliefs.push("My authentic expression is a gift to the world");
      }
    });

    return beliefs.slice(0, 5); // Return top 5 beliefs
  }

  generateConfidenceExperiments(analysis) {
    const experiments = [
      {
        name: "Power Posture Hour",
        instruction:
          "Spend one hour maintaining confident posture - shoulders back, head high, taking up your natural space",
        difficulty: "easy",
        purpose:
          "Build physical confidence and notice how posture affects internal state",
      },
      {
        name: "Authentic Opinion Sharing",
        instruction:
          "Share your genuine opinion on one topic today, even if it differs from others",
        difficulty: "medium",
        purpose: "Practice trusting and expressing your authentic perspective",
      },
      {
        name: "Space Claiming Practice",
        instruction:
          "In your next social interaction, consciously take up your rightful physical and energetic space",
        difficulty: "medium",
        purpose: "Practice existing without shrinking",
      },
    ];

    // Add specific experiments based on analysis
    if (analysis.shrinking_patterns.some((p) => p.pattern === "hiding")) {
      experiments.push({
        name: "Visibility Practice",
        instruction:
          "Make yourself slightly more visible than usual - speak up in a meeting, post something authentic, or wear something that expresses you",
        difficulty: "challenging",
        purpose: "Practice being seen authentically",
      });
    }

    return experiments.slice(0, 4); // Return top 4 experiments
  }

  generatePosturePractices() {
    return [
      {
        name: "Mountain Pose",
        instruction:
          "Stand with feet rooted, spine tall, crown reaching skyward - breathe into your natural majesty",
        when: "Morning routine and before challenging situations",
        purpose: "Embody your inherent dignity and strength",
      },
      {
        name: "Confident Walking",
        instruction:
          "Walk with shoulders back, chest open, head high - own the ground beneath your feet",
        when: "Throughout the day, especially when entering new spaces",
        purpose:
          "Practice moving through the world with presence and confidence",
      },
      {
        name: "Seated Presence",
        instruction:
          "Sit with spine erect, shoulders relaxed but broad, taking up your natural space in the chair",
        when: "During meetings, conversations, and work",
        purpose: "Maintain confident presence even while seated",
      },
    ];
  }

  generateEnergyReclaimingPractices(analysis) {
    const practices = [];

    analysis.power_leaks.forEach((leak) => {
      practices.push({
        leak_type: leak.leak,
        practice: leak.reclaim,
        frequency: "When you notice the pattern",
      });
    });

    practices.push({
      leak_type: "general_energy_reclaiming",
      practice:
        "Throughout the day, notice when you're making yourself smaller and consciously expand back to your natural size",
      frequency: "Ongoing awareness practice",
    });

    return practices;
  }

  transformFearsIntoGuidance(analysis) {
    const transformations = [];

    analysis.fear_analysis.primary_fears.forEach((fearObj) => {
      transformations.push({
        fear: fearObj.fear,
        wisdom: fearObj.wisdom,
        transformation: fearObj.transformation,
        growth_edge: fearObj.growth_edge,
        daily_practice: this.getFearSpecificPractice(fearObj.fear),
      });
    });

    return transformations;
  }

  getFearSpecificPractice(fear) {
    const practices = {
      judgment:
        'Practice: Ask yourself "Whose opinion actually matters to me and why?" Focus on the voices that truly support your growth',
      rejection:
        'Practice: Remind yourself "The right people will appreciate my authenticity" before sharing something true',
      failure:
        'Practice: Reframe each "failure" as valuable data - ask "What did this teach me about what works?"',
      visibility:
        "Practice: Start with small acts of authentic visibility and notice that the sky doesn't fall",
      inadequacy:
        'Practice: When feeling inadequate, ask "What if this feeling is preparing me to serve more effectively?"',
    };
    return (
      practices[fear] ||
      "Practice: Breathe through the fear and take one small brave action aligned with your truth"
    );
  }

  generateDailyPractices(analysis) {
    return [
      {
        name: "Morning Power Activation",
        instruction:
          "Spend 2 minutes in confident posture while setting your intention to stand tall today",
        timing: "Morning",
        purpose: "Start each day grounded in your natural power",
      },
      {
        name: "Courage Micro-Moments",
        instruction:
          "Take one small action today that requires you to be slightly more visible or authentic",
        timing: "During the day",
        purpose: "Build courage through consistent small steps",
      },
      {
        name: "Evening Acknowledgment",
        instruction:
          "Before bed, acknowledge one moment when you stood tall today (even if it felt small)",
        timing: "Evening",
        purpose: "Build evidence of your growing confidence",
      },
      {
        name: "Shrinking Pattern Interrupt",
        instruction:
          "When you notice yourself shrinking, pause, breathe, and consciously expand back to your natural size",
        timing: "As needed",
        purpose:
          "Develop real-time awareness and choice around shrinking patterns",
      },
    ];
  }

  integrateWithTrustBuilding(analysis) {
    return {
      trust_connection:
        "Standing tall is the external expression of internal self-trust - they develop together",
      trust_practices: [
        "Before standing tall in any situation, first connect with your gut feeling about what's true for you",
        "Use your body as a confidence barometer - when you trust your inner knowing, your posture naturally improves",
        "Practice making small decisions from your gut throughout the day - this builds the trust needed for bigger acts of standing tall",
      ],
      integration_insight:
        "You can't authentically stand tall in the world if you don't trust your inner authority - they're two sides of the same developmental process",
    };
  }

  async storePracticeSession(analysis, practice, data) {
    try {
      const sessionData = {
        situation: data.situation,
        shrinking_patterns: analysis.shrinking_patterns,
        confidence_level: analysis.confidence_level,
        practice_structure: practice,
        session_type: "standing_tall_practice",
      };

      // Store for pattern recognition
      return true; // Simplified storage
    } catch (error) {
      console.error("Error storing standing tall session:", error);
      return false;
    }
  }

  generateWelcomeMessage(analysis) {
    if (
      analysis.readiness_for_growth === "high" &&
      analysis.confidence_level >= 6
    ) {
      return "I can feel your readiness to step more fully into your power! Your combination of willingness and existing confidence creates perfect conditions for breakthrough. Let\'s build on your solid foundation.";
    } else if (analysis.readiness_for_growth === "gentle") {
      return "I deeply honor where you are right now. Standing tall is a practice, not a performance. We\'ll work at exactly the pace that feels supportive - your nervous system\'s wisdom leads the way.";
    } else if (analysis.confidence_level <= 4) {
      return "Your courage to work on standing tall, even when confidence feels low, is profound. This isn\'t about faking confidence - it\'s about reconnecting with your inherent worth and natural presence.";
    } else {
      return "Your willingness to explore standing tall shows you\'re ready to reclaim your natural power. Every moment you choose growth over shrinking is choosing yourself - and that\'s beautiful.";
    }
  }

  getEmergencyStandingTallResponse(data) {
    return {
      message:
        "Your desire to stand tall instead of shrinking is a powerful choice. Remember: you don\'t need to earn the right to take up space - it\'s already yours.",
      situation_analysis: {
        message:
          "Working on standing tall shows you\'re choosing expansion over contraction - this is courage in action",
        confidence_level: 5,
      },
      standing_tall_practice: {
        title: "Emergency Confidence Practice",
        duration: "3 minutes",
        phases: [
          {
            name: "Instant Dignity Activation",
            instructions: [
              "Stand with feet hip-width apart and feel your connection to the ground",
              "Straighten your spine and let your shoulders relax but widen",
              "Take three deep breaths into your belly",
              "Say to yourself: 'I belong here and I have value'",
              "Notice: this confident posture is not fake - it\'s your natural state",
            ],
          },
        ],
      },
      confidence_building: {
        foundational_beliefs: [
          "I have an inherent right to exist and be seen",
          "My authentic presence adds value to every situation",
          "Standing tall serves others by giving them permission to do the same",
        ],
      },
      daily_empowerment_practices: [
        {
          name: "Daily Dignity Reminder",
          instruction:
            "Each morning, stand tall and remind yourself: 'I belong here and my presence matters'",
          timing: "Every morning",
        },
      ],
    };
  }
}
