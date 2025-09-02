#!/usr/bin/env node
/**
 * OpenAPI Version Bump Tool
 * 
 * Automatically bumps the version in gpt-actions-schema.json according to semver rules:
 * - If version is semver (x.y.z), bump patch (x.y.z+1)
 * - If version is missing or non-semver, set to 0.0.1
 * - Preserves existing formatting and field order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const schemaPath = path.join(rootDir, 'gpt-actions-schema.json');

function isSemver(version) {
  if (!version || typeof version !== 'string') return false;
  return /^\d+\.\d+\.\d+$/.test(version);
}

function bumpPatchVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function bumpVersion() {
  // Check if schema file exists
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ gpt-actions-schema.json not found');
    process.exit(1);
  }
  
  // Read current schema
  const originalContent = fs.readFileSync(schemaPath, 'utf8');
  let schema;
  try {
    schema = JSON.parse(originalContent);
  } catch (error) {
    console.error('❌ Invalid JSON in gpt-actions-schema.json:', error.message);
    process.exit(1);
  }
  
  // Ensure info object exists
  if (!schema.info) {
    schema.info = {};
  }
  
  const currentVersion = schema.info.version;
  let newVersion;
  
  if (isSemver(currentVersion)) {
    newVersion = bumpPatchVersion(currentVersion);
    console.log(`📈 Bumping version: ${currentVersion} → ${newVersion}`);
  } else {
    newVersion = '0.0.1';
    if (currentVersion) {
      console.log(`⚠️  Non-semver version "${currentVersion}" → ${newVersion}`);
    } else {
      console.log(`✨ Setting initial version: ${newVersion}`);
    }
  }
  
  // Update version
  schema.info.version = newVersion;
  
  // Write back with same formatting (detect indentation)
  let indent = 2; // default
  const lines = originalContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      indent = match[1].length;
      break;
    }
  }
  
  const updatedContent = JSON.stringify(schema, null, indent);
  
  // Only write if content actually changed
  if (updatedContent !== originalContent) {
    fs.writeFileSync(schemaPath, updatedContent + '\n');
    console.log(`✅ Updated gpt-actions-schema.json`);
    console.log(`📋 New version: ${newVersion}`);
  } else {
    console.log(`➖ No changes needed (version already ${newVersion})`);
  }
  
  return newVersion;
}

// Run the version bump
try {
  bumpVersion();
} catch (error) {
  console.error('💥 Version bump failed:', error.message);
  process.exit(1);
}