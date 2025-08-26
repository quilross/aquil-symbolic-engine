const send = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json' }
});

const readJSON = async (req) => {
  try { return await req.json(); } catch { return {}; }
};

export async function embed(req, env) {
  const { text, model = '@cf/baai/bge-small-en-v1.5' } = await readJSON(req);
  if (!text) return send(400, { error: 'text required' });
  try {
    const out = await env.AI.run(model, { text });
    const vector = out.data[0];
    return send(200, { vector, dims: vector.length });
  } catch (e) {
    return send(500, { error: 'ai_embed_error', message: String(e) });
  }
}

export async function generate(req, env) {
  const { model = '@cf/meta/llama-3.1-8b-instruct', messages } = await readJSON(req);
  try {
    const out = await env.AI.run(model, { messages });
    return send(200, { output: out });
  } catch (e) {
    return send(500, { error: 'ai_generate_error', message: String(e) });
  }
}
