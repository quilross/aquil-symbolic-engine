# D1 Logging Format Guide

This repository stores long-term history in Cloudflare D1. The canonical table is:

- `metamorphic_logs` — primary structured log store with canonical schema
- `event_log` — compatibility VIEW that maps to metamorphic_logs for backwards compatibility

## Metamorphic Logs (Canonical Schema)

| column               | type | description                                      |
| -------------------- | ---- | ------------------------------------------------ |
| `id`                 | TEXT | unique log identifier (correlation ID)          |
| `timestamp`          | TEXT | ISO-8601 timestamp                               |
| `operationId`        | TEXT | canonical operation identifier                   |
| `originalOperationId`| TEXT | original operation ID (when different)          |
| `kind`               | TEXT | event category (e.g. `action_success`, `action_error`) |
| `level`              | TEXT | log level (info/warning/error/highlight)        |
| `session_id`         | TEXT | related conversation id                          |
| `tags`               | TEXT | JSON array string of structured tags            |
| `stores`             | TEXT | JSON array string of stores containing this log |
| `artifactKey`        | TEXT | R2 key for associated artifacts                  |
| `error_message`      | TEXT | error description (for error events)            |
| `error_code`         | TEXT | error code (for error events)                   |
| `detail`             | TEXT | JSON payload (scrubbed for privacy)             |
| `env`                | TEXT | environment (production/staging/dev)            |
| `source`             | TEXT | source of the log (gpt/system/user)             |

## Event Log Compatibility View

The `event_log` is now a VIEW that maps to `metamorphic_logs` for backwards compatibility:

```sql
CREATE VIEW event_log AS
SELECT
  id,
  timestamp AS ts,
  kind AS type,
  source AS who,
  level,
  session_id,
  tags,
  NULL AS idx1,
  NULL AS idx2,
  detail AS payload
FROM metamorphic_logs;
```

This ensures existing fallback code continues to work without modification.

## API Usage

### Write a Log

```
POST /api/log
{
  "type": "insight",
  "who": "mirror",
  "level": "info",
  "session_id": "ark_session_123",
  "tags": ["trust", "growth"],
  "payload": {"text": "realization goes here"}
}
```

### Retrieve Logs

```
GET /api/logs?limit=20&type=insight&tag=trust
```

Returns an array of `{ id, timestamp, kind, detail }` objects from whichever
log table exists.

Use these endpoints to capture every meaningful moment and to pull continuity
at session start. If neither table exists, both endpoints return empty arrays
rather than throwing missing‑table errors.
