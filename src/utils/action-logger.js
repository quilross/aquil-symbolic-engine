/**
 * Shared ChatGPT Action Logger
 * Centralized logging for all router modules to avoid duplication
 */

/**
 * Simple logChatGPTAction function for router modules
 * This is a simplified version of the main logChatGPTAction in index.js
 * used by router modules to maintain consistency
 */
export async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}