import { send, readJSON } from "../utils/http.js";

async function tableExists(db, name) {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .bind(name)
    .first();
  return !!row;
}

// Retrieve recent logs from D1, checking for available tables before querying.
export async function getLogs(env, limit = 10) {
  if (!env.AQUIL_DB) {
    return { error: "D1 binding not available" };
  }

  try {
    if (await tableExists(env.AQUIL_DB, "metamorphic_logs")) {
      const { results } = await env.AQUIL_DB.prepare(
        "SELECT id, timestamp, kind, detail FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?",
      )
        .bind(limit)
        .all();
      return results;
    }
    if (await tableExists(env.AQUIL_DB, "metamorphic_logs")) {
      const { results } = await env.AQUIL_DB.prepare(
        "SELECT id, timestamp, kind, detail FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?",
      )
        .bind(limit)
        .all();
      return results;
    }
    if (await tableExists(env.AQUIL_DB, "event_log")) {
      const { results } = await env.AQUIL_DB.prepare(
        "SELECT id, ts AS timestamp, type AS kind, payload AS detail FROM event_log ORDER BY ts DESC LIMIT ?",
      )
        .bind(limit)
        .all();
      return results;
    }
    return [];
  } catch (e) {
    return { error: "Unable to fetch logs", message: String(e) };
  }
}

export async function exec(req, env) {
  const { sql, params = [] } = await readJSON(req);
  if (typeof sql !== "string") return send(400, { error: "sql required" });
  const op = sql.trim().split(/\s+/)[0].toUpperCase();
  if (!["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE"].includes(op))
    return send(400, { error: "unsupported statement" });
  try {
    const stmt = env.AQUIL_DB.prepare(sql);
    const result = params.length
      ? await stmt.bind(...params).all()
      : await stmt.all();
    return send(200, { result });
  } catch (e) {
    return send(500, { error: "d1_error", message: String(e) });
  }
}
