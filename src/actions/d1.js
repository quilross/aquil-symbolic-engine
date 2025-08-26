// Stub for logs endpoint
export async function getLogs(env) {
  // Example: fetch last 10 logs from D1
  try {
    const results = await env.AQUIL_DB.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10').all();
    return results.results || [];
  } catch (e) {
    return { error: 'Unable to fetch logs', message: String(e) };
  }
}
const send = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json' }
});

const readJSON = async (req) => {
  try { return await req.json(); } catch { return {}; }
};

export async function exec(req, env) {
  const { sql, params = [] } = await readJSON(req);
  if (typeof sql !== 'string') return send(400, { error: 'sql required' });
  const op = sql.trim().split(/\s+/)[0].toUpperCase();
  if (!['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE'].includes(op))
    return send(400, { error: 'unsupported statement' });
  try {
    const stmt = env.AQUIL_DB.prepare(sql);
    const result = params.length ? await stmt.bind(...params).all() : await stmt.all();
    return send(200, { result });
  } catch (e) {
    return send(500, { error: 'd1_error', message: String(e) });
  }
}
