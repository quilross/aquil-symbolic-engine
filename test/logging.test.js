import test from 'node:test';
import assert from 'node:assert/strict';
import {
  logDataOrEvent,
  retrieveLogsOrDataEntries,
  searchLogs
} from '../src/actions/logging.js';

function createMockEnv({ d1Fail = false, vectorFail = false } = {}) {
  const d1Store = new Map();
  const kvStore = new Map();
  const vectorStore = new Map();

  const env = {
    D1: {
      async put(id, data) {
        if (d1Fail) throw new Error('D1 down');
        d1Store.set(id, data);
      },
      async get(id) {
        if (d1Fail) throw new Error('D1 down');
        return d1Store.get(id);
      },
      async search(text) {
        if (d1Fail) throw new Error('D1 down');
        const res = [];
        for (const val of d1Store.values()) {
          if (JSON.stringify(val).includes(text)) res.push(val);
        }
        return res;
      }
    },
    MEMORY_KV: {
      async put(key, value) {
        kvStore.set(key, value);
      },
      async get(key) {
        return kvStore.get(key);
      },
      async list({ prefix = '' } = {}) {
        const keys = [];
        for (const k of kvStore.keys()) {
          if (k.startsWith(prefix)) keys.push({ name: k });
        }
        return { keys };
      },
      async delete(key) {
        kvStore.delete(key);
      },
      async search(text) {
        const res = [];
        for (const val of kvStore.values()) {
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (JSON.stringify(obj).includes(text)) res.push(obj);
        }
        return res;
      }
    },
    VECTORIZE: {
      async upsert(entries) {
        if (vectorFail) throw new Error('Vector down');
        entries.forEach(e => vectorStore.set(e.id, e));
      },
      async query(q) {
        if (vectorFail) throw new Error('Vector down');
        const id = q.id || q;
        return vectorStore.has(id) ? [vectorStore.get(id)] : [];
      }
    }
  };
  return { env, stores: { d1Store, kvStore, vectorStore } };
}

test('log event and retrieve across all layers', async () => {
  const { env, stores } = createMockEnv();
  const res = await logDataOrEvent(env, { detail: 'alpha' });
  assert.equal(res.status, 'ok');
  const id = res.id;
  assert.ok(stores.d1Store.has(id));
  assert.ok(stores.kvStore.has(id));
  assert.ok(stores.vectorStore.has(id));

  const retrieved = await retrieveLogsOrDataEntries(env, id);
  assert.equal(retrieved.status, 'vector');
  assert.equal(retrieved.results[0].metadata.detail, 'alpha');
});

test('vector failure falls back to D1', async () => {
  const { env } = createMockEnv({ vectorFail: true });
  const res = await logDataOrEvent(env, { detail: 'beta' });
  assert.equal(res.status, 'pending');
  const id = res.id;
  const retrieved = await retrieveLogsOrDataEntries(env, id);
  assert.equal(retrieved.status, 'fallback');
  assert.equal(retrieved.used, 'D1');
  assert.equal(retrieved.message, 'Vector endpoint down');
  assert.equal(retrieved.results[0].detail, 'beta');
});

test('vector and D1 failure falls back to KV', async () => {
  const { env } = createMockEnv({ vectorFail: true, d1Fail: true });
  const res = await logDataOrEvent(env, { detail: 'gamma' });
  assert.equal(res.status, 'pending');
  const id = res.id;
  const retrieved = await retrieveLogsOrDataEntries(env, id);
  assert.equal(retrieved.status, 'fallback');
  assert.equal(retrieved.used, 'KV');
  assert.ok(retrieved.message.includes('Vector'));
  assert.equal(retrieved.results[0].detail, 'gamma');
});

test('searchLogs falls back to D1 when vector fails', async () => {
  const { env } = createMockEnv({ vectorFail: true });
  await logDataOrEvent(env, { detail: 'delta' });
  const searched = await searchLogs(env, 'delta');
  assert.equal(searched.status, 'fallback');
  assert.equal(searched.used, 'D1');
  assert.equal(searched.message, 'Vector endpoint down');
  assert.equal(searched.results[0].detail, 'delta');
});

test('searchLogs falls back to KV when vector and D1 fail', async () => {
  const { env } = createMockEnv({ vectorFail: true, d1Fail: true });
  await logDataOrEvent(env, { detail: 'epsilon' });
  const searched = await searchLogs(env, 'epsilon');
  assert.equal(searched.status, 'fallback');
  assert.equal(searched.used, 'KV');
  assert.ok(searched.message.includes('Vector'));
  assert.equal(searched.results[0].detail, 'epsilon');
});

