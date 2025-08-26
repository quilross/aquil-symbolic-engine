// src/actions.js
// Unified log/retrieve endpoints for KV, D1, R2, Vectorize, and Workers AI (no auth)

export async function handleActions(req, env) {
  const url = new URL(req.url);

  const send = (status, data) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json' }
    });

  // Helper: parse JSON body safely
  const readJSON = async () => {
    try {
      return await req.json();
    } catch {
      return {};
    }
  };

  const KEY_REGEX = /^[A-Za-z0-9\/]+$/;
  const MAX_BASE64_LENGTH = Number(env.MAX_BASE64_LENGTH || 1024 * 1024);

  // ---------- KV (log / get) ----------
  if (url.pathname === '/kv/log' && req.method === 'POST') {
    const { key, value, metadata, expiration } = await readJSON();
    if (!key || value === undefined) return send(400, { error: 'key and value required' });
    if (!KEY_REGEX.test(key)) return send(400, { error: 'invalid key' });
    const body = typeof value === 'string' ? value : JSON.stringify(value);
    await env.MEMORY_KV.put(key, body, { metadata, expiration });
    return send(200, { ok: true, key });
  }
  if (url.pathname === '/kv/get' && req.method === 'GET') {
    const key = url.searchParams.get('key');
    if (!key) return send(400, { error: 'key required' });
    if (!KEY_REGEX.test(key)) return send(400, { error: 'invalid key' });
    const val = await env.MEMORY_KV.get(key);
    return send(200, { key, value: val });
  }

  // ---------- D1 (exec SQL) ----------
  if (url.pathname === '/d1/exec' && req.method === 'POST') {
    const { sql, params = [] } = await readJSON();
    if (typeof sql !== 'string') return send(400, { error: 'sql required' });
    const op = sql.trim().split(/\s+/)[0].toUpperCase();
    if (!['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE'].includes(op))
      return send(400, { error: 'unsupported statement' });
    try {
      const stmt = env.DB.prepare(sql);
      const result = params.length ? await stmt.bind(...params).all() : await stmt.all();
      return send(200, { result });
    } catch (e) {
      return send(500, { error: 'd1_error', message: String(e) });
    }
  }

  // ---------- R2 (put / get) ----------
  if (url.pathname === '/r2/put' && req.method === 'POST') {
    const { key, base64 } = await readJSON();
    const contentType = req.headers.get('Content-Type');
    const size = req.headers.get('Content-Length');
    if (!key || !base64) return send(400, { error: 'key and base64 required' });
    if (!KEY_REGEX.test(key)) return send(400, { error: 'invalid key' });
    if (!contentType || !size) return send(400, { error: 'Content-Type and Content-Length required' });
    if (base64.length > MAX_BASE64_LENGTH) return send(400, { error: 'payload too large' });
    try {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const httpMetadata = { contentType, size: Number(size) };
      await env.ARCHIVE_BUCKET.put(key, bytes, { httpMetadata });
      console.log('r2_put_metadata', { key, contentType, size: Number(size) });
      return send(200, { ok: true, key });
    } catch (e) {
      return send(500, { error: 'r2_put_error', message: String(e) });
    }
  }
  if (url.pathname === '/r2/get' && req.method === 'GET') {
    const key = url.searchParams.get('key');
    if (!key) return send(400, { error: 'key required' });
    if (!KEY_REGEX.test(key)) return send(400, { error: 'invalid key' });
    const obj = await env.ARCHIVE_BUCKET.get(key);
    if (!obj) return send(404, { error: 'not_found' });
    const buf = await obj.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return send(200, { key, base64 });
  }

  // ---------- Vectorize (upsert / query) ----------
  if (url.pathname === '/vectorize/upsert' && req.method === 'POST') {
    const { id, text, vector, metadata, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON();
    let v = vector;
    try {
      if (!v && text) {
        const embedding = await env.AI.run(model, { text });
        v = embedding.data[0];
      }
      if (!id || !Array.isArray(v)) return send(400, { error: 'id and embedding vector required' });
      await env.VECTORIZE.upsert([{ id, values: v, metadata }]);
      return send(200, { ok: true, id });
    } catch (e) {
      return send(500, { error: 'vector_upsert_error', message: String(e) });
    }
  }
  if (url.pathname === '/vectorize/query' && req.method === 'POST') {
    const { text, vector, topK = 5, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON();
    let v = vector;
    try {
      if (!v && text) {
        const embedding = await env.AI.run(model, { text });
        v = embedding.data[0];
      }
      if (!Array.isArray(v)) return send(400, { error: 'vector or text required' });
      const results = await env.VECTORIZE.query(v, { topK });
      return send(200, { results });
    } catch (e) {
      return send(500, { error: 'vector_query_error', message: String(e) });
    }
  }

  // ---------- Workers AI endpoints ----------
  if (url.pathname === '/ai/embed' && req.method === 'POST') {
    const { text, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON();
    if (!text) return send(400, { error: 'text required' });
    try {
      const out = await env.AI.run(model, { text });
      const vector = out.data[0];
      return send(200, { vector, dims: vector.length });
    } catch (e) {
      return send(500, { error: 'ai_embed_error', message: String(e) });
    }
  }

  if (url.pathname === '/ai/generate' && req.method === 'POST') {
    const { model = '@cf/meta/llama-3.1-8b-instruct', messages } = await readJSON();
    try {
      const out = await env.AI.run(model, { messages });
      return send(200, { output: out });
    } catch (e) {
      return send(500, { error: 'ai_generate_error', message: String(e) });
    }
  }

  return null; // If not handled, return null so main fetch can continue
}
