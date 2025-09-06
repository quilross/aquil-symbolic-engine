/**
 * Privacy Redaction Utilities
 * 
 * Provides fail-open privacy redaction for payloads before storing in D1/KV.
 * Redacts common secret-looking fields while preserving functionality.
 */

// Common secret field patterns (case-insensitive)
const SECRET_FIELD_PATTERNS = [
  /^authorization$/i,
  /^api[-_]?key$/i,
  /^cookie$/i,
  /^set[-_]?cookie$/i,
  /^password$/i,
  /^token$/i,
  /^secret$/i,
  /^bearer$/i,
  /^x[-_]?api[-_]?key$/i,
  /.*password.*/i,
  /.*secret.*/i,
  /.*token.*/i,
  /.*auth.*/i
];

/**
 * Redact secret-looking fields from an object (recursive)
 * @param {any} obj - Object to redact
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @returns {any} Object with secret fields redacted
 */
function redactSecrets(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) return obj;
  
  // Handle non-objects
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => redactSecrets(item, depth + 1));
  }
  
  // Handle objects
  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSecretField = SECRET_FIELD_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSecretField) {
      // Redact the field but preserve type information
      if (typeof value === 'string') {
        redacted[key] = value.length > 0 ? '[REDACTED]' : '';
      } else if (typeof value === 'number') {
        redacted[key] = '[REDACTED_NUMBER]';
      } else if (typeof value === 'boolean') {
        redacted[key] = '[REDACTED_BOOLEAN]';
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else {
      // Recursively redact nested objects
      redacted[key] = redactSecrets(value, depth + 1);
    }
  }
  
  return redacted;
}

/**
 * Redact secrets from payload while preserving structure and functionality
 * @param {any} payload - Payload to redact
 * @returns {any} Redacted payload
 */
export function redactPayload(payload) {
  try {
    return redactSecrets(payload);
  } catch (error) {
    console.warn('Privacy redaction failed:', error.message);
    // Fail-open: return original payload if redaction fails
    return payload;
  }
}

/**
 * Redact secrets from a JSON string
 * @param {string} jsonStr - JSON string to redact
 * @returns {string} Redacted JSON string
 */
export function redactJsonString(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    const redacted = redactPayload(parsed);
    return JSON.stringify(redacted);
  } catch (error) {
    console.warn('JSON redaction failed:', error.message);
    // Fail-open: return original string if parsing/redaction fails
    return jsonStr;
  }
}

/**
 * Check if a payload contains potential secrets (for monitoring)
 * @param {any} payload - Payload to check
 * @returns {boolean} True if potential secrets found
 */
export function containsPotentialSecrets(payload) {
  try {
    if (!payload || typeof payload !== 'object') return false;
    
    const jsonStr = JSON.stringify(payload).toLowerCase();
    const secretKeywords = ['password', 'token', 'secret', 'api_key', 'authorization', 'bearer'];
    
    return secretKeywords.some(keyword => jsonStr.includes(keyword));
  } catch (error) {
    return false;
  }
}