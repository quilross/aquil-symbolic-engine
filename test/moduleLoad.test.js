import test from 'node:test';
import assert from 'node:assert/strict';

const fakeEnv = { AQUIL_DB: {}, AQUIL_MEMORIES: {} };

test('AquilCore module loads', async () => {
  const { AquilCore } = await import('../src/src-core-aquil-core.js');
  const instance = new AquilCore(fakeEnv);
  assert.ok(instance);
});

test('TrustBuilder module loads', async () => {
  const { TrustBuilder } = await import('../src/src-core-trust-builder.js');
  const instance = new TrustBuilder(fakeEnv);
  assert.ok(instance);
});
