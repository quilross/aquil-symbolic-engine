#!/usr/bin/env node

/**
 * CI Spec Bump Reminder
 * Warns when config/gpt-actions-schema.json changes without version bump
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..', '..');

async function checkSpecBump() {
  try {
    console.log('🔍 Checking for schema changes requiring version bump...');
    
    // Check if config/gpt-actions-schema.json was modified in the last commit
    let changedFiles;
    try {
      changedFiles = execSync('git diff --name-only HEAD~1', { 
        encoding: 'utf8',
        cwd: rootDir 
      }).trim();
    } catch (error) {
      console.log('ℹ️  Could not detect git changes (possibly initial commit)');
      return;
    }
    
    const schemaChanged = changedFiles.includes('config/gpt-actions-schema.json');
    
    if (!schemaChanged) {
      console.log('✅ No schema changes detected');
      return;
    }
    
    console.log('📋 Schema file changed, checking version bump...');
    
    // Get current version from schema
    const schemaPath = join(rootDir, 'config/gpt-actions-schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const currentVersion = schema.info?.version;
    
    if (!currentVersion) {
      console.log('⚠️  Warning: No version found in schema');
      return;
    }
    
    // Get previous version from git
    let previousVersion;
    try {
      const previousSchema = execSync('git show HEAD~1:config/gpt-actions-schema.json', {
        encoding: 'utf8',
        cwd: rootDir
      });
      const prevSchemaObj = JSON.parse(previousSchema);
      previousVersion = prevSchemaObj.info?.version;
    } catch (error) {
      console.log('ℹ️  Could not retrieve previous schema version');
      return;
    }
    
    if (currentVersion === previousVersion) {
      console.log('⚠️  WARNING: Schema changed but version not bumped!');
      console.log(`   Current version: ${currentVersion}`);
      console.log(`   Previous version: ${previousVersion}`);
      console.log('');
      console.log('🔧 Recommended actions:');
      console.log('   1. Run: npm run spec:bump');
      console.log('   2. Refresh Actions in GPT Builder');
      console.log('   3. Commit the version change');
      console.log('');
      console.log('💡 This ensures GPT Actions cache is properly invalidated');
      
      // Exit with warning code but don't fail CI
      process.exit(0);
    } else {
      console.log('✅ Version bump detected:');
      console.log(`   Previous: ${previousVersion}`);
      console.log(`   Current: ${currentVersion}`);
      console.log('📝 Don\'t forget to refresh Actions in GPT Builder!');
    }
    
  } catch (error) {
    console.error('❌ Error checking spec bump:', error.message);
    // Don't fail CI on script errors
    process.exit(0);
  }
}

checkSpecBump();