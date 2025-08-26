import { send, readJSON } from '../utils/http.js';

export async function upsert(req, env) {
  const { id, text, vector, metadata, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON(req);
  let v = vector;
  try {
    if (!v && text) {
      const embedding = await env.AI.run(model, { text });
      v = embedding.data[0];
    }
    if (!id || !Array.isArray(v)) return send(400, { error: 'id and embedding vector required' });
    await env.VECTORIZE.upsert([{ id, values: v, metadata }]);
    return send(200, { ok: true, id });
  } catch (e) {
    return send(500, { error: 'vector_upsert_error', message: String(e) });
  }
}

export async function query(req, env) {
  const { text, vector, topK = 5, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON(req);
  let v = vector;
  try {
    if (!v && text) {
      const embedding = await env.AI.run(model, { text });
      v = embedding.data[0];
    }
    if (!Array.isArray(v)) return send(400, { error: 'vector or text required' });
    const results = await env.VECTORIZE.query(v, { topK });
    return send(200, { results });
  } catch (e) {
    return send(500, { error: 'vector_query_error', message: String(e) });
  }
}
