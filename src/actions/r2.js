/**
 * @typedef {Object} LogEntry
 * @property {string} type - Log entry type (e.g., "insight")
 * @property {string} [who] - Who is logging (e.g., "user")
 * @property {string} [level] - Log level (e.g., "info")
 */

/**
 * @typedef {Object} R2Record
 * @property {string} key - Human-readable R2 storage key
 * @property {string} value - JSON-encoded string data
 */

// List recent logbin keys from R2 (LEGACY - preserved)
export async function listRecent(env, { prefix = "logbin_", limit = 20 } = {}) {
  const result = await env.AQUIL_STORAGE.list({ prefix, limit });
  // Return key, size, uploaded
  return result.objects
    .map((obj) => ({ key: obj.key, size: obj.size, uploaded: obj.uploaded }))
    .sort((a, b) => b.uploaded - a.uploaded)
    .slice(0, limit);
}

// R2 RESONANCE SYSTEM - Micro-thread Weaving for Sparse Data

// Store resonance threads in R2
export async function storeResonanceThread(env, threadData) {
  const threadId = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const threadKey = `resonance/${threadId}.json`;
  
  try {
    const threadContent = JSON.stringify({
      id: threadId,
      created_at: new Date().toISOString(),
      type: 'resonance_thread',
      ...threadData
    });
    
    await env.AQUIL_STORAGE.put(threadKey, threadContent, {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'max-age=86400'
      }
    });
    
    return { success: true, threadId, key: threadKey };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Weave micro-threads from single log entry (sparse data support)
export async function weaveMicroThread(env, logEntry) {
  try {
    const { content, session_id, timestamp, tags = [] } = logEntry;
    
    // Extract themes and patterns from single entry
    const themes = extractThemes(content);
    const emotions = extractEmotions(content);
    const bodySignals = extractBodySignals(content);
    const insights = extractInsights(content);
    
    const microThread = {
      source_log: logEntry.id || 'unknown',
      session_id,
      timestamp,
      weaving_type: 'micro_thread',
      themes,
      emotions,
      body_signals: bodySignals,
      insights,
      resonance_patterns: generateResonancePatterns(themes, emotions, bodySignals),
      continuity_threads: identifyContinuityThreads(content, tags),
      growth_edges: identifyGrowthEdges(content, themes)
    };
    
    return await storeResonanceThread(env, microThread);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Weave multi-log resonance (PRESERVED - existing functionality)
export async function weaveMultiLogResonance(env, logEntries) {
  try {
    if (!logEntries || logEntries.length === 0) {
      return { success: false, error: 'No log entries provided' };
    }
    
    // If only one entry, use micro-thread weaving
    if (logEntries.length === 1) {
      return await weaveMicroThread(env, logEntries[0]);
    }
    
    // Multi-log resonance weaving
    const allThemes = [];
    const allEmotions = [];
    const allBodySignals = [];
    const sessionPatterns = {};
    
    for (const entry of logEntries) {
      const content = entry.content || entry.payload?.content || '';
      allThemes.push(...extractThemes(content));
      allEmotions.push(...extractEmotions(content));
      allBodySignals.push(...extractBodySignals(content));
      
      // Track session patterns
      if (entry.session_id) {
        sessionPatterns[entry.session_id] = sessionPatterns[entry.session_id] || [];
        sessionPatterns[entry.session_id].push({
          timestamp: entry.timestamp,
          themes: extractThemes(content),
          emotions: extractEmotions(content)
        });
      }
    }
    
    const multiThread = {
      source_logs: logEntries.map(e => e.id || 'unknown'),
      log_count: logEntries.length,
      weaving_type: 'multi_thread',
      unified_themes: [...new Set(allThemes)],
      emotional_arc: traceEmotionalArc(allEmotions),
      somatic_patterns: traceSomaticPatterns(allBodySignals),
      session_evolution: sessionPatterns,
      resonance_narrative: generateResonanceNarrative(allThemes, allEmotions, sessionPatterns),
      growth_trajectory: identifyGrowthTrajectory(logEntries)
    };
    
    return await storeResonanceThread(env, multiThread);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Progressive weaving: logs → threads → narratives
export async function progressiveWeaving(env, { session_id, timeframe = '7d' } = {}) {
  try {
    // Get logs from the timeframe
    const { readLogsWithFilters } = await import('./logging.js');
    const logs = await readLogsWithFilters(env, {
      session_id,
      limit: 100,
      date_from: new Date(Date.now() - (timeframe === '7d' ? 7 : 1) * 24 * 60 * 60 * 1000)
    });
    
    if (logs.length === 0) {
      return { success: false, error: 'No logs found for weaving' };
    }
    
    // Progressive weaving stages
    const stages = {
      micro_threads: [],
      session_threads: {},
      narrative_arc: null
    };
    
    // Stage 1: Create micro-threads from individual logs
    for (const log of logs) {
      const microThread = await weaveMicroThread(env, log);
      if (microThread.success) {
        stages.micro_threads.push(microThread);
      }
    }
    
    // Stage 2: Group into session threads
    const sessionGroups = {};
    for (const log of logs) {
      const sid = log.session_id || 'default';
      sessionGroups[sid] = sessionGroups[sid] || [];
      sessionGroups[sid].push(log);
    }
    
    for (const [sid, sessionLogs] of Object.entries(sessionGroups)) {
      if (sessionLogs.length > 1) {
        const sessionThread = await weaveMultiLogResonance(env, sessionLogs);
        if (sessionThread.success) {
          stages.session_threads[sid] = sessionThread;
        }
      }
    }
    
    // Stage 3: Create overall narrative arc
    stages.narrative_arc = await weaveNarrativeArc(env, logs, stages);
    
    return {
      success: true,
      weaving_type: 'progressive',
      timeframe,
      stages,
      total_logs: logs.length,
      micro_threads_count: stages.micro_threads.length,
      session_threads_count: Object.keys(stages.session_threads).length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper functions for theme and pattern extraction
function extractThemes(content) {
  const themes = [];
  const text = content.toLowerCase();
  
  if (text.includes('trust') || text.includes('confidence')) themes.push('trust');
  if (text.includes('creative') || text.includes('art') || text.includes('express')) themes.push('creativity');
  if (text.includes('body') || text.includes('somatic') || text.includes('physical')) themes.push('somatic');
  if (text.includes('fear') || text.includes('anxious') || text.includes('worried')) themes.push('emotional_processing');
  if (text.includes('goal') || text.includes('commit') || text.includes('achieve')) themes.push('goal_setting');
  if (text.includes('dream') || text.includes('vision') || text.includes('symbolic')) themes.push('unconscious_wisdom');
  if (text.includes('family') || text.includes('parent') || text.includes('ancestor')) themes.push('ancestry');
  if (text.includes('money') || text.includes('wealth') || text.includes('abundance')) themes.push('abundance');
  if (text.includes('transition') || text.includes('change') || text.includes('new')) themes.push('transitions');
  if (text.includes('value') || text.includes('important') || text.includes('matter')) themes.push('values');
  
  return themes;
}

function extractEmotions(content) {
  const emotions = [];
  const text = content.toLowerCase();
  
  if (text.includes('anxious') || text.includes('nervous')) emotions.push('anxiety');
  if (text.includes('excited') || text.includes('enthusiastic')) emotions.push('excitement');
  if (text.includes('sad') || text.includes('grief')) emotions.push('sadness');
  if (text.includes('angry') || text.includes('frustrated')) emotions.push('anger');
  if (text.includes('peaceful') || text.includes('calm')) emotions.push('peace');
  if (text.includes('confused') || text.includes('uncertain')) emotions.push('confusion');
  if (text.includes('grateful') || text.includes('thankful')) emotions.push('gratitude');
  if (text.includes('overwhelm')) emotions.push('overwhelm');
  
  return emotions;
}

function extractBodySignals(content) {
  const signals = [];
  const text = content.toLowerCase();
  
  if (text.includes('tense') || text.includes('tight')) signals.push('tension');
  if (text.includes('breath') || text.includes('breathing')) signals.push('breath_awareness');
  if (text.includes('heart') || text.includes('chest')) signals.push('heart_center');
  if (text.includes('shoulder') || text.includes('neck')) signals.push('upper_body_holding');
  if (text.includes('stomach') || text.includes('gut')) signals.push('gut_wisdom');
  if (text.includes('energy') || text.includes('tired')) signals.push('energy_state');
  if (text.includes('pain') || text.includes('ache')) signals.push('pain_signals');
  
  return signals;
}

function extractInsights(content) {
  const insights = [];
  const text = content.toLowerCase();
  
  if (text.includes('realize') || text.includes('understand')) insights.push('realization');
  if (text.includes('pattern') || text.includes('notice')) insights.push('pattern_recognition');
  if (text.includes('learn') || text.includes('discover')) insights.push('learning');
  if (text.includes('shift') || text.includes('change')) insights.push('transformation');
  if (text.includes('connect') || text.includes('relate')) insights.push('connection');
  
  return insights;
}

function generateResonancePatterns(themes, emotions, bodySignals) {
  const patterns = [];
  
  // Trust + body awareness pattern
  if (themes.includes('trust') && bodySignals.length > 0) {
    patterns.push({
      type: 'embodied_trust',
      description: 'Trust building through somatic awareness',
      elements: ['trust', ...bodySignals]
    });
  }
  
  // Creativity + emotional processing pattern
  if (themes.includes('creativity') && emotions.length > 0) {
    patterns.push({
      type: 'creative_emotional_flow',
      description: 'Creative expression through emotional processing',
      elements: ['creativity', ...emotions]
    });
  }
  
  // Anxiety + somatic pattern
  if (emotions.includes('anxiety') && bodySignals.length > 0) {
    patterns.push({
      type: 'anxiety_somatic_connection',
      description: 'Anxiety manifesting in body awareness',
      elements: ['anxiety', ...bodySignals]
    });
  }
  
  return patterns;
}

function identifyContinuityThreads(content, tags) {
  const threads = [];
  
  // Look for recurring themes in tags
  if (tags.includes('trust')) threads.push('ongoing_trust_journey');
  if (tags.includes('creative')) threads.push('creative_development');
  if (tags.includes('somatic')) threads.push('body_wisdom_cultivation');
  if (tags.includes('autonomous')) threads.push('autonomous_system_interaction');
  
  // Look for continuity markers in content
  const text = content.toLowerCase();
  if (text.includes('again') || text.includes('still') || text.includes('continue')) {
    threads.push('recurring_experience');
  }
  if (text.includes('progress') || text.includes('growing') || text.includes('developing')) {
    threads.push('growth_trajectory');
  }
  
  return threads;
}

function identifyGrowthEdges(content, themes) {
  const edges = [];
  
  if (themes.includes('trust')) {
    edges.push({
      area: 'trust',
      edge: 'Deepening self-trust and internal navigation',
      invitation: 'What would it feel like to trust yourself completely?'
    });
  }
  
  if (themes.includes('creativity')) {
    edges.push({
      area: 'creativity',
      edge: 'Authentic creative expression',
      invitation: 'How can you honor what wants to be expressed through you?'
    });
  }
  
  if (themes.includes('somatic')) {
    edges.push({
      area: 'somatic',
      edge: 'Embodied wisdom and body listening',
      invitation: 'What is your body trying to communicate to you?'
    });
  }
  
  return edges;
}

function traceEmotionalArc(emotions) {
  const emotionCounts = {};
  emotions.forEach(emotion => {
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });
  
  return {
    dominant_emotions: Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, frequency: count })),
    emotional_diversity: Object.keys(emotionCounts).length,
    processing_indicators: emotions.includes('confusion') ? 'active_processing' : 'stable_state'
  };
}

function traceSomaticPatterns(bodySignals) {
  const signalCounts = {};
  bodySignals.forEach(signal => {
    signalCounts[signal] = (signalCounts[signal] || 0) + 1;
  });
  
  return {
    primary_signals: Object.entries(signalCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([signal, count]) => ({ signal, frequency: count })),
    body_awareness_level: bodySignals.length > 0 ? 'active' : 'minimal'
  };
}

function generateResonanceNarrative(themes, emotions, sessionPatterns) {
  const uniqueThemes = [...new Set(themes)];
  const uniqueEmotions = [...new Set(emotions)];
  
  let narrative = "Your journey is weaving together ";
  
  if (uniqueThemes.length > 0) {
    narrative += `themes of ${uniqueThemes.join(', ')} `;
  }
  
  if (uniqueEmotions.length > 0) {
    narrative += `with emotional experiences of ${uniqueEmotions.join(', ')} `;
  }
  
  const sessionCount = Object.keys(sessionPatterns).length;
  if (sessionCount > 1) {
    narrative += `across ${sessionCount} distinct sessions, `;
  }
  
  narrative += "creating a unique pattern of growth and self-discovery.";
  
  return narrative;
}

function identifyGrowthTrajectory(logEntries) {
  const trajectory = {
    direction: 'stable',
    key_shifts: [],
    emerging_patterns: [],
    integration_opportunities: []
  };
  
  // Analyze chronological progression
  const sortedLogs = logEntries.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prev = sortedLogs[i-1];
    const curr = sortedLogs[i];
    
    const prevThemes = extractThemes(prev.content || '');
    const currThemes = extractThemes(curr.content || '');
    
    // Detect theme evolution
    const newThemes = currThemes.filter(theme => !prevThemes.includes(theme));
    if (newThemes.length > 0) {
      trajectory.key_shifts.push({
        timestamp: curr.timestamp,
        new_themes: newThemes,
        type: 'theme_emergence'
      });
    }
  }
  
  // Determine overall direction
  const firstHalf = sortedLogs.slice(0, Math.floor(sortedLogs.length / 2));
  const secondHalf = sortedLogs.slice(Math.floor(sortedLogs.length / 2));
  
  const firstHalfThemes = firstHalf.flatMap(log => extractThemes(log.content || ''));
  const secondHalfThemes = secondHalf.flatMap(log => extractThemes(log.content || ''));
  
  if (secondHalfThemes.length > firstHalfThemes.length) {
    trajectory.direction = 'expanding';
  } else if (secondHalfThemes.length < firstHalfThemes.length) {
    trajectory.direction = 'focusing';
  }
  
  return trajectory;
}

// Create narrative arc from progressive weaving
async function weaveNarrativeArc(env, logs, stages) {
  try {
    const allThemes = logs.flatMap(log => extractThemes(log.content || log.payload?.content || ''));
    const themeFrequency = {};
    allThemes.forEach(theme => {
      themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
    });
    
    const dominantThemes = Object.entries(themeFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);
    
    const narrativeArc = {
      timespan: `${logs.length} logs across ${new Set(logs.map(l => l.session_id)).size} sessions`,
      dominant_themes: dominantThemes,
      micro_threads_woven: stages.micro_threads.length,
      session_threads_woven: Object.keys(stages.session_threads).length,
      overall_narrative: `A journey of ${dominantThemes.join(', ')} unfolding through ${logs.length} moments of awareness and reflection.`,
      growth_invitation: generateGrowthInvitation(dominantThemes, logs.length)
    };
    
    // Store narrative arc
    const arcResult = await storeResonanceThread(env, {
      weaving_type: 'narrative_arc',
      ...narrativeArc
    });
    
    return arcResult.success ? narrativeArc : null;
  } catch (error) {
    return null;
  }
}

function generateGrowthInvitation(themes, logCount) {
  if (themes.includes('trust')) {
    return `With ${logCount} moments of reflection, you're building a foundation of self-trust. What would it feel like to trust yourself completely?`;
  }
  
  if (themes.includes('creativity')) {
    return `Your creative journey is unfolding through ${logCount} expressions. How can you honor what wants to emerge through you?`;
  }
  
  if (themes.includes('somatic')) {
    return `Your body has been communicating through ${logCount} moments of awareness. What deeper wisdom is it offering?`;
  }
  
  return `Through ${logCount} moments of reflection, you're weaving a unique pattern of growth. What wants to emerge next?`;
}

// =============================================================================
// STRUCTURED R2 STORAGE HELPERS
// =============================================================================

/**
 * Store structured JSON data in R2 with logging breadcrumb
 * @param {string} key - Human-readable R2 storage key (e.g., "hd_chart_aquil.json")
 * @param {Object} data - JavaScript object to be stored as JSON
 * @param {Object} env - Cloudflare environment bindings
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export async function storeR2Record(env, key, data) {
  try {
    // Stringify the data to JSON
    const jsonString = JSON.stringify(data, null, 2);
    
    // Store in R2 with proper metadata
    await env.AQUIL_STORAGE.put(key, jsonString, {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'max-age=86400'
      },
      customMetadata: {
        'x-stored-at': new Date().toISOString(),
        'x-data-type': 'structured_json',
        'x-size': jsonString.length.toString()
      }
    });
    
    // Leave a breadcrumb in D1/KV/Vector by calling the existing logging system
    // This uses the same pattern as other functions that call writeLog
    try {
      const { writeLog } = await import('./logging.js');
      await writeLog(env, {
        type: `r2_store_${key.replace('.json', '').replace(/[^a-zA-Z0-9_]/g, '_')}`,
        payload: {
          content: `Stored structured data in R2`,
          r2_key: key,
          data_size: jsonString.length,
          timestamp: new Date().toISOString()
        },
        session_id: crypto.randomUUID(),
        who: 'system',
        level: 'info',
        tags: ['r2_storage', 'structured_data'],
        textOrVector: `Stored structured JSON data with key: ${key}`
      });
    } catch (loggingError) {
      // R2 storage succeeded, but logging failed - this is acceptable
      console.warn('R2 storage succeeded but logging breadcrumb failed:', loggingError.message);
    }
    
    return { success: true, key };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Retrieve and parse structured JSON data from R2
 * @param {string} key - R2 storage key to retrieve
 * @param {Object} env - Cloudflare environment bindings
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getR2Record(env, key) {
  try {
    const obj = await env.AQUIL_STORAGE.get(key);
    if (!obj) {
      return { success: false, error: 'Record not found' };
    }
    
    // Get the text content
    const jsonString = await obj.text();
    
    // Parse JSON safely
    try {
      const data = JSON.parse(jsonString);
      return { success: true, data };
    } catch (parseError) {
      return { success: false, error: `Invalid JSON data: ${parseError.message}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

import { send, readJSON } from "../utils/http.js";

export async function put(req, env) {
  const { key, base64, httpMetadata } = await readJSON(req);
  if (!key || !base64) return send(400, { error: "key and base64 required" });
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    await env.AQUIL_STORAGE.put(key, bytes, { httpMetadata });
    return send(200, { ok: true, key });
  } catch (e) {
    return send(500, { error: "r2_put_error", message: String(e) });
  }
}

export async function get(req, env) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return send(400, { error: "key required" });
  
  const obj = await env.AQUIL_STORAGE.get(key);
  if (!obj) return send(404, { error: "not_found" });
  
  // For ChatGPT compatibility, try to return JSON if it's JSON content
  try {
    const text = await obj.text();
    // Try to parse as JSON first
    const jsonContent = JSON.parse(text);
    return send(200, { 
      key, 
      content: jsonContent,
      contentType: 'application/json',
      size: obj.size 
    });
  } catch (jsonError) {
    // If not JSON, fall back to base64 for binary content
    const buf = await obj.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return send(200, { 
      key, 
      base64, 
      contentType: 'application/octet-stream',
      size: obj.size 
    });
  }
}
