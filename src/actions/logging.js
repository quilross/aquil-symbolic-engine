// Unified log retrieval from D1, KV, R2
export async function readLogs(env, opts = {}) {
  const limit = Math.min(parseInt(opts.limit || '20', 10), 200);
  const results = {};

  // D1
  try {
    const { results: d1logs } = await env.AQUIL_DB.prepare(
      `SELECT id, timestamp, kind, detail, session_id, voice_used, signal_strength, tags FROM metamorphic_logs ORDER BY timestamp DESC LIMIT ?`
    ).bind(limit).all();
    results.d1 = d1logs;
  } catch (e) {
    results.d1 = String(e);
  }

  // KV
  try {
    const { listRecent } = await import('./kv.js');
    results.kv = await listRecent(env, { limit });
  } catch (e) {
    results.kv = String(e);
  }

  // R2
  try {
    const { listRecent } = await import('./r2.js');
    results.r2 = await listRecent(env, { limit });
  } catch (e) {
    results.r2 = String(e);
  }

  // Vector
  try {
    results.vector = 'Listing not supported; use query API.';
  } catch (e) {
    results.vector = String(e);
  }

  return results;
}
// Unified logging actions for D1, KV, R2, Vector
// Resilient, backend-aware, collision-safe

function base62(n) {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";
  while (n > 0) {
    s = chars[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s.padStart(26, "0");
}

function generateId() {
  const arr = new Uint32Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++)
      arr[i] = Math.floor(Math.random() * 0xffffffff);
  }
  let n = 0n;
  for (const v of arr) n = (n << 32n) | BigInt(v);
  return base62(Number(n % BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFF")));
}

function getNYTimestamp() {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(new Date())
      .replace(/\//g, "-")
      .replace(/, /, "T")
      .replace(/ /g, ":");
  } catch {
    return new Date().toISOString();
  }
}

export async function writeLog(
  env,
  { type, payload, session_id, who, level, tags, binary, textOrVector },
) {
  const id = generateId();
  const timestamp = getNYTimestamp();
  const status = {};
  // D1
  try {
    await env.AQUIL_DB.prepare(
      "INSERT INTO metamorphic_logs (id, timestamp, kind, signal_strength, detail, session_id, voice_used, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        Date.now(),
        type,
        opts.level || null,
        JSON.stringify(payload),
        session_id || null,
        who || null,
        JSON.stringify(tags || []),
      )
      .run();
    status.d1 = "ok";
  } catch (e) {
    status.d1 = String(e);
  }

  // KV
  try {
    await env.AQUIL_MEMORIES.put(
      `log_${id}`,
      JSON.stringify({
        id,
        timestamp,
        type,
        payload,
        session_id,
        who,
        level,
        tags,
      }),
      { expirationTtl: 86400 },
    );
    status.kv = "ok";
  } catch (e) {
    status.kv = String(e);
  }

  // R2
  if (binary) {
    try {
      const bytes = Uint8Array.from(atob(binary), (c) => c.charCodeAt(0));
      await env.AQUIL_STORAGE.put(`logbin_${id}`, bytes);
      status.r2 = "ok";
    } catch (e) {
      status.r2 = String(e);
    }
  }

  // Vector
  if (textOrVector) {
    try {
      let values;
      if (typeof textOrVector === "string") {
        // Embed text
        values = await env.AI.run("@cf/baai/bge-small-en-v1.5", {
          text: textOrVector,
        });
      } else if (Array.isArray(textOrVector)) {
        values = textOrVector;
      }
      if (values) {
        await env.AQUIL_CONTEXT.upsert([
          {
            id: `logvec_${id}`,
            values,
            metadata: {
              type,
              session_id,
              who,
              level,
              tags,
            },
          },
        ]);
        status.vector = "ok";
      }
    } catch (e) {
      status.vector = String(e);
    }
  }
  return status;
}
