#!/usr/bin/env node
/**
 * Schema Fix Script - Addresses issues identified by comprehensive validator
 * - Adds missing error response schemas
 * - Fixes inconsistent parameter definitions
 * - Adds trigger phrases to autonomous operations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔧 SCHEMA ISSUE FIX SCRIPT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * Standard error response schema for all operations
 */
const standardErrorResponses = {
  "400": {
    "description": "Bad Request - Invalid input parameters",
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

/**
 * Parameter fixes for operations with inconsistent definitions
 */
const parameterFixes = {
  "manageCommitment": {
    "action": { "description": "Type of commitment action to perform" },
    "commitment": { "description": "Detailed commitment description" },
    "timeframe": { "description": "Timeline for commitment completion" },
    "micro_practice": { "description": "Whether this is a micro-practice commitment" }
  },
  "updateCommitmentProgress": {
    "commitment_id": { "description": "Unique identifier of the commitment to update" },
    "progress": { "description": "Progress update description or status" },
    "completion_status": { "description": "Current completion status of the commitment" }
  },
  "queryD1Database": {
    "sql": { "description": "SQL query to execute on the D1 database" },
    "params": { "description": "Parameters to bind to the SQL query" }
  },
  "storeInKV": {
    "key": { "description": "Key under which to store the data" },
    "value": { "description": "Data to store in key-value format" },
    "expirationTtl": { "description": "Time-to-live in seconds for the stored data" }
  },
  "upsertVectors": {
    "vectors": { "description": "Array of vector objects to upsert" },
    "namespace": { "description": "Namespace for vector organization" }
  },
  "extractMediaWisdom": {
    "media_type": { "description": "Type of media (movie, book, music, podcast, etc.)" },
    "title": { "description": "Title of the media content" },
    "personal_reaction": { "description": "User's personal reaction or thoughts about the media" }
  },
  "standingTallPractice": {
    "confidence_area": { "description": "Specific area where confidence building is needed" },
    "current_challenge": { "description": "Current confidence challenge or situation" }
  },
  "submitFeedback": {
    "type": { "description": "Type of feedback being provided" },
    "content": { "description": "Detailed feedback content" },
    "rating": { "description": "Numerical rating if applicable (1-10)" }
  },
  "generateDiscoveryInquiry": {
    "focus_area": { "description": "Area of life or topic to explore deeper" },
    "depth_level": { "description": "How deep to go in the exploration" },
    "context": { "description": "Current situation or context for the inquiry" }
  },
  "interpretDream": {
    "dream_content": { "description": "Detailed description of the dream" },
    "emotional_tone": { "description": "Overall emotional feeling of the dream" },
    "symbols_noticed": { "description": "Specific symbols or elements noticed in the dream" }
  },
  "optimizeEnergy": {
    "current_energy": { "description": "Current energy level on a scale of 1-10" },
    "energy_patterns": { "description": "Observed patterns in energy levels" },
    "challenges": { "description": "Current energy challenges or drains" }
  },
  "clarifyValues": {
    "life_area": { "description": "Area of life to clarify values for" },
    "current_values": { "description": "Currently identified or assumed values" },
    "conflicts_or_questions": { "description": "Areas of value conflict or uncertainty" }
  },
  "unleashCreativity": {
    "creative_domain": { "description": "Domain or area of creative expression" },
    "current_blocks": { "description": "Current creative blocks or challenges" },
    "inspiration_sources": { "description": "Sources that typically inspire creativity" }
  },
  "cultivateAbundance": {
    "scarcity_areas": { "description": "Areas where scarcity mindset is experienced" },
    "abundance_goals": { "description": "Desired abundance outcomes or goals" },
    "current_mindset": { "description": "Current mindset around abundance/scarcity" }
  },
  "healAncestry": {
    "family_patterns": { "description": "Identified family or generational patterns" },
    "healing_intention": { "description": "What the user hopes to heal or transform" },
    "ancestral_gifts": { "description": "Positive ancestral gifts to acknowledge" }
  },
  "ragMemoryConsolidation": {
    "content": { "description": "Content to store for future retrieval" },
    "type": { "description": "Type of content (insight, pattern, wisdom, reflection)" },
    "metadata": { "description": "Additional metadata for the stored content" },
    "importance": { "description": "Importance level of the content (1-10)" }
  }
};

/**
 * Trigger phrases for autonomous operations that are missing them
 */
const triggerPhraseAdditions = {
  "manageCommitment": "create commitment, make commitment, commit to, promise to, accountability",
  "listActiveCommitments": "show commitments, list commitments, my commitments, current commitments",
  "getDailySynthesis": "daily summary, today's insights, daily wisdom, morning check-in",
  "getPersonalInsights": "my insights, personal patterns, growth insights, what have I learned",
  "systemHealthCheck": "system status, health check, system working, is everything ok"
};

/**
 * Fix main schema by adding error responses and fixing parameters
 */
function fixMainSchema() {
  console.log('🔧 Fixing main schema (gpt-actions-schema.json)...');
  
  const schemaPath = path.join(rootDir, 'gpt-actions-schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  let fixedOperations = 0;
  let addedErrorResponses = 0;
  let fixedParameters = 0;
  let addedTriggerPhrases = 0;
  
  // Iterate through all paths and operations
  for (const [pathKey, pathData] of Object.entries(schema.paths)) {
    for (const [method, operation] of Object.entries(pathData)) {
      if (operation.operationId) {
        fixedOperations++;
        
        // Add error responses if missing
        if (!operation.responses['400'] && !operation.responses['500']) {
          operation.responses = {
            ...operation.responses,
            ...standardErrorResponses
          };
          addedErrorResponses++;
        }
        
        // Fix parameter descriptions if inconsistent
        if (parameterFixes[operation.operationId]) {
          const fixes = parameterFixes[operation.operationId];
          if (operation.requestBody?.content?.['application/json']?.schema?.properties) {
            const properties = operation.requestBody.content['application/json'].schema.properties;
            
            for (const [paramName, paramDef] of Object.entries(properties)) {
              if (fixes[paramName] && !paramDef.description) {
                paramDef.description = fixes[paramName].description;
                fixedParameters++;
              }
            }
          }
        }
        
        // Add trigger phrases to description if autonomous and missing
        if (operation['x-openai-autonomous'] && triggerPhraseAdditions[operation.operationId]) {
          const currentDescription = operation.description || '';
          if (!currentDescription.includes('Triggers on:')) {
            operation.description = currentDescription + ` Triggers on: ${triggerPhraseAdditions[operation.operationId]}.`;
            addedTriggerPhrases++;
          }
        }
      }
    }
  }
  
  // Write the updated schema
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  
  console.log(`  ✅ Fixed ${fixedOperations} operations`);
  console.log(`  ✅ Added error responses to ${addedErrorResponses} operations`);
  console.log(`  ✅ Fixed parameter descriptions for ${fixedParameters} parameters`);
  console.log(`  ✅ Added trigger phrases to ${addedTriggerPhrases} operations`);
}

/**
 * Create a backup of original files
 */
function createBackups() {
  console.log('💾 Creating backups...');
  
  const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');
  const backupPath = path.join(rootDir, 'gpt-actions-schema.json.backup');
  
  fs.copyFileSync(mainSchemaPath, backupPath);
  console.log(`  ✅ Backup created: ${backupPath}`);
}

/**
 * Validate the fixes
 */
function validateFixes() {
  console.log('🔍 Validating fixes...');
  
  try {
    const schemaPath = path.join(rootDir, 'gpt-actions-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    let operationsWithErrors = 0;
    let operationsWithTriggers = 0;
    
    for (const [pathKey, pathData] of Object.entries(schema.paths)) {
      for (const [method, operation] of Object.entries(pathData)) {
        if (operation.operationId) {
          // Check for error responses
          if (operation.responses['400'] || operation.responses['500']) {
            operationsWithErrors++;
          }
          
          // Check for trigger phrases
          if (operation['x-openai-autonomous'] && operation.description?.includes('Triggers on:')) {
            operationsWithTriggers++;
          }
        }
      }
    }
    
    console.log(`  ✅ ${operationsWithErrors} operations now have error responses`);
    console.log(`  ✅ Autonomous operations with trigger phrases: ${operationsWithTriggers}`);
    
    // Validate JSON structure
    console.log(`  ✅ JSON structure is valid`);
    
  } catch (error) {
    console.error(`  ❌ Validation failed: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * Main fix function
 */
async function runFixes() {
  try {
    createBackups();
    fixMainSchema();
    
    if (validateFixes()) {
      console.log('\n🎉 Schema fixes completed successfully!');
      console.log('📄 Run the validator again to confirm all issues are resolved.');
    } else {
      console.error('\n❌ Validation failed after fixes');
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Fix script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the fixes
runFixes().catch(error => {
  console.error('❌ Fix script failed:', error);
  process.exit(1);
});