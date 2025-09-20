import test from 'node:test';
import assert from 'node:assert/strict';

import { upsert, query } from '../src/actions/vectorize.js';

const requestWithBody = (body) => ({
  json: async () => body
});

test('upsert uses available vectorize binding fallback', async () => {
  let capturedPayload;
  const env = {
    AQUIL_CONTEXT: {
      upsert: async (payload) => {
        capturedPayload = payload;
      }
    }
  };

  const res = await upsert(
    requestWithBody({ id: 'entry-1', vector: [0.1, 0.2], metadata: { scope: 'test' } }),
    env
  );

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, id: 'entry-1' });
  assert.deepEqual(capturedPayload, [
    { id: 'entry-1', values: [0.1, 0.2], metadata: { scope: 'test' } }
  ]);
});

test('query returns data from available binding with provided options', async () => {
  let receivedVector;
  let receivedOptions;
  const env = {
    AQUIL_CONTEXT: {
      query: async (vector, options) => {
        receivedVector = vector;
        receivedOptions = options;
        return { matches: [{ id: 'x', score: 0.99 }] };
      }
    }
  };

  const res = await query(requestWithBody({ vector: [0.3, 0.4], topK: 3 }), env);

  assert.equal(res.status, 200);
  assert.deepEqual(receivedVector, [0.3, 0.4]);
  assert.deepEqual(receivedOptions, { topK: 3 });
  assert.deepEqual(await res.json(), { results: { matches: [{ id: 'x', score: 0.99 }] } });
});

test('missing vector binding surfaces helpful error', async () => {
  const env = {};

  const res = await upsert(requestWithBody({ id: 'entry-2', vector: [0.5] }), env);

  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.error, 'vector_binding_missing');
  assert.match(body.message, /Vectorize binding not configured/);
});
