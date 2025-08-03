#!/usr/bin/env node

/**
 * CI Validation Script for Signal Q Worker
 * Performs comprehensive validation checks for deployment automation
 */

import fs from 'fs';
import path from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';

const WORKER_DIR = './worker';
const REQUIRED_FILES = [
  'worker/src/index.js',
  'worker/wrangler.toml',
  'worker/src/openapi-core.json',
  'package.json',
  'package-lock.json'
];

console.log('🔍 Signal Q Worker CI Validation\n');

let errors = 0;
let warnings = 0;

function log(type, message) {
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️ ' : '✅';
  console.log(`${prefix} ${message}`);
  
  if (type === 'error') errors++;
  if (type === 'warning') warnings++;
}

// Check required files
console.log('📁 Checking required files...');
for (const file of REQUIRED_FILES) {
  if (fs.existsSync(file)) {
    log('info', `${file} exists`);
  } else {
    log('error', `Required file ${file} is missing`);
  }
}

// Check package.json structure
console.log('\n📦 Validating package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (pkg.name) {
    log('info', `Package name: ${pkg.name}`);
  } else {
    log('warning', 'Package name is missing');
  }
  
  if (pkg.devDependencies && pkg.devDependencies.wrangler) {
    const version = pkg.devDependencies.wrangler;
    log('info', `Wrangler version: ${version}`);
    
    if (version.startsWith('^3.') || version.startsWith('3.')) {
      log('warning', 'Wrangler version is outdated, consider upgrading to v4');
    }
  } else {
    log('error', 'Wrangler is not listed in devDependencies');
  }
  
  if (pkg.scripts && pkg.scripts.deploy) {
    log('info', `Deploy script: ${pkg.scripts.deploy}`);
  } else {
    log('warning', 'No deploy script found in package.json');
  }
} catch (err) {
  log('error', `Failed to parse package.json: ${err.message}`);
}

// Check worker configuration
console.log('\n⚙️  Validating worker configuration...');
try {
  const tomlPath = path.join(WORKER_DIR, 'wrangler.toml');
  const tomlContent = fs.readFileSync(tomlPath, 'utf8');
  
  if (tomlContent.includes('name = ')) {
    log('info', 'Worker name is configured');
  } else {
    log('error', 'Worker name is missing in wrangler.toml');
  }
  
  if (tomlContent.includes('main = ')) {
    log('info', 'Worker entry point is configured');
  } else {
    log('error', 'Worker entry point is missing in wrangler.toml');
  }
  
  if (tomlContent.includes('compatibility_date = ')) {
    log('info', 'Compatibility date is set');
  } else {
    log('warning', 'Compatibility date is missing');
  }
} catch (err) {
  log('error', `Failed to read wrangler.toml: ${err.message}`);
}

// Validate OpenAPI schema
console.log('\n📘 Validating OpenAPI specification...');
try {
  await SwaggerParser.validate(path.join(WORKER_DIR, 'src/openapi-core.json'));
  log('info', 'OpenAPI schema is valid');
} catch (err) {
  log('error', `OpenAPI validation failed: ${err.message}`);
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`   Errors: ${errors}`);
console.log(`   Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ Validation failed - please fix the errors above');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Validation passed with warnings');
  process.exit(0);
} else {
  console.log('\n✅ All validations passed!');
  process.exit(0);
}