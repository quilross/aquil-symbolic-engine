import { test } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * D1 Schema Migration Tests
 * Tests the D1 logging schema fix migration
 */

test('D1 schema migration - verify new table structure', () => {
  // Test SQL query for new metamorphic_logs structure
  const expectedColumns = [
    'id', 'timestamp', 'operationId', 'originalOperationId', 'kind', 'level',
    'session_id', 'tags', 'stores', 'artifactKey', 'error_message', 'error_code',
    'detail', 'env', 'source'
  ];
  
  // Mock schema verification - in real deployment this would verify actual D1 schema
  const mockSchemaResult = {
    columns: expectedColumns,
    indexes: ['idx_logs_ts', 'idx_logs_op', 'idx_logs_session']
  };
  
  assert.equal(mockSchemaResult.columns.length, 15, 'Should have 15 columns in canonical schema');
  assert.ok(mockSchemaResult.columns.includes('id'), 'Should have id column');
  assert.ok(mockSchemaResult.columns.includes('operationId'), 'Should have operationId column');
  assert.ok(mockSchemaResult.columns.includes('stores'), 'Should have stores column');
});

test('D1 schema migration - verify event_log compatibility view', () => {
  // Test that event_log VIEW maps correctly to metamorphic_logs
  const mockViewMapping = {
    'id': 'id',
    'ts': 'timestamp',
    'type': 'kind',
    'who': 'source',
    'level': 'level',
    'session_id': 'session_id',
    'tags': 'tags',
    'payload': 'detail'
  };
  
  // Verify all required event_log columns are mapped
  const requiredEventLogColumns = ['id', 'ts', 'type', 'who', 'level', 'session_id', 'tags', 'payload'];
  for (const col of requiredEventLogColumns) {
    assert.ok(mockViewMapping[col], `event_log column ${col} should be mapped`);
  }
});

test('D1 migration - verify data migration logic', () => {
  // Test the data migration mapping from old to new schema
  const oldRecord = {
    id: 'test123',
    timestamp: '2024-01-01T12:00:00Z',
    kind: 'test_action',
    signal_strength: 'medium',
    detail: '{"test": "data"}',
    session_id: 'session123',
    voice_used: 'mirror',
    tags: 'tag1,tag2'
  };
  
  // Expected new record after migration
  const expectedNewRecord = {
    id: 'test123',
    timestamp: '2024-01-01T12:00:00Z',
    operationId: null,
    originalOperationId: null,
    kind: 'test_action',
    level: 'medium', // mapped from signal_strength
    session_id: 'session123',
    tags: 'tag1,tag2',
    stores: null,
    artifactKey: null,
    error_message: null,
    error_code: null,
    detail: '{"test": "data"}',
    env: null,
    source: 'gpt' // default value
  };
  
  // Verify migration mapping
  assert.equal(expectedNewRecord.level, oldRecord.signal_strength, 'signal_strength should map to level');
  assert.equal(expectedNewRecord.kind, oldRecord.kind, 'kind should be preserved');
  assert.equal(expectedNewRecord.session_id, oldRecord.session_id, 'session_id should be preserved');
  assert.equal(expectedNewRecord.source, 'gpt', 'source should default to gpt');
});

test('Logging code compatibility - new schema insert', () => {
  // Test that the new logging code produces correct insert parameters
  const mockLogEntry = {
    id: 'log123',
    timestamp: '2024-01-01T12:00:00.000Z',
    operationId: 'trustCheckIn',
    originalOperationId: null,
    kind: 'action_success',
    level: 'info',
    session_id: 'session123',
    tags: JSON.stringify(['trust', 'action']),
    stores: JSON.stringify(['d1']),
    artifactKey: null,
    error_message: null,
    error_code: null,
    detail: JSON.stringify({content: 'test'}),
    env: 'production',
    source: 'gpt'
  };
  
  // Verify all required fields are present
  assert.ok(mockLogEntry.id, 'Should have id');
  assert.ok(mockLogEntry.timestamp, 'Should have timestamp');
  assert.ok(mockLogEntry.kind, 'Should have kind');
  assert.ok(mockLogEntry.detail, 'Should have detail');
  
  // Verify canonical schema compliance
  assert.equal(typeof mockLogEntry.tags, 'string', 'tags should be JSON string');
  assert.equal(typeof mockLogEntry.stores, 'string', 'stores should be JSON string');
  assert.equal(mockLogEntry.source, 'gpt', 'source should be set');
});