/**
 * Journal Service - Dedicated data service for all journaling operations
 * Centralizes Cloudflare KV namespace interactions with robust error handling and logging
 */

/**
 * Add a new journal entry to KV storage
 * @param {Object} env - Cloudflare Workers environment
 * @param {Object} entryData - Journal entry data
 * @param {Object} options - Storage options (TTL, metadata, etc.)
 * @returns {Object} Result with success status and entry ID
 */
export async function addEntry(env, entryData, options = {}) {
  const operationId = `addEntry_${Date.now()}`;
  
  try {
    // Validate required data
    if (!entryData || typeof entryData !== 'object') {
      throw new Error('Entry data must be a valid object');
    }
    
    if (!entryData.id) {
      throw new Error('Entry data must contain an id field');
    }
    
    // Ensure KV binding is available
    if (!env.AQUIL_MEMORIES) {
      throw new Error('KV namespace AQUIL_MEMORIES not available');
    }
    
    // Prepare key and data
  const key = options.keyPrefix !== undefined ? `${options.keyPrefix}${entryData.id}` : `log:${entryData.id}`;
    const data = JSON.stringify(entryData);
    
    // Prepare KV options
    const kvOptions = {};
    
    // Handle TTL
    if (options.ttl) {
      kvOptions.expirationTtl = options.ttl;
    } else if (env.KV_TTL_SECONDS) {
      const ttlSeconds = parseInt(env.KV_TTL_SECONDS, 10);
      if (ttlSeconds > 0) {
        kvOptions.expirationTtl = ttlSeconds;
      }
    }
    
    // Handle metadata
    if (options.metadata) {
      kvOptions.metadata = options.metadata;
    }
    
    // Perform KV put operation
    await env.AQUIL_MEMORIES.put(key, data, kvOptions);
    
    // Log successful operation
    console.log(`[JournalService] Successfully added entry: ${key}`, {
      operationId,
      entryId: entryData.id,
      keyUsed: key,
      dataSize: data.length,
      ttl: kvOptions.expirationTtl || 'none'
    });
    
    return {
      success: true,
      key,
      id: entryData.id,
      operationId
    };
    
  } catch (error) {
    // Log detailed error information
    console.error(`[JournalService] Failed to add entry:`, {
      operationId,
      error: error.message,
      stack: error.stack,
      entryId: entryData?.id || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      operationId,
      entryId: entryData?.id || 'unknown'
    };
  }
}

/**
 * Get a journal entry by ID from KV storage
 * @param {Object} env - Cloudflare Workers environment
 * @param {string} id - Entry ID
 * @param {Object} options - Retrieval options
 * @returns {Object} Result with entry data or error
 */
export async function getEntryById(env, id, options = {}) {
  const operationId = `getEntryById_${Date.now()}`;
  
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Entry ID must be a non-empty string');
    }
    
    // Ensure KV binding is available
    if (!env.AQUIL_MEMORIES) {
      throw new Error('KV namespace AQUIL_MEMORIES not available');
    }
    
    // Prepare key
    const key = options.keyPrefix !== undefined ? `${options.keyPrefix}${id}` : `log:${id}`;
    
    // Perform KV get operation
    const value = await env.AQUIL_MEMORIES.get(key, options.type ? { type: options.type } : undefined);
    
    if (!value) {
      console.log(`[JournalService] Entry not found: ${key}`, {
        operationId,
        entryId: id,
        keyUsed: key
      });
      
      return {
        success: false,
        error: 'Entry not found',
        operationId,
        entryId: id
      };
    }
    
    // Parse JSON data
    let parsedData;
    try {
      parsedData = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (parseError) {
      throw new Error(`Failed to parse entry data: ${parseError.message}`);
    }
    
    // Log successful operation
    console.log(`[JournalService] Successfully retrieved entry: ${key}`, {
      operationId,
      entryId: id,
      keyUsed: key,
      dataSize: typeof value === 'string' ? value.length : JSON.stringify(value).length
    });
    
    return {
      success: true,
      data: parsedData,
      key,
      id,
      operationId
    };
    
  } catch (error) {
    // Log detailed error information
    console.error(`[JournalService] Failed to get entry by ID:`, {
      operationId,
      error: error.message,
      stack: error.stack,
      entryId: id,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      operationId,
      entryId: id
    };
  }
}

/**
 * Get journal entries by user ID from KV storage
 * @param {Object} env - Cloudflare Workers environment
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, prefix, etc.)
 * @returns {Object} Result with array of entries or error
 */
export async function getEntriesByUser(env, userId, options = {}) {
  const operationId = `getEntriesByUser_${Date.now()}`;
  
  try {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }
    
    // Ensure KV binding is available
    if (!env.AQUIL_MEMORIES) {
      throw new Error('KV namespace AQUIL_MEMORIES not available');
    }
    
    // Determine prefixes to scan: support both legacy 'log_' and current 'log:'
    const prefixes = options.prefix
      ? [options.prefix]
      : ['log:', 'log_'];
    const limit = Math.min(options.limit || 100, 1000); // Cap at 1000 for performance
    
    // List keys from KV across prefixes
    const allKeys = [];
    for (const prefix of prefixes) {
      const listResult = await env.AQUIL_MEMORIES.list({ prefix, limit });
      allKeys.push(...listResult.keys);
    }
    
    const userEntries = [];
    const errors = [];
    
    // Filter and fetch entries for the specific user
  for (const keyInfo of allKeys) {
      try {
        const value = await env.AQUIL_MEMORIES.get(keyInfo.name);
        if (value) {
          const parsedData = JSON.parse(value);
          
          // Check if entry belongs to the user
          if (parsedData.userId === userId || parsedData.who === userId || parsedData.session_id === userId) {
            userEntries.push({
              key: keyInfo.name,
              data: parsedData,
              metadata: keyInfo.metadata || {}
            });
          }
        }
      } catch (parseError) {
        errors.push({
          key: keyInfo.name,
          error: parseError.message
        });
      }
    }
    
    // Sort by timestamp if available (newest first)
    userEntries.sort((a, b) => {
      const aTime = new Date(a.data.timestamp || 0).getTime();
      const bTime = new Date(b.data.timestamp || 0).getTime();
      return bTime - aTime;
    });
    
    // Apply limit after sorting
    const limitedEntries = userEntries.slice(0, options.limit || 100);
    
    // Log successful operation
    console.log(`[JournalService] Successfully retrieved entries for user: ${userId}`, {
      operationId,
      userId,
      totalKeys: allKeys.length,
      userEntriesFound: userEntries.length,
      returnedEntries: limitedEntries.length,
      errors: errors.length
    });
    
    return {
      success: true,
      entries: limitedEntries,
      total: userEntries.length,
      errors: errors.length > 0 ? errors : undefined,
      operationId,
      userId
    };
    
  } catch (error) {
    // Log detailed error information
    console.error(`[JournalService] Failed to get entries by user:`, {
      operationId,
      error: error.message,
      stack: error.stack,
      userId,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      operationId,
      userId
    };
  }
}

/**
 * Update an existing journal entry in KV storage
 * @param {Object} env - Cloudflare Workers environment
 * @param {string} id - Entry ID
 * @param {Object} data - Updated entry data
 * @param {Object} options - Update options
 * @returns {Object} Result with success status and updated entry
 */
export async function updateEntry(env, id, data, options = {}) {
  const operationId = `updateEntry_${Date.now()}`;
  
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Entry ID must be a non-empty string');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('Update data must be a valid object');
    }
    
    // Ensure KV binding is available
    if (!env.AQUIL_MEMORIES) {
      throw new Error('KV namespace AQUIL_MEMORIES not available');
    }
    
    // Get existing entry if merge is requested
    let existingResult = null;
    
    let updatedData;
    if (options.merge !== false) { // Default to merge
      existingResult = await exports.getEntryById(env, id, { keyPrefix: options.keyPrefix });
      
      if (existingResult.success) {
        // Merge with existing data
        updatedData = {
          ...existingResult.data,
          ...data,
          id, // Preserve ID
          updated_at: new Date().toISOString() // Add update timestamp
        };
      } else if (!options.allowCreate) {
        // Entry doesn't exist and creation not allowed
        return {
          success: false,
          error: 'Entry not found and creation not allowed',
          operationId,
          entryId: id
        };
      } else {
        // Create new entry
        updatedData = {
          ...data,
          id,
          created_at: new Date().toISOString()
        };
      }
    } else {
      // Replace completely
      updatedData = {
        ...data,
        id, // Ensure ID is preserved
        updated_at: new Date().toISOString()
      };
    }
    
    // Prepare key and data for storage directly (avoiding recursive call)
    const keyToUse = options.keyPrefix !== undefined ? `${options.keyPrefix}${id}` : `log:${id}`;
    const dataToStore = JSON.stringify(updatedData);
    
    // Prepare KV options
    const kvOptions = {};
    
    // Handle TTL
    if (options.ttl) {
      kvOptions.expirationTtl = options.ttl;
    } else if (env.KV_TTL_SECONDS) {
      const ttlSeconds = parseInt(env.KV_TTL_SECONDS, 10);
      if (ttlSeconds > 0) {
        kvOptions.expirationTtl = ttlSeconds;
      }
    }
    
    // Handle metadata
    if (options.metadata) {
      kvOptions.metadata = options.metadata;
    }
    
    // Perform KV put operation directly
    await env.AQUIL_MEMORIES.put(keyToUse, dataToStore, kvOptions);
    
    console.log(`[JournalService] Successfully updated entry: ${keyToUse}`, {
      operationId,
      entryId: id,
      keyUsed: keyToUse,
      merged: options.merge !== false,
      created: !existingResult?.success,
      dataSize: dataToStore.length
    });
    
    return {
      success: true,
      data: updatedData,
      key: keyToUse,
      id,
      operationId,
      updated: true
    };
    
  } catch (error) {
    // Log detailed error information
    console.error(`[JournalService] Failed to update entry:`, {
      operationId,
      error: error.message,
      stack: error.stack,
      entryId: id,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      operationId,
      entryId: id
    };
  }
}

/**
 * Helper function to list recent entries with content
 * @param {Object} env - Cloudflare Workers environment
 * @param {Object} options - Listing options
 * @returns {Object} Result with entries array or error
 */
export async function listRecentEntries(env, options = {}) {
  const operationId = `listRecentEntries_${Date.now()}`;
  
  try {
    // Ensure KV binding is available
    if (!env.AQUIL_MEMORIES) {
      throw new Error('KV namespace AQUIL_MEMORIES not available');
    }
    
    const limit = Math.min(options.limit || 20, 100);
    const prefixes = options.prefix ? [options.prefix] : ['log:', 'log_'];
    
    // List keys from KV across prefixes
    const allKeys = [];
    for (const prefix of prefixes) {
      const listResult = await env.AQUIL_MEMORIES.list({ prefix, limit });
      allKeys.push(...listResult.keys.map(k => k.name));
    }
    
    // Sort keys by timestamp descending (newest first) when timestamp suffix exists
    const sortedKeys = allKeys.sort((a, b) => {
      const tsA = (() => {
        if (a.includes('_')) return parseInt(a.split('_').pop() || '0', 10);
        // If no underscore suffix, try to parse timestamp from value later; default 0 here
        return 0;
      })();
      const tsB = (() => {
        if (b.includes('_')) return parseInt(b.split('_').pop() || '0', 10);
        return 0;
      })();
      return tsB - tsA;
    });

    // Fetch entries for the sorted keys
    const entries = [];
    for (const key of sortedKeys) {
      // When passing full key name, use empty keyPrefix to use the key as-is
      const entryResult = await exports.getEntryById(env, key, { keyPrefix: '' });
      if (entryResult.success) {
        entries.push({
          key: key,
          content: entryResult.data,
          metadata: null
        });
      }
    }
    
    console.log(`[JournalService] Successfully listed recent entries`, {
      operationId,
      prefixes,
      totalKeys: allKeys.length,
      returnedEntries: entries.length
    });
    
    return {
      success: true,
      entries,
      total: entries.length,
      operationId
    };
    
  } catch (error) {
    console.error(`[JournalService] Failed to list recent entries:`, {
      operationId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      operationId
    };
  }
}

/**
 * Delete a journal entry from KV storage
 * @param {Object} env - Cloudflare Workers environment
 * @param {string} id - Entry ID
 * @param {Object} options - Delete options
 * @returns {Object} Result with success status
 */
export async function deleteEntry(env, id, options = {}) {
  const operationId = `deleteEntry_${Date.now()}`;
  
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Entry ID must be a non-empty string');
    }
    
    // Ensure KV binding is available
    if (!env.AQUIL_MEMORIES) {
      throw new Error('KV namespace AQUIL_MEMORIES not available');
    }
    
    // Prepare key
    // Use keyToUse for delete operation
    const keyToUse = options.keyPrefix !== undefined ? `${options.keyPrefix}${id}` : `log:${id}`;
    
    // Check if entry exists (if requested)
    if (options.checkExists) {
      const existing = await exports.getEntryById(env, id, { keyPrefix: options.keyPrefix });
      if (!existing.success) {
        return {
          success: false,
          error: 'Entry not found',
          operationId,
          entryId: id
        };
      }
    }
    
    // Perform delete operation
    await env.AQUIL_MEMORIES.delete(keyToUse);
    
    console.log(`[JournalService] Successfully deleted entry: ${keyToUse}`, {
      operationId,
      entryId: id,
      keyUsed: keyToUse
    });
    
    return {
      success: true,
      key: keyToUse,
      id,
      operationId,
      deleted: true
    };
    
  } catch (error) {
    console.error(`[JournalService] Failed to delete entry:`, {
      operationId,
      error: error.message,
      stack: error.stack,
      entryId: id,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      operationId,
      entryId: id
    };
  }
}