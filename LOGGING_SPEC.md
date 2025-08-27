# D1 Logging Format Guide

This repository stores long-term history in Cloudflare D1. Two tables may be present:

- `metamorphic_logs` — primary structured log store
- `event_log` — legacy fallback table used when `metamorphic_logs` is absent

## Metamorphic Logs

| column            | type | description                                     |
| ----------------- | ---- | ----------------------------------------------- |
| `id`              | TEXT | unique log identifier                           |
| `timestamp`       | TEXT | Philadelphia time at log creation               |
| `kind`            | TEXT | event category (e.g. `session_init`, `insight`) |
| `signal_strength` | TEXT | info/warning/error/highlight level              |
| `detail`          | TEXT | JSON or string payload                          |
| `session_id`      | TEXT | related conversation id                         |
| `voice`           | TEXT | mirror/oracle/scientist/strategist              |
| `tags`            | TEXT | comma‑separated labels                          |
| `idx1`, `idx2`    | TEXT | optional indexes                                |
| `metadata`        | TEXT | extra JSON metadata                             |

## Event Log Fallback

When `metamorphic_logs` is missing, the worker writes to `event_log` with fields:
`id`, `ts` (timestamp), `type` (kind), `who` (voice), `level` (signal_strength),
`session_id`, `tags`, `idx1`, `idx2`, and `payload` (detail).

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
