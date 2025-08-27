// List recent log keys from KV
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

// Batch get values for keys
export async function batchGet(env, keys) {
  const results = {};
  for (const key of keys) {
    try {
      results[key] = await env.AQUIL_MEMORIES.get(key);
    } catch (e) {
      results[key] = null;
    }
  }
  return results;
}
import { send, readJSON } from "../utils/http.js";

export async function log(req, env) {
  const { key, value, metadata, expiration } = await readJSON(req);
  if (!key || value === undefined)
    return send(400, { error: "key and value required" });
  const body = typeof value === "string" ? value : JSON.stringify(value);
  await env.AQUIL_MEMORIES.put(key, body, { metadata, expiration });
  return send(200, { ok: true, key });
}

export async function get(req, env) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return send(400, { error: "key required" });
  const val = await env.AQUIL_MEMORIES.get(key);
  return send(200, { key, value: val });
}
