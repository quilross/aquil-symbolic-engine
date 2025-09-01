/**
 * GPT Compatibility Mode Utilities
 * Provides fail-open behavior for missing bindings when GPT_COMPAT_MODE is enabled
 */

/**
 * Check if GPT compatibility mode is enabled
 * @param {Object} env - Environment object
 * @returns {boolean} True if GPT_COMPAT_MODE is enabled
 */
export function isGPTCompatMode(env) {
  return env?.GPT_COMPAT_MODE === 'true' || env?.GPT_COMPAT_MODE === true;
}

/**
 * Safe binding access with GPT compat mode support
 * @param {Object} env - Environment object
 * @param {string} bindingName - Name of the binding (e.g., 'AQUIL_DB', 'AQUIL_MEMORIES')
 * @returns {Object|null} The binding or null if in compat mode and binding is missing
 */
export function safeBinding(env, bindingName) {
  const binding = env?.[bindingName];
  
  if (!binding && isGPTCompatMode(env)) {
    console.log(`[GPT_COMPAT_MODE] Missing binding ${bindingName}, continuing in fail-open mode`);
    return null;
  }
  
  return binding;
}

/**
 * Safe operation execution with GPT compat mode support
 * @param {Object} env - Environment object
 * @param {Function} operation - Operation to execute
 * @param {*} fallbackValue - Value to return if operation fails in compat mode
 * @returns {Promise<*>} Operation result or fallback value
 */
export async function safeOperation(env, operation, fallbackValue = null) {
  try {
    return await operation();
  } catch (error) {
    if (isGPTCompatMode(env)) {
      console.log(`[GPT_COMPAT_MODE] Operation failed, returning fallback:`, error.message);
      return fallbackValue;
    }
    throw error;
  }
}

/**
 * Safe logging with GPT compat mode support
 * Prevents logging exceptions from halting execution
 * @param {Object} env - Environment object
 * @param {Function} logOperation - Logging operation to execute
 * @returns {Promise<boolean>} True if logged successfully, false if failed
 */
export async function safeLog(env, logOperation) {
  try {
    await logOperation();
    return true;
  } catch (error) {
    if (isGPTCompatMode(env)) {
      console.log(`[GPT_COMPAT_MODE] Logging failed, suppressing exception:`, error.message);
      return false;
    }
    throw error;
  }
}