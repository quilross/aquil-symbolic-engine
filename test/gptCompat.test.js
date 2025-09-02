import test from "node:test";
import assert from "node:assert/strict";
import { isGPTCompatMode, safeBinding, safeOperation, safeLog } from "../src/utils/gpt-compat.js";

test("GPT_COMPAT_MODE detection", () => {
  // Test with string 'true'
  let env = { GPT_COMPAT_MODE: 'true' };
  assert.equal(isGPTCompatMode(env), true);
  
  // Test with boolean true
  env = { GPT_COMPAT_MODE: true };
  assert.equal(isGPTCompatMode(env), true);
  
  // Test with string 'false'
  env = { GPT_COMPAT_MODE: 'false' };
  assert.equal(isGPTCompatMode(env), false);
  
  // Test with boolean false
  env = { GPT_COMPAT_MODE: false };
  assert.equal(isGPTCompatMode(env), false);
  
  // Test with missing env - now defaults to true
  env = {};
  assert.equal(isGPTCompatMode(env), true);
  
  // Test with null env - now defaults to true
  assert.equal(isGPTCompatMode(null), true);
});

test("safeBinding with GPT_COMPAT_MODE", () => {
  // Test normal mode - should return binding
  let env = { GPT_COMPAT_MODE: false, AQUIL_DB: { test: 'value' } };
  let binding = safeBinding(env, 'AQUIL_DB');
  assert.deepEqual(binding, { test: 'value' });
  
  // Test normal mode with missing binding - should return undefined
  env = { GPT_COMPAT_MODE: false };
  binding = safeBinding(env, 'AQUIL_DB');
  assert.equal(binding, undefined);
  
  // Test compat mode with missing binding - should return null
  env = { GPT_COMPAT_MODE: true };
  binding = safeBinding(env, 'AQUIL_DB');
  assert.equal(binding, null);
  
  // Test compat mode with existing binding - should return binding
  env = { GPT_COMPAT_MODE: true, AQUIL_DB: { test: 'value' } };
  binding = safeBinding(env, 'AQUIL_DB');
  assert.deepEqual(binding, { test: 'value' });
});

test("safeOperation with GPT_COMPAT_MODE", async () => {
  // Test normal mode with successful operation
  let env = { GPT_COMPAT_MODE: false };
  let result = await safeOperation(env, () => Promise.resolve('success'), 'fallback');
  assert.equal(result, 'success');
  
  // Test normal mode with failing operation - should throw
  env = { GPT_COMPAT_MODE: false };
  await assert.rejects(
    () => safeOperation(env, () => Promise.reject(new Error('test error')), 'fallback'),
    /test error/
  );
  
  // Test compat mode with failing operation - should return fallback
  env = { GPT_COMPAT_MODE: true };
  result = await safeOperation(env, () => Promise.reject(new Error('test error')), 'fallback');
  assert.equal(result, 'fallback');
  
  // Test compat mode with successful operation - should return result
  env = { GPT_COMPAT_MODE: true };
  result = await safeOperation(env, () => Promise.resolve('success'), 'fallback');
  assert.equal(result, 'success');
});

test("safeLog with GPT_COMPAT_MODE", async () => {
  // Test normal mode with successful log
  let env = { GPT_COMPAT_MODE: false };
  let result = await safeLog(env, () => Promise.resolve());
  assert.equal(result, true);
  
  // Test normal mode with failing log - should throw
  env = { GPT_COMPAT_MODE: false };
  await assert.rejects(
    () => safeLog(env, () => Promise.reject(new Error('log error'))),
    /log error/
  );
  
  // Test compat mode with failing log - should return false
  env = { GPT_COMPAT_MODE: true };
  result = await safeLog(env, () => Promise.reject(new Error('log error')));
  assert.equal(result, false);
  
  // Test compat mode with successful log - should return true
  env = { GPT_COMPAT_MODE: true };
  result = await safeLog(env, () => Promise.resolve());
  assert.equal(result, true);
});