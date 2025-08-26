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
    const stmt = env.DB.prepare(sql);
    const result = params.length ? await stmt.bind(...params).all() : await stmt.all();
    return send(200, { result });
  } catch (e) {
    return send(500, { error: 'd1_error', message: String(e) });
  }
}
