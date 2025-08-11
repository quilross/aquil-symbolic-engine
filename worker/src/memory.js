// Memory Durable Object for storing per-user Gene Key state history
// Persists conversation symbolic tone progression over time

export class MemoryDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;

    try {
      switch (method) {
        case 'GET': {
          // Return the entire memory log as JSON
          const stored = await this.state.storage.list();
          const history = Array.from(stored.values());
          
          return new Response(JSON.stringify(history, null, 2), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        case 'PUT': {
          // Append a new entry to the memory log
          try {
            const entry = await request.json();
            const timestamp = Date.now();
            const record = {
              timestamp,
              ...entry
            };
            
            // Use timestamp as key for chronological ordering
            await this.state.storage.put(timestamp.toString(), record);
            
            return new Response(null, { status: 204 });
          } catch (parseError) {
            return new Response('Invalid JSON body', { status: 400 });
          }
        }

        default:
          return new Response('Method not allowed', { status: 405 });
      }
    } catch (error) {
      console.error('MemoryDO error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
}