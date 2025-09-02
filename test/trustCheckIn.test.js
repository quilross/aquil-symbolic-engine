import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { TrustBuilder } from "../src/src-core-trust-builder.js";

function createEnv() {
  return {
    AQUIL_DB: {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
          run: async () => ({}),
          first: async () => ({ test: 1 }),
        }),
        // Fixed: add first() method directly on prepare() for health checks  
        first: async () => ({ test: 1 }),
        run: async () => ({}),
      }),
    },
    AQUIL_MEMORIES: {
      get: async (key) => null,
      put: async (key, value, options) => true,
    },
    AQUIL_STORAGE: {
      get: async (key) => null,
      put: async (key, value) => true,
    },
    AQUIL_CONTEXT: {
      query: async () => ({ matches: [] }),
      upsert: async () => ({ success: true }),
    },
    AI: { run: async () => ({ response: "{}" }) },
  };
}

test("trust check-in endpoint returns analysis", async () => {
  const env = createEnv();
  TrustBuilder.prototype.processCheckIn = async function (data) {
    if (!data.current_state) throw new Error("current_state required");
    return { trust_analysis: {}, message: "ok" };
  };
  const request = new Request("http://localhost/api/trust/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_state: "I trust myself", trust_level: 7 }),
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.trust_analysis);
  assert.ok(data.message);
});
