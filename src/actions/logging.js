// Unified log retrieval from D1, KV, R2
export async function readLogs(env, opts = {}) {
  const limit = Math.min(parseInt(opts.limit || '20', 10), 200);
  const results = {};

  // D1
  try {
    const { results: d1logs } = await env.AQUIL_DB.prepare(
      `SELECT id, timestamp, kind, detail, session_id, voice_used, signal_strength, tags FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?`
    ).bind(limit).all();
    results.d1 = d1logs;
  } catch (e) {
    results.d1 = String(e);
  }

  // KV - Enhanced to return full content + IDs
  try {
    const { getRecentLogs } = await import('./kv.js');
    results.kv = await getRecentLogs(env, { limit, includeContent: true });
  } catch (e) {
    results.kv = String(e);
  }

  // R2 - Enhanced with resonance weaving
  try {
    const { listRecent, progressiveWeaving } = await import('./r2.js');
    results.r2 = await listRecent(env, { limit });
    
    // Add resonance weaving for recent logs
    try {
      const resonanceResult = await progressiveWeaving(env, { timeframe: '24h' });
      results.r2_resonance = resonanceResult.success ? resonanceResult : null;
    } catch (resonanceError) {
      results.r2_resonance = `resonance_error: ${resonanceError.message}`;
    }
  } catch (e) {
    results.r2 = String(e);
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
  
  // D1 - Enhanced with variable payload support and schema enforcement
  try {
    // Normalize payload to ensure it has required fields
    const normalizedPayload = {
      content: payload?.content || payload?.message || JSON.stringify(payload),
      source: payload?.source || who || 'system',
      ...payload
    };

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
          JSON.stringify(normalizedPayload),
          session_id || null,
          who || null,
          JSON.stringify(tags || []),
        )
        .run();
      status.d1 = "ok";
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
            JSON.stringify(normalizedPayload),
          )
          .run();
        status.d1 = "ok_fallback";
      } catch (fallbackError) {
        status.d1 = `primary_error: ${primaryError.message}, fallback_error: ${fallbackError.message}`;
      }
    }
  } catch (e) {
    status.d1 = String(e);
  }

  // KV
  try {
    await env.AQUIL_MEMORIES.put(
      `log_${id}`,
      JSON.stringify({
        id,
        timestamp,
        type,
        payload,
        session_id,
        who,
        level,
        tags,
      }),
      { expirationTtl: 86400 },
    );
    status.kv = "ok";
  } catch (e) {
    status.kv = String(e);
  }

  // R2
  if (binary) {
    try {
      const bytes = Uint8Array.from(atob(binary), (c) => c.charCodeAt(0));
      await env.AQUIL_STORAGE.put(`logbin_${id}`, bytes);
      status.r2 = "ok";
    } catch (e) {
      status.r2 = String(e);
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
      }
    } catch (e) {
      status.vector = String(e);
    }
  }
  return status;
}

// Enhanced logging for autonomous actions
export async function writeAutonomousLog(env, data) {
  const { action, trigger_keywords, trigger_phrase, user_state, response } = data;
  
  const autonomousLogData = {
    type: 'autonomous_action',
    payload: {
      action,
      trigger_keywords: trigger_keywords || [],
      trigger_phrase: trigger_phrase || '',
      user_state: user_state || 'unknown',
      response_summary: response?.message || 'No response',
      timestamp: new Date().toISOString(),
      autonomous: true
    },
    session_id: data.session_id || crypto.randomUUID(),
    who: 'system',
    level: 'info',
    tags: ['autonomous', action, ...(trigger_keywords || [])],
    textOrVector: `Autonomous action: ${action}. Triggered by: ${trigger_phrase || 'system'}. Keywords: ${(trigger_keywords || []).join(', ')}`
  };

  return await writeLog(env, autonomousLogData);
}

// Read logs with autonomous filtering
export async function readAutonomousLogs(env, opts = {}) {
  const limit = Math.min(parseInt(opts.limit || '20', 10), 200);
  const results = {};

  // D1 - Filter for autonomous actions
  try {
    const { results: d1logs } = await env.AQUIL_DB.prepare(
      `SELECT id, timestamp, kind, detail, session_id, voice_used, signal_strength, tags 
       FROM metamorphic_logs 
       WHERE kind = 'autonomous_action' OR tags LIKE '%autonomous%'
       ORDER BY timestamp DESC LIMIT ?`
    ).bind(limit).all();
    results.d1 = d1logs;
  } catch (e) {
    results.d1 = String(e);
  }

  // KV - Look for autonomous logs
  try {
    const kvList = await env.AQUIL_MEMORIES.list({ prefix: 'autonomous_action:' });
    const autonomousLogs = [];
    
    for (const key of kvList.keys.slice(0, limit)) {
      try {
        const logData = await env.AQUIL_MEMORIES.get(key.name);
        if (logData) {
          autonomousLogs.push(JSON.parse(logData));
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

// Get autonomous action statistics
export async function getAutonomousStats(env, timeframe = '24h') {
  try {
    const hoursBack = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    const { results } = await env.AQUIL_DB.prepare(
      `SELECT kind, COUNT(*) as count, tags
       FROM metamorphic_logs 
       WHERE (kind = 'autonomous_action' OR tags LIKE '%autonomous%') 
       AND timestamp > ?
       GROUP BY kind, tags`
    ).bind(cutoffTime).all();
    
    const stats = {
      total_autonomous_actions: 0,
      actions_by_type: {},
      triggers_by_keyword: {},
      timeframe
    };
    
    for (const row of results) {
      stats.total_autonomous_actions += row.count;
      
      // Parse the detail to get action type
      try {
        const tags = JSON.parse(row.tags || '[]');
        for (const tag of tags) {
          if (tag !== 'autonomous') {
            stats.actions_by_type[tag] = (stats.actions_by_type[tag] || 0) + row.count;
          }
        }
      } catch (e) {
        console.error('Error parsing autonomous log tags:', e);
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting autonomous stats:', error);
    return {
      total_autonomous_actions: 0,
      actions_by_type: {},
      triggers_by_keyword: {},
      timeframe,
      error: error.message
    };
  }
}

// Enhanced log reading with filters for autonomous analysis
export async function readLogsWithFilters(env, filters = {}) {
  const {
    limit = 20,
    type,
    autonomous_only = false,
    session_id,
    tags,
    date_from,
    date_to
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
    params.push(new Date(date_from).getTime());
  }
  
  if (date_to) {
    conditions.push('timestamp <= ?');
    params.push(new Date(date_to).getTime());
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(maxLimit);
  
  try {
    const { results } = await env.AQUIL_DB.prepare(query).bind(...params).all();
    return results;
  } catch (error) {
    console.error('Error reading logs with filters:', error);
    return [];
  }
}
