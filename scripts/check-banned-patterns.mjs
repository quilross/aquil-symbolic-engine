#!/usr/bin/env node
/**
 * Banned Patterns Checker
 * Fails on forbidden patterns that could cause regression
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const BANNED_PATTERNS = [
  {
    pattern: 'INSERT INTO event_log',
    description: 'Legacy event_log table insert (use metamorphic_logs)',
    searchPaths: ['src/', 'test/', 'scripts/'],
    excludePaths: ['scripts/check-banned-patterns.mjs'] // Exclude self-reference
  },
  {
    pattern: 'INSERT INTO aquil_logs',
    description: 'Legacy aquil_logs table insert (use metamorphic_logs)',
    searchPaths: ['src/', 'test/', 'scripts/'],
    excludePaths: ['scripts/check-banned-patterns.mjs'] // Exclude self-reference
  },
  {
    pattern: 'AQUIL_VECTORIZE',
    description: 'Legacy vectorize binding',
    searchPaths: ['src/', 'test/', 'docs/', '*.md', '*.js', '*.mjs', '*.json'],
    excludePaths: ['scripts/check-banned-patterns.mjs'] // Exclude self-reference
  },
  {
    pattern: '/api/health[^-]',
    description: 'Legacy health endpoint (use /api/system/health-check)',
    searchPaths: ['src/', 'test/', 'docs/', '*.md']
  },
  {
    pattern: '/api/wellbeing/',
    description: 'Removed wellbeing endpoint',
    searchPaths: ['src/', 'test/', 'docs/', '*.md']
  },
  {
    pattern: '/api/me/',
    description: 'Removed me endpoint',
    searchPaths: ['src/', 'test/', 'docs/', '*.md']
  },
  {
    pattern: '/api/wisdom/',
    description: 'Legacy wisdom endpoint pattern (should be /api/wisdom/synthesize or /api/wisdom/daily-synthesis)',
    searchPaths: ['src/', 'test/', 'docs/', '*.md'],
    allowedExceptions: ['/api/wisdom/synthesize', '/api/wisdom/daily-synthesis']
  }
];

async function checkBannedPatterns() {
  console.log('🚫 Checking for Banned Patterns...\n');
  
  let exitCode = 0;
  const violations = [];
  
  for (const banned of BANNED_PATTERNS) {
    console.log(`🔍 Checking pattern: ${banned.pattern}`);
    
    try {
      for (const searchPath of banned.searchPaths) {
        const fullPath = path.join(rootDir, searchPath);
        
        // Build grep command
        let grepCmd;
        if (searchPath.includes('*')) {
          // For glob patterns, search in current directory
          grepCmd = `find ${rootDir} -name "${searchPath}" -type f -exec grep -l "${banned.pattern}" {} \\; 2>/dev/null || true`;
        } else {
          // For directories, search recursively
          grepCmd = `find ${fullPath} -type f \\( -name "*.js" -o -name "*.mjs" -o -name "*.json" -o -name "*.md" \\) -exec grep -l "${banned.pattern}" {} \\; 2>/dev/null || true`;
        }
        
        const { stdout } = await execAsync(grepCmd);
        const files = stdout.trim().split('\n').filter(Boolean);
        
        if (files.length > 0) {
          // Check for allowed exceptions
          let hasViolations = false;
          
          for (const file of files) {
            const relativePath = path.relative(rootDir, file);
            
            // Skip excluded paths
            if (banned.excludePaths && banned.excludePaths.some(excludePath => 
              relativePath.includes(excludePath)
            )) {
              continue;
            }
            
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, lineNum) => {
              if (line.includes(banned.pattern)) {
                // Check if this line contains allowed exceptions
                let isAllowed = false;
                if (banned.allowedExceptions) {
                  isAllowed = banned.allowedExceptions.some(exception => 
                    line.includes(exception)
                  );
                }
                
                if (!isAllowed) {
                  violations.push({
                    pattern: banned.pattern,
                    description: banned.description,
                    file: path.relative(rootDir, file),
                    line: lineNum + 1,
                    content: line.trim()
                  });
                  hasViolations = true;
                }
              }
            });
          }
          
          if (!hasViolations) {
            console.log(`  ✅ Found files but all occurrences are allowed exceptions`);
          }
        }
      }
      
    } catch (error) {
      console.log(`  ⚠️  Search error: ${error.message}`);
    }
  }
  
  // Report violations
  console.log('\n📋 Banned Pattern Check Summary:');
  
  if (violations.length === 0) {
    console.log('✅ No banned patterns found');
  } else {
    console.log(`❌ Found ${violations.length} violations:`);
    exitCode = 1;
    
    violations.forEach(violation => {
      console.log(`\n❌ ${violation.pattern} (${violation.description})`);
      console.log(`   File: ${violation.file}:${violation.line}`);
      console.log(`   Content: ${violation.content}`);
    });
    
    console.log('\n💡 Fix suggestions:');
    console.log('  - Remove references to AQUIL_VECTORIZE (use AQUIL_VECTOR_INDEX)');
    console.log('  - Replace /api/health with /api/system/health-check');
    console.log('  - Remove /api/wellbeing/, /api/me/ references');
    console.log('  - Use specific wisdom endpoints: /api/wisdom/synthesize, /api/wisdom/daily-synthesis');
  }
  
  process.exit(exitCode);
}

checkBannedPatterns().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});