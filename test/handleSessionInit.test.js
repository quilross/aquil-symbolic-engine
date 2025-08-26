import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSessionInit } from '../src/ark/endpoints.js';

// utility to create fake env with stubbed DB and AI
function createEnv(logs) {
  return {
    AQUIL_DB: {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: logs }),
          run: async () => ({})
        })
      })
    },
    AI: {
      run: async () => ({ response: 'hi' })
    }
  };
}

test('handleSessionInit retrieves continuity logs', async () => {
  const fakeLogs = [
    { id: '1', timestamp: '2024-01-01T00:00:00Z', kind: 'test', detail: '{"foo":"bar"}' }
  ];
  const env = createEnv(fakeLogs);
  const res = await handleSessionInit(new Request('http://local/session-init'), env);
  const data = await res.json();
  assert.equal(data.continuity.length, 1);
  assert.deepEqual(data.continuity[0], {
    id: '1',
    timestamp: '2024-01-01T00:00:00Z',
    kind: 'test',
    detail: { foo: 'bar' }
  });
});
