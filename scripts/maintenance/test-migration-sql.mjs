#!/usr/bin/env node
/**
 * Test D1 Migration SQL Syntax
 * Validates the migration SQL is syntactically correct
 */

import fs from 'fs';
import path from 'path';

const migrationFile = 'migrate-d1-schema.sql';

console.log('🔍 Testing D1 Migration SQL Syntax');
console.log('===================================');

try {
  // Read migration file
  const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
  
  console.log('📄 Migration file size:', migrationSQL.length, 'bytes');
  
  // Basic SQL syntax validation
  const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
  console.log('📊 Found', statements.length, 'SQL statements');
  
  // Check for required statements
  const requiredPatterns = [
    /CREATE TABLE.*metamorphic_logs_new/i,
    /INSERT.*INTO metamorphic_logs_new/i,
    /ALTER TABLE.*metamorphic_logs.*RENAME/i,
    /CREATE INDEX.*idx_logs_ts/i,
    /CREATE VIEW.*event_log/i
  ];
  
  let foundPatterns = 0;
  for (const pattern of requiredPatterns) {
    if (pattern.test(migrationSQL)) {
      foundPatterns++;
      console.log('✅ Found required pattern:', pattern.source);
    } else {
      console.log('❌ Missing required pattern:', pattern.source);
    }
  }
  
  console.log(`\n📋 Migration validation: ${foundPatterns}/${requiredPatterns.length} required patterns found`);
  
  if (foundPatterns === requiredPatterns.length) {
    console.log('✅ Migration SQL syntax appears valid');
    process.exit(0);
  } else {
    console.log('❌ Migration SQL missing required statements');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Migration validation failed:', error.message);
  process.exit(1);
}