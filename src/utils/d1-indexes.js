/**
 * D1 Performance Insurance - Safe Index Creation
 * 
 * Creates performance indexes on the aquil_logs table if they don't exist.
 * Uses IF NOT EXISTS to avoid conflicts and logs/continues on error (fail-open).
 */

/**
 * Ensure critical performance indexes exist on D1 tables
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object>} Results with success/failure counts
 */
export async function ensureD1Indexes(env) {
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  if (!env.AQUIL_DB) {
    results.details.push('⚠️ D1 binding not available - skipping index creation');
    return results;
  }

  // Required indexes for performance
  const indexes = [
    {
      name: 'idx_logs_ts',
      sql: 'CREATE INDEX IF NOT EXISTS idx_logs_ts ON aquil_logs(timestamp);'
    },
    {
      name: 'idx_logs_op', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_logs_op ON aquil_logs(operationId);'
    },
    {
      name: 'idx_logs_session',
      sql: 'CREATE INDEX IF NOT EXISTS idx_logs_session ON aquil_logs(session_id);'
    },
    {
      name: 'idx_logs_kind',
      sql: 'CREATE INDEX IF NOT EXISTS idx_logs_kind ON aquil_logs(kind);'
    },
    {
      name: 'idx_logs_level',
      sql: 'CREATE INDEX IF NOT EXISTS idx_logs_level ON aquil_logs(level);'
    }
  ];

  for (const index of indexes) {
    try {
      console.log(`Creating D1 index: ${index.name}`);
      
      await env.AQUIL_DB.prepare(index.sql).run();
      
      results.created++;
      results.details.push(`✅ ${index.name}: created/verified`);
      
    } catch (error) {
      results.errors++;
      results.details.push(`❌ ${index.name}: ${error.message}`);
      
      // Log error but continue - index creation should never break the system
      console.warn(`Failed to create index ${index.name}:`, error.message);
    }
  }

  console.log(`D1 index creation summary: ${results.created} created, ${results.errors} errors`);
  
  return results;
}

/**
 * Optional: Check if aquil_logs table exists
 * @param {Object} env - Environment bindings
 * @returns {Promise<boolean>} True if table exists
 */
export async function checkAquilLogsTable(env) {
  try {
    if (!env.AQUIL_DB) return false;
    
    const result = await env.AQUIL_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='aquil_logs'"
    ).first();
    
    return !!result;
  } catch (error) {
    console.warn('Failed to check aquil_logs table:', error.message);
    return false;
  }
}