import test from "node:test";
import assert from "node:assert/strict";
import Ajv from "ajv";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import app from "../src/index.js";
import { TrustBuilder } from "../src/src-core-trust-builder.js";
import { MediaWisdomExtractor } from "../src/src-core-media-wisdom.js";
import { PatternRecognizer } from "../src/src-core-pattern-recognizer.js";
import { StandingTall } from "../src/src-core-standing-tall.js";
import { SomaticHealer } from "../src/src-core-somatic-healer.js";
// Using real implementations for logging and D1 actions
import * as d1 from "../src/actions/d1.js";
import * as arkCore from "../src/ark/core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  fs.readFileSync(join(__dirname, "..", "gpt-actions-schema.json"), "utf8"),
);
const ajv = new Ajv();

function validateResponse(path, method, data) {
  const methodSchema = schema.paths[path]?.[method.toLowerCase()];
  const responseSchema = methodSchema?.responses?.["200"]?.content?.[
    "application/json"
  ]?.schema || { type: "object" };
  const validate = ajv.compile(responseSchema);
  assert.ok(
    validate(data),
    `Schema validation failed for ${path}: ${JSON.stringify(validate.errors)}`,
  );
}

// basic environment stub
const env = {
  AQUIL_DB: {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [] }),
        run: async () => ({}),
        first: async () => null,
      }),
    }),
  },
  AI: { run: async () => ({ response: "{}" }) },
};

TrustBuilder.prototype.processCheckIn = async function (data) {
  if (!data.current_state) throw new Error("current_state required");
  return { message: "ok" };
};

TrustBuilder.prototype.synthesizeWisdom = async function (data) {
  if (!data.life_situation || !data.specific_question)
    throw new Error("missing fields");
  return { wisdom: [] };
};

TrustBuilder.prototype.dailySynthesis = async function () {
  return { wisdom: [] };
};

MediaWisdomExtractor.prototype.extractWisdom = async function (data) {
  if (!data.media_type || !data.title || !data.your_reaction)
    throw new Error("missing fields");
  return { insights: [] };
};

PatternRecognizer.prototype.recognize = async function (data) {
  if (!data.area_of_focus || !data.recent_experiences)
    throw new Error("missing fields");
  return { patterns: [] };
};

StandingTall.prototype.practice = async function (data) {
  if (!data.situation || !data.desired_outcome)
    throw new Error("missing fields");
  return { practice: [] };
};

SomaticHealer.prototype.generateSession = async function (data) {
  if (!data.body_state || !data.emotions || !data.intention)
    throw new Error("missing fields");
  return { session: [] };
};

const endpoints = [
  { method: "GET", path: "/api/health", valid: null },
  { method: "GET", path: "/api/logs", valid: null },
  { method: "GET", path: "/api/session-init", valid: null },
  {
    method: "POST",
    path: "/api/log",
    valid: { type: "note", payload: { text: "hi" } },
  },
  {
    method: "POST",
    path: "/api/trust/check-in",
    valid: { current_state: "confident" },
    missing: {},
  },
  {
    method: "POST",
    path: "/api/media/extract-wisdom",
    valid: { media_type: "book", title: "Test", your_reaction: "wow" },
    missing: { media_type: "book", title: "Test" },
  },
  {
    method: "POST",
    path: "/api/somatic/session",
    valid: { body_state: "tense", emotions: "anxious", intention: "relax" },
    missing: { body_state: "tense", emotions: "anxious" },
  },
  {
    method: "POST",
    path: "/api/wisdom/synthesize",
    valid: { life_situation: "job", specific_question: "What next?" },
  },
  {
    method: "POST",
    path: "/api/patterns/recognize",
    valid: { area_of_focus: "trust_building", recent_experiences: "I keep..." },
  },
  {
    method: "POST",
    path: "/api/standing-tall/practice",
    valid: { situation: "meeting", desired_outcome: "speak up" },
  },
  { method: "GET", path: "/api/wisdom/daily-synthesis", valid: null },
];

for (const ep of endpoints) {
  test(`${ep.path} success`, async () => {
    const init = { method: ep.method };
    if (ep.valid) {
      init.body = JSON.stringify(ep.valid);
      init.headers = { "Content-Type": "application/json" };
    }
    const res = await app.fetch(
      new Request("http://localhost" + ep.path, init),
      env,
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    validateResponse(ep.path, ep.method, data);
  });

  if (ep.method === "POST") {
    test(`${ep.path} rejects malformed JSON`, async () => {
      const res = await app.fetch(
        new Request("http://localhost" + ep.path, {
          method: "POST",
          body: "not-json",
        }),
        env,
      );
      assert.equal(res.status, 400);
    });
    if (ep.missing) {
      test(`${ep.path} missing params`, async () => {
        const res = await app.fetch(
          new Request("http://localhost" + ep.path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ep.missing),
          }),
          env,
        );
        assert.equal(res.status, 500);
      });
    }
  }
}
