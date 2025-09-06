import axios from "axios";
const base = process.env.DEV_SERVER_URL || "http://localhost:8787";

const endpoints = [
  { method: "get", url: "/api/system/health-check", data: null },
  {
    method: "post",
    url: "/api/trust/check-in",
    data: {
      current_state: "confident and ready",
      trust_level: 7,
      specific_situation: "testing endpoint",
      body_sensations: "relaxed",
    },
  },
  {
    method: "post",
    url: "/api/media/extract-wisdom",
    data: {
      media_type: "book",
      title: "Test Book",
      your_reaction: "curious and inspired",
    },
  },
  {
    method: "post",
    url: "/api/somatic/session",
    data: {
      body_state: "grounded",
      emotions: "calm",
      intention: "healing",
    },
  },
  {
    method: "post",
    url: "/api/wisdom/synthesize",
    data: {
      wisdom_sources: ["source1", "source2"],
    },
  },
  {
    method: "post",
    url: "/api/patterns/recognize",
    data: {
      pattern: "growth",
    },
  },
  {
    method: "post",
    url: "/api/standing-tall/practice",
    data: {
      practice: "confidence",
    },
  },
  { method: "get", url: "/api/wisdom/daily-synthesis", data: null },
  {
    method: "post",
    url: "/api/log",
    data: {
      type: "test_event",
      payload: { message: "testing log endpoint" },
      who: "tester",
      level: "info",
      session_id: "test_session",
      tags: ["test"],
      idx1: 1,
      idx2: 2,
    },
  },
  { method: "get", url: "/api/logs", data: null },
  { method: "get", url: "/api/session-init", data: null },
];

for (const ep of endpoints) {
  try {
    const res = await axios({
      method: ep.method,
      url: base + ep.url,
      data: ep.data,
      validateStatus: () => true,
    });
    console.log(`\n${ep.method.toUpperCase()} ${ep.url}`);
    console.log("Status:", res.status);
    console.log("Response:", res.data);
  } catch (err) {
    console.error(
      `Error testing ${ep.method.toUpperCase()} ${ep.url}:`,
      err.message,
    );
  }
}
