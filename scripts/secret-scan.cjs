#!/usr/bin/env node

/**
 * Pre-commit Secret Scanning Script
 * Scans for potential secrets before allowing commits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Scanning for potential secrets before commit...\n');

// Secret patterns to detect
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'HIGH'
  },
  {
    name: 'AWS Secret Key',
    pattern: /[0-9a-zA-Z/+]{40}/g,
    severity: 'HIGH'
  },
  {
    name: 'Cloudflare API Token',
    pattern: /[a-f0-9]{32}/g,
    severity: 'HIGH'
  },
  {
    name: 'Generic API Key',
    pattern: /(api[_-]?key|api_token|access[_-]?token)["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{16,}/gi,
    severity: 'HIGH'
  },
  {
    name: 'Bearer Token',
    pattern: /bearer\s+[a-zA-Z0-9_\-]{20,}/gi,
    severity: 'MEDIUM'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g,
    severity: 'HIGH'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: 'CRITICAL'
  },
  {
    name: 'SignalQ Token',
    pattern: /(sg_live|sq_live|sq_admin)_[A-Za-z0-9_-]+/g,
    severity: 'HIGH'
  },
  {
    name: 'Bearer SignalQ Token',
    pattern: /Bearer[ \t]+(sg_live|sq_live|sq_admin)_[A-Za-z0-9_-]+/g,
    severity: 'HIGH'
  },
  {
    name: 'OpenAI Key',
    pattern: /sk-[A-Za-z0-9]{20,}/g,
    severity: 'HIGH'
  },
  {
    name: 'JWT Token',
    pattern: /(?<![A-Za-z0-9])eyJ[A-Za-z0-9_=-]{20,}\.?[A-Za-z0-9_.=-]{10,}/g,
    severity: 'HIGH'
  },
  {
    name: 'Password in Code',
    pattern: /(password|pwd|passwd)["\s]*[:=]["\s]*[^\s"]{6,}/gi,
    severity: 'MEDIUM'
  }
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.env\.example/,
  /package-lock\.json/,
  /\.log$/,
  /\.wrangler/,
  /dist/,
  /build/,
  /\.min\./,
  /secret-scan\.cjs$/ // Don't scan this file itself
];

// Whitelist for known safe patterns (like dev tokens in examples)
const WHITELIST_PATTERNS = [
  'sample-api-token',
  'sample-account-id',
  'example-key-123',
  'test-token-456'
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isWhitelisted(match) {
  return WHITELIST_PATTERNS.some(safe => match.includes(safe));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const { name, pattern, severity } of SECRET_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!isWhitelisted(match)) {
          const lines = content.substring(0, content.indexOf(match)).split('\n');
          const lineNumber = lines.length;
          findings.push({
            file: filePath,
            line: lineNumber,
            type: name,
            severity,
            match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
            fullMatch: match
          });
        }
      }
    }
  }

  return findings;
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    
    if (shouldExcludeFile(fullPath)) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function getGitStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.warn('⚠️  Could not get staged files, scanning all files');
    return null;
  }
}

// Main scanning logic
function runScan() {
  const stagedFiles = getGitStagedFiles();
  const filesToScan = stagedFiles ? 
    stagedFiles.filter(f => fs.existsSync(f) && !shouldExcludeFile(f)) :
    getAllFiles('.').filter(f => !shouldExcludeFile(f));

  console.log(`📁 Scanning ${filesToScan.length} files...`);

  let totalFindings = 0;
  let criticalFindings = 0;
  let highFindings = 0;

  for (const file of filesToScan) {
    try {
      const findings = scanFile(file);
      
      if (findings.length > 0) {
        console.log(`\n🚨 ${file}:`);
        for (const finding of findings) {
          const emoji = finding.severity === 'CRITICAL' ? '🔥' : 
                       finding.severity === 'HIGH' ? '⚠️' : '⚡';
          console.log(`  ${emoji} Line ${finding.line}: ${finding.type} (${finding.severity})`);
          console.log(`     Pattern: ${finding.match}`);
          
          if (finding.severity === 'CRITICAL') criticalFindings++;
          else if (finding.severity === 'HIGH') highFindings++;
          totalFindings++;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan ${file}: ${error.message}`);
    }
  }

  console.log(`\n📊 Scan Results:`);
  console.log(`   Total findings: ${totalFindings}`);
  console.log(`   Critical: ${criticalFindings}`);
  console.log(`   High: ${highFindings}`);

  if (criticalFindings > 0) {
    console.log('\n🚫 COMMIT BLOCKED: Critical secrets detected!');
    console.log('Please remove secrets before committing.');
    process.exit(1);
  } else if (highFindings > 0) {
    console.log('\n⚠️  WARNING: High-severity patterns detected.');
    console.log('Please review these findings before committing.');
    console.log('If these are false positives, add them to the whitelist.');
    process.exit(1);
  } else {
    console.log('\n✅ No secrets detected. Safe to commit!');
    process.exit(0);
  }
}

// Setup as git hook helper
if (process.argv[2] === 'install') {
  const hookPath = '.git/hooks/pre-commit';
  const hookContent = `#!/bin/sh
node scripts/secret-scan.cjs
`;
  
  try {
    fs.writeFileSync(hookPath, hookContent);
    fs.chmodSync(hookPath, '755');
    console.log('✅ Pre-commit hook installed successfully!');
    console.log('   Run: git commit to test the hook');
  } catch (error) {
    console.error('❌ Failed to install pre-commit hook:', error.message);
    process.exit(1);
  }
} else {
  runScan();
}
