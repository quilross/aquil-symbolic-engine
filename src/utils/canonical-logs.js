/**
 * Canonical Log Format Utilities
 * Provides consistent formatting between /api/logs and /api/logs/session/:sessionId
 */

import { toCanonical } from '../ops/operation-aliases.js';

/**
 * Transform raw logs into canonical format used by /api/logs
 * @param {Object} logs - Raw logs from various stores
 * @param {Object} env - Environment object
 * @returns {Array} Array of canonically formatted logs
 */
export function transformToCanonicalFormat(logs, env) {
  const standardizedLogs = new Map(); // Use Map to deduplicate by id
  
  // Process D1 logs
  if (Array.isArray(logs.d1)) {
    logs.d1.forEach(log => {
      const originalOperationId = log.kind || 'unknown';
      const canonical = toCanonical(originalOperationId);
      
      const standardLog = {
        id: log.id || `d1_${log.timestamp}_${Math.random()}`,
        timestamp: log.timestamp,
        operationId: canonical,
        type: log.kind?.includes('error') ? 'action_error' : 'action_success',
        tags: [
          `action:${canonical}`,
          ...(canonical !== originalOperationId ? [`alias:${originalOperationId}`] : []),
          'domain:system',
          'source:gpt',
          `env:${env.ENVIRONMENT || 'production'}`
        ].concat(log.tags ? JSON.parse(log.tags) : []),
        stores: ['d1']
      };
      
      // Add originalOperationId if different from canonical
      if (canonical !== originalOperationId) {
        standardLog.originalOperationId = originalOperationId;
      }
      
      if (log.kind?.includes('error')) {
        standardLog.error = {
          message: log.detail?.error || 'Unknown error',
          code: log.detail?.code || undefined
        };
      }
      
      standardizedLogs.set(standardLog.id, standardLog);
    });
  }
  
  // Process KV logs  
  if (Array.isArray(logs.kv)) {
    logs.kv.forEach(log => {
      const logId = log.id || `kv_${log.timestamp}_${Math.random()}`;
      const existing = standardizedLogs.get(logId);
      const originalOperationId = log.type || 'unknown';
      const canonical = toCanonical(originalOperationId);
      
      const standardLog = {
        id: logId,
        timestamp: log.timestamp || log.created_at,
        operationId: canonical,
        type: log.level === 'error' ? 'action_error' : 'action_success',
        tags: [
          `action:${canonical}`,
          ...(canonical !== originalOperationId ? [`alias:${originalOperationId}`] : []),
          'domain:system',
          'source:gpt',
          `env:${env.ENVIRONMENT || 'production'}`
        ].concat(log.tags || []),
        stores: existing ? [...existing.stores, 'kv'] : ['kv']
      };
      
      // Add originalOperationId if different from canonical
      if (canonical !== originalOperationId) {
        standardLog.originalOperationId = originalOperationId;
      }
      
      if (log.level === 'error') {
        standardLog.error = {
          message: log.payload?.message || 'Unknown error',
          code: log.payload?.code || undefined
        };
      }
      
      standardizedLogs.set(logId, { ...existing, ...standardLog });
    });
  }
  
  // Process R2 logs
  if (Array.isArray(logs.r2)) {
    logs.r2.forEach(log => {
      const logId = log.id || `r2_${log.timestamp}_${Math.random()}`;
      const existing = standardizedLogs.get(logId);
      const originalOperationId = log.type || 'unknown';
      const canonical = toCanonical(originalOperationId);
      
      const standardLog = {
        id: logId,
        timestamp: log.timestamp || log.created_at,
        operationId: canonical,
        type: 'action_success', // R2 typically stores successful actions
        tags: [
          `action:${canonical}`,
          ...(canonical !== originalOperationId ? [`alias:${originalOperationId}`] : []),
          'domain:system',
          'source:gpt',
          `env:${env.ENVIRONMENT || 'production'}`
        ].concat(log.tags || []),
        stores: existing ? [...existing.stores, 'r2'] : ['r2'],
        artifactKey: log.key || undefined
      };
      
      // Add originalOperationId if different from canonical
      if (canonical !== originalOperationId) {
        standardLog.originalOperationId = originalOperationId;
      }
      
      standardizedLogs.set(logId, { ...existing, ...standardLog });
    });
  }
  
  return Array.from(standardizedLogs.values());
}

/**
 * Apply cursor-based pagination to logs
 * @param {Array} logs - Array of logs to paginate
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated result with items and cursor
 */
export function applyCursorPagination(logs, { cursor, limit = 20 }) {
  // Sort by timestamp (stable sort with logId tiebreaker)
  const sortedLogs = logs.sort((a, b) => {
    const aTime = new Date(a.timestamp || 0).getTime();
    const bTime = new Date(b.timestamp || 0).getTime();
    
    if (aTime !== bTime) {
      return bTime - aTime; // Newest first
    }
    
    // Stable tiebreaker using logId
    return a.id.localeCompare(b.id);
  });
  
  // Apply cursor pagination
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = sortedLogs.findIndex(log => log.id === cursor);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }
  
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + limit);
  const nextCursor = paginatedLogs.length === limit && startIndex + limit < sortedLogs.length 
    ? paginatedLogs[paginatedLogs.length - 1].id 
    : null;
  
  return {
    items: paginatedLogs,
    cursor: nextCursor
  };
}