#!/usr/bin/env node

/**
 * Wrangler Fallback Script for Firewall-Safe Codespaces Automation
 * 
 * This script automatically detects Cloudflare connectivity and falls back to local mode
 * when firewall restrictions prevent access to Cloudflare endpoints.
 * 
 * Usage: node scripts/wrangler-fallback.js [command] [args...]
 * Default command: dev
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import https from 'https';

const execAsync = promisify(exec);

// Cloudflare endpoints to test for connectivity
const CLOUDFLARE_ENDPOINTS = [
  'sparrow.cloudflare.com',
  'workers.cloudflare.com'
];

// Default timeout for connectivity tests (5 seconds)
const CONNECTIVITY_TIMEOUT = 5000;

/**
 * Test connectivity to a specific endpoint
 * @param {string} hostname - The hostname to test
 * @returns {Promise<boolean>} - True if reachable, false otherwise
 */
function testConnectivity(hostname) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: CONNECTIVITY_TIMEOUT
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode < 500); // Accept any non-server-error response
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.setTimeout(CONNECTIVITY_TIMEOUT);
    req.end();
  });
}

/**
 * Test connectivity to all Cloudflare endpoints
 * @returns {Promise<boolean>} - True if any endpoint is reachable
 */
async function testCloudflareConnectivity() {
  console.log('🔍 Testing Cloudflare connectivity...');
  
  const results = await Promise.all(
    CLOUDFLARE_ENDPOINTS.map(async (endpoint) => {
      const isReachable = await testConnectivity(endpoint);
      console.log(`   ${isReachable ? '✅' : '❌'} ${endpoint}: ${isReachable ? 'reachable' : 'unreachable'}`);
      return isReachable;
    })
  );

  const hasConnectivity = results.some(result => result);
  console.log(`🌐 Cloudflare connectivity: ${hasConnectivity ? 'AVAILABLE' : 'BLOCKED'}`);
  
  return hasConnectivity;
}

/**
 * Run wrangler with the appropriate configuration
 * @param {string[]} args - Command line arguments
 * @param {boolean} useLocal - Whether to use local mode
 */
function runWrangler(args, useLocal = false) {
  const command = args[0] || 'dev';
  let wranglerArgs = [command];

  // Add the rest of the arguments
  if (args.length > 1) {
    wranglerArgs.push(...args.slice(1));
  }

  // Configure for local mode if needed
  if (useLocal && command === 'dev') {
    // Add local development flags
    if (!wranglerArgs.includes('--local')) {
      wranglerArgs.push('--local');
    }
    if (!wranglerArgs.includes('--port') && !wranglerArgs.some(arg => arg.startsWith('--port='))) {
      wranglerArgs.push('--port', '8788');
    }
    
    console.log('🏠 Using local development mode (firewall-safe)');
  } else if (command === 'dev') {
    console.log('☁️ Using cloud development mode');
  }

  console.log(`🚀 Running: npx wrangler ${wranglerArgs.join(' ')}`);
  console.log('');

  // Change to worker directory and run wrangler
  const wranglerProcess = spawn('npx', ['wrangler', ...wranglerArgs], {
    cwd: 'worker',
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Handle process exit
  wranglerProcess.on('exit', (code) => {
    process.exit(code);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    wranglerProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    wranglerProcess.kill('SIGTERM');
  });
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dev';

  console.log('🌟 Wrangler Fallback Script - Firewall-Safe Automation');
  console.log('======================================================');
  
  // Check if we're in Codespaces
  const isCodespaces = process.env.CODESPACES || process.env.CODESPACES_ENV;
  if (isCodespaces) {
    console.log('🏗️  GitHub Codespaces environment detected');
  }

  // For non-dev commands, run directly without connectivity tests
  if (command !== 'dev') {
    console.log(`📦 Running wrangler ${command} command directly...`);
    runWrangler(args, false);
    return;
  }

  try {
    // Test Cloudflare connectivity
    const hasConnectivity = await testCloudflareConnectivity();
    
    // Run wrangler with appropriate configuration
    runWrangler(args, !hasConnectivity);
    
  } catch (error) {
    console.error('❌ Error during connectivity test:', error.message);
    console.log('🔄 Falling back to local mode due to connectivity test failure...');
    runWrangler(args, true);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});