/**
 * OpenAPI-enabled Router for Aquil Symbolic Engine
 * This router provides OpenAPI schema generation and validation
 */

import { OpenAPIRouter } from '@cloudflare/itty-router-openapi';
import { z } from 'zod';

// Import existing utilities
import { logChatGPTAction } from './actions/logging.js';
import { arkLog, arkRetrieve, arkStatus } from './ark/ark-endpoints.js';
import { handleSessionInit, handleHealthCheck } from './ark/endpoints.js';
import { corsHeaders } from './utils/cors.js';

// Create OpenAPI router with configuration
export const openApiRouter = OpenAPIRouter({
  schema: {
    info: {
      title: 'Aquil Symbolic Engine API',
      description: 'Personal AI Wisdom Builder & Trust Reinforcement System with full OpenAPI documentation',
      version: '2.0.0',
    },
    servers: [
      {
        url: 'https://signal-q.me',
        description: 'Production server',
      },
    ],
  },
  docs_url: '/openapi',
  openapi_url: '/openapi.yaml',
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
  },
});

// Schema definitions for request/response validation
const LogEntrySchema = z.object({
  type: z.string().describe('Type of log entry'),
  session_id: z.string().optional().describe('Session identifier'),
  voice: z.string().optional().describe('Who is speaking (user, assistant, system)'),
  level: z.string().optional().describe('Log level (info, warn, error)'),
  payload: z.any().describe('Log payload data'),
  autonomous: z.boolean().optional().describe('Whether this is an autonomous action'),
});

const LogResponseSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  session_id: z.string().optional(),
  timestamp: z.string(),
  message: z.string().optional(),
});

const HealthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string(),
  services: z.object({
    database: z.string(),
    kv_store: z.string(),
    r2_storage: z.string(),
    vectorize: z.string(),
  }).optional(),
});

const SessionInitResponseSchema = z.object({
  session_id: z.string(),
  timestamp: z.string(),
  status: z.string(),
  capabilities: z.array(z.string()).optional(),
});

// OpenAPI route definitions with proper schema validation
openApiRouter.post('/api/log', {
  summary: 'Log data or conversation event',
  description: 'Primary logging endpoint for all conversation events, insights, and system actions',
  tags: ['Logging'],
  requestBody: LogEntrySchema,
  responses: {
    200: {
      description: 'Successfully logged entry',
      schema: LogResponseSchema,
    },
    400: {
      description: 'Invalid request data',
      schema: z.object({
        error: z.string(),
        details: z.any().optional(),
      }),
    },
  },
}, async (request, env, ctx) => {
  try {
    // Use existing handler
    const result = await arkLog(request, env);
    const body = await request.clone().json();
    const data = await result.clone().json();
    
    // Log the action
    await logChatGPTAction(env, 'logEntry', body, data);
    
    return result;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/logs', {
  summary: 'Retrieve logs',
  description: 'Get logs with optional filtering and pagination',
  tags: ['Logging'],
  parameters: [
    {
      name: 'limit',
      in: 'query',
      description: 'Maximum number of logs to return',
      schema: z.number().optional().default(20),
    },
    {
      name: 'session_id',
      in: 'query',
      description: 'Filter by session ID',
      schema: z.string().optional(),
    },
    {
      name: 'level',
      in: 'query',
      description: 'Filter by log level',
      schema: z.string().optional(),
    },
  ],
  responses: {
    200: {
      description: 'List of logs',
      schema: z.object({
        logs: z.array(LogResponseSchema),
        total: z.number().optional(),
        hasMore: z.boolean().optional(),
      }),
    },
  },
}, async (request, env, ctx) => {
  try {
    const result = await arkRetrieve(request, env);
    const data = await result.clone().json();
    
    await logChatGPTAction(env, 'retrieveLogs', { url: request.url }, data);
    
    return result;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/session-init', {
  summary: 'Initialize session',
  description: 'Initialize a new session for ChatGPT integration',
  tags: ['System'],
  responses: {
    200: {
      description: 'Session initialized successfully',
      schema: SessionInitResponseSchema,
    },
  },
}, async (request, env, ctx) => {
  try {
    const result = await handleSessionInit(request, env);
    const resultData = await result.clone().json();
    
    await logChatGPTAction(env, 'sessionInit', {}, resultData);
    
    return result;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/system/health-check', {
  summary: 'Health check',
  description: 'Check system health and service availability',
  tags: ['System'],
  responses: {
    200: {
      description: 'System health status',
      schema: HealthCheckResponseSchema,
    },
  },
}, async (request, env, ctx) => {
  try {
    const result = await handleHealthCheck(request, env);
    const data = await result.clone().json();
    
    await logChatGPTAction(env, 'healthCheck', {}, data);
    
    return result;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Personal Development endpoints
const PersonalDevResponseSchema = z.object({
  type: z.string(),
  result: z.object({
    insights: z.array(z.string()).optional(),
    practices: z.array(z.string()).optional(),
    next_steps: z.array(z.string()).optional(),
    message: z.string().optional(),
  }),
  session_id: z.string(),
  timestamp: z.string(),
});

const PersonalDevRequestSchema = z.object({
  content: z.any().describe('Content specific to the personal development type'),
  session_id: z.string().optional(),
});

// Define personal development endpoints
const personalDevTypes = [
  'gratitude',
  'healing', 
  'intuition',
  'purpose',
  'relationships',
  'shadow',
  'socratic',
  'ritual'
];

personalDevTypes.forEach(type => {
  openApiRouter.post(`/api/personal-development/${type}`, {
    summary: `${type.charAt(0).toUpperCase() + type.slice(1)} session`,
    description: `Process a ${type} personal development session`,
    tags: ['Personal Development'],
    requestBody: PersonalDevRequestSchema,
    responses: {
      200: {
        description: `${type} session result`,
        schema: PersonalDevResponseSchema,
      },
    },
  }, async (request, env, ctx) => {
    try {
      // This would be implemented by importing the appropriate processor
      // For now, return a basic response structure
      const body = await request.json();
      const result = {
        type,
        result: {
          message: `${type} session processed successfully`,
          insights: [`${type} insights would be generated here`],
          practices: [`${type} practices would be suggested here`],
          next_steps: [`${type} next steps would be provided here`],
        },
        session_id: body.session_id || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      
      await logChatGPTAction(env, 'personalDevelopmentSession', body, result);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
});

// Journal Entry endpoints (from the problem statement)
const JournalEntrySchema = z.object({
  id: z.string().describe('Unique identifier for the journal entry'),
  type: z.string().describe('Type of journal entry'),
  detail: z.string().optional().describe('Detailed content of the entry'),
  timestamp: z.string().describe('ISO 8601 timestamp'),
  storedIn: z.enum(['KV', 'D1']).describe('Storage location'),
});

const JournalResponseSchema = z.object({
  ok: z.boolean(),
  id: z.string().optional(),
  key: z.string().optional(),
  error: z.string().optional(),
});

openApiRouter.post('/api/journal/entries', {
  summary: 'Create journal entry',
  description: 'Create a new journal entry in the specified storage system',
  tags: ['Journal'],
  requestBody: JournalEntrySchema,
  responses: {
    200: {
      description: 'Journal entry created successfully',
      schema: JournalResponseSchema,
    },
    400: {
      description: 'Invalid journal entry data',
      schema: z.object({
        ok: z.literal(false),
        error: z.string(),
      }),
    },
  },
}, async (request, env, ctx) => {
  try {
    // Import the journal service function
    const { addEntry } = await import('./journalService.js');
    
    const body = await request.json();
    
    // Validate the journal entry
    if (!body.id || !body.type || !body.timestamp || !body.storedIn) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing required fields: id, type, timestamp, storedIn'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    let result;
    if (body.storedIn === 'KV') {
      result = await addEntry(env, body);
    } else if (body.storedIn === 'D1') {
      // For D1, we'd use the existing D1 insert logic
      const { exec } = await import('./actions/d1.js');
      await exec(env, 'insertLog', [
        body.id, body.type, body.detail || null, body.timestamp, 'D1'
      ]);
      result = { success: true, id: body.id };
    }
    
    const response = {
      ok: result.success,
      id: result.id,
      key: result.key,
    };
    
    await logChatGPTAction(env, 'createJournalEntry', body, response);
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/journal/entries', {
  summary: 'Get journal entries',
  description: 'Retrieve journal entries with optional filtering',
  tags: ['Journal'],
  parameters: [
    {
      name: 'limit',
      in: 'query',
      description: 'Maximum number of entries to return',
      schema: z.number().optional().default(20),
    },
    {
      name: 'type',
      in: 'query',
      description: 'Filter by entry type',
      schema: z.string().optional(),
    },
  ],
  responses: {
    200: {
      description: 'List of journal entries',
      schema: z.object({
        ok: z.boolean(),
        items: z.array(JournalEntrySchema),
      }),
    },
  },
}, async (request, env, ctx) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const type = url.searchParams.get('type');
    
    // Use existing retrieve logic - this would be adapted from the index.js handleRetrieve function
    const result = {
      ok: true,
      items: [], // Would be populated with actual data
    };
    
    await logChatGPTAction(env, 'getJournalEntries', { limit, type }, result);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

export default openApiRouter;