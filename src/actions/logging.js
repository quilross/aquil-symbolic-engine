import { randomUUID } from 'crypto';

function genId() {
  try {
    return randomUUID();
  } catch {
    return 'log-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
}

async function writeWithRetry(op) {
  try {
    await op();
  } catch (err) {
    try {
      await op();
    } catch (err2) {
      throw err2;
    }
  }
}

export async function logDataOrEvent(env, entry = {}) {
  const id = entry.id || genId();
  const log = { ...entry, id };
  const failures = [];

  // Primary D1 write
  if (env?.D1?.put) {
    try {
      await writeWithRetry(() => env.D1.put(id, log));
    } catch {
      failures.push('D1');
    }
  } else {
    failures.push('D1');
  }

  // KV write (cache & fallback)
  if (env?.MEMORY_KV?.put) {
    try {
      await writeWithRetry(() => env.MEMORY_KV.put(id, JSON.stringify(log)));
    } catch {
      failures.push('KV');
    }
  } else {
    failures.push('KV');
  }

  // Vector index write (Cloudflare Vectorize: aquil-context-index, 1024-dim cosine)
  const vector = env?.AQUIL_CONTEXT;
  if (vector?.upsert) {
    try {
      const values = Array.isArray(entry.vector)
        ? entry.vector
        : [0];
      await writeWithRetry(() =>
        vector.upsert([{ id, values, metadata: log }])
      );
    } catch {
      failures.push('Vector');
    }
  } else {
    failures.push('Vector');
  }

  if (failures.length && env?.MEMORY_KV?.put) {
    await env.MEMORY_KV.put(`pending:${id}`, JSON.stringify({ log, failures }));
    return { status: 'pending', id, failed: failures };
  }

  return { status: 'ok', id };
}

async function vectorSearch(env, query) {
  const q = typeof query === 'string' ? { id: query } : query;
  const res = await env.AQUIL_CONTEXT.query(q);
  return res && res.length ? res : [];
}

async function d1Get(env, id) {
  return env.D1.get ? await env.D1.get(id) : null;
}

async function kvGet(env, id) {
  const val = env.MEMORY_KV.get ? await env.MEMORY_KV.get(id) : null;
  return typeof val === 'string' ? JSON.parse(val) : val;
}

export async function retrieveLogsOrDataEntries(env, query) {
  const id = typeof query === 'string' ? query : query.id;
  try {
    const vectorRes = await vectorSearch(env, query);
    if (vectorRes.length) return { status: 'vector', results: vectorRes };

    const d1Res = await d1Get(env, id);
    if (d1Res) return {
      status: 'fallback',
      used: 'D1',
      message: 'Vector empty',
      results: [d1Res]
    };

    const kvRes = await kvGet(env, id);
    if (kvRes) return {
      status: 'fallback',
      used: 'KV',
      message: 'Vector empty',
      results: [kvRes]
    };

    return { status: 'error', message: 'No logs found' };
  } catch {
    try {
      const d1Res = await d1Get(env, id);
      if (d1Res) return {
        status: 'fallback',
        used: 'D1',
        message: 'Vector endpoint down',
        results: [d1Res]
      };
    } catch {
      const kvRes = await kvGet(env, id);
      if (kvRes) return {
        status: 'fallback',
        used: 'KV',
        message: 'Vector and D1 endpoints down',
        results: [kvRes]
      };
      return { status: 'error', message: 'Vector and D1 endpoints down' };
    }

    const kvRes = await kvGet(env, id);
    if (kvRes) return {
      status: 'fallback',
      used: 'KV',
      message: 'Vector endpoint down',
      results: [kvRes]
    };
    return { status: 'error', message: 'Vector endpoint down' };
  }
}

export async function searchLogs(env, text) {
  try {
    const vectorRes = await vectorSearch(env, { text });
    if (vectorRes.length) return { status: 'vector', results: vectorRes };

    const d1Res = env.D1.search ? await env.D1.search(text) : [];
    if (d1Res.length) return {
      status: 'fallback',
      used: 'D1',
      message: 'Vector empty',
      results: d1Res
    };

    const kvRes = env.MEMORY_KV.search ? await env.MEMORY_KV.search(text) : [];
    if (kvRes.length) return {
      status: 'fallback',
      used: 'KV',
      message: 'Vector empty',
      results: kvRes
    };

    return { status: 'error', message: 'No logs found' };
  } catch {
    try {
      const d1Res = env.D1.search ? await env.D1.search(text) : [];
      if (d1Res.length) return {
        status: 'fallback',
        used: 'D1',
        message: 'Vector endpoint down',
        results: d1Res
      };
    } catch {
      const kvRes = env.MEMORY_KV.search ? await env.MEMORY_KV.search(text) : [];
      if (kvRes.length) return {
        status: 'fallback',
        used: 'KV',
        message: 'Vector and D1 endpoints down',
        results: kvRes
      };
      return { status: 'error', message: 'Vector and D1 endpoints down' };
    }

    const kvRes = env.MEMORY_KV.search ? await env.MEMORY_KV.search(text) : [];
    if (kvRes.length) return {
      status: 'fallback',
      used: 'KV',
      message: 'Vector endpoint down',
      results: kvRes
    };
    return { status: 'error', message: 'Vector endpoint down' };
  }
}

export async function advancedLoggingOperations(env, { operation } = {}) {
  if (operation !== 'syncPending') return { status: 'error', message: 'unknown operation' };
  if (!env?.MEMORY_KV?.list) return { status: 'error', message: 'KV unavailable' };
  const { keys = [] } = await env.MEMORY_KV.list({ prefix: 'pending:' });
  let synced = 0;
  for (const { name } of keys) {
    const val = await env.MEMORY_KV.get(name);
    if (!val) continue;
    const { log } = JSON.parse(val);
    const id = log.id;
    const errs = [];
    try {
      await env.D1.put(id, log);
    } catch {
      errs.push('D1');
    }
    try {
      await env.AQUIL_CONTEXT.upsert([{ id, values: log.vector || new Array(1024).fill(0), metadata: log.metadata }]);
    } catch {
      errs.push('Vector');
    }
    if (errs.length === 0) {
      await env.MEMORY_KV.delete(name);
      synced++;
    }
  }
  return { status: 'ok', synced };
}

export default {
  logDataOrEvent,
  retrieveLogsOrDataEntries,
  searchLogs,
  advancedLoggingOperations
};

