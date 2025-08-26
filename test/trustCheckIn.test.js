import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

function createEnv() {
  return {
    AQUIL_DB: {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
          run: async () => ({})
        })
      })
    },
    AQUIL_MEMORIES: {}
  };
}

test('trust check-in endpoint returns analysis', async () => {
  const env = createEnv();
  const request = new Request('http://localhost/api/trust/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_state: 'I trust myself', trust_level: 7 })
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.trust_analysis);
  assert.ok(data.message);
});
