// Ensure a vector: embed text or pass through provided vector
// ...existing code...
// Ensure a vector embedding from text or vector
export async function ensureVector(
  env,
  { text, vector, model = "@cf/baai/bge-small-en-v1.5" } = {},
) {
  if (vector) {
    return vector;
  }
  if (text) {
    // Use Cloudflare AI binding to embed text
    const embedding = await env.AI.run(model, { text });
    // Convert to Float32Array if needed
    if (embedding?.data) {
      return new Float32Array(embedding.data);
    }
    return embedding;
  }
  throw new Error("No text or vector provided for embedding");
}

// Query vector database by text
export async function queryByText(
  env,
  { text, topK = 5, model = "@cf/baai/bge-small-en-v1.5" } = {},
) {
  const vector = await ensureVector(env, { text, model });
  const results = await env.AQUIL_CONTEXT.query({
    topK,
    vector,
    includeMetadata: true,
  });
  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
  }));
}
import { send, readJSON } from "../utils/http.js";

export async function upsert(req, env) {
  const {
    id,
    text,
    vector,
    metadata,
    model = "@cf/baai/bge-small-en-v1.5",
  } = await readJSON(req);
  let v = vector;
  try {
    if (!v && text) {
      const embedding = await env.AI.run(model, { text });
      v = embedding.data[0];
    }
    if (!id || !Array.isArray(v))
      return send(400, { error: "id and embedding vector required" });
    await env.AQUIL_CONTEXT.upsert([{ id, values: v, metadata }]);
    return send(200, { ok: true, id });
  } catch (e) {
    return send(500, { error: "vector_upsert_error", message: String(e) });
  }
}

export async function query(req, env) {
  const {
    text,
    vector,
    topK = 5,
    model = "@cf/baai/bge-small-en-v1.5",
  } = await readJSON(req);
  let v = vector;
  try {
    if (!v && text) {
      const embedding = await env.AI.run(model, { text });
      v = embedding.data[0];
    }
    if (!Array.isArray(v))
      return send(400, { error: "vector or text required" });
    const results = await env.AQUIL_CONTEXT.query(v, { topK });
    return send(200, { results });
  } catch (e) {
    return send(500, { error: "vector_query_error", message: String(e) });
  }
}
