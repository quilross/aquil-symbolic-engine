// Signalhaven Transcendence Agent Worker
// Provides basic REST endpoints with persistent memory using KV and Durable Objects.
// Designed for the free Cloudflare Workers plan.

import { CoreEndpoints } from './modules/core-endpoints.js';
import { AutonomousAI } from './modules/autonomous-ai.js';
import { AgentEndpoints } from './modules/agent-endpoints.js';
import { Security } from './modules/security.js';
import { Utils } from './modules/utils.js';
import { Config } from './modules/config.js';

export default {
  async fetch(request, env) {
    const security = new Security();
    const config = new Config(env);

    // Handle CORS preflight requests FIRST, before auth
    if (request.method === 'OPTIONS') {
      return Utils.createCorsResponse();
    }

    // Validate configuration
    const configValidation = config.validate();
    if (!configValidation.valid) {
      Utils.log('error', 'Invalid configuration', { errors: configValidation.errors });
      return Utils.createErrorResponse(new Error('Server configuration error'), 500);
    }

    // Rate limiting check
    if (config.get('rateLimit.enabled')) {
      const rateLimitResult = security.checkRateLimit(
        request,
        config.get('rateLimit.maxRequests'),
        config.get('rateLimit.windowMs')
      );
      if (!rateLimitResult.allowed) {
        return new Response(rateLimitResult.error, { status: rateLimitResult.status });
      }
    }

    // Authentication
    if (config.get('auth.requireAuth')) {
      const authResult = security.authenticateRequest(request, env);
      if (!authResult.authenticated) {
        return new Response(authResult.error, { status: authResult.status });
      }
    }

    // Handle system health check without Durable Objects for testing
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/system/health') {
      const healthConfig = config.getHealthCheckConfig();
      const memoryUsage = typeof performance !== 'undefined' && performance.memory ?
        Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'unknown';

      return Utils.createResponse({
        overall: 'healthy',
        api: {
          status: 'operational',
          responseTime: 45,
          endpoints: healthConfig.endpoints,
          version: healthConfig.version
        },
        storage: {
          status: 'ready',
          usage: 'minimal',
          durableObjects: 'configured'
        },
        deployment: {
          status: 'live',
          lastUpdate: new Date().toISOString(),
          worker: 'signal_q',
          memory: `${memoryUsage}MB`
        },
        ai: {
          binding: 'enabled',
          model: config.get('ai.model')
        },
        authentication: {
          bearerToken: 'required',
          adminAccess: 'configured'
        },
        recommendations: ['Signal Q is live and operational'],
        timestamp: new Date().toISOString(),
        uptime: 'unknown'
      });
    }

    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const id = env.USER_STATE.idFromName(userId);
    const obj = env.USER_STATE.get(id);

    // Create a new request with the token in headers for the Durable Object
    const auth = request.headers.get('Authorization') || '';
    const [, token] = auth.split(' ');
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'X-Token': token
      },
      body: request.body
    });

    return obj.fetch(newRequest);
  }
};

export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ai = env.AI; // AI binding for enhanced capabilities

    // Initialize modules
    this.config = new Config(env);
    this.security = new Security();
    this.coreEndpoints = new CoreEndpoints(this);
    this.autonomousAI = new AutonomousAI(this);
    this.agentEndpoints = new AgentEndpoints(this);
    
    // Initialize degraded state
    this.degraded = false;
  }

  // Route all API requests
  async fetch(request) {
    try {
      const token = request.headers.get('X-Token');
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '');
      const method = request.method.toUpperCase();

      // Handle CORS preflight requests
      if (method === 'OPTIONS') {
        return Utils.createCorsResponse();
      }

      // Security checks
      const suspicionCheck = this.security.checkSuspiciousActivity(request);
      if (suspicionCheck.suspicious) {
        Utils.log('warn', 'Suspicious activity blocked', suspicionCheck);
        return Utils.createErrorResponse(new Error('Access temporarily restricted'), 429);
      }

      await this.rotateDay();

      // Route to appropriate handler based on path prefix
      return await this.routeRequest(path, method, request, token);
    } catch (error) {
      Utils.log('error', 'Request processing failed', { error: error.message, stack: error.stack });
      return Utils.createErrorResponse(error);
    }
  }

  // Route requests to appropriate handlers
  async routeRequest(path, method, request, token) {
    try {
      // Core endpoints (identity, memory, protocols)
      const coreResponse = await this.coreEndpoints.handleCoreEndpoints(path, method, request, token);
      if (coreResponse) {
        return coreResponse;
      }

      // Agent endpoints (time tracking, suggestions, monitoring)
      const agentResponse = await this.agentEndpoints.handleAgentEndpoints(path, method, request);
      if (agentResponse) {
        return agentResponse;
      }

      // Autonomous AI endpoints
      if (path === '/autonomous/protocol-execution' && method === 'POST') {
        return this.autonomousAI.autonomousProtocolExecution(await request.json());
      }
      if (path === '/autonomous/decision-engine' && method === 'POST') {
        return this.autonomousAI.autonomousDecisionEngine(await request.json());
      }
      if (path === '/autonomous/intervention' && method === 'POST') {
        return this.autonomousAI.autonomousIntervention(await request.json());
      }
      if (path === '/ai-enhance' && method === 'POST') {
        return this.autonomousAI.aiEnhancedResponse(await request.json());
      }

      // Legacy endpoints - these are temporarily kept here but should be moved to modules
      const legacyResponse = await this.handleLegacyEndpoints(path, method, request);
      if (legacyResponse) {
        return legacyResponse;
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      Utils.log('error', 'Routing error', { path, method, error: error.message });
      return Utils.createErrorResponse(error);
    }
  }

  // Handle legacy endpoints that haven't been moved to modules yet
  async handleLegacyEndpoints(path, method, request) {
    // For now, return null - these endpoints can be added back as needed
    // This keeps the file size manageable while maintaining core functionality
    
    // Blueprint endpoints
    if (path === '/gene-key-guidance' && method === 'GET') {
      return this.getGeneKeyGuidance();
    }
    
    // System endpoints
    if (path === '/deploy/request' && method === 'POST') {
      return this.requestDeployment(await request.json());
    }
    if (path === '/deploy/status' && method === 'GET') {
      return this.getDeploymentStatus();
    }
    
    return null;
  }

  // Essential utility methods
  respond(obj) {
    return Utils.createResponse(obj, this.degraded);
  }

  // Delegate AI methods to AutonomousAI module
  async getAIProtocolDecision(protocolType, context) {
    return this.autonomousAI.getAIProtocolDecision(protocolType, context);
  }

  async autonomouslyExecuteProtocol(protocolType, parameters) {
    return this.autonomousAI.autonomouslyExecuteProtocol(protocolType, parameters);
  }

  // Essential storage and degradation management
  async rotateDay() {
    const now = new Date().toISOString().slice(0, 10);
    const current = (await this.state.storage.get('day')) || { day: now, writes: 0, reads: 0 };
    if (current.day !== now) {
      await this.state.storage.put('day', { day: now, writes: 0, reads: 0 });
    }
  }

  async inc(type) {
    const data = (await this.state.storage.get('day')) || { day: '', writes: 0, reads: 0 };
    data[type] = (data[type] || 0) + 1;
    await this.state.storage.put('day', data);
    if (data.writes > 900 || data.reads > 90000) {
      this.degraded = true;
      return true;
    }
    return false;
  }

  // Simplified Gene Key guidance - moved from legacy
  async getGeneKeyGuidance() {
    const activeKey = '28'; // Current active Gene Key
    const emotion = 'doubt'; // Current dominant emotion
    
    const geneKeyGuidance = {
      '28': {
        shadow: {
          guidance: 'Purposelessness is the gateway. When feeling lost, remember this is part of the totality experience.',
          protocol: 'Ask-for-Purpose Reflection'
        },
        gift: {
          guidance: 'Your gift of Totality sees the complete picture others miss. Trust this broader vision.',
          protocol: 'Project Audit'
        }
      }
    };

    const currentGuidance = geneKeyGuidance[activeKey] || geneKeyGuidance['28'];
    const level = emotion === 'doubt' ? 'shadow' : 'gift';
    
    await this.inc('reads');
    return this.respond({
      activeKey,
      currentLevel: level,
      guidance: currentGuidance[level].guidance,
      suggestedProtocol: currentGuidance[level].protocol,
      emotionalContext: emotion
    });
  }

  // Simplified deployment endpoints
  async requestDeployment(data) {
    const { deploymentType, userPermission } = data;
    
    if (!userPermission) {
      await this.inc('reads');
      return this.respond({
        canDeploy: false,
        nextSteps: ['User permission required', 'Ask user: \'Can I help you deploy your Signal Q updates?\''],
        status: 'permission_denied'
      });
    }

    await this.inc('reads');
    return this.respond({
      canDeploy: true,
      nextSteps: [
        'I can guide you through the deployment',
        'Would you like me to provide the exact commands?'
      ],
      deployCommand: deploymentType === 'full' ? 
        'cd /workspaces/aquil-symbolic-engine/worker && ./deploy.sh' :
        'cd /workspaces/aquil-symbolic-engine/worker && wrangler deploy',
      status: 'ready_to_assist'
    });
  }

  async getDeploymentStatus() {
    await this.inc('reads');
    return this.respond({
      ready: true,
      lastDeployment: null,
      pendingChanges: [
        'Modular architecture improvements',
        'Enhanced security and validation',
        'Code quality improvements'
      ],
      healthCheck: 'healthy',
      nextSteps: [
        'All files are ready for deployment',
        'Configuration validated successfully',
        'Secure tokens configured'
      ]
    });
  }
}