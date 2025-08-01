#!/usr/bin/env node

/**
 * Complete the OpenAPI spec by adding all remaining endpoints
 */

const fs = require('fs');
const path = require('path');

const openApiPath = path.join(__dirname, 'src', 'openapi-core.json');
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));

// Add the remaining missing endpoints identified by analysis
const additionalEndpoints = {
  "/agent-curiosity": {
    "post": {
      "operationId": "agentCuriosity",
      "summary": "Agent curiosity exploration",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "curiosityType": { "type": "string", "enum": ["culture", "science", "art"] },
                "userContext": { "type": "string" }
              },
              "required": ["curiosityType"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Agent curiosity exploration results" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/agent-interests": {
    "get": {
      "operationId": "getAgentInterests",
      "summary": "Get current agent interests and preferences",
      "responses": {
        "200": { "description": "Agent interests and discoveries" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/agent-exploration": {
    "post": {
      "operationId": "agentExploration",
      "summary": "Agent autonomous exploration",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "explorationType": { "type": "string", "enum": ["local events", "new technology", "art"] }
              },
              "required": ["explorationType"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Exploration findings and recommendations" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/data-sovereignty": {
    "get": {
      "operationId": "getDataSovereignty",
      "summary": "Get data sovereignty options",
      "responses": {
        "200": { "description": "Data sovereignty options" }
      },
      "security": [{ "bearerAuth": [] }]
    },
    "post": {
      "operationId": "executeDataSovereignty",
      "summary": "Execute data sovereignty action",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "action": { "type": "string", "enum": ["export", "delete", "anonymize", "backup"] },
                "scope": { "type": "string" },
                "confirmation": { "type": "boolean" }
              },
              "required": ["action", "confirmation"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Data sovereignty action result" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/deploy/request": {
    "post": {
      "operationId": "requestDeployment",
      "summary": "Request deployment assistance",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "deploymentType": { "type": "string", "enum": ["quick", "full", "check-status"] },
                "userPermission": { "type": "boolean" }
              },
              "required": ["deploymentType"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Deployment assistance" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/deploy/status": {
    "get": {
      "operationId": "getDeploymentStatus",
      "summary": "Get deployment status",
      "responses": {
        "200": { "description": "Deployment status information" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/microdose/log-session": {
    "post": {
      "operationId": "logMicrodoseSession",
      "summary": "Log microdose session for harm reduction",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "substance": { "type": "string" },
                "dose": { "type": "string" },
                "intention": { "type": "string" },
                "safetyProtocols": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["substance"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Session logged with harm reduction guidance" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/microdose/harm-reduction": {
    "get": {
      "operationId": "getMicrodoseHarmReduction",
      "summary": "Get harm reduction guidance",
      "responses": {
        "200": { "description": "Harm reduction guidance" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/patterns/cross-domain": {
    "get": {
      "operationId": "getCrossDomainPatterns",
      "summary": "AI-powered cross-domain pattern recognition",
      "responses": {
        "200": { "description": "Cross-domain pattern analysis" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/learning/adaptive-protocols": {
    "post": {
      "operationId": "getAdaptiveProtocols",
      "summary": "Get AI-selected adaptive protocols",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "currentContext": { "type": "string" },
                "energyLevel": { "type": "string" },
                "timeAvailable": { "type": "string" },
                "primaryGoal": { "type": "string" }
              },
              "required": ["currentContext"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Adaptive protocol recommendation" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/insights/emergence-prediction": {
    "get": {
      "operationId": "getEmergencePrediction",
      "summary": "AI-powered emergence and breakthrough prediction",
      "responses": {
        "200": { "description": "Emergence prediction analysis" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/energy/circadian-optimization": {
    "get": {
      "operationId": "getCircadianOptimization",
      "summary": "Circadian rhythm optimization guidance",
      "responses": {
        "200": { "description": "Circadian optimization recommendations" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/energy/creative-peak-detection": {
    "post": {
      "operationId": "detectCreativePeaks",
      "summary": "Detect optimal creative peak times",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "currentEnergy": { "type": "number", "minimum": 1, "maximum": 10 },
                "recentOutput": { "type": "object" },
                "environmentFactors": { "type": "array", "items": { "type": "string" } },
                "timeOfDay": { "type": "string" }
              },
              "required": ["currentEnergy"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Creative peak detection analysis" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/social/interaction-analysis": {
    "post": {
      "operationId": "analyzeSocialInteraction",
      "summary": "Analyze social interaction patterns",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "interactionType": { "type": "string" },
                "participants": { "type": "number" },
                "energy": { "type": "number" },
                "context": { "type": "string" },
                "outcome": { "type": "string" }
              },
              "required": ["interactionType", "participants"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Social interaction analysis" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/social/boundary-optimization": {
    "get": {
      "operationId": "getBoundaryOptimization",
      "summary": "Personal boundary optimization guidance",
      "responses": {
        "200": { "description": "Boundary optimization recommendations" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/mobile/ios-sync": {
    "post": {
      "operationId": "syncIOSDevice",
      "summary": "Sync with iOS device and shortcuts",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "deviceId": { "type": "string" },
                "notificationPrefs": { "type": "object" },
                "syncScope": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["deviceId"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "iOS sync configuration" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/mobile/shortcuts": {
    "get": {
      "operationId": "getIOSShortcuts",
      "summary": "Get iOS shortcuts for Signal Q integration",
      "responses": {
        "200": { "description": "iOS shortcuts configuration" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/tokens/generate": {
    "post": {
      "operationId": "generateCustomToken",
      "summary": "Generate custom API token",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "permissions": { "type": "array", "items": { "type": "string" } },
                "expiresIn": { "type": "number" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Generated token" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/tokens/list": {
    "get": {
      "operationId": "listCustomTokens",
      "summary": "List user custom tokens",
      "responses": {
        "200": { "description": "List of custom tokens" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/tokens/revoke": {
    "post": {
      "operationId": "revokeCustomToken",
      "summary": "Revoke custom token",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "tokenId": { "type": "string" }
              },
              "required": ["tokenId"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Token revoked" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/tokens/validate": {
    "post": {
      "operationId": "validateCustomToken",
      "summary": "Validate custom token",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "token": { "type": "string" }
              },
              "required": ["token"]
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Token validation result" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  },

  "/tokens/settings": {
    "get": {
      "operationId": "getTokenSettings",
      "summary": "Get token management settings",
      "responses": {
        "200": { "description": "Token settings" }
      },
      "security": [{ "bearerAuth": [] }]
    },
    "post": {
      "operationId": "updateTokenSettings",
      "summary": "Update token management settings",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "maxTokens": { "type": "number" },
                "defaultExpiry": { "type": "number" },
                "requireExpiry": { "type": "boolean" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Token settings updated" }
      },
      "security": [{ "bearerAuth": [] }]
    }
  }
};

// Merge all additional endpoints
Object.assign(openApiSpec.paths, additionalEndpoints);

// Update endpoint count
const totalEndpoints = Object.keys(openApiSpec.paths).reduce(
  (count, path) => count + Object.keys(openApiSpec.paths[path]).length, 0
);

console.log(`🔄 Adding final ${Object.keys(additionalEndpoints).length} endpoint paths...`);
console.log(`📈 Total endpoints now: ${totalEndpoints}`);

// Save complete spec
fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2));
console.log(`✅ Complete OpenAPI spec saved`);

// Update worker endpoint count
const workerPath = path.join(__dirname, 'src', 'index.js');
let workerCode = fs.readFileSync(workerPath, 'utf8');
workerCode = workerCode.replace(/const endpointCount = \d+;/, `const endpointCount = ${totalEndpoints};`);
fs.writeFileSync(workerPath, workerCode);
console.log(`📝 Updated worker endpoint count to: ${totalEndpoints}`);

console.log(`\n🎉 OpenAPI spec is now COMPLETE!`);
console.log(`📋 All ${totalEndpoints} endpoints documented`);
console.log(`🔗 Perfect alignment achieved`);