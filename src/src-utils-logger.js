/**
 * Simple structured logger without emojis
 * Outputs JSON strings with level, message, and optional metadata
 */

export const logger = {
  info(message, metadata = {}) {
    console.log(
      JSON.stringify({ level: 'info', message, ...metadata })
    );
  },
  error(message, metadata = {}) {
    console.error(
      JSON.stringify({ level: 'error', message, ...metadata })
    );
  }
};

