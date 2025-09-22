import { send, readJSON } from "../utils/http.js";

export async function embed(req, env) {
  const { text, model = "@cf/baai/bge-small-en-v1.5" } = await readJSON(req);
  if (!text) return send(400, { error: "text required" });
  try {
    const client = env.AQUIL_AI || env.AI_GATEWAY_PROD || env.AI || env.AI_GATEWAY;
    if (!client) {
      throw new Error('AI binding not found (expected AQUIL_AI or AI_GATEWAY_PROD)');
    }

    const out = await client.run(model, { text });
    const vector = out.data[0];
    return send(200, { vector, dims: vector.length });
  } catch (e) {
    return send(500, { error: "ai_embed_error", message: String(e) });
  }
}

export async function generate(req, env) {
  const { model = "@cf/meta/llama-3.1-8b-instruct", messages } =
    await readJSON(req);
  try {
    const client = env.AQUIL_AI || env.AI_GATEWAY_PROD || env.AI || env.AI_GATEWAY;
    if (!client) {
      throw new Error('AI binding not found (expected AQUIL_AI or AI_GATEWAY_PROD)');
    }

    const out = await client.run(model, { messages });
    return send(200, { output: out });
  } catch (e) {
    return send(500, { error: "ai_generate_error", message: String(e) });
  }
}
