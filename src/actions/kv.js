const send = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json' }
});

const readJSON = async (req) => {
  try { return await req.json(); } catch { return {}; }
};

export async function log(req, env) {
  const { key, value, metadata, expiration } = await readJSON(req);
  if (!key || value === undefined) return send(400, { error: 'key and value required' });
  const body = typeof value === 'string' ? value : JSON.stringify(value);
  await env.MEMORY_KV.put(key, body, { metadata, expiration });
  return send(200, { ok: true, key });
}

export async function get(req, env) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!key) return send(400, { error: 'key required' });
  const val = await env.MEMORY_KV.get(key);
  return send(200, { key, value: val });
}
