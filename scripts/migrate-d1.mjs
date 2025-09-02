#!/usr/bin/env node
/**
 * D1 Schema Migration Script
 * Applies the D1 logging schema fix migration safely
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const migrationFile = 'migrate-d1-schema.sql';

console.log('🔄 D1 Schema Migration - Logging Fix');
console.log('=====================================');

// Check if migration file exists
if (!fs.existsSync(migrationFile)) {
  console.error('❌ Migration file not found:', migrationFile);
  process.exit(1);
}

try {
  console.log('📊 Applying D1 schema migration...');
  
  // Apply migration to production
  const result = execSync(`wrangler d1 execute AQUIL_DB --file=${migrationFile} --env production`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Migration applied successfully');
  console.log('📝 Output:', result);
  
  console.log('\n🔍 Verifying new schema...');
  
  // Verify the new schema structure
  const verifyResult = execSync(`wrangler d1 execute AQUIL_DB --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='metamorphic_logs';" --env production`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('📋 Schema verification:', verifyResult);
  
  console.log('\n✅ D1 schema migration completed successfully!');
  console.log('🎯 Fixed issues:');
  console.log('  - Added missing id column compatibility');
  console.log('  - Updated metamorphic_logs schema to canonical format');
  console.log('  - Created event_log compatibility VIEW');
  console.log('  - Updated indexes for performance');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('\n🔧 Manual recovery options:');
  console.error('  1. Check wrangler authentication: wrangler whoami');
  console.error('  2. Verify database exists: wrangler d1 list');
  console.error('  3. Apply migration manually with individual SQL commands');
  process.exit(1);
}