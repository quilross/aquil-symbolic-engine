#!/usr/bin/env node
/**
 * Repository Validation Script
 * Checks for common issues and validates the repository structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function logSuccess(...args) { log(colors.green, '✓', ...args); }
function logError(...args) { log(colors.red, '✗', ...args); }
function logWarning(...args) { log(colors.yellow, '⚠', ...args); }
function logInfo(...args) { log(colors.blue, 'ℹ', ...args); }

class RepositoryValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  addError(message) {
    this.errors.push(message);
    logError(message);
  }

  addWarning(message) {
    this.warnings.push(message);
    logWarning(message);
  }

  addSuccess(message) {
    this.success.push(message);
    logSuccess(message);
  }

  checkFileExists(filePath, required = true) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      this.addSuccess(`${filePath} exists`);
      return true;
    } else {
      if (required) {
        this.addError(`${filePath} is missing`);
      } else {
        this.addWarning(`${filePath} is missing (optional)`);
      }
      return false;
    }
  }

  checkPackageJson() {
    logInfo('Checking package.json...');
    
    if (!this.checkFileExists('package.json')) return;
    
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      
      // Check type module
      if (pkg.type === 'module') {
        this.addSuccess('Package is configured as ES module');
      } else {
        this.addWarning('Package should be configured as ES module ("type": "module")');
      }
      
      // Check dependencies
      const requiredDeps = ['itty-router'];
      for (const dep of requiredDeps) {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          this.addSuccess(`Required dependency ${dep} is present`);
        } else {
          this.addError(`Missing required dependency: ${dep}`);
        }
      }
      
      // Check scripts
      const requiredScripts = ['dev', 'deploy', 'types'];
      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          this.addSuccess(`Script ${script} is configured`);
        } else {
          this.addWarning(`Missing script: ${script}`);
        }
      }
      
    } catch (error) {
      this.addError(`Invalid package.json: ${error.message}`);
    }
  }

  checkWranglerConfig() {
    logInfo('Checking wrangler.toml...');
    
    if (!this.checkFileExists('wrangler.toml')) return;
    
    try {
      const config = fs.readFileSync(path.join(__dirname, 'wrangler.toml'), 'utf8');
      
      // Check for required bindings
      const requiredBindings = [
        'AQUIL_DB',
        'AQUIL_MEMORIES', 
        'AQUIL_STORAGE',
        'AQUIL_CONTEXT',
        'AQUIL_AI'
      ];
      
      for (const binding of requiredBindings) {
        if (config.includes(binding)) {
          this.addSuccess(`Binding ${binding} is configured`);
        } else {
          this.addError(`Missing binding: ${binding}`);
        }
      }
      
      // Check compatibility date
      if (config.includes('compatibility_date')) {
        this.addSuccess('Compatibility date is set');
      } else {
        this.addWarning('Missing compatibility_date');
      }
      
      // Check for custom domains
      if (config.includes('signal-q.me')) {
        this.addSuccess('Custom domain routing configured');
      } else {
        this.addWarning('No custom domain routing found');
      }
      
    } catch (error) {
      this.addError(`Error reading wrangler.toml: ${error.message}`);
    }
  }

  checkSourceStructure() {
    logInfo('Checking source code structure...');
    
    // Critical files
    const criticalFiles = [
      'src/index.js',
      'src/config-loader.js',
      'schema.sql',
      'config/ark.actions.logging.json'
    ];
    
    for (const file of criticalFiles) {
      this.checkFileExists(file);
    }
    
    // Important directories
    const importantDirs = [
      'src/actions',
      'src/routes', 
      'src/utils',
      'src/ark',
      'src/agent',
      'src/ops'
    ];
    
    for (const dir of importantDirs) {
      if (fs.existsSync(path.join(__dirname, dir))) {
        this.addSuccess(`Directory ${dir} exists`);
      } else {
        this.addError(`Missing directory: ${dir}`);
      }
    }
  }

  checkIndexJs() {
    logInfo('Checking main index.js file...');
    
    const indexPath = path.join(__dirname, 'src/index.js');
    if (!fs.existsSync(indexPath)) {
      this.addError('src/index.js does not exist');
      return;
    }
    
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for experimental JSON import (should be fixed)
      if (content.includes('with { type: \'json\' }')) {
        this.addError('Still using experimental JSON import syntax');
      } else {
        this.addSuccess('No experimental JSON import syntax found');
      }
      
      // Check for config-loader import
      if (content.includes('./config-loader.js')) {
        this.addSuccess('Using config-loader for configuration');
      } else {
        this.addWarning('Not using config-loader - may cause compatibility issues');
      }
      
      // Check for proper imports
      const requiredImports = [
        'itty-router',
        './utils/autonomy.js',
        './utils/error-handler.js',
        './ark/ark-endpoints.js'
      ];
      
      for (const importStr of requiredImports) {
        if (content.includes(importStr)) {
          this.addSuccess(`Import ${importStr} found`);
        } else {
          this.addWarning(`Import ${importStr} not found`);
        }
      }
      
    } catch (error) {
      this.addError(`Error reading index.js: ${error.message}`);
    }
  }

  checkDatabaseSchema() {
    logInfo('Checking database schema...');
    
    if (!this.checkFileExists('schema.sql')) return;
    
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      
      // Check for essential tables
      const requiredTables = [
        'user_profile',
        'trust_sessions',
        'media_wisdom',
        'somatic_sessions',
        'wisdom_synthesis',
        'metamorphic_logs'
      ];
      
      for (const table of requiredTables) {
        if (schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
          this.addSuccess(`Table ${table} defined`);
        } else {
          this.addError(`Missing table definition: ${table}`);
        }
      }
      
      // Check for indexes
      if (schema.includes('CREATE INDEX')) {
        this.addSuccess('Database indexes are defined');
      } else {
        this.addWarning('No database indexes found');
      }
      
    } catch (error) {
      this.addError(`Error reading schema.sql: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    log(colors.cyan, '📄 REPOSITORY VALIDATION REPORT');
    console.log('='.repeat(60));
    
    log(colors.green, `✓ Successes: ${this.success.length}`);
    log(colors.yellow, `⚠ Warnings: ${this.warnings.length}`);
    log(colors.red, `✗ Errors: ${this.errors.length}`);
    
    if (this.errors.length === 0) {
      log(colors.green, '\n🎉 Repository validation passed!');
      log(colors.green, 'Your repository is ready for deployment.');
      return true;
    } else {
      log(colors.red, `\n😱 Repository validation failed with ${this.errors.length} error(s).`);
      log(colors.red, 'Please fix the errors before deploying.');
      
      if (this.warnings.length > 0) {
        log(colors.yellow, '\nWarnings (recommended to fix):');
        this.warnings.forEach(w => log(colors.yellow, `  - ${w}`));
      }
      
      return false;
    }
  }

  async validate() {
    log(colors.cyan, '🔍 Starting repository validation...');
    console.log();
    
    this.checkPackageJson();
    this.checkWranglerConfig();
    this.checkSourceStructure();
    this.checkIndexJs();
    this.checkDatabaseSchema();
    
    return this.generateReport();
  }
}

// Run validation if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new RepositoryValidator();
  const isValid = await validator.validate();
  process.exit(isValid ? 0 : 1);
}

export { RepositoryValidator };