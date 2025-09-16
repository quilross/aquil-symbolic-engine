// List recent log keys from KV (LEGACY - returns only IDs)
export async function listRecent(env, { prefix = "log_", limit = 20 } = {}) {
  const result = await env.AQUIL_MEMORIES.list({ prefix });
  // Sort keys newest to oldest by extracting timestamp from key
  const sorted = result.keys
    .map((k) => ({ key: k.name, ts: parseInt(k.name.split("_")[1], 10) || 0 }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
    .map((k) => k.key);
  return sorted;
}

// Enhanced: List recent logs with FULL CONTENT + IDs (NO REGRESSION)
export async function listRecentWithContent(env, { prefix = "log_", limit = 20 } = {}) {
  const { listRecentEntries } = await import('../journalService.js');
  
  const result = listRecentEntries(env, { prefix, limit });
  
  if (result.success) {
    // Convert to legacy format
    return result.entries.map(entry => ({
      id: entry.key,
      key: entry.key, // Preserve legacy key field
      content: entry.content,
      timestamp: entry.content.timestamp,
      type: entry.content.type,
      payload: entry.content.payload
    }));
  } else {
    console.error('Failed to list recent entries:', result.error);
    return [];
  }
}

// Dual-mode retrieval: IDs only OR full content
export async function getRecentLogs(env, options = {}) {
  const { includeContent = true, ...opts } = options;
  
  // Force includeContent to true for this specific function's logic
  return await listRecentWithContent(env, { ...opts, includeContent: true });
}

// Batch get values for keys
export async function batchGet(env, keys) {
  const { getEntryById } = await import('../journalService.js');
  
  const results = {};
  for (const key of keys) {
    try {
      const result = await getEntryById(env, key, { keyPrefix: '' });
      if (result.success) {
        // Return the content in the original format expected
        results[key] = result.data.content || JSON.stringify(result.data);
      } else {
        results[key] = null;
      }
    } catch (e) {
      results[key] = null;
    }
  }
  return results;
}
import { send, readJSON } from "../utils/http.js";

export async function log(req, env) {
  const { addEntry } = await import('../journalService.js');
  
  const { key, value, metadata, expiration } = await readJSON(req);
  if (!key || value === undefined)
    return send(400, { error: "key and value required" });
  
  // Create entry data compatible with journal service
  const entryData = {
    id: key.replace(/^log[_:]/, ''), // Remove log prefix if present
    content: typeof value === "string" ? value : JSON.stringify(value),
    timestamp: new Date().toISOString()
  };
  
  // If value is an object, spread its properties
  if (typeof value === 'object' && value !== null) {
    Object.assign(entryData, value);
  }
  
  const options = {
    keyPrefix: '', // Use the key as-is
    metadata,
    ttl: expiration
  };
  
  // Override key formatting to use exact key
  const result = await addEntry(env, { ...entryData, id: key }, options);
  
  if (result.success) {
    return send(200, { ok: true, key });
  } else {
    return send(500, { error: result.error });
  }
}

export async function get(req, env) {
  const { getEntryById } = await import('../journalService.js');
  
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return send(400, { error: "key required" });
  
  const result = await getEntryById(env, key, { keyPrefix: '' });
  
  if (result.success) {
    // Return the original content format
    const value = result.data.content || JSON.stringify(result.data);
    return send(200, { key, value });
  } else {
    return send(200, { key, value: null });
  }
}
