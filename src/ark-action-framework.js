/**
 * @openapi
 * /action/{name}:
 *   post:
 *     summary: Log a symbolic action event
 *     description: Log an archetype-based action with metadata, mode, and impact. Aligns with GPT Actions schema.
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Action name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               archetype: { type: string }
 *               mode: { type: string }
 *               impact: { type: string }
 *               metadata: { type: object }
 *               type: { type: string }
 *               who: { type: string }
 *               level: { type: string }
 *               session_id: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               payload: { type: object }
 *             required: [archetype, impact, payload]
 *     responses:
 *       201:
 *         description: Action logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 logEntry: { type: object }
 */

import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

let commitmentLogs = [];
if (!global.d1Vault) global.d1Vault = [];

const ARCHETYPES = ["anchor", "break", "express", "integrate"];
const MODES = ["automatic", "conditional", "invitation", "intentional"];
const IMPACTS = ["self", "other", "system"];
const DEFAULT_MODE = {
  anchor: "automatic",
  break: "conditional",
  express: "invitation",
  integrate: "intentional",
};

// Generic Action Endpoint (aligned with GPT Actions schema)
app.post("/action/:name", (req, res) => {
  const { name } = req.params;
  let {
    archetype,
    mode,
    impact,
    metadata = {},
    type,
    who,
    level,
    session_id,
    tags = [],
    payload,
  } = req.body;

  if (!ARCHETYPES.includes(archetype)) {
    return res.status(400).json({ error: "Invalid archetype" });
  }
  if (!IMPACTS.includes(impact)) {
    return res.status(400).json({ error: "Invalid impact" });
  }
  if (!MODES.includes(mode)) {
    mode = DEFAULT_MODE[archetype];
  }
  if (!payload) {
    return res.status(400).json({ error: "Missing payload" });
  }

  const logEntry = {
    endpoint: `action.${name}`,
    archetype,
    mode,
    impact,
    type: type || "action_event",
    who: who || "unknown",
    level: level || "info",
    session_id: session_id || null,
    tags: Array.isArray(tags) ? tags : [],
    payload,
    timestamp: new Date().toISOString(),
    metadata,
  };

  commitmentLogs.push(logEntry);

  // Promote to D1 Vault if repeated/significant (stub)
  const archetypeCount = commitmentLogs.filter(
    (log) => log.archetype === archetype,
  ).length;
  if (archetypeCount >= 3) {
    if (!global.d1Vault.some((entry) => entry.archetype === archetype)) {
      global.d1Vault.push({ archetype, promotedAt: new Date().toISOString() });
    }
  }

  res.status(201).json({ success: true, logEntry });
});

// Batch Action Logging
app.post("/action/batch", (req, res) => {
  const { actions } = req.body;
  if (!Array.isArray(actions)) {
    return res.status(400).json({ error: "Actions must be an array" });
  }
  const results = actions.map((action) => {
    const {
      name,
      archetype,
      mode,
      impact,
      metadata = {},
      type,
      who,
      level,
      session_id,
      tags = [],
      payload,
    } = action;
    if (
      !ARCHETYPES.includes(archetype) ||
      !IMPACTS.includes(impact) ||
      !payload
    ) {
      return { success: false, error: "Invalid action", action };
    }
    const logEntry = {
      endpoint: `action.${name}`,
      archetype,
      mode: MODES.includes(mode) ? mode : DEFAULT_MODE[archetype],
      impact,
      type: type || "action_event",
      who: who || "unknown",
      level: level || "info",
      session_id: session_id || null,
      tags: Array.isArray(tags) ? tags : [],
      payload,
      timestamp: new Date().toISOString(),
      metadata,
    };
    commitmentLogs.push(logEntry);
    return { success: true, logEntry };
  });
  res.status(201).json({ results });
});

// Retrieve Commitment Logs
app.get("/logs", (req, res) => {
  res.json(commitmentLogs);
});

// Summarize Commitment Logs
app.get("/action/summary", (req, res) => {
  const summary = {};
  commitmentLogs.forEach((log) => {
    if (!summary[log.archetype])
      summary[log.archetype] = { count: 0, impacts: {} };
    summary[log.archetype].count++;
    summary[log.archetype].impacts[log.impact] =
      (summary[log.archetype].impacts[log.impact] || 0) + 1;
  });
  res.json(summary);
});

// List Archetypes, Modes, Impacts
app.get("/action/meta", (req, res) => {
  res.json({ archetypes: ARCHETYPES, modes: MODES, impacts: IMPACTS });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ark Action Framework API running on port ${PORT}`);
});
