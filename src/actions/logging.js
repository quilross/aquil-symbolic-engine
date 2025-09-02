/**
 * Unified Logging System with Multi-Store Support
 * 
 * R2 Lifecycle Policy:
 * - Artifact storage: logs/<operationId>/<YYYY-MM-DD>/<logId>.json|bin
 * - Retention: 30 days cache control, longer retention via Cloudflare R2 lifecycle rules
 * - Required operations: somatic_healing_session, pattern_recognition (generate significant content)
 * - Optional operations: trust_check_in, basic actions (minimal artifacts)
 * - Binary artifacts: .bin for encoded data, .json for structured logs
 * 
 * Note: Configure R2 lifecycle rules in Cloudflare dashboard for automatic cleanup.
 * No signed URLs implemented - use direct R2 access patterns if needed.
 */

import { toCanonical } from '../ops/operation-aliases.js';
import { isGPTCompatMode, safeBinding, safeOperation } from '../utils/gpt-compat.js';

// Helper function to determine R2 policy for an operation
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
    
    // N/A: Actions that are purely informational (default)
  };
  
  return r2Policies[canonical] || 'n/a';
}

// Unified log retrieval from D1, KV, R2
export async function readLogs(env, opts = {}) {
  const limit = Math.min(parseInt(opts.limit || '20', 10), 200);
  const results = {};

  // D1
  try {
    const db = safeBinding(env, 'AQUIL_DB');
    if (db) {
      const { results: d1logs } = await db.prepare(
        `SELECT id, timestamp, kind, detail, session_id, voice_used, signal_strength, tags FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?`
      ).bind(limit).all();
      results.d1 = d1logs;
    } else if (isGPTCompatMode(env)) {
      results.d1 = []; // Empty array in compat mode
    }
  } catch (e) {
    if (isGPTCompatMode(env)) {
      results.d1 = []; // Empty array in compat mode
    } else {
      results.d1 = String(e);
    }
  }

  // KV - Enhanced to return full content + IDs
  try {
    const { getRecentLogs } = await import('./kv.js');
    results.kv = await safeOperation(env, 
      () => getRecentLogs(env, { limit, includeContent: true }),
      [] // Empty array fallback in compat mode
    );
  } catch (e) {
    if (isGPTCompatMode(env)) {
      results.kv = []; // Empty array in compat mode
    } else {
      results.kv = String(e);
    }
  }

  // R2 - Enhanced with resonance weaving
  try {
    const { listRecent, progressiveWeaving } = await import('./r2.js');
    results.r2 = await safeOperation(env,
      () => listRecent(env, { limit }),
      [] // Empty array fallback in compat mode
    );
    
    // Add resonance weaving for recent logs
    try {
      const resonanceResult = await safeOperation(env,
        () => progressiveWeaving(env, { timeframe: '24h' }),
        null // Null fallback in compat mode
      );
      results.r2_resonance = resonanceResult?.success ? resonanceResult : null;
    } catch (resonanceError) {
      if (isGPTCompatMode(env)) {
        results.r2_resonance = null;
      } else {
        results.r2_resonance = `resonance_error: ${resonanceError.message}`;
      }
    }
  } catch (e) {
    if (isGPTCompatMode(env)) {
      results.r2 = []; // Empty array in compat mode
    } else {
      results.r2 = String(e);
    }
  }

  // Vector - Enhanced with dual-mode support
  try {
    const { queryVector } = await import('./vectorize.js');
    results.vector = {
      status: 'Available modes: semantic_recall, transformative_inquiry, legacy',
      modes: ['semantic_recall', 'transformative_inquiry', 'legacy'],
      note: 'Use /api/vector/query with mode parameter'
    };
  } catch (e) {
    results.vector = String(e);
  }

  return results;
}
// Unified logging actions for D1, KV, R2, Vector
// Resilient, backend-aware, collision-safe

function base62(n) {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";
  while (n > 0) {
    s = chars[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s.padStart(26, "0");
}

function generateId() {
  const arr = new Uint32Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++)
      arr[i] = Math.floor(Math.random() * 0xffffffff);
  }
  let n = 0n;
  for (const v of arr) n = (n << 32n) | BigInt(v);
  return base62(Number(n % BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFF")));
}

function getNYTimestamp() {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(new Date())
      .replace(/\//g, "-")
      .replace(/, /, "T")
      .replace(/ /g, ":");
  } catch {
    return new Date().toISOString();
  }
}

export async function writeLog(
  env,
  { type, payload, session_id, who, level, tags, binary, textOrVector },
) {
  const id = generateId();
  const timestamp = getNYTimestamp();
  const status = {};
  
  // Get payload size limit from environment (default 16KB)
  const maxPayloadBytes = parseInt(env.MAX_PAYLOAD_BYTES || '16384', 10);
  
  // Normalize payload to ensure it has required fields
  const normalizedPayload = {
    content: payload?.content || payload?.message || JSON.stringify(payload),
    source: payload?.source || who || 'system',
    ...payload
  };
  
  // Apply privacy redaction before storing in D1/KV (fail-open)
  let redactedPayload = normalizedPayload;
  try {
    const { redactPayload } = await import('../utils/privacy.js');
    redactedPayload = redactPayload(normalizedPayload);
  } catch (redactionError) {
    // Fail-open: use original payload if redaction fails
    console.warn('Privacy redaction failed:', redactionError.message);
    redactedPayload = normalizedPayload;
  }
  
  // Check payload size and handle R2 overflow (fail-open)
  const payloadStr = JSON.stringify(redactedPayload);
  const payloadSize = new TextEncoder().encode(payloadStr).length;
  let finalPayload = redactedPayload;
  let r2Pointer = null;
  
  if (payloadSize > maxPayloadBytes) {
    // Move bulk data to R2 if available
    try {
      if (env.AQUIL_STORAGE) {
        const r2Key = `overflow/${new Date().toISOString().split('T')[0]}/${id}.json`;
        
        // Compress payload for R2 storage
        const r2Data = JSON.stringify(redactedPayload, null, 2);
        const encoder = new TextEncoder();
        const data = encoder.encode(r2Data);
        
        // Calculate SHA256 checksum
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        await env.AQUIL_STORAGE.put(r2Key, data, {
          customMetadata: {
            'content-encoding': 'gzip',
            'x-sha256': sha256,
            'x-original-size': payloadSize.toString(),
            'x-timestamp': timestamp,
            'x-session-id': session_id || 'unknown'
          }
        });
        
        // Create compact summary for D1/KV storage
        r2Pointer = r2Key;
        finalPayload = {
          _r2_overflow: true,
          _r2_key: r2Key,
          _r2_sha256: sha256,
          _original_size: payloadSize,
          summary: `Payload too large (${payloadSize} bytes) - stored in R2`,
          content_preview: (redactedPayload.content || '').substring(0, 200) + '...',
          type: redactedPayload.type || type,
          source: redactedPayload.source || who || 'system'
        };
        
        status.r2_overflow = 'success';
      } else {
        // R2 not available - truncate payload with warning
        finalPayload = {
          _payload_truncated: true,
          _original_size: payloadSize,
          _max_size: maxPayloadBytes,
          summary: `Payload truncated (${payloadSize} > ${maxPayloadBytes} bytes)`,
          content: payloadStr.substring(0, maxPayloadBytes - 500) + '... [TRUNCATED]'
        };
        
        status.r2_overflow = 'unavailable_truncated';
        
        // Track missing store write (fail-open)
        try {
          const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
          incrementMissingStoreWrite(env, 'r2');
        } catch (metricsError) {
          // Silent fail for metrics
        }
      }
    } catch (r2Error) {
      // R2 failed - truncate payload
      finalPayload = {
        _payload_truncated: true,
        _r2_error: r2Error.message,
        _original_size: payloadSize,
        summary: `R2 overflow failed, payload truncated`,
        content: payloadStr.substring(0, maxPayloadBytes - 500) + '... [TRUNCATED]'
      };
      
      status.r2_overflow = `error: ${r2Error.message}`;
      
      // Track missing store write (fail-open)
      try {
        const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
        incrementMissingStoreWrite(env, 'r2');
      } catch (metricsError) {
        // Silent fail for metrics
      }
    }
  }
  
  // D1 - Enhanced with variable payload support and schema enforcement
  try {
    // Check circuit breaker for D1 store
    const { checkStoreCircuitBreaker, recordStoreFailure } = await import('../utils/ops-middleware.js');
    const { shouldSkip } = await checkStoreCircuitBreaker(env, 'd1');
    
    if (shouldSkip) {
      status.d1 = "circuit_breaker_open";
      
      // Track missing store write (fail-open)
      try {
        const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
        incrementMissingStoreWrite(env, 'd1');
      } catch (metricsError) {
        // Silent fail for metrics
      }
    } else {
      // Try primary table (metamorphic_logs) first
      try {
        await env.AQUIL_DB.prepare(
          "INSERT INTO metamorphic_logs (id, timestamp, kind, signal_strength, detail, session_id, voice_used, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            id,
            new Date().toISOString(), // Use ISO format instead of Date.now()
            type || 'log',
            level || 'medium',
            JSON.stringify(finalPayload),
            session_id || null,
            who || null,
            JSON.stringify(tags || []),
          )
          .run();
        status.d1 = "ok";
        
        // Track successful log write (fail-open)
        try {
          const { incrementLogWritten } = await import('../utils/metrics.js');
          incrementLogWritten(env, 'd1');
        } catch (metricsError) {
          // Silent fail for metrics
        }
        
      } catch (primaryError) {
        // Fallback to event_log table if metamorphic_logs fails
        try {
          await env.AQUIL_DB.prepare(
            "INSERT INTO event_log (id, ts, type, who, level, session_id, tags, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
            .bind(
              id,
              new Date().toISOString(),
              type || 'log',
              who || 'system',
              level || 'info',
              session_id || null,
              JSON.stringify(tags || []),
              JSON.stringify(finalPayload),
            )
            .run();
          status.d1 = "ok_fallback";
          
          // Track successful log write (fail-open)
          try {
            const { incrementLogWritten } = await import('../utils/metrics.js');
            incrementLogWritten(env, 'd1');
          } catch (metricsError) {
            // Silent fail for metrics
          }
          
        } catch (fallbackError) {
          status.d1 = `primary_error: ${primaryError.message}, fallback_error: ${fallbackError.message}`;
          
          // Record store failure for circuit breaker
          await recordStoreFailure(env, 'd1');
          
          // Track missing store write (fail-open)
          try {
            const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
            incrementMissingStoreWrite(env, 'd1');
          } catch (metricsError) {
            // Silent fail for metrics
          }
        }
      }
    }
  } catch (e) {
    status.d1 = String(e);
    
    // Record store failure for circuit breaker
    try {
      const { recordStoreFailure } = await import('../utils/ops-middleware.js');
      await recordStoreFailure(env, 'd1');
    } catch (circuitError) {
      // Silent fail for circuit breaker
    }
    
    // Track missing store write (fail-open)
    try {
      const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
      incrementMissingStoreWrite(env, 'd1');
    } catch (metricsError) {
      // Silent fail for metrics
    }
  }

  // KV - Respect KV_TTL_SECONDS environment variable and use finalPayload
  try {
    const kvData = JSON.stringify({
      id,
      timestamp,
      type,
      payload: finalPayload,  // Use finalPayload (may be truncated or have R2 pointer)
      session_id,
      who,
      level,
      tags,
      r2_pointer,  // Include R2 pointer if overflow occurred
    });
    
    // Use KV_TTL_SECONDS env var, default to 0 (no expiry)
    const ttlSeconds = parseInt(env.KV_TTL_SECONDS || '0', 10);
    
    if (ttlSeconds > 0) {
      await env.AQUIL_MEMORIES.put(`log_${id}`, kvData, { expirationTtl: ttlSeconds });
    } else {
      await env.AQUIL_MEMORIES.put(`log_${id}`, kvData);
    }
    status.kv = "ok";
    
    // Track successful log write (fail-open)
    try {
      const { incrementLogWritten } = await import('../utils/metrics.js');
      incrementLogWritten(env, 'kv');
    } catch (metricsError) {
      // Silent fail for metrics
    }
    
  } catch (e) {
    status.kv = String(e);
    
    // Track missing store write (fail-open)
    try {
      const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
      incrementMissingStoreWrite(env, 'kv');
    } catch (metricsError) {
      // Silent fail for metrics
    }
  }

  // R2 - Store with proper artifact key format: logs/<opId>/<YYYY-MM-DD>/<logId>.json|bin
  if (binary) {
    try {
      const operationId = type?.replace(/_error$/, '') || 'unknown';
      const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      const extension = binary.startsWith('data:') ? 'bin' : 'json';
      const artifactKey = `logs/${operationId}/${date}/${id}.${extension}`;
      
      const bytes = Uint8Array.from(atob(binary), (c) => c.charCodeAt(0));
      await env.AQUIL_STORAGE.put(artifactKey, bytes, {
        httpMetadata: {
          contentType: extension === 'json' ? 'application/json' : 'application/octet-stream',
          cacheControl: 'max-age=2592000' // 30 days
        }
      });
      
      status.r2 = "ok";
      status.artifactKey = artifactKey;
      
      // Track successful log write (fail-open)
      try {
        const { incrementLogWritten } = await import('../utils/metrics.js');
        incrementLogWritten(env, 'r2');
      } catch (metricsError) {
        // Silent fail for metrics
      }
      
    } catch (e) {
      status.r2 = String(e);
      
      // Track missing store write (fail-open)
      try {
        const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
        incrementMissingStoreWrite(env, 'r2');
      } catch (metricsError) {
        // Silent fail for metrics
      }
    }
  } else {
    // Check if R2 storage is required for this operation type
    const r2Policy = getR2PolicyForOperation(type?.replace(/_error$/, '') || 'unknown');
    if (r2Policy === 'required') {
      // Store JSON log data for required operations
      try {
      const operationId = type?.replace(/_error$/, '') || 'unknown';
      const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      const artifactKey = `logs/${operationId}/${date}/${id}.json`;
      
      const logData = JSON.stringify({
        id,
        timestamp,
        type,
        payload: finalPayload,  // Use finalPayload (with privacy redaction)
        session_id,
        who,
        level,
        tags
      });
      
      await env.AQUIL_STORAGE.put(artifactKey, logData, {
        httpMetadata: {
          contentType: 'application/json',
          cacheControl: 'max-age=2592000' // 30 days
        }
      });
      
      status.r2 = "ok";
      status.artifactKey = artifactKey;
      
      // Track successful log write (fail-open)
      try {
        const { incrementLogWritten } = await import('../utils/metrics.js');
        incrementLogWritten(env, 'r2');
      } catch (metricsError) {
        // Silent fail for metrics
      }
      
    } catch (e) {
      status.r2 = String(e);
      
      // Track missing store write (fail-open)
      try {
        const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
        incrementMissingStoreWrite(env, 'r2');
      } catch (metricsError) {
        // Silent fail for metrics
      }
    }
    }
  }

  // Vector
  if (textOrVector) {
    try {
      let values;
      if (typeof textOrVector === "string") {
        // Embed text
        values = await env.AI.run("@cf/baai/bge-small-en-v1.5", {
          text: textOrVector,
        });
      } else if (Array.isArray(textOrVector)) {
        values = textOrVector;
      }
      if (values) {
        await env.AQUIL_CONTEXT.upsert([
          {
            id: `logvec_${id}`,
            values,
            metadata: {
              type,
              session_id,
              who,
              level,
              tags,
            },
          },
        ]);
        status.vector = "ok";
        
        // Track successful log write (fail-open)
        try {
          const { incrementLogWritten } = await import('../utils/metrics.js');
          incrementLogWritten(env, 'vector');
        } catch (metricsError) {
          // Silent fail for metrics
        }
      }
    } catch (e) {
      status.vector = String(e);
      
      // Track missing store write (fail-open)
      try {
        const { incrementMissingStoreWrite } = await import('../utils/metrics.js');
        incrementMissingStoreWrite(env, 'vector');
      } catch (metricsError) {
        // Silent fail for metrics
      }
    }
  }
  
  // Add stores metadata for GPT compatibility mode
  if (isGPTCompatMode(env)) {
    const stores = [];
    const missingStores = [];
    
    // Check which stores were attempted and their status
    if (status.d1 === "ok" || status.d1 === "ok_fallback") stores.push('d1');
    else if (status.d1 && !safeBinding(env, 'AQUIL_DB')) missingStores.push('d1');
    
    if (status.kv === "ok") stores.push('kv');
    else if (status.kv && !safeBinding(env, 'AQUIL_MEMORIES')) missingStores.push('kv');
    
    if (status.r2 === "ok") stores.push('r2');
    else if (status.r2 && !safeBinding(env, 'AQUIL_STORAGE')) missingStores.push('r2');
    
    if (status.vector === "ok") stores.push('vector');
    else if (status.vector && !safeBinding(env, 'AQUIL_CONTEXT')) missingStores.push('vector');
    
    return {
      ...status,
      stores,
      missingStores,
      success: true // Always return success in GPT_COMPAT_MODE
    };
  }
  
  return status;
}

// Enhanced logging for autonomous actions with improved traceability
export async function writeAutonomousLog(env, data) {
  const { action, trigger_keywords, trigger_phrase, user_state, response, session_id, level, confidence, endpoint } = data;
  
  // Generate trace ID for this autonomous action
  const traceId = generateId();
  
  const autonomousLogData = {
    type: 'autonomous_action',
    payload: {
      trace_id: traceId,
      action,
      trigger_keywords: trigger_keywords || [],
      trigger_phrase: trigger_phrase || '',
      user_state: user_state || 'unknown',
      response_summary: response?.message || 'No response',
      confidence_score: confidence || null,
      target_endpoint: endpoint || null,
      timestamp: new Date().toISOString(),
      autonomous: true,
      processing_time_ms: data.processing_time_ms || null,
      success: data.success !== false, // Default to true unless explicitly false
      error_details: data.error || null
    },
    session_id: session_id || crypto.randomUUID(),
    who: 'system',
    level: level || 'info',
    tags: ['autonomous', action, ...(trigger_keywords || [])],
    textOrVector: `Autonomous action: ${action}. Triggered by: ${trigger_phrase || 'system'}. Keywords: ${(trigger_keywords || []).join(', ')}`

  };

  // Also store in KV with enhanced structure for quick autonomous queries
  try {
    await env.AQUIL_MEMORIES.put(
      `autonomous_${traceId}`,
      JSON.stringify({
        ...autonomousLogData.payload,
        full_log_id: autonomousLogData.session_id
      }),
      { expirationTtl: 86400 * 7 } // 7 days for autonomous actions
    );
  } catch (kvError) {
    console.warn('Failed to store autonomous log in KV:', kvError);
  }

  return await writeLog(env, autonomousLogData);
}

// Read logs with autonomous filtering
export async function readAutonomousLogs(env, opts = {}) {
  const limit = Math.min(parseInt(opts.limit || '20', 10), 200);
  const filters = opts.filters || {};
  const results = {};

  // D1 - Filter for autonomous actions with additional filters
  try {
    let query = `SELECT id, timestamp, kind, detail, session_id, voice_used, signal_strength, tags 
       FROM metamorphic_logs 
       WHERE (kind = 'autonomous_action' OR tags LIKE '%autonomous%')`;
    const params = [];
    
    // Add additional filters
    if (filters.type) {
      query += ` AND kind = ?`;
      params.push(filters.type);
    }
    if (filters.session_id) {
      query += ` AND session_id = ?`;
      params.push(filters.session_id);
    }
    if (filters.level) {
      query += ` AND signal_strength = ?`;
      params.push(filters.level);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);
    
    const { results: d1logs } = await env.AQUIL_DB.prepare(query).bind(...params).all();
    results.d1 = d1logs;
  } catch (e) {
    results.d1 = String(e);
  }

  // KV - Look for autonomous logs with filtering
  try {
    const kvList = await env.AQUIL_MEMORIES.list({ prefix: 'autonomous_action:' });
    const autonomousLogs = [];
    
    for (const key of kvList.keys.slice(0, limit)) {
      try {
        const logData = await env.AQUIL_MEMORIES.get(key.name);
        if (logData) {
          const parsedLog = JSON.parse(logData);
          
          // Apply filters if provided
          let includeLog = true;
          if (filters.type && parsedLog.type !== filters.type) includeLog = false;
          if (filters.session_id && parsedLog.session_id !== filters.session_id) includeLog = false;
          if (filters.level && parsedLog.level !== filters.level) includeLog = false;
          
          if (includeLog) {
            autonomousLogs.push(parsedLog);
          }
        }
      } catch (e) {
        console.error('Error reading autonomous log from KV:', e);
      }
    }
    
    results.kv = autonomousLogs;
  } catch (e) {
    results.kv = String(e);
  }

  return results;
}

// Enhanced autonomous action statistics with better analytics
export async function getAutonomousStats(env, timeframe = '24h') {
  try {
    const hoursBack = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 24;
    const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString();
    
    const stats = {
      total_autonomous_actions: 0,
      actions_by_type: {},
      triggers_by_keyword: {},
      success_rate: 0,
      average_confidence: 0,
      most_common_triggers: [],
      timeframe,
      analysis_timestamp: new Date().toISOString()
    };

    // Get detailed autonomous logs from D1
    try {
      const { results } = await env.AQUIL_DB.prepare(
        `SELECT kind, detail, tags, timestamp
         FROM metamorphic_logs 
         WHERE (kind = 'autonomous_action' OR tags LIKE '%autonomous%') 
         AND timestamp > ?
         ORDER BY timestamp DESC`
      ).bind(cutoffTime).all();
      
      let totalConfidence = 0;
      let confidenceCount = 0;
      let successCount = 0;
      const triggerCounts = {};
      
      for (const row of results) {
        stats.total_autonomous_actions++;
        
        try {
          const detail = JSON.parse(row.detail || '{}');
          const tags = JSON.parse(row.tags || '[]');
          
          // Count actions by type
          if (detail.action) {
            stats.actions_by_type[detail.action] = (stats.actions_by_type[detail.action] || 0) + 1;
          }
          
          // Track success rate
          if (detail.success !== false) {
            successCount++;
          }
          
          // Track confidence scores
          if (detail.confidence_score && typeof detail.confidence_score === 'number') {
            totalConfidence += detail.confidence_score;
            confidenceCount++;
          }
          
          // Count trigger keywords
          if (detail.trigger_keywords && Array.isArray(detail.trigger_keywords)) {
            detail.trigger_keywords.forEach(keyword => {
              triggerCounts[keyword] = (triggerCounts[keyword] || 0) + 1;
            });
          }
          
        } catch (parseError) {
          console.warn('Error parsing autonomous log detail:', parseError);
        }
      }
      
      // Calculate derived statistics
      stats.success_rate = stats.total_autonomous_actions > 0 ? 
        (successCount / stats.total_autonomous_actions) * 100 : 0;
      
      stats.average_confidence = confidenceCount > 0 ? 
        totalConfidence / confidenceCount : 0;
      
      // Get most common triggers (top 10)
      stats.most_common_triggers = Object.entries(triggerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));
      
      stats.triggers_by_keyword = triggerCounts;
      
    } catch (d1Error) {
      console.warn('D1 query failed, trying KV fallback:', d1Error);
      
      // Fallback to KV storage
      try {
        const kvList = await env.AQUIL_MEMORIES.list({ prefix: 'autonomous_' });
        stats.total_autonomous_actions = kvList.keys.length;
        
        // Sample some KV entries for basic stats
        const sampleSize = Math.min(50, kvList.keys.length);
        let successCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
          try {
            const logData = await env.AQUIL_MEMORIES.get(kvList.keys[i].name);
            if (logData) {
              const parsed = JSON.parse(logData);
              if (parsed.success !== false) successCount++;
              if (parsed.action) {
                stats.actions_by_type[parsed.action] = (stats.actions_by_type[parsed.action] || 0) + 1;
              }
            }
          } catch (kvParseError) {
            console.warn('Error parsing KV autonomous log:', kvParseError);
          }
        }
        
        stats.success_rate = sampleSize > 0 ? (successCount / sampleSize) * 100 : 0;
        
      } catch (kvError) {
        console.error('Both D1 and KV autonomous stats failed:', kvError);
        stats.error = 'Unable to retrieve autonomous statistics';
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting autonomous stats:', error);
    return {
      total_autonomous_actions: 0,
      actions_by_type: {},
      triggers_by_keyword: {},
      success_rate: 0,
      average_confidence: 0,
      most_common_triggers: [],
      timeframe,
      error: error.message,
      analysis_timestamp: new Date().toISOString()
    };
  }
}

// Enhanced log reading with filters and improved autonomous analysis
export async function readLogsWithFilters(env, filters = {}) {
  const {
    limit = 20,
    type,
    autonomous_only = false,
    session_id,
    tags,
    date_from,
    date_to,
    include_trace_data = false,
    success_only = false,
    min_confidence = null
  } = filters;
  
  const maxLimit = Math.min(parseInt(limit, 10), 200);
  let query = `SELECT id, timestamp, kind, detail, session_id, voice_used, signal_strength, tags FROM metamorphic_logs`;
  const conditions = [];
  const params = [];
  
  if (type) {
    conditions.push('kind = ?');
    params.push(type);
  }
  
  if (autonomous_only) {
    conditions.push("(kind = 'autonomous_action' OR tags LIKE '%autonomous%')");
  }
  
  if (session_id) {
    conditions.push('session_id = ?');
    params.push(session_id);
  }
  
  if (tags && Array.isArray(tags)) {
    for (const tag of tags) {
      conditions.push('tags LIKE ?');
      params.push(`%${tag}%`);
    }
  }
  
  if (date_from) {
    conditions.push('timestamp >= ?');
    params.push(new Date(date_from).toISOString());
  }
  
  if (date_to) {
    conditions.push('timestamp <= ?');
    params.push(new Date(date_to).toISOString());
  }
  
  // Filter by success status if requested
  if (success_only) {
    conditions.push("(detail NOT LIKE '%\"success\":false%' OR detail IS NULL)");
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(maxLimit);
  
  try {
    const { results } = await env.AQUIL_DB.prepare(query).bind(...params).all();
    
    // Post-process results for enhanced autonomous analysis
    const processedResults = results.map(row => {
      const processed = { ...row };
      
      try {
        const detail = JSON.parse(row.detail || '{}');
        
        // Add computed fields for autonomous logs
        if (row.kind === 'autonomous_action' || (row.tags && row.tags.includes('autonomous'))) {
          processed.autonomous_metadata = {
            trace_id: detail.trace_id || null,
            confidence_score: detail.confidence_score || null,
            success: detail.success !== false,
            processing_time_ms: detail.processing_time_ms || null,
            target_endpoint: detail.target_endpoint || null,
            trigger_count: detail.trigger_keywords ? detail.trigger_keywords.length : 0
          };
          
          // Filter by confidence if specified
          if (min_confidence !== null && detail.confidence_score !== null) {
            if (detail.confidence_score < min_confidence) {
              return null; // Will be filtered out
            }
          }
        }
        
        // Add trace data if requested
        if (include_trace_data && detail.trace_id) {
          processed.trace_id = detail.trace_id;
        }
        
      } catch (parseError) {
        console.warn('Error parsing log detail for filtering:', parseError);
      }
      
      return processed;
    }).filter(Boolean); // Remove null entries from confidence filtering
    
    return processedResults;
  } catch (error) {
    console.error('Error reading logs with filters:', error);
    return [];
  }
}
