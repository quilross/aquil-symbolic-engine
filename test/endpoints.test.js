import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import worker from "../src/index.js";

const schema = JSON.parse(
  fs.readFileSync(new URL("../gpt-actions-schema.json", import.meta.url)),
);

const endpoints = [];
for (const [path, methods] of Object.entries(schema.paths)) {
  for (const method of Object.keys(methods)) {
    endpoints.push({ path, method });
  }
}

function bodyFor(path) {
  switch (path) {
    case "/api/log":
      return { type: "test", payload: {} };
    case "/api/trust/check-in":
      return { current_state: "ok" };
    case "/api/media/extract-wisdom":
      return { media_type: "video", title: "x", your_reaction: "wow" };
    case "/api/somatic/session":
      return { body_state: {}, emotions: [], intention: "rest" };
    case "/api/patterns/recognize":
      return { area_of_focus: "overall_growth", recent_experiences: [] };
    case "/api/standing-tall/practice":
      return { situation: "test", desired_outcome: "confidence" };
    case "/api/wisdom/synthesize":
      return { life_situation: "test", specific_question: "what now?" };
    case "/api/feedback":
      return { message: "hi" };
    case "/api/dreams/interpret":
      return { dream_text: "I was flying" };
    case "/api/energy/optimize":
      return { current_energy: "low" };
    case "/api/values/clarify":
      return { values_list: ["truth"] };
    case "/api/creativity/unleash":
      return { block_description: "stuck" };
    case "/api/abundance/cultivate":
      return { money_mindset: "scarcity" };
    case "/api/transitions/navigate":
      return { transition_type: "career" };
    case "/api/ancestry/heal":
      return { family_pattern: "anger" };
    default:
      return { dummy: true };
  }
}

for (const ep of endpoints) {
  test(`${ep.method.toUpperCase()} ${ep.path} responds`, async () => {
    const init = { method: ep.method.toUpperCase() };
    if (ep.method === "post") {
      init.body = JSON.stringify(bodyFor(ep.path));
      init.headers = { "Content-Type": "application/json" };
    }
    const res = await worker.fetch(
      new Request("http://localhost" + ep.path, init),
      {},
    );
    assert.notEqual(res.status, 404);
  });
}
