import { send, readJSON } from '../utils/http.js';

const VECTOR_BINDING_KEYS = [
  'VECTORIZE',
  'AQUIL_CONTEXT',
  'AQUIL_CONTEXT_INDEX',
  'VECTOR_INDEX',
  'VECTOR_CONTEXT'
];

function resolveVectorIndex(env) {
  for (const key of VECTOR_BINDING_KEYS) {
    if (env?.[key]) {
      return env[key];
    }
  }
  const error = new Error(
    'Vectorize binding not configured. Define a [[vectorize]] binding named "VECTORIZE" or update the code to use your binding name.'
  );
  error.code = 'MISSING_VECTORIZE_BINDING';
  throw error;
}

export async function upsert(req, env) {
  const { id, text, vector, metadata, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON(req);
  let v = vector;
  try {
    const index = resolveVectorIndex(env);
    if (!v && text) {
      const embedding = await env.AI.run(model, { text });
      v = embedding.data[0];
    }
    if (!id || !Array.isArray(v)) return send(400, { error: 'id and embedding vector required' });
    await index.upsert([{ id, values: v, metadata }]);
    return send(200, { ok: true, id });
  } catch (e) {
    if (e.code === 'MISSING_VECTORIZE_BINDING') {
      return send(500, { error: 'vector_binding_missing', message: e.message });
    }
    return send(500, { error: 'vector_upsert_error', message: String(e) });
  }
}

export async function query(req, env) {
  const { text, vector, topK = 5, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON(req);
  let v = vector;
  try {
    const index = resolveVectorIndex(env);
    if (!v && text) {
      const embedding = await env.AI.run(model, { text });
      v = embedding.data[0];
    }
    if (!Array.isArray(v)) return send(400, { error: 'vector or text required' });
    const results = await index.query(v, { topK });
    return send(200, { results });
  } catch (e) {
    if (e.code === 'MISSING_VECTORIZE_BINDING') {
      return send(500, { error: 'vector_binding_missing', message: e.message });
    }
    return send(500, { error: 'vector_query_error', message: String(e) });
  }
}

export { resolveVectorIndex };
