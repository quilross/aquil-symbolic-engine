import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// In-memory store for now (replace with DB later)
let commitmentLogs = [];

// Archetypes Enum
const ARCHETYPES = ["anchor", "break", "express", "integrate"];
const MODES = ["automatic", "conditional", "invitation", "intentional"];
const IMPACTS = ["self", "other", "system"];

// Default mode per archetype
const DEFAULT_MODE = {
  anchor: "automatic",
  break: "conditional",
  express: "invitation",
  integrate: "intentional"
};

// Generic Action Endpoint
app.post("/action/:name", (req, res) => {
  const { name } = req.params;
  let { archetype, mode, impact, metadata } = req.body;

  // Validation
  if (!ARCHETYPES.includes(archetype)) {
    return res.status(400).json({ error: "Invalid archetype" });
  }
  if (!IMPACTS.includes(impact)) {
    return res.status(400).json({ error: "Invalid impact" });
  }
  // Apply default mode if not provided or invalid
  if (!MODES.includes(mode)) {
    mode = DEFAULT_MODE[archetype];
  }

  // Schema enforcement
  const logEntry = {
    endpoint: `action.${name}`,
    archetype,
    mode,
    impact,
    timestamp: new Date().toISOString(),
    metadata: {
      context: metadata?.context || "",
      tags: Array.isArray(metadata?.tags) ? metadata.tags : []
    }
  };

  commitmentLogs.push(logEntry);

  // Promote to D1 Vault if repeated/significant (stub)
  // Simulate D1 Vault as an array for now
  if (!global.d1Vault) global.d1Vault = [];
  const archetypeCount = commitmentLogs.filter(log => log.archetype === archetype).length;
  if (archetypeCount >= 3) {
    // Only promote if not already promoted
    if (!global.d1Vault.some(entry => entry.archetype === archetype)) {
      global.d1Vault.push({ archetype, promotedAt: new Date().toISOString() });
    }
  }

  res.status(201).json({ success: true, logEntry });
});

// Retrieve Commitment Logs
app.get("/logs", (req, res) => {
  res.json(commitmentLogs);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ark Action Framework API running on port ${PORT}`);
});
