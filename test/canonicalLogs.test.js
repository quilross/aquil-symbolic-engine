import test from "node:test";
import assert from "node:assert/strict";
import { transformToCanonicalFormat, applyCursorPagination } from "../src/utils/canonical-logs.js";

test("transformToCanonicalFormat - D1 logs", () => {
  const env = { ENVIRONMENT: 'test' };
  const rawLogs = {
    d1: [
      {
        id: 'test-log-1',
        timestamp: '2024-01-01T12:00:00Z',
        kind: 'trust_check_in',
        tags: '["test", "trust"]'
      },
      {
        id: 'test-log-2', 
        timestamp: '2024-01-01T12:01:00Z',
        kind: 'error_test',
        detail: { error: 'Test error', code: 'TEST_ERROR' },
        tags: '[]'
      }
    ]
  };
  
  const canonical = transformToCanonicalFormat(rawLogs, env);
  
  assert.equal(canonical.length, 2);
  assert.equal(canonical[0].operationId, 'trustCheckIn'); // Canonical form
  assert.equal(canonical[0].originalOperationId, 'trust_check_in'); // Original preserved
  assert.equal(canonical[0].type, 'action_success');
  assert.ok(canonical[0].tags.includes('action:trustCheckIn'));
  assert.ok(canonical[0].tags.includes('alias:trust_check_in'));
  assert.ok(canonical[0].tags.includes('env:test'));
  
  assert.equal(canonical[1].type, 'action_error');
  assert.equal(canonical[1].error.message, 'Test error');
  assert.equal(canonical[1].error.code, 'TEST_ERROR');
});

test("transformToCanonicalFormat - KV logs", () => {
  const env = { ENVIRONMENT: 'test' };
  const rawLogs = {
    kv: [
      {
        id: 'kv-log-1',
        timestamp: '2024-01-01T12:00:00Z',
        type: 'extract_media_wisdom',
        level: 'info',
        tags: ['media', 'wisdom']
      }
    ]
  };
  
  const canonical = transformToCanonicalFormat(rawLogs, env);
  
  assert.equal(canonical.length, 1);
  assert.equal(canonical[0].operationId, 'extractMediaWisdom');
  assert.equal(canonical[0].originalOperationId, 'extract_media_wisdom');
  assert.ok(canonical[0].stores.includes('kv'));
});

test("transformToCanonicalFormat - R2 logs", () => {
  const env = { ENVIRONMENT: 'test' };
  const rawLogs = {
    r2: [
      {
        id: 'r2-log-1',
        timestamp: '2024-01-01T12:00:00Z',
        type: 'somaticHealingSession',
        key: 'artifacts/somatic/session-1.json',
        tags: ['somatic', 'healing']
      }
    ]
  };
  
  const canonical = transformToCanonicalFormat(rawLogs, env);
  
  assert.equal(canonical.length, 1);
  assert.equal(canonical[0].operationId, 'somaticHealingSession');
  assert.equal(canonical[0].type, 'action_success');
  assert.equal(canonical[0].artifactKey, 'artifacts/somatic/session-1.json');
  assert.ok(canonical[0].stores.includes('r2'));
});

test("applyCursorPagination - basic pagination", () => {
  const logs = [
    { id: 'log-1', timestamp: '2024-01-01T12:03:00Z' },
    { id: 'log-2', timestamp: '2024-01-01T12:02:00Z' },
    { id: 'log-3', timestamp: '2024-01-01T12:01:00Z' },
    { id: 'log-4', timestamp: '2024-01-01T12:00:00Z' }
  ];
  
  // First page
  let result = applyCursorPagination(logs, { limit: 2 });
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].id, 'log-1'); // Newest first
  assert.equal(result.items[1].id, 'log-2');
  assert.equal(result.cursor, 'log-2');
  
  // Second page
  result = applyCursorPagination(logs, { cursor: 'log-2', limit: 2 });
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].id, 'log-3');
  assert.equal(result.items[1].id, 'log-4');
  assert.equal(result.cursor, null); // Last page
});

test("applyCursorPagination - stable sort with ID tiebreaker", () => {
  const logs = [
    { id: 'log-b', timestamp: '2024-01-01T12:00:00Z' },
    { id: 'log-a', timestamp: '2024-01-01T12:00:00Z' }, // Same timestamp
    { id: 'log-c', timestamp: '2024-01-01T12:00:00Z' }
  ];
  
  const result = applyCursorPagination(logs, { limit: 10 });
  
  // Should be sorted by ID when timestamps are equal
  assert.equal(result.items[0].id, 'log-a');
  assert.equal(result.items[1].id, 'log-b');
  assert.equal(result.items[2].id, 'log-c');
});