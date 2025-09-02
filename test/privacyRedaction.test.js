import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { redactPayload, redactJsonString, containsPotentialSecrets } from '../src/utils/privacy.js';

test('Privacy redaction removes sensitive fields', () => {
  const payload = {
    user: 'john',
    password: 'secret123',
    api_key: 'key_abc123',
    authorization: 'Bearer token123',
    cookie: 'session=abc123',
    message: 'hello world',
    data: {
      token: 'nested_token',
      normal_field: 'safe_value'
    }
  };

  const redacted = redactPayload(payload);

  // Sensitive fields should be redacted
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.api_key, '[REDACTED]');
  assert.equal(redacted.authorization, '[REDACTED]');
  assert.equal(redacted.cookie, '[REDACTED]');
  assert.equal(redacted.data.token, '[REDACTED]');

  // Safe fields should remain
  assert.equal(redacted.user, 'john');
  assert.equal(redacted.message, 'hello world');
  assert.equal(redacted.data.normal_field, 'safe_value');
});

test('Privacy redaction handles edge cases', () => {
  // Null/undefined
  assert.equal(redactPayload(null), null);
  assert.equal(redactPayload(undefined), undefined);

  // Non-objects
  assert.equal(redactPayload('string'), 'string');
  assert.equal(redactPayload(123), 123);

  // Arrays
  const arr = [{ password: 'secret' }, { safe: 'value' }];
  const redactedArr = redactPayload(arr);
  assert.equal(redactedArr[0].password, '[REDACTED]');
  assert.equal(redactedArr[1].safe, 'value');
});

test('redactJsonString works correctly', () => {
  const jsonStr = '{"password":"secret","message":"hello"}';
  const redacted = redactJsonString(jsonStr);
  const parsed = JSON.parse(redacted);
  
  assert.equal(parsed.password, '[REDACTED]');
  assert.equal(parsed.message, 'hello');
});

test('containsPotentialSecrets detection', () => {
  assert.equal(containsPotentialSecrets({ password: 'secret' }), true);
  assert.equal(containsPotentialSecrets({ api_key: 'key123' }), true);
  assert.equal(containsPotentialSecrets({ message: 'hello' }), false);
  assert.equal(containsPotentialSecrets(null), false);
});

test('redaction preserves type information', () => {
  const payload = {
    password: 'string_secret',
    secret_number: 42,
    secret_bool: true,
    secret_object: { nested: true }
  };

  const redacted = redactPayload(payload);
  
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.secret_number, '[REDACTED_NUMBER]');
  assert.equal(redacted.secret_bool, '[REDACTED_BOOLEAN]');
  assert.equal(redacted.secret_object, '[REDACTED]');
});