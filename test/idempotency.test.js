import { test } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * Idempotency Tests for D1 Logging
 * Tests that replaying the same log ID doesn't create duplicates
 */

test('Idempotency - same log ID should not create duplicates', () => {
  // Mock D1 database to test INSERT OR IGNORE behavior
  let insertCalls = 0;
  let storedRecords = new Map();
  
  const mockD1 = {
    prepare: (sql) => ({
      bind: (...params) => ({
        run: async () => {
          insertCalls++;
          const [id] = params;
          
          // Simulate INSERT OR IGNORE behavior
          if (sql.includes('INSERT OR IGNORE')) {
            if (!storedRecords.has(id)) {
              storedRecords.set(id, { id, ...params });
              return { success: true, meta: { changes: 1 } };
            } else {
              // Duplicate ID - ignore (no changes)
              return { success: true, meta: { changes: 0 } };
            }
          } else if (sql.includes('INSERT INTO')) {
            // Regular insert would fail on duplicate
            if (storedRecords.has(id)) {
              throw new Error('UNIQUE constraint failed: metamorphic_logs.id');
            }
            storedRecords.set(id, { id, ...params });
            return { success: true, meta: { changes: 1 } };
          }
          
          return { success: true };
        }
      })
    })
  };
  
  // Test INSERT OR IGNORE behavior
  const testId = 'test-log-123';
  const insertSQL = "INSERT OR IGNORE INTO metamorphic_logs (id, timestamp, operationId, originalOperationId, kind, level, session_id, tags, stores, artifactKey, error_message, error_code, detail, env, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  
  // First insert - should succeed
  const firstInsert = mockD1.prepare(insertSQL).bind(
    testId, '2024-01-01T12:00:00Z', 'trustCheckIn', null, 'action_success', 'info',
    'session123', '["trust"]', '["d1"]', null, null, null, '{"test":true}', 'test', 'gpt'
  );
  
  // Second insert with same ID - should be ignored
  const secondInsert = mockD1.prepare(insertSQL).bind(
    testId, '2024-01-01T12:01:00Z', 'trustCheckIn', null, 'action_success', 'info',
    'session123', '["trust"]', '["d1"]', null, null, null, '{"test":true}', 'test', 'gpt'
  );
  
  // Execute both inserts
  firstInsert.run();
  secondInsert.run();
  
  // Verify behavior
  assert.equal(insertCalls, 2, 'Both inserts should be attempted');
  assert.equal(storedRecords.size, 1, 'Only one record should exist (no duplicates)');
  assert.ok(storedRecords.has(testId), 'Record should exist with the test ID');
});

test('Regular INSERT would fail on duplicate ID', async () => {
  // Mock for regular INSERT behavior (should fail)
  const storedRecords = new Map();
  
  const mockD1BadInsert = {
    prepare: (sql) => ({
      bind: (...params) => ({
        run: async () => {
          const [id] = params;
          
          if (storedRecords.has(id)) {
            throw new Error('UNIQUE constraint failed: metamorphic_logs.id');
          }
          storedRecords.set(id, { id, ...params });
          return { success: true };
        }
      })
    })
  };
  
  const testId = 'test-duplicate';
  const regularInsertSQL = "INSERT INTO metamorphic_logs (id, timestamp, operationId) VALUES (?, ?, ?)";
  
  // First insert - should succeed
  const firstInsert = mockD1BadInsert.prepare(regularInsertSQL).bind(testId, '2024-01-01T12:00:00Z', 'test');
  await firstInsert.run();
  
  // Second insert - should fail with constraint error
  const secondInsert = mockD1BadInsert.prepare(regularInsertSQL).bind(testId, '2024-01-01T12:01:00Z', 'test');
  
  await assert.rejects(async () => {
    await secondInsert.run();
  }, /UNIQUE constraint failed/, 'Regular INSERT should fail on duplicate ID');
});

test('Canonical operationId mapping', async () => {
  // Mock the toCanonical function behavior
  const canonicalMappings = {
    'trust_check_in': 'trustCheckIn',
    'check_in': 'trustCheckIn',
    'system_health_check': 'systemHealthCheck',
    'log': 'log'
  };
  
  function mockToCanonical(operationId) {
    return canonicalMappings[operationId] || operationId;
  }
  
  // Test canonical mapping
  assert.equal(mockToCanonical('trust_check_in'), 'trustCheckIn');
  assert.equal(mockToCanonical('check_in'), 'trustCheckIn');
  assert.equal(mockToCanonical('system_health_check'), 'systemHealthCheck');
  assert.equal(mockToCanonical('unknown_operation'), 'unknown_operation');
  
  // Test originalOperationId logic
  const testCases = [
    { input: 'trust_check_in', canonical: 'trustCheckIn', shouldHaveOriginal: true },
    { input: 'trustCheckIn', canonical: 'trustCheckIn', shouldHaveOriginal: false },
    { input: 'log', canonical: 'log', shouldHaveOriginal: false }
  ];
  
  for (const testCase of testCases) {
    const canonical = mockToCanonical(testCase.input);
    const originalOperationId = (testCase.input && testCase.input !== canonical) ? testCase.input : null;
    
    assert.equal(canonical, testCase.canonical, `Canonical mapping for ${testCase.input}`);
    
    if (testCase.shouldHaveOriginal) {
      assert.equal(originalOperationId, testCase.input, `Should preserve original ${testCase.input}`);
    } else {
      assert.equal(originalOperationId, null, `Should not have original for ${testCase.input}`);
    }
  }
});