import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  addEntry, 
  getEntryById, 
  getEntriesByUser, 
  updateEntry, 
  listRecentEntries,
  deleteEntry 
} from '../src/journalService.js';

describe('Journal Service Tests', () => {
  let mockEnv;
  let mockKV;

  beforeEach(() => {
    // Mock KV operations
    mockKV = {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({ keys: [] })
    };

    mockEnv = {
      AQUIL_MEMORIES: mockKV,
      KV_TTL_SECONDS: '3600' // 1 hour TTL for tests
    };
  });

  describe('addEntry', () => {
    it('should add entry successfully with valid data', async () => {
      const entryData = {
        id: 'test-123',
        type: 'user_action',
        timestamp: new Date().toISOString(),
        payload: { message: 'test entry' }
      };

      const result = await addEntry(mockEnv, entryData);

      expect(result.success).toBe(true);
      expect(result.id).toBe('test-123');
      expect(result.key).toBe('log:test-123');
      expect(mockKV.put).toHaveBeenCalledWith(
        'log:test-123',
        JSON.stringify(entryData),
        { expirationTtl: 3600 }
      );
    });

    it('should fail when entry data is invalid', async () => {
      const result = await addEntry(mockEnv, null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Entry data must be a valid object');
      expect(mockKV.put).not.toHaveBeenCalled();
    });

    it('should fail when KV namespace is not available', async () => {
      const envWithoutKV = { AQUIL_MEMORIES: null };
      const entryData = { id: 'test-123' };

      const result = await addEntry(envWithoutKV, entryData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('KV namespace AQUIL_MEMORIES not available');
    });

    it('should handle custom key prefix', async () => {
      const entryData = { id: 'test-123', type: 'custom' };
      const options = { keyPrefix: 'custom_' };

      const result = await addEntry(mockEnv, entryData, options);

      expect(result.success).toBe(true);
      expect(result.key).toBe('custom_test-123');
      expect(mockKV.put).toHaveBeenCalledWith(
        'custom_test-123',
        JSON.stringify(entryData),
        { expirationTtl: 3600 }
      );
    });
  });

  describe('getEntryById', () => {
    it('should retrieve entry successfully', async () => {
      const entryData = {
        id: 'test-123',
        type: 'user_action',
        timestamp: new Date().toISOString()
      };
      
      mockKV.get.mockResolvedValue(JSON.stringify(entryData));

      const result = await getEntryById(mockEnv, 'test-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(entryData);
      expect(result.id).toBe('test-123');
      expect(mockKV.get).toHaveBeenCalledWith('log:test-123', undefined);
    });

    it('should return not found when entry does not exist', async () => {
      mockKV.get.mockResolvedValue(null);

      const result = await getEntryById(mockEnv, 'nonexistent-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Entry not found');
      expect(result.entryId).toBe('nonexistent-123');
    });

    it('should fail when ID is invalid', async () => {
      const result = await getEntryById(mockEnv, '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Entry ID must be a non-empty string');
      expect(mockKV.get).not.toHaveBeenCalled();
    });
  });

  describe('getEntriesByUser', () => {
    it('should retrieve entries for specific user', async () => {
      const entries = [
        { name: 'log_1234567890', metadata: {} },
        { name: 'log_1234567891', metadata: {} }
      ];
      
      const entryData1 = { id: 'entry1', userId: 'user123', timestamp: '2023-01-01T00:00:00Z' };
      const entryData2 = { id: 'entry2', userId: 'user123', timestamp: '2023-01-02T00:00:00Z' };
      
      mockKV.list.mockResolvedValue({ keys: entries });
      mockKV.get
        .mockResolvedValueOnce(JSON.stringify(entryData1))
        .mockResolvedValueOnce(JSON.stringify(entryData2));

      const result = await getEntriesByUser(mockEnv, 'user123');

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(2);
      expect(result.userId).toBe('user123');
      // Should be sorted by timestamp (newest first)
      expect(result.entries[0].data.timestamp).toBe('2023-01-02T00:00:00Z');
      expect(result.entries[1].data.timestamp).toBe('2023-01-01T00:00:00Z');
    });

    it('should return empty array when no entries found for user', async () => {
      mockKV.list.mockResolvedValue({ keys: [] });

      const result = await getEntriesByUser(mockEnv, 'user123');

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateEntry', () => {
    it('should update existing entry with merge', async () => {
      const existingData = {
        id: 'test-123',
        type: 'user_action',
        oldField: 'old_value'
      };
      
      const updateData = {
        newField: 'new_value',
        type: 'updated_action'
      };

      // Mock existing entry retrieval
      mockKV.get.mockResolvedValue(JSON.stringify(existingData));

      const result = await updateEntry(mockEnv, 'test-123', updateData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('test-123');
      expect(result.data.oldField).toBe('old_value'); // Should preserve
      expect(result.data.newField).toBe('new_value'); // Should add
      expect(result.data.type).toBe('updated_action'); // Should update
      expect(result.data.updated_at).toBeDefined();
    });

    it('should create new entry when entry does not exist and allowCreate is true', async () => {
      mockKV.get.mockResolvedValue(null); // Entry doesn't exist

      const updateData = {
        type: 'new_action',
        field: 'value'
      };

      const result = await updateEntry(mockEnv, 'new-123', updateData, { allowCreate: true });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('new-123');
      expect(result.data.created_at).toBeDefined();
    });
  });

  describe('listRecentEntries', () => {
    it('should list recent entries successfully', async () => {
      const keys = [
        { name: 'log_1234567891', metadata: {} },
        { name: 'log_1234567890', metadata: {} }
      ];
      
      const entryData1 = { timestamp: '2023-01-02T00:00:00Z', type: 'action1' };
      const entryData2 = { timestamp: '2023-01-01T00:00:00Z', type: 'action2' };

      mockKV.list.mockResolvedValue({ keys });
      mockKV.get
        .mockResolvedValueOnce(JSON.stringify(entryData1))
        .mockResolvedValueOnce(JSON.stringify(entryData2));

      const result = await listRecentEntries(mockEnv);

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].content.timestamp).toBe('2023-01-02T00:00:00Z');
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry successfully', async () => {
      const result = await deleteEntry(mockEnv, 'test-123');

      expect(result.success).toBe(true);
      expect(result.id).toBe('test-123');
      expect(result.deleted).toBe(true);
      expect(mockKV.delete).toHaveBeenCalledWith('log:test-123');
    });

    it('should fail when ID is invalid', async () => {
      const result = await deleteEntry(mockEnv, '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Entry ID must be a non-empty string');
      expect(mockKV.delete).not.toHaveBeenCalled();
    });
  });
});