// List recent logbin keys from R2
export async function listRecent(env, { prefix = "logbin_", limit = 20 } = {}) {
  const result = await env.AQUIL_STORAGE.list({ prefix, limit });
  // Return key, size, uploaded
  return result.objects
    .map((obj) => ({ key: obj.key, size: obj.size, uploaded: obj.uploaded }))
    .sort((a, b) => b.uploaded - a.uploaded)
    .slice(0, limit);
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
  const buf = await obj.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return send(200, { key, base64 });
}
