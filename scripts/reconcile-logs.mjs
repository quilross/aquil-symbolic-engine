#!/usr/bin/env node
/**
 * Log Reconciliation Script
 * Compares D1 vs KV/Vector/R2 and backfills missing writes idempotently
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toCanonical } from '../src/ops/operation-aliases.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function reconcileLogs(options = {}) {
  const { 
    windowHours = 24, 
    dryRun = false, 
    env: envName = 'production',
    verbose = false 
  } = options;
  
  console.log(`🔄 Starting Log Reconciliation (${envName})`);
  console.log(`📅 Window: Last ${windowHours} hours`);
  console.log(`🚀 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);
  
  // Mock environment for local testing
  const mockEnv = createMockEnvironment();
  
  try {
    const windowStart = new Date(Date.now() - (windowHours * 60 * 60 * 1000));
    const windowEnd = new Date();
    
    console.log(`🔍 Analyzing logs from ${windowStart.toISOString()} to ${windowEnd.toISOString()}\n`);
    
    // Step 1: Get D1 logs (source of truth)
    const d1Logs = await getD1LogsInWindow(mockEnv, windowStart, windowEnd);
    console.log(`📊 Found ${d1Logs.length} D1 logs in window`);
    
    // Step 2: Check KV completeness
    const kvMissing = await findMissingKVLogs(mockEnv, d1Logs);
    console.log(`📝 Missing KV logs: ${kvMissing.length}`);
    
    // Step 3: Check Vector completeness  
    const vectorMissing = await findMissingVectorLogs(mockEnv, d1Logs);
    console.log(`🔍 Missing Vector logs: ${vectorMissing.length}`);
    
    // Step 4: Check R2 completeness (based on R2 policy)
    const r2Missing = await findMissingR2Logs(mockEnv, d1Logs);
    console.log(`📦 Missing R2 logs: ${r2Missing.length}`);
    
    // Step 5: Perform backfill if not dry run
    let backfilledCount = 0;
    if (!dryRun && (kvMissing.length > 0 || vectorMissing.length > 0 || r2Missing.length > 0)) {
      console.log(`\n🔧 Starting backfill process...`);
      
      // Backfill KV
      for (const log of kvMissing) {
        try {
          await backfillKVLog(mockEnv, log);
          backfilledCount++;
          if (verbose) console.log(`  ✅ Backfilled KV: ${log.id}`);
        } catch (error) {
          console.error(`  ❌ Failed to backfill KV log ${log.id}: ${error.message}`);
        }
      }
      
      // Backfill Vector
      for (const log of vectorMissing) {
        try {
          await backfillVectorLog(mockEnv, log);
          backfilledCount++;
          if (verbose) console.log(`  ✅ Backfilled Vector: ${log.id}`);
        } catch (error) {
          console.error(`  ❌ Failed to backfill Vector log ${log.id}: ${error.message}`);
        }
      }
      
      // Backfill R2
      for (const log of r2Missing) {
        try {
          await backfillR2Log(mockEnv, log);
          backfilledCount++;
          if (verbose) console.log(`  ✅ Backfilled R2: ${log.id}`);
        } catch (error) {
          console.error(`  ❌ Failed to backfill R2 log ${log.id}: ${error.message}`);
        }
      }
    }
    
    // Summary
    const totalMissing = kvMissing.length + vectorMissing.length + r2Missing.length;
    console.log(`\n📋 Reconciliation Summary:`);
    console.log(`  📊 Total logs analyzed: ${d1Logs.length}`);
    console.log(`  ❌ Total missing: ${totalMissing}`);
    console.log(`  🔧 Backfilled: ${backfilledCount}`);
    console.log(`  ✅ System consistency: ${totalMissing === 0 ? 'PERFECT' : backfilledCount === totalMissing ? 'RESTORED' : 'NEEDS ATTENTION'}`);
    
    return {
      success: true,
      analyzed: d1Logs.length,
      missing: totalMissing,
      backfilled: backfilledCount,
      consistency: totalMissing === 0 ? 'perfect' : backfilledCount === totalMissing ? 'restored' : 'degraded'
    };
    
  } catch (error) {
    console.error(`💥 Reconciliation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Mock functions for demonstration (would use real bindings in production)
function createMockEnvironment() {
  return {
    AQUIL_DB: {
      prepare: (query) => ({
        bind: (...params) => ({
          all: async () => ({ results: [] })
        })
      })
    },
    AQUIL_MEMORIES: {
      get: async (key) => null,
      put: async (key, value) => true
    },
    AQUIL_VECTOR_INDEX: {
      query: async () => ({ matches: [] }),
      upsert: async () => ({ success: true })
    },
    AQUIL_ARTIFACTS: {
      get: async (key) => null,
      put: async (key, value) => true
    }
  };
}

async function getD1LogsInWindow(env, start, end) {
  // In real implementation, would query D1 database
  return [
    { id: 'log1', timestamp: start.toISOString(), kind: 'trust_check_in', detail: {} },
    { id: 'log2', timestamp: end.toISOString(), kind: 'somatic_session', detail: {} }
  ];
}

async function findMissingKVLogs(env, d1Logs) {
  // Check which D1 logs are missing from KV
  const missing = [];
  for (const log of d1Logs) {
    const kvKey = `log:${log.id}`;
    const exists = await env.AQUIL_MEMORIES.get(kvKey);
    if (!exists) {
      missing.push(log);
    }
  }
  return missing;
}

async function findMissingVectorLogs(env, d1Logs) {
  // Check which D1 logs are missing from Vector index
  const missing = [];
  for (const log of d1Logs) {
    // Would query vector index for log id
    missing.push(log); // Mock: assume all missing
  }
  return missing.slice(0, 1); // Mock: only first one missing
}

async function findMissingR2Logs(env, d1Logs) {
  // Check R2 based on policy - only certain operations store in R2
  const r2PolicyLogs = d1Logs.filter(log => getR2PolicyForOperation(log.kind) !== 'n/a');
  const missing = [];
  
  for (const log of r2PolicyLogs) {
    const r2Key = generateR2Key(log);
    const exists = await env.AQUIL_ARTIFACTS.get(r2Key);
    if (!exists) {
      missing.push(log);
    }
  }
  return missing;
}

function getR2PolicyForOperation(operationId) {
  const canonical = toCanonical(operationId);
  const r2Policies = {
    // Required: Actions that generate significant artifacts/content
    'somaticHealingSession': 'required',
    'extractMediaWisdom': 'required', 
    'interpretDream': 'required',
    'transformation_contract': 'required',
    
    // Optional: Actions that may generate shareable content
    'trustCheckIn': 'optional',
    'recognizePatterns': 'optional',
    'synthesizeWisdom': 'optional',
    'getPersonalInsights': 'optional',
    'getDailySynthesis': 'optional',
    'optimizeEnergy': 'optional',
    
    // Legacy mappings for backwards compatibility during reconciliation
    'somatic_healing_session': 'required',
    'trust_check_in': 'optional',
    'pattern_recognition': 'optional'
  };
  return r2Policies[canonical] || r2Policies[operationId] || 'n/a';
}

function generateR2Key(log) {
  const date = new Date(log.timestamp);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `logs/${log.kind}/${dateStr}/${log.id}.json`;
}

async function backfillKVLog(env, log) {
  const kvKey = `log:${log.id}`;
  const kvValue = JSON.stringify({
    id: log.id,
    timestamp: log.timestamp,
    type: log.kind,
    detail: log.detail,
    backfilled: true,
    backfilled_at: new Date().toISOString()
  });
  
  // Respect KV_TTL_SECONDS environment variable - default 0 (no expiry)
  const ttlSeconds = parseInt(env.KV_TTL_SECONDS || '0', 10);
  
  if (ttlSeconds > 0) {
    await env.AQUIL_MEMORIES.put(kvKey, kvValue, { expirationTtl: ttlSeconds });
  } else {
    await env.AQUIL_MEMORIES.put(kvKey, kvValue);
  }
}

async function backfillVectorLog(env, log) {
  const vectorData = {
    id: log.id,
    values: new Array(384).fill(0.1), // Mock embedding
    metadata: {
      timestamp: log.timestamp,
      type: log.kind,
      backfilled: true
    }
  };
  
  await env.AQUIL_VECTOR_INDEX.upsert([vectorData]);
}

async function backfillR2Log(env, log) {
  const r2Key = generateR2Key(log);
  const r2Value = JSON.stringify({
    ...log,
    backfilled: true,
    backfilled_at: new Date().toISOString()
  });
  
  await env.AQUIL_ARTIFACTS.put(r2Key, r2Value);
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'window') options.windowHours = parseInt(value) || 24;
    if (key === 'dry-run' || key === 'dry') options.dryRun = true;
    if (key === 'env') options.env = value || 'production';
    if (key === 'verbose' || key === 'v') options.verbose = true;
  }
  
  reconcileLogs(options).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { reconcileLogs };