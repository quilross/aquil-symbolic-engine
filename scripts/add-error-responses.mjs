#!/usr/bin/env node
/**
 * Add standardized error responses to logging schema operations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const loggingSchemaPath = path.join(rootDir, 'config/ark.actions.logging.json');

const schema = JSON.parse(fs.readFileSync(loggingSchemaPath, 'utf8'));

const standardErrorResponses = {
  "400": {
    "description": "Bad Request - Invalid parameters or request format",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "error": { "type": "string", "description": "Error type" },
            "message": { "type": "string", "description": "Human-readable error message" },
            "details": { "type": "object", "description": "Additional error details" }
          },
          "required": ["error", "message"]
        }
      }
    }
  },
  "500": {
    "description": "Internal Server Error - Operation failed",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "error": { "type": "string", "description": "Error type" },
            "message": { "type": "string", "description": "Human-readable error message" },
            "timestamp": { "type": "string", "description": "Error timestamp" }
          },
          "required": ["error", "message"]
        }
      }
    }
  }
};

let changesCount = 0;

// Process each path and method
for (const [pathKey, pathData] of Object.entries(schema.paths || {})) {
  for (const [method, methodData] of Object.entries(pathData)) {
    if (methodData.responses && methodData.operationId) {
      // Check if operation is missing error responses
      const hasErrorResponse = methodData.responses['400'] || methodData.responses['500'] || 
                              methodData.responses['4XX'] || methodData.responses['5XX'];
      
      if (!hasErrorResponse) {
        console.log(`Adding error responses to ${methodData.operationId} (${method.toUpperCase()} ${pathKey})`);
        
        // Add standardized error responses
        methodData.responses = {
          ...methodData.responses,
          ...standardErrorResponses
        };
        
        changesCount++;
      }
    }
  }
}

if (changesCount > 0) {
  // Write updated schema back to file
  fs.writeFileSync(loggingSchemaPath, JSON.stringify(schema, null, 2) + '\n');
  console.log(`✅ Added error responses to ${changesCount} operations`);
} else {
  console.log('✅ All operations already have error responses');
}