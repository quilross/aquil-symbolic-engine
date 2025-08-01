#!/usr/bin/env node

/**
 * Signal Q OpenAPI Spec Updater
 * 
 * This script updates the OpenAPI spec to include all endpoints
 * that are implemented in the worker but missing from the spec.
 */

const fs = require('fs');
const path = require('path');

// Load current OpenAPI spec
const openApiPath = path.join(__dirname, 'src', 'openapi-core.json');
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));

// Define missing endpoints based on implementation analysis
const missingEndpoints = {
  "/identity-nodes": {
    "get": {
      "operationId": "listIdentityNodes",
      "summary": "List all stored identity nodes",
      "responses": {
        "200": { "description": "List of identity nodes" }
      }
    },
    "post": {
      "operationId": "createIdentityNode", 
      "summary": "Create a new identity node",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "identity_key": { "type": "string" },
                "description": { "type": "string" },
                "active": { "type": "boolean" }
              },
              "required": ["identity_key"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Identity node created" }
      }
    }
  },
  
  "/voice-shifts": {
    "post": {
      "operationId": "recordVoiceShift",
      "summary": "Record a voice shift event",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "from_voice": { "type": "string" },
                "to_voice": { "type": "string" },
                "context": { "type": "string" },
                "intensity": { "type": "number" }
              },
              "required": ["from_voice", "to_voice"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Voice shift recorded" }
      }
    }
  },

  "/identity-memories": {
    "post": {
      "operationId": "logMemory",
      "summary": "Log a symbolic memory snapshot",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "content": { "type": "string" },
                "context": { "type": "string" },
                "emotional_state": { "type": "string" }
              },
              "required": ["content"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Memory logged" }
      }
    }
  },

  "/narratives/generate": {
    "post": {
      "operationId": "generateNarrative",
      "summary": "Generate narrative from memory log",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "memory_log_id": { "type": "string" },
                "narrative_type": { "type": "string" }
              },
              "required": ["memory_log_id"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Generated narrative" }
      }
    }
  },

  "/ritual-actions/trigger": {
    "post": {
      "operationId": "triggerRitualAction",
      "summary": "Trigger a ritual action with AI autonomy",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "ritual_type": { "type": "string" },
                "context": { "type": "string" },
                "intention": { "type": "string" }
              },
              "required": ["ritual_type"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Ritual action triggered" }
      }
    }
  },

  "/friction-ratings": {
    "post": {
      "operationId": "recordFrictionRating",
      "summary": "Record user friction rating",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "friction_type": { "type": "string" },
                "rating": { "type": "number", "minimum": 1, "maximum": 10 }
              },
              "required": ["friction_type", "rating"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Friction rating recorded" }
      }
    }
  },

  "/play-protocols": {
    "get": {
      "operationId": "listPlayProtocols",
      "summary": "List available play protocols",
      "responses": {
        "200": { "description": "List of play protocols" }
      }
    },
    "post": {
      "operationId": "createPlayProtocol",
      "summary": "Create or log a new play protocol",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "description": { "type": "string" },
                "activities": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["name"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Play protocol created" }
      }
    }
  },

  "/media-engagements": {
    "post": {
      "operationId": "logMediaEngagement",
      "summary": "Log media engagement with impact mapping",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "media_type": { "type": "string" },
                "content": { "type": "string" },
                "impact_rating": { "type": "number" },
                "emotional_response": { "type": "string" }
              },
              "required": ["media_type", "content"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Media engagement logged" }
      }
    }
  },

  "/feedback": {
    "post": {
      "operationId": "logFeedback",
      "summary": "Log user feedback with leadership rotation",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "feedback": { "type": "string" },
                "rating": { "type": "number" },
                "category": { "type": "string" }
              },
              "required": ["feedback"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Feedback logged" }
      }
    }
  },

  "/logs": {
    "get": {
      "operationId": "getLogs",
      "summary": "Get user logs",
      "responses": {
        "200": { "description": "User logs" }
      }
    }
  },

  "/export-logs": {
    "get": {
      "operationId": "exportLogs",
      "summary": "Export all logs (admin only)",
      "responses": {
        "200": { "description": "Exported logs" },
        "403": { "description": "Admin access required" }
      }
    }
  },

  "/reset": {
    "post": {
      "operationId": "resetUserData",
      "summary": "Reset all user data (admin only)",
      "responses": {
        "200": { "description": "Data reset complete" },
        "403": { "description": "Admin access required" }
      }
    }
  },

  "/track-time": {
    "post": {
      "operationId": "trackTime",
      "summary": "Track time and timezone information",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "activity": { "type": "string" },
                "duration": { "type": "number" },
                "timezone": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Time tracking information" }
      }
    }
  },

  "/session-monitor": {
    "post": {
      "operationId": "sessionMonitor",
      "summary": "Monitor session duration and health",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "maxDuration": { "type": "number" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Session monitoring status" }
      }
    }
  },

  "/movement-reminder": {
    "post": {
      "operationId": "movementReminder",
      "summary": "Check movement patterns and reminders",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "lastMovement": { "type": "string", "format": "date-time" },
                "reminderInterval": { "type": "number" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Movement reminder status" }
      }
    }
  },

  "/agent-overwhelm": {
    "get": {
      "operationId": "getAgentOverwhelm",
      "summary": "Check agent system load and overwhelm",
      "responses": {
        "200": { "description": "Agent overwhelm status" }
      }
    }
  },

  "/privacy-settings": {
    "get": {
      "operationId": "getPrivacySettings",
      "summary": "Get current privacy settings",
      "responses": {
        "200": { "description": "Privacy settings" }
      }
    },
    "post": {
      "operationId": "updatePrivacySettings",
      "summary": "Update privacy settings",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "dataRetention": { "type": "string" },
                "loggingLevel": { "type": "string" },
                "shareWithAgent": { "type": "boolean" },
                "anonymizeData": { "type": "boolean" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Privacy settings updated" }
      }
    }
  },

  "/autonomous/protocol-execution": {
    "post": {
      "operationId": "autonomousProtocolExecution",
      "summary": "Execute protocols autonomously without user approval",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "protocolType": { "type": "string" },
                "context": { "type": "string" },
                "urgency": { "type": "string", "enum": ["low", "medium", "high"] }
              },
              "required": ["protocolType"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Autonomous protocol execution result" }
      }
    }
  },

  "/autonomous/decision-engine": {
    "post": {
      "operationId": "autonomousDecisionEngine",
      "summary": "AI autonomous decision making and execution",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "situation": { "type": "string" },
                "availableActions": { "type": "array", "items": { "type": "string" } },
                "constraints": { "type": "object" }
              },
              "required": ["situation"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Autonomous decision result" }
      }
    }
  },

  "/autonomous/intervention": {
    "post": {
      "operationId": "autonomousIntervention",
      "summary": "Autonomous intervention system",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "triggerType": { "type": "string" },
                "severity": { "type": "string", "enum": ["low", "medium", "high"] },
                "context": { "type": "string" }
              },
              "required": ["triggerType"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Intervention result" }
      }
    }
  }
};

// Add security to all new endpoints
Object.keys(missingEndpoints).forEach(path => {
  Object.keys(missingEndpoints[path]).forEach(method => {
    missingEndpoints[path][method].security = [{ "bearerAuth": [] }];
  });
});

// Merge missing endpoints into the spec
Object.assign(openApiSpec.paths, missingEndpoints);

// Update metadata
openApiSpec.info.version = "2.1.0";
openApiSpec.info.description = "Complete Signal Q autonomous agent endpoints for CustomGPT integration. Core functionality across 4 creative lineages (THROATCRAFT, ARK, LUNACRAFT, Somatic) with AI-enhanced decision making. Now includes all implemented endpoints.";

// Update endpoint count in health check
const totalEndpoints = Object.keys(openApiSpec.paths).reduce(
  (count, path) => count + Object.keys(openApiSpec.paths[path]).length, 0
);

console.log(`🔄 Updating OpenAPI spec...`);
console.log(`📊 Added ${Object.keys(missingEndpoints).length} missing endpoint paths`);
console.log(`📈 Total endpoints now: ${totalEndpoints}`);

// Save updated spec
const backupPath = path.join(__dirname, 'src', 'openapi-core-backup.json');
fs.writeFileSync(backupPath, JSON.stringify(JSON.parse(fs.readFileSync(openApiPath, 'utf8')), null, 2));
console.log(`💾 Backup saved to: ${backupPath}`);

fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2));
console.log(`✅ Updated OpenAPI spec saved to: ${openApiPath}`);

// Also update the endpoint count in the worker health check
const workerPath = path.join(__dirname, 'src', 'index.js');
let workerCode = fs.readFileSync(workerPath, 'utf8');
workerCode = workerCode.replace(/const endpointCount = \d+;/, `const endpointCount = ${totalEndpoints};`);
fs.writeFileSync(workerPath, workerCode);
console.log(`📝 Updated endpoint count in worker to: ${totalEndpoints}`);

console.log(`\n🎉 OpenAPI spec alignment complete!`);
console.log(`📋 Spec now includes all ${totalEndpoints} implemented endpoints`);
console.log(`🔗 Ready for deployment and testing`);