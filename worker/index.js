// Signal Q - Minimal Worker Implementation
// Import from src/index.js for main fetch functionality

// Import main worker from src
import worker from './src/index.js';

// Import Memory Durable Object
import { MemoryDO } from './src/memory.js';

// Re-export the default worker
export default worker;

// Helper functions for Durable Objects (needed for UserState)
function correlationIdFrom(req) {
  const h = req.headers.get('x-correlation-id');
  return h && h.trim() ? h.trim() : (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Correlation-ID'
  };
}

// Minimal UserState Durable Object (keep existing functionality)
export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const correlationId = correlationIdFrom(request);
    // Minimal pass-through for existing DO functionality
    return new Response(JSON.stringify({ message: "UserState DO active" }), {
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
        ...corsHeaders()
      }
    });
  }
}

// Export MemoryDO for Durable Objects runtime
export { MemoryDO };