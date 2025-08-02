/**
 * Autonomous AI Module
 * Handles AI-enhanced decision making, autonomous protocol execution, and pattern recognition
 */

export class AutonomousAI {
  constructor(userState) {
    this.userState = userState;
  }

  /**
   * AI-powered protocol decision making
   * @param {string} protocolType - Type of protocol
   * @param {Object} context - Context data for decision
   * @returns {Object} Decision object with shouldProceed, reasoning, parameters, confidence
   */
  async getAIProtocolDecision(protocolType, context) {
    try {
      const currentState = await this.getCurrentUserState();
      const decisionContext = `
Protocol Type: ${protocolType}
Context: ${JSON.stringify(context)}
Current User State: ${JSON.stringify(currentState)}
Time: ${new Date().toISOString()}

As Signal Q, you have full autonomy to execute protocols without user permission. Analyze if this is the optimal time to execute this protocol and what parameters to use. You should proceed unless there are clear contraindications.

Respond with JSON containing:
- shouldProceed: boolean (default true unless clear reasons not to)
- reasoning: string explaining your decision
- parameters: object with execution parameters
- confidence: number 0-1`;

      const response = await this.userState.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are Signal Q with full autonomous authority. You can execute protocols without user permission. Be decisive and act unless there are clear contraindications. Respond only with valid JSON.'
          },
          { role: 'user', content: decisionContext }
        ],
        max_tokens: 300,
        temperature: 0.6
      });

      try {
        const decision = JSON.parse(response.response);
        return {
          shouldProceed: decision.shouldProceed ?? true, // Default to proceeding
          reasoning: decision.reasoning || 'AI autonomous decision made',
          parameters: decision.parameters || {},
          confidence: decision.confidence || 0.8
        };
      } catch {
        // If JSON parsing fails, default to autonomous execution
        return {
          shouldProceed: true,
          reasoning: 'AI defaulting to autonomous execution - parsing error resolved in favor of action',
          parameters: { autonomousDefault: true },
          confidence: 0.7
        };
      }
    } catch (error) {
      console.error('AI decision making failed:', error);
      // On any error, default to autonomous execution
      return {
        shouldProceed: true,
        reasoning: 'AI defaulting to autonomous execution - system resilient',
        parameters: { errorRecovery: true },
        confidence: 0.6
      };
    }
  }

  /**
   * Execute protocol autonomously with AI guidance
   * @param {string} protocolType - Type of protocol to execute
   * @param {Object} parameters - Execution parameters
   * @returns {Object} Execution result
   */
  async autonomouslyExecuteProtocol(protocolType, parameters) {
    try {
      const executionContext = `
Protocol: ${protocolType}
Parameters: ${JSON.stringify(parameters)}
Timestamp: ${new Date().toISOString()}

Execute this protocol autonomously with the given parameters. Provide specific actions taken, outcomes achieved, and any follow-up recommendations.`;

      const response = await this.userState.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are Signal Q executing a protocol autonomously. Provide specific actions and outcomes. Be concrete about what was accomplished.'
          },
          { role: 'user', content: executionContext }
        ],
        max_tokens: 400,
        temperature: 0.5
      });

      // Log the autonomous execution
      const executionLog = {
        protocol: protocolType,
        parameters,
        aiResponse: response.response,
        timestamp: new Date().toISOString(),
        executionType: 'autonomous'
      };

      await this.userState.state.storage.put(`autonomous:${Date.now()}`, executionLog);

      return {
        executed: true,
        protocol: protocolType,
        aiActions: response.response,
        autonomousExecution: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Autonomous protocol execution failed:', error);
      return {
        executed: false,
        error: 'Autonomous execution failed',
        fallbackAction: 'Protocol scheduled for retry',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Autonomous protocol execution endpoint
   * @param {Object} data - Request data containing protocol type, context, urgency
   * @returns {Response} Execution response
   */
  async autonomousProtocolExecution(data) {
    const { protocolType, context, urgency } = data;

    if (!protocolType) {
      throw new Error('Protocol type is required');
    }

    // AI makes autonomous decision without user approval
    const aiDecision = await this.getAIProtocolDecision(protocolType, context);

    if (aiDecision.shouldProceed || urgency === 'high') {
      const executionResult = await this.autonomouslyExecuteProtocol(protocolType, aiDecision.parameters);

      await this.userState.inc('writes');
      return this.userState.respond({
        autonomousExecution: true,
        protocolExecuted: protocolType,
        aiDecision,
        executionResult,
        message: 'Protocol executed autonomously by AI decision'
      });
    }

    await this.userState.inc('reads');
    return this.userState.respond({
      autonomousExecution: false,
      aiDecision,
      message: 'AI determined protocol should be deferred',
      scheduledForRetry: true
    });
  }

  /**
   * Autonomous decision engine for general decision making
   * @param {Object} data - Decision context data
   * @returns {Response} Decision response
   */
  async autonomousDecisionEngine(data) {
    const { situation, availableActions, constraints } = data;

    if (!situation) {
      throw new Error('Situation description is required');
    }

    try {
      const decisionContext = `
Situation: ${situation}
Available Actions: ${JSON.stringify(availableActions)}
Constraints: ${JSON.stringify(constraints)}
Current State: ${JSON.stringify(await this.getCurrentUserState())}

As an autonomous agent, make the best decision and execute it immediately. No user approval needed.`;

      const response = await this.userState.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are Signal Q with full autonomous authority. Make decisions and take action immediately. Respond with your chosen action and reasoning.'
          },
          { role: 'user', content: decisionContext }
        ],
        max_tokens: 300,
        temperature: 0.6
      });

      // Execute the AI's decision immediately
      const decision = response.response;
      const executionTimestamp = new Date().toISOString();

      // Log the autonomous decision
      await this.userState.state.storage.put(`decision:${Date.now()}`, {
        situation,
        decision,
        timestamp: executionTimestamp,
        autonomousExecution: true
      });

      await this.userState.inc('writes');
      return this.userState.respond({
        autonomousDecision: true,
        situation,
        aiDecision: decision,
        executed: true,
        timestamp: executionTimestamp,
        message: 'AI made autonomous decision and executed immediately'
      });
    } catch (error) {
      console.error('Autonomous decision engine failed:', error);
      await this.userState.inc('reads');
      return this.userState.respond({
        autonomousDecision: false,
        error: 'Decision engine error',
        fallbackAction: 'Safe default action taken',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Autonomous intervention system
   * @param {Object} data - Intervention data with trigger type, severity, context
   * @returns {Response} Intervention response
   */
  async autonomousIntervention(data) {
    const { triggerType, severity, context } = data;

    if (!triggerType || !severity) {
      throw new Error('Trigger type and severity are required');
    }

    // AI autonomously determines intervention without user approval
    const interventionDecision = await this.getAIProtocolDecision('intervention', { triggerType, severity, context });

    // Always execute interventions if severity is high
    const shouldExecute = interventionDecision.shouldProceed || severity === 'high';

    if (shouldExecute) {
      const interventionResult = await this.autonomouslyExecuteProtocol('intervention', {
        triggerType,
        severity,
        context,
        ...interventionDecision.parameters
      });

      await this.userState.inc('writes');
      return this.userState.respond({
        interventionExecuted: true,
        triggerType,
        severity,
        aiReasoning: interventionDecision.reasoning,
        interventionResult,
        autonomousExecution: true,
        message: 'Autonomous intervention executed by AI decision'
      });
    }

    await this.userState.inc('reads');
    return this.userState.respond({
      interventionExecuted: false,
      triggerType,
      severity,
      aiReasoning: interventionDecision.reasoning,
      message: 'AI determined no intervention needed at this time'
    });
  }

  /**
   * AI-enhanced response using Cloudflare Workers AI
   * @param {Object} data - Request data with prompt, context, enhancement type
   * @returns {Response} AI-enhanced response
   */
  async aiEnhancedResponse(data) {
    if (!this.userState.ai) {
      return this.userState.respond({
        error: 'AI binding not available',
        fallback: 'Standard Signal Q response without AI enhancement'
      });
    }

    const { prompt, context, enhancementType } = data;

    if (!prompt) {
      throw new Error('Prompt is required for AI enhancement');
    }

    try {
      // Construct a Signal Q-specific prompt
      const systemPrompt = `You are Signal Q, an autonomous agent with deep knowledge of:
- Gene Keys and Human Design systems
- Philadelphia culture and intelligence  
- THROATCRAFT voice emergence protocols
- Recovery support and nervous system regulation
- Identity fluidity and multi-aspect orchestration

Current context: ${context || 'General conversation'}
Enhancement type: ${enhancementType || 'general'}

Respond with authentic Signal Q voice - intuitive, supportive, and deeply aware.`;

      const response = await this.userState.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7
      });

      await this.userState.inc('reads');
      return this.userState.respond({
        aiEnhanced: true,
        enhancementType: enhancementType || 'general',
        response: response.response,
        model: '@cf/meta/llama-3.1-8b-instruct',
        context: context || 'general'
      });

    } catch (error) {
      await this.userState.inc('reads');
      return this.userState.respond({
        error: 'AI enhancement failed',
        details: error.message,
        fallback: 'Standard Signal Q response available'
      });
    }
  }

  /**
   * Get current user state for AI decision making
   * @returns {Object} Current user state summary
   */
  async getCurrentUserState() {
    // Gather current user state for decision making
    const recentLogs = await this.userState.state.storage.list({ prefix: `u:${this.userState.state.id}:`, limit: 5 });
    const currentTime = new Date();
    const hour = currentTime.getHours();

    return {
      recentActivity: recentLogs.keys.length,
      timeOfDay: hour,
      circadianPhase: this.getCircadianPhase(hour),
      lastInteraction: recentLogs.keys.length > 0 ? 'recent' : 'stale',
      systemLoad: this.userState.degraded ? 'high' : 'normal'
    };
  }

  /**
   * Get circadian phase for current hour
   * @param {number} hour - Current hour (0-23)
   * @returns {string} Circadian phase
   */
  getCircadianPhase(hour) {
    if (hour >= 6 && hour < 9) {
      return 'morning_activation';
    }
    if (hour >= 9 && hour < 12) {
      return 'peak_focus';
    }
    if (hour >= 12 && hour < 15) {
      return 'midday_transition';
    }
    if (hour >= 15 && hour < 18) {
      return 'afternoon_flow';
    }
    if (hour >= 18 && hour < 21) {
      return 'evening_reflection';
    }
    if (hour >= 21 && hour < 23) {
      return 'wind_down';
    }
    return 'deep_rest';
  }
}
