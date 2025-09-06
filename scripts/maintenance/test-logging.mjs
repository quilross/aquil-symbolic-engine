// Minimal integration test for unified logging endpoints (Miniflare/Codespaces)
import fetch from "node-fetch";

const BASE = "http://127.0.0.1:8787";

async function postLog() {
  const res = await fetch(`${BASE}/api/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "insight",
      payload: { msg: "hello" },
      who: "mirror",
      level: "info",
      tags: ["trust"],
      text: "stand tall",
    }),
  });
  const json = await res.json();
  if (!json || json.error)
    throw new Error(
      "POST /api/log failed: " + (json.error || JSON.stringify(json)),
    );
  return json;
}

async function getLogs() {
  const res = await fetch(`${BASE}/api/logs?source=all&limit=5`);
  const json = await res.json();
  if (!json || !json.results)
    throw new Error("GET /api/logs failed: " + JSON.stringify(json));
  return json.results;
}

(async () => {
  console.log("Posting log...");
  const postResult = await postLog();
  console.log("Log posted:", postResult);

  console.log("Fetching logs...");
  const logs = await getLogs();
  console.log("Logs:", logs);

  // Assert D1 array length >= 1
  if (!logs.d1 || !Array.isArray(logs.d1) || logs.d1.length < 1) {
    throw new Error("D1 logs missing or empty");
  }
  console.log("D1 logs OK");

  // Assert KV has corresponding log key
  const kvLog =
    logs.kv && logs.kv.find((l) => l.value && l.value.includes("hello"));
  if (!kvLog) {
    throw new Error("KV log not found for posted message");
  }
  console.log("KV log OK:", kvLog.key);

  console.log("Integration test passed.");
})().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
