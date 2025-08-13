function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export class MemoryDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (method === 'POST' && url.pathname === '/append') {
      let body;
      try {
        body = await request.json();
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          { status: 400, headers: { "content-type": "application/json; charset=utf-8" } }
        );
      }
      const entry = { ...body, ts: Date.now() };
      await this.state.storage.put(`m:${entry.user}:${entry.ts}`, entry);
      return new Response(null, { status: 204 });
    }
    if (method === 'GET' && url.pathname.startsWith('/read/')) {
      const user = url.pathname.split('/read/')[1];
      const list = await this.state.storage.list({ prefix: `m:${user}:` });
      const items = [...list.values()].sort((a,b) => a.ts - b.ts);
      return json({ user, items });
    }
    return new Response('Not Found', { status: 404 });
  }
}
