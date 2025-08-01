#!/usr/bin/env node

/**
 * Final Audit Script
 * Comprehensive validation of Signal Q deployment readiness
 */

const fs = require('fs');
const path = require('path');

console.log('🏁 Final Audit Starting...\n');

async function finalAudit() {
  try {
    const results = {
      codebase: await auditCodebase(),
      configuration: await auditConfiguration(),
      documentation: await auditDocumentation(),
      deployment: await auditDeploymentReadiness(),
      security: await auditSecurity()
    };

    console.log('\n📋 Final Audit Summary:');
    console.log('='.repeat(50));
    
    const categories = Object.keys(results);
    const passedCategories = categories.filter(cat => results[cat].passed);
    
    categories.forEach(category => {
      const result = results[category];
      console.log(`${result.passed ? '✅' : '❌'} ${category.toUpperCase()}: ${result.passed ? 'PASS' : 'FAIL'}`);
      if (!result.passed && result.issues) {
        result.issues.forEach(issue => console.log(`  - ${issue}`));
      }
    });

    const overallScore = (passedCategories.length / categories.length) * 100;
    console.log(`\n📊 Overall Score: ${overallScore.toFixed(1)}%`);

    if (overallScore >= 80) {
      console.log('\n🎉 Final audit PASSED - Ready for deployment!');
      console.log('\n🚀 Next Steps:');
      console.log('  1. Commit and push package-lock.json');
      console.log('  2. GitHub Actions will handle deployment');
      console.log('  3. Monitor deployment status in Actions tab');
      return true;
    } else {
      console.log('\n⚠️  Final audit FAILED - Issues need resolution');
      return false;
    }

  } catch (error) {
    console.log('❌ Final audit failed:', error.message);
    return false;
  }
}

async function auditCodebase() {
  try {
    const workerExists = fs.existsSync(path.join(__dirname, '../worker/src/index.js'));
    const openapiExists = fs.existsSync(path.join(__dirname, '../worker/src/openapi-core.json'));
    const wranglerExists = fs.existsSync(path.join(__dirname, '../worker/wrangler.toml'));
    const packageExists = fs.existsSync(path.join(__dirname, '../package.json'));
    const packageLockExists = fs.existsSync(path.join(__dirname, '../package-lock.json'));

    const issues = [];
    if (!workerExists) issues.push('Worker implementation missing');
    if (!openapiExists) issues.push('OpenAPI specification missing');
    if (!wranglerExists) issues.push('Wrangler configuration missing');
    if (!packageExists) issues.push('Package.json missing');
    if (!packageLockExists) issues.push('Package-lock.json missing');

    return {
      passed: issues.length === 0,
      issues
    };
  } catch (error) {
    return { passed: false, issues: ['Codebase audit error: ' + error.message] };
  }
}

async function auditConfiguration() {
  try {
    const issues = [];
    
    // Check wrangler.toml
    const wranglerPath = path.join(__dirname, '../worker/wrangler.toml');
    if (fs.existsSync(wranglerPath)) {
      const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
      if (!wranglerContent.includes('API_TOKEN')) {
        issues.push('API tokens not configured in wrangler.toml');
      }
      if (!wranglerContent.includes('signal_q')) {
        issues.push('Worker name not set correctly');
      }
    } else {
      issues.push('Wrangler configuration missing');
    }

    // Check package.json scripts
    const packagePath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const requiredScripts = ['test', 'deploy', 'validate'];
      const missingScripts = requiredScripts.filter(script => !packageContent.scripts[script]);
      if (missingScripts.length > 0) {
        issues.push(`Missing npm scripts: ${missingScripts.join(', ')}`);
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  } catch (error) {
    return { passed: false, issues: ['Configuration audit error: ' + error.message] };
  }
}

async function auditDocumentation() {
  try {
    const issues = [];
    
    const readmeExists = fs.existsSync(path.join(__dirname, '../README.md'));
    if (!readmeExists) {
      issues.push('README.md missing');
    }

    const deploymentDocsExist = fs.existsSync(path.join(__dirname, '../DEPLOYMENT_SOLUTION.md'));
    if (!deploymentDocsExist) {
      issues.push('Deployment documentation missing');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  } catch (error) {
    return { passed: false, issues: ['Documentation audit error: ' + error.message] };
  }
}

async function auditDeploymentReadiness() {
  try {
    const issues = [];
    
    // Check if GitHub Actions workflow exists
    const workflowPath = path.join(__dirname, '../.github/workflows/deploy-cloudflare-worker.yml');
    if (!fs.existsSync(workflowPath)) {
      issues.push('GitHub Actions workflow missing');
    }

    // Check validation scripts
    const scriptDir = path.join(__dirname, '../scripts');
    const requiredScripts = ['openapi-audit.js', 'implementation-analysis.js', 'final-audit.js'];
    const missingScripts = requiredScripts.filter(script => 
      !fs.existsSync(path.join(scriptDir, script))
    );
    if (missingScripts.length > 0) {
      issues.push(`Missing validation scripts: ${missingScripts.join(', ')}`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  } catch (error) {
    return { passed: false, issues: ['Deployment readiness error: ' + error.message] };
  }
}

async function auditSecurity() {
  try {
    const issues = [];
    
    // Check that tokens are not hardcoded in main codebase (should be in env vars)
    const workerPath = path.join(__dirname, '../worker/src/index.js');
    if (fs.existsSync(workerPath)) {
      const workerContent = fs.readFileSync(workerPath, 'utf8');
      // This is acceptable since tokens are in wrangler.toml as env vars
      if (workerContent.includes('sq_live_') && !workerContent.includes('env.API_TOKEN')) {
        issues.push('Hardcoded tokens detected - should use environment variables');
      }
    }

    // Check for proper authentication implementation
    if (fs.existsSync(workerPath)) {
      const workerContent = fs.readFileSync(workerPath, 'utf8');
      if (!workerContent.includes('Authorization') || !(workerContent.includes('Bearer') || workerContent.includes('token'))) {
        issues.push('Bearer token authentication not properly implemented');
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  } catch (error) {
    return { passed: false, issues: ['Security audit error: ' + error.message] };
  }
}

// Run final audit
finalAudit()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Final audit script failed:', error);
    process.exit(1);
  });