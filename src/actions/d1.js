import { send, readJSON } from '../utils/http.js';

// Retrieve recent logs from D1, prioritizing metamorphic_logs with
// fallback to the legacy event_log table.
export async function getLogs(env, limit = 10) {
  if (!env.AQUIL_DB) {
    return { error: 'D1 binding not available' };
  }

  try {
    // Preferred modern table
    const { results } = await env.AQUIL_DB
      .prepare(
        'SELECT id, timestamp, kind, detail FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?'
      )
      .bind(limit)
      .all();
    return results;
  } catch (primaryErr) {
    try {
      // Fallback to legacy event_log structure
      const { results } = await env.AQUIL_DB
        .prepare(
          'SELECT id, ts AS timestamp, type AS kind, payload AS detail FROM event_log ORDER BY ts DESC LIMIT ?'
        )
        .bind(limit)
        .all();
      return results;
    } catch (secondaryErr) {
      return { error: 'Unable to fetch logs', message: String(secondaryErr) };
    }
  }
}

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
