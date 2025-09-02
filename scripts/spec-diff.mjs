#!/usr/bin/env node
/**
 * OpenAPI Spec Diff Tool
 * 
 * Compares the current gpt-actions-schema.json against the last committed version
 * and prints a concise, human-readable diff for GPT builder refresh decisions.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const schemaPath = path.join(rootDir, 'gpt-actions-schema.json');

function extractOperationIds(schema) {
  const operations = [];
  if (!schema.paths) return operations;
  
  for (const [pathKey, methods] of Object.entries(schema.paths)) {
    for (const [method, config] of Object.entries(methods)) {
      if (config.operationId) {
        operations.push({
          operationId: config.operationId,
          path: pathKey,
          method: method.toUpperCase()
        });
      }
    }
  }
  return operations;
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}

async function getCommittedSchema() {
  try {
    const { stdout } = await execAsync('git show HEAD:gpt-actions-schema.json', { cwd: rootDir });
    return JSON.parse(stdout);
  } catch (error) {
    console.log('⚠️  No committed schema found (new file or first commit)');
    return null;
  }
}

async function generateSpecDiff() {
  console.log('# OpenAPI Spec Diff Report\n');
  
  // Read current schema
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ Current gpt-actions-schema.json not found');
    process.exit(1);
  }
  
  const currentContent = fs.readFileSync(schemaPath, 'utf8');
  const currentSchema = JSON.parse(currentContent);
  const currentHash = hashContent(currentContent);
  
  // Get committed schema
  const committedSchema = await getCommittedSchema();
  if (!committedSchema) {
    const currentOps = extractOperationIds(currentSchema);
    console.log(`## New Schema\n`);
    console.log(`- **Operations**: ${currentOps.length}`);
    console.log(`- **Version**: ${currentSchema.info?.version || 'unversioned'}`);
    console.log(`- **Server**: ${currentSchema.servers?.[0]?.url || 'not specified'}`);
    console.log(`- **Hash**: ${currentHash}\n`);
    console.log('✅ Ready to commit new schema');
    return;
  }
  
  const committedContent = JSON.stringify(committedSchema, null, 2);
  const committedHash = hashContent(committedContent);
  
  // Extract operation data
  const currentOps = extractOperationIds(currentSchema);
  const committedOps = extractOperationIds(committedSchema);
  
  const currentOpIds = new Set(currentOps.map(op => op.operationId));
  const committedOpIds = new Set(committedOps.map(op => op.operationId));
  
  // Calculate differences
  const addedOps = [...currentOpIds].filter(id => !committedOpIds.has(id));
  const removedOps = [...committedOpIds].filter(id => !currentOpIds.has(id));
  
  // Path-level changes
  const currentPaths = new Set(Object.keys(currentSchema.paths || {}));
  const committedPaths = new Set(Object.keys(committedSchema.paths || {}));
  const addedPaths = [...currentPaths].filter(path => !committedPaths.has(path));
  const removedPaths = [...committedPaths].filter(path => !currentPaths.has(path));
  
  // Server URL comparison
  const currentServer = currentSchema.servers?.[0]?.url;
  const committedServer = committedSchema.servers?.[0]?.url;
  const serverChanged = currentServer !== committedServer;
  
  // Version comparison
  const currentVersion = currentSchema.info?.version;
  const committedVersion = committedSchema.info?.version;
  const versionChanged = currentVersion !== committedVersion;
  
  // Print summary
  console.log(`## Changes Summary\n`);
  console.log(`| Metric | Before | After | Status |`);
  console.log(`|--------|---------|-------|---------|`);
  console.log(`| Operations | ${committedOps.length} | ${currentOps.length} | ${currentOps.length === committedOps.length ? '✅' : currentOps.length === 30 ? '⚠️' : '❌'} |`);
  console.log(`| Version | ${committedVersion || 'unversioned'} | ${currentVersion || 'unversioned'} | ${versionChanged ? '🔄' : '➖'} |`);
  console.log(`| Server | ${committedServer || 'unspecified'} | ${currentServer || 'unspecified'} | ${serverChanged ? '🔄' : '✅'} |`);
  console.log(`| Schema Hash | ${committedHash} | ${currentHash} | ${currentHash !== committedHash ? '🔄' : '✅'} |\n`);
  
  // Operation changes
  if (addedOps.length > 0 || removedOps.length > 0) {
    console.log(`## Operation Changes\n`);
    if (addedOps.length > 0) {
      console.log(`### ➕ Added Operations (${addedOps.length})`);
      addedOps.forEach(op => console.log(`- \`${op}\``));
      console.log();
    }
    if (removedOps.length > 0) {
      console.log(`### ➖ Removed Operations (${removedOps.length})`);
      removedOps.forEach(op => console.log(`- \`${op}\``));
      console.log();
    }
  }
  
  // Path changes
  if (addedPaths.length > 0 || removedPaths.length > 0) {
    console.log(`## Path Changes\n`);
    if (addedPaths.length > 0) {
      console.log(`### ➕ Added Paths (${addedPaths.length})`);
      addedPaths.forEach(path => console.log(`- \`${path}\``));
      console.log();
    }
    if (removedPaths.length > 0) {
      console.log(`### ➖ Removed Paths (${removedPaths.length})`);
      removedPaths.forEach(path => console.log(`- \`${path}\``));
      console.log();
    }
  }
  
  // Action recommendations
  console.log(`## Recommendations\n`);
  
  if (currentOps.length !== 30) {
    console.log(`❌ **Operation count is ${currentOps.length}, must be exactly 30**`);
  } else if (currentHash === committedHash) {
    console.log(`✅ **No changes detected** - schema is up to date`);
  } else {
    if (!versionChanged) {
      console.log(`⚠️  **Schema changed but version not bumped** - run \`npm run spec:bump\``);
    }
    console.log(`🔄 **Schema changes detected** - click "Refresh Actions" in GPT builder after committing`);
  }
}

// Run the diff
generateSpecDiff().catch(error => {
  console.error('💥 Spec diff failed:', error.message);
  process.exit(1);
});