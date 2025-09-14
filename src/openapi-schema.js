/**
 * Manual OpenAPI Schema Generator for Aquil Symbolic Engine
 * Creates OpenAPI YAML/JSON schema from route definitions
 */

import YAML from 'js-yaml';

// Manual schema definition based on existing routes
const openApiSchema = {
  openapi: '3.1.0',
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
  paths: {
    '/api/session-init': {
      get: {
        summary: 'Initialize session',
        description: 'Initialize a new session for ChatGPT integration',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Session initialized successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    session_id: { type: 'string' },
                    timestamp: { type: 'string' },
                    status: { type: 'string' },
                    capabilities: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/system/health-check': {
      get: {
        summary: 'Health check',
        description: 'Check system health and service availability',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    version: { type: 'string' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'string' },
                        kv_store: { type: 'string' },
                        r2_storage: { type: 'string' },
                        vectorize: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/log': {
      post: {
        summary: 'Log data or conversation event',
        description: 'Primary logging endpoint for all conversation events, insights, and system actions',
        tags: ['Logging'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: 'Type of log entry' },
                  session_id: { type: 'string', description: 'Session identifier' },
                  voice: { type: 'string', description: 'Who is speaking (user, assistant, system)' },
                  level: { type: 'string', description: 'Log level (info, warn, error)' },
                  payload: { description: 'Log payload data' },
                  autonomous: { type: 'boolean', description: 'Whether this is an autonomous action' }
                },
                required: ['type']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successfully logged entry',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    id: { type: 'string' },
                    session_id: { type: 'string' },
                    timestamp: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    details: {}
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/logs': {
      get: {
        summary: 'Retrieve logs',
        description: 'Get logs with optional filtering and pagination',
        tags: ['Logging'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of logs to return',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'session_id',
            in: 'query',
            description: 'Filter by session ID',
            schema: { type: 'string' }
          },
          {
            name: 'level',
            in: 'query',
            description: 'Filter by log level',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'List of logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean' },
                          id: { type: 'string' },
                          session_id: { type: 'string' },
                          timestamp: { type: 'string' },
                          message: { type: 'string' }
                        }
                      }
                    },
                    total: { type: 'number' },
                    hasMore: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/journal/entries': {
      get: {
        summary: 'Get journal entries',
        description: 'Retrieve journal entries with optional filtering',
        tags: ['Journal'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of entries to return',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'type',
            in: 'query',
            description: 'Filter by entry type',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'List of journal entries',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: 'Unique identifier for the journal entry' },
                          type: { type: 'string', description: 'Type of journal entry' },
                          detail: { type: 'string', description: 'Detailed content of the entry' },
                          timestamp: { type: 'string', description: 'ISO 8601 timestamp' },
                          storedIn: { type: 'string', enum: ['KV', 'D1'], description: 'Storage location' }
                        },
                        required: ['id', 'type', 'timestamp', 'storedIn']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create journal entry',
        description: 'Create a new journal entry in the specified storage system',
        tags: ['Journal'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Unique identifier for the journal entry' },
                  type: { type: 'string', description: 'Type of journal entry' },
                  detail: { type: 'string', description: 'Detailed content of the entry' },
                  timestamp: { type: 'string', description: 'ISO 8601 timestamp' },
                  storedIn: { type: 'string', enum: ['KV', 'D1'], description: 'Storage location' }
                },
                required: ['id', 'type', 'timestamp', 'storedIn']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Journal entry created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    id: { type: 'string' },
                    key: { type: 'string' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid journal entry data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      JournalEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier for the journal entry' },
          type: { type: 'string', description: 'Type of journal entry' },
          detail: { type: 'string', description: 'Detailed content of the entry' },
          timestamp: { type: 'string', description: 'ISO 8601 timestamp' },
          storedIn: { type: 'string', enum: ['KV', 'D1'], description: 'Storage location' }
        },
        required: ['id', 'type', 'timestamp', 'storedIn']
      },
      LogEntry: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Type of log entry' },
          session_id: { type: 'string', description: 'Session identifier' },
          voice: { type: 'string', description: 'Who is speaking (user, assistant, system)' },
          level: { type: 'string', description: 'Log level (info, warn, error)' },
          payload: { description: 'Log payload data' },
          autonomous: { type: 'boolean', description: 'Whether this is an autonomous action' }
        },
        required: ['type']
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: {}
        }
      }
    }
  },
  tags: [
    { name: 'System', description: 'System operations and health checks' },
    { name: 'Logging', description: 'Logging and retrieval operations' },
    { name: 'Journal', description: 'Journal entry management' },
    { name: 'Personal Development', description: 'Personal growth and development tools' }
  ]
};

/**
 * Generate OpenAPI schema as YAML
 */
export function generateOpenAPIYAML() {
  try {
    return YAML.dump(openApiSchema, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  } catch (error) {
    console.error('Error generating YAML:', error);
    return `# Error generating OpenAPI YAML: ${error.message}`;
  }
}

/**
 * Generate OpenAPI schema as JSON
 */
export function generateOpenAPIJSON() {
  return JSON.stringify(openApiSchema, null, 2);
}

/**
 * Get the raw schema object
 */
export function getSchema() {
  return openApiSchema;
}

export default {
  generateOpenAPIYAML,
  generateOpenAPIJSON,
  getSchema,
  schema: openApiSchema
};