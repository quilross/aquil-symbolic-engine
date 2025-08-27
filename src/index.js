// Health check endpoint
app.get("/api/health", async (req, res) => {
  const env = req.env || process.env;
  const summary = { ok: true };
  // D1: pragma user_version
  try {
    const { results } = await env.AQUIL_DB.prepare("PRAGMA user_version").all();
    summary.d1 = results && results.length ? results[0].user_version : null;
  } catch (e) {
    summary.d1 = String(e);
    summary.ok = false;
  }
  // KV: put/get throwaway key
  try {
    const key = `__health__${Date.now()}`;
    await env.AQUIL_MEMORIES.put(key, "ok", { expirationTtl: 10 });
    const val = await env.AQUIL_MEMORIES.get(key);
    summary.kv = val === "ok";
  } catch (e) {
    summary.kv = String(e);
    summary.ok = false;
  }
  // R2: list with prefix __health__
  try {
    const result = await env.AQUIL_STORAGE.list({
      prefix: "__health__",
      limit: 1,
    });
    summary.r2 = Array.isArray(result.objects);
  } catch (e) {
    summary.r2 = String(e);
    summary.ok = false;
  }
  // AI: noop model metadata call
  try {
    const meta = await env.AI.run("@cf/baai/bge-small-en-v1.5", { meta: true });
    summary.ai = !!meta;
  } catch (e) {
    summary.ai = String(e);
    summary.ok = false;
  }
  // Vector: return index binding name
  try {
    summary.vector = env.AQUIL_CONTEXT
      ? env.AQUIL_CONTEXT.constructor.name
      : null;
  } catch (e) {
    summary.vector = String(e);
    summary.ok = false;
  }
  res.json(summary);
});
import { Router } from "itty-router";
import {
  handleSessionInit,
  handleDiscoveryInquiry,
  handleRitualSuggestion,
  handleHealthCheck,
} from "./ark/endpoints.js";
import * as kv from "./actions/kv.js";
import * as d1 from "./actions/d1.js";
import * as r2 from "./actions/r2.js";
import * as vectorize from "./actions/vectorize.js";
import * as ai from "./actions/ai.js";
import { writeLog, readLogs } from "./actions/logging.js";
import { SomaticHealer } from "./src-core-somatic-healer.js";
import { TrustBuilder } from "./src-core-trust-builder.js";
import { MediaWisdomExtractor } from "./src-core-media-wisdom.js";
import { PatternRecognizer } from "./src-core-pattern-recognizer.js";
import { StandingTall } from "./src-core-standing-tall.js";
import { ValuesClarifier } from "./src-core-values-clarifier.js";
import { CreativityUnleasher } from "./src-core-creativity-unleasher.js";
import { AbundanceCultivator } from "./src-core-abundance-cultivator.js";
import { TransitionNavigator } from "./src-core-transition-navigator.js";
import { AncestryHealer } from "./src-core-ancestry-healer.js";

const router = Router();
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
const addCORS = (res) => {
  Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
  return res;
};

// Helper to create simple placeholder POST endpoints
const createJsonPlaceholder = (path) => {
  router.post(path, async (req) => {
    let data;
    try {
      data = await req.json();
    } catch {
      return addCORS(
        new Response(JSON.stringify({ error: "Malformed JSON" }), {
          status: 400,
          headers: cors,
        }),
      );
    }
    return addCORS(
      new Response(
        JSON.stringify({ message: `${path} placeholder`, input: data }),
        {
          status: 200,
          headers: cors,
        },
      ),
    );
  });
};

// CORS preflight
router.options("*", () => new Response(null, { status: 200, headers: cors }));

// ARK endpoints
router.get("/api/session-init", async (req, env) =>
  addCORS(await handleSessionInit(req, env)),
);
router.post("/api/discovery/generate-inquiry", async (req, env) =>
  addCORS(await handleDiscoveryInquiry(req, env)),
);
router.post("/api/ritual/auto-suggest", async (req, env) =>
  addCORS(await handleRitualSuggestion(req, env)),
);
router.get("/api/system/health-check", async (req, env) =>
  addCORS(await handleHealthCheck(req, env)),
);
// Unified logging endpoint
router.post("/api/log", async (req, env) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return addCORS(
      new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: cors,
      }),
    );
  }
  const { type, payload, who, level, tags, text, vector, binary, session_id } = body;
  let textOrVector = vector || text || null;
  const logResult = await writeLog(env, {
    type,
    payload,
    session_id,
    who,
    level,
    tags,
    binary,
    textOrVector,
  });
  return addCORS(
    new Response(JSON.stringify(logResult), { status: 200, headers: cors }),
  );
});

// Unified log retrieval endpoint
router.get("/api/logs", async (req, env) => {
  const url = new URL(req.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "20", 10),
    200,
  );
  try {
    const logs = await readLogs(env, { limit });
    return addCORS(
      new Response(JSON.stringify({ status: "ok", logs }), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (e) {
    return addCORS(
      new Response(JSON.stringify({ status: "error", error: String(e) }), {
        status: 500,
        headers: cors,
      }),
    );
  }
});

// Trust check-in endpoint
router.post("/api/trust/check-in", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Malformed JSON",
          message: "Request body must be valid JSON.",
        }),
        {
          status: 400,
          headers: cors,
        },
      ),
    );
  }
  try {
    const trustBuilder = new TrustBuilder(env);
    const result = await trustBuilder.processCheckIn(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Trust check-in error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Trust check-in error",
          message:
            "Trust building is always available. Take a breath and honor your inner knowing.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Media wisdom extraction endpoint
router.post("/api/media/extract-wisdom", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Malformed JSON",
          message: "Request body must be valid JSON.",
        }),
        {
          status: 400,
          headers: cors,
        },
      ),
    );
  }
  try {
    const mediaExtractor = new MediaWisdomExtractor(env);
    const result = await mediaExtractor.extractWisdom(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Media wisdom error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Media wisdom processing error",
          message:
            "Your reaction to content always contains valuable information about your inner world and growth needs.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Pattern recognition endpoint
router.post("/api/patterns/recognize", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Malformed JSON",
          message: "Request body must be valid JSON.",
        }),
        {
          status: 400,
          headers: cors,
        },
      ),
    );
  }
  try {
    const recognizer = new PatternRecognizer(env);
    const result = await recognizer.analyzePatterns(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Pattern recognition error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Pattern processing error",
          message:
            "Pattern recognition is happening even when systems are offline - your awareness itself is the most powerful tool for growth.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Standing tall practice endpoint
router.post("/api/standing-tall/practice", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Malformed JSON",
          message: "Request body must be valid JSON.",
        }),
        {
          status: 400,
          headers: cors,
        },
      ),
    );
  }
  try {
    const standingTall = new StandingTall(env);
    const result = await standingTall.generatePractice(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Standing tall error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Standing tall processing error",
          message:
            "Your inherent dignity and worth are never in question. Stand tall because you belong here.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Values clarification endpoint
router.post("/api/values/clarify", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Malformed JSON",
          message: "Request body must be valid JSON.",
        }),
        {
          status: 400,
          headers: cors,
        },
      ),
    );
  }
  try {
    const clarifier = new ValuesClarifier(env);
    const result = await clarifier.clarify(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Values clarify error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Values clarification error",
          message: "Your values are steady guides even in uncertain times.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Creativity unleashing endpoint
router.post("/api/creativity/unleash", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: cors,
      }),
    );
  }
  try {
    const unleasher = new CreativityUnleasher(env);
    const result = await unleasher.unleash(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Creativity unleash error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Creativity unleashing error",
          message: "Creative flow is always within you, ready to emerge.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Abundance cultivation endpoint
router.post("/api/abundance/cultivate", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: cors,
      }),
    );
  }
  try {
    const cultivator = new AbundanceCultivator(env);
    const result = await cultivator.cultivate(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Abundance cultivation error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Abundance cultivation error",
          message: "Abundance begins with a mindset of possibility.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Transition navigation endpoint
router.post("/api/transitions/navigate", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: cors,
      }),
    );
  }
  try {
    const navigator = new TransitionNavigator(env);
    const result = await navigator.navigate(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Transition navigation error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Transition navigation error",
          message: "Every transition carries seeds of renewal and growth.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Ancestry healing endpoint
router.post("/api/ancestry/heal", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: cors,
      }),
    );
  }
  try {
    const healer = new AncestryHealer(env);
    const result = await healer.heal(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Ancestry healing error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Ancestry healing error",
          message:
            "You carry your ancestors' strength as you heal old patterns.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Wisdom synthesis endpoint
router.post("/api/wisdom/synthesize", async (req) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: cors,
      }),
    );
  }
  // Placeholder response until full wisdom synthesizer is implemented
  return addCORS(
    new Response(
      JSON.stringify({
        message: "Wisdom synthesis placeholder",
        input: data,
      }),
      {
        status: 200,
        headers: cors,
      },
    ),
  );
});

// Daily wisdom synthesis endpoint
router.get("/api/wisdom/daily-synthesis", async () => {
  // Placeholder daily synthesis response
  return addCORS(
    new Response(
      JSON.stringify({
        message: "Daily synthesis placeholder",
        insights: [],
      }),
      {
        status: 200,
        headers: cors,
      },
    ),
  );
});

// Health endpoint
router.get("/api/health", async (req, env) => {
  // D1 health: pragma user_version
  let d1 = null;
  try {
    const { results } = await env.AQUIL_DB.prepare('PRAGMA user_version').all();
    d1 = results && results[0] ? results[0].user_version : null;
  } catch (e) {
    d1 = String(e);
  }

  // KV health: put/get temp key
  let kv = null;
  try {
    const key = `__health__${Date.now()}`;
    await env.AQUIL_MEMORIES.put(key, 'ok', { expirationTtl: 10 });
    kv = await env.AQUIL_MEMORIES.get(key);
  } catch (e) {
    kv = String(e);
  }

  // R2 health: list with prefix __health__
  let r2 = null;
  try {
    const { objects } = await env.AQUIL_STORAGE.list({ prefix: '__health__', limit: 1 });
    r2 = Array.isArray(objects) ? objects.length : null;
  } catch (e) {
    r2 = String(e);
  }

  // AI health: metadata call
  let ai = null;
  try {
    ai = await env.AI.metadata ? await env.AI.metadata() : 'no metadata';
  } catch (e) {
    ai = String(e);
  }

  // Vector health: binding info
  let vector = null;
  try {
    vector = env.AQUIL_CONTEXT ? Object.keys(env.AQUIL_CONTEXT).length : 'no binding';
  } catch (e) {
    vector = String(e);
  }

  const ok = [d1, kv, r2, ai, vector].every((v) => v !== null && v !== '' && v !== 'no binding');
  return addCORS(
    new Response(
      JSON.stringify({ ok, d1, kv, r2, ai, vector }),
      { status: ok ? 200 : 500, headers: cors },
    ),
  );
});

// Somatic healing session endpoint
router.post("/api/somatic/session", async (req, env) => {
  let data;
  try {
    data = await req.json();
  } catch {
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Malformed JSON",
          message: "Request body must be valid JSON.",
        }),
        {
          status: 400,
          headers: cors,
        },
      ),
    );
  }
  try {
    const healer = new SomaticHealer(env);
    const result = await healer.generateSession(data);
    return addCORS(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: cors,
      }),
    );
  } catch (error) {
    console.error("Somatic session error:", error);
    return addCORS(
      new Response(
        JSON.stringify({
          error: "Somatic processing error",
          message:
            "Your body's wisdom is always available. Simply placing a hand on your heart and breathing connects you to your inner knowing.",
        }),
        {
          status: 500,
          headers: cors,
        },
      ),
    );
  }
});

// Placeholder endpoints for additional schema paths
router.get("/api/insights", async () =>
  addCORS(
    new Response(JSON.stringify({ message: "/api/insights placeholder" }), {
      status: 200,
      headers: cors,
    }),
  ),
);

createJsonPlaceholder("/api/feedback");
createJsonPlaceholder("/api/dreams/interpret");
createJsonPlaceholder("/api/energy/optimize");
createJsonPlaceholder("/api/values/clarify");
createJsonPlaceholder("/api/creativity/unleash");
createJsonPlaceholder("/api/abundance/cultivate");
createJsonPlaceholder("/api/transitions/navigate");
createJsonPlaceholder("/api/ancestry/heal");

// KV
router.post("/kv/log", async (req, env) => addCORS(await kv.log(req, env)));
router.get("/kv/get", async (req, env) => addCORS(await kv.get(req, env)));

// D1
router.post("/d1/exec", async (req, env) => addCORS(await d1.exec(req, env)));

// R2
router.post("/r2/put", async (req, env) => addCORS(await r2.put(req, env)));
router.get("/r2/get", async (req, env) => addCORS(await r2.get(req, env)));

// Vectorize
router.post("/vectorize/upsert", async (req, env) =>
  addCORS(await vectorize.upsert(req, env)),
);
router.post("/vectorize/query", async (req, env) =>
  addCORS(await vectorize.query(req, env)),
);

// Workers AI
router.post("/ai/embed", async (req, env) => addCORS(await ai.embed(req, env)));
router.post("/ai/generate", async (req, env) =>
  addCORS(await ai.generate(req, env)),
);

// Fallback for unknown routes
router.all("*", () =>
  addCORS(
    new Response(
      JSON.stringify({
        error: "Not found",
        message: "Route not found",
      }),
      { status: 404, headers: cors },
    ),
  ),
);

export default {
  fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};

export { ARK_MANIFEST } from "./ark/endpoints.js";
