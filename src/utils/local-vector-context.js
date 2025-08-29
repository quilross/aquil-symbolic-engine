// Mock Vector Database for Local Development
// Usage: Attach to env.AQUIL_CONTEXT if not present

class LocalVectorContext {
  constructor() {
    this.vectors = [];
  }

  async upsert(items) {
    for (const item of items) {
      // Replace if id exists, else add
      const idx = this.vectors.findIndex(v => v.id === item.id);
      if (idx >= 0) {
        this.vectors[idx] = item;
      } else {
        this.vectors.push(item);
      }
    }
    return { ok: true, count: items.length };
  }

  async query(vector, { topK = 5 } = {}) {
    // Dummy: just return the first topK vectors
    return { matches: this.vectors.slice(0, topK) };
  }
}

export function attachLocalVectorContext(env) {
  if (!env.AQUIL_CONTEXT) {
    env.AQUIL_CONTEXT = new LocalVectorContext();
  }
}
