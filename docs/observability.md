# Observability & Logging System

## 60-Second "No-Surprises" Checklist

> **For whenever the schema changes—this is for humans, not CI.**

- **Op count = 30**  
  `jq '[.paths[]|.[]|select(.operationId)]|length' gpt-actions-schema.json`
- **Canonical opIds** only (alias layer handles any snake\_case at runtime).
- **Server URL =** `https://signal-q.me` (no localhost).
- **No auth schemes** (as intended).
- **POST/PUT** have optional `Idempotency-Key`.
- **Responses** are JSON with tiny examples.
- **Bump `info.version`** (use `npm run spec:bump`) and **click "Refresh Actions"** in the GPT builder.

---

This document explains the multi-store logging architecture, tagging system, R2 lifecycle policy, reconciliation process, idempotency features, and new observability enhancements.

## Architecture Overview

The Aquil Symbolic Engine uses a **multi-store logging architecture** to ensure reliability, searchability, and long-term storage of user interactions and system events.

### Storage Stores

#### 1. D1 Database (Primary)
- **Purpose**: Primary transactional storage and source of truth
- **Schema**: `metamorphic_logs` table with structured fields
- **Data**: Core log metadata, timestamps, session tracking
- **Retention**: Permanent (managed via application logic)

#### 2. KV Store (AQUIL_MEMORIES)
- **Purpose**: Fast retrieval and session continuity
- **Format**: Key-value pairs with structured JSON
- **Data**: Recent logs, user context, idempotency cache
- **Retention**: Configurable via `KV_TTL_SECONDS` (default: permanent)

#### 3. Vector Index (AQUIL_VECTOR_INDEX)
- **Purpose**: Semantic search and pattern recognition
- **Format**: Embeddings with metadata
- **Data**: Text content converted to 384-dimension vectors
- **Retention**: Managed by Vectorize service

#### 4. R2 Object Storage (AQUIL_ARTIFACTS)
- **Purpose**: Large artifacts and binary content
- **Format**: Structured path hierarchy
- **Data**: Generated content, binary attachments, detailed logs
- **Retention**: 30 days cache + lifecycle rules

## Standardized Log Schema

All logs conform to a consistent schema across stores:

```json
{
  "id": "unique-log-identifier",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "operationId": "trustCheckIn",
  "originalOperationId": "trust_check_in",
  "type": "action_success|action_error",
  "tags": [
    "action:trustCheckIn",
    "alias:trust_check_in",
    "domain:trust",
    "source:gpt",
    "env:production"
  ],
  "stores": ["d1", "kv", "r2"],
  "artifactKey": "logs/trustCheckIn/2024-01-01/log123.json",
  "error": {
    "message": "Error description",
    "code": "optional_error_code"
  }
}
```

### Required Fields
- `id`: Unique identifier across all stores
- `timestamp`: ISO 8601 timestamp for stable sorting
- `operationId`: Maps to GPT Actions schema operations
- `type`: Either `action_success` or `action_error`
- `tags`: Array of structured tags for filtering

### Optional Fields
- `originalOperationId`: Present only when different from canonical `operationId`
- `stores`: Array indicating which stores contain this log
- `artifactKey`: R2 key for associated artifacts
- `error`: Error details for failed operations

## Canonical Operation Names

### Purpose
Normalizes operation naming between schema (camelCase) and implementation (snake_case) to ensure consistent R2 policy routing, domain classification, and analytics.

### System
- **Canonical Names**: Match GPT Actions schema exactly (e.g., `trustCheckIn`)
- **Aliases**: Implementation variants (e.g., `trust_check_in`)
- **Centralized Mapping**: Defined in `src/ops/operation-aliases.js`

### Behavior
- **R2 Policy**: Uses canonical name for storage decisions
- **Domain Classification**: Uses canonical name for categorization
- **Tags**: Include both `action:<canonical>` and `alias:<original>` when different
- **Response**: `/api/logs` returns canonical `operationId`, with `originalOperationId` when different

### Zero-Impact Migration
Existing handlers continue using their current names. The `logChatGPTAction` function normalizes centrally, preserving all behavior while enabling consistent analytics.

## Tagging System

### Standard Tags
Every log includes these standardized tags:

1. **Action Tag**: `action:<canonical-operationId>`
2. **Alias Tag**: `alias:<original-operationId>` (when different from canonical)
3. **Domain Tag**: `domain:<category>`
4. **Source Tag**: `source:gpt` (for ChatGPT actions)
5. **Environment Tag**: `env:<stage>`

### Domain Categories
- `trust`: Trust-building operations
- `somatic`: Body-awareness and healing
- `wisdom`: Knowledge synthesis and insights
- `patterns`: Pattern recognition and analysis
- `system`: Health checks and infrastructure

### Custom Tags
Additional context-specific tags may be added:
- `error`: For failed operations
- `autonomous`: For system-initiated actions
- `chatgpt_action`: For GPT-triggered operations

## R2 Lifecycle Policy

### Artifact Key Format
All R2 artifacts follow this standardized format:
```
logs/<operationId>/<YYYY-MM-DD>/<logId>.<json|bin>
```

Examples:
- `logs/trust_check_in/2024-01-01/abc123.json`
- `logs/somatic_session/2024-01-01/def456.bin`

### Storage Policy by Operation

#### Required R2 Storage
Operations that generate significant content:
- `somatic_healing_session`: Full session data and guidance
- `pattern_recognition`: Analysis results and insights
- `wisdom_synthesis`: Synthesized wisdom and recommendations

#### Optional R2 Storage
Operations with minimal artifacts:
- `trust_check_in`: Basic state snapshots
- `media_extract_wisdom`: Extracted insights
- `standing_tall_practice`: Practice guidance

#### No R2 Storage
Simple operations:
- `system_health_check`: Status only
- `get_daily_synthesis`: Computed responses
- `log_data_or_event`: Metadata only

### Retention Strategy
1. **R2 Cache Control**: 30 days (`max-age=2592000`)
2. **R2 Lifecycle Rules**: Configure in Cloudflare R2 dashboard for longer-term retention
3. **KV Retention**: Configurable via `KV_TTL_SECONDS` environment variable
4. **Cleanup**: Automatic via R2 lifecycle policies and KV TTL

### KV Retention Profiles

#### Solo Developer (Default)
```bash
KV_TTL_SECONDS=0  # No expiry - persistent storage
IDEMPOTENCY_TTL_SECONDS=86400  # 24 hours
```
- **Use case**: Single user, KV as hot index with D1 as source-of-truth
- **Benefits**: Complete log history always available for analysis
- **Trade-off**: Higher KV storage usage

#### Team/Scale
```bash
KV_TTL_SECONDS=604800  # 7 days
IDEMPOTENCY_TTL_SECONDS=86400  # 24 hours  
```
- **Use case**: Multiple users, confident D1/Vector/R2 capture everything needed
- **Benefits**: Controlled KV storage usage
- **Trade-off**: Older logs only available via D1/R2

## Reconciliation System

### Purpose
Ensures consistency across all storage stores by detecting and backfilling missing log entries.

### Process
1. **Source of Truth**: D1 database serves as authoritative record
2. **Comparison**: Check KV, Vector, and R2 for missing entries
3. **Backfill**: Idempotently restore missing data
4. **Reporting**: Generate consistency metrics

### Usage
```bash
# Check last 24 hours (dry run)
npm run reconcile -- --window 24 --dry-run

# Backfill last 6 hours
npm run reconcile -- --window 6

# Verbose output
npm run reconcile -- --window 12 --verbose
```

### Automated Reconciliation
Configure as Worker cron trigger:
```javascript
// In wrangler.toml
[[triggers]]
crons = ["0 */6 * * *"]  # Every 6 hours
```

## Idempotency Support

### Purpose
Prevents duplicate processing and ensures consistent responses for identical requests.

### Implementation
- **Header**: `Idempotency-Key: <unique-key>`
- **Storage**: KV store with 24-hour expiration
- **Scope**: Per operation type
- **Response**: Returns cached result if key exists

### Currently Supported Endpoints
The following endpoints honor the `Idempotency-Key` header:

1. **`POST /api/trust/check-in`** (operationId: `trust_check_in`)
   - Used for trust state check-ins and analysis
   - Key format: `idempotency:trust_check_in:<provided-key>`

2. **`POST /api/somatic/session`** (operationId: `somatic_healing_session`)
   - Used for somatic healing session generation
   - Key format: `idempotency:somatic_healing_session:<provided-key>`

**Note**: Other POST endpoints (36 additional endpoints) do not currently support idempotency. Future implementations may extend this support based on user needs and endpoint criticality.

### Example Usage
```bash
curl -X POST https://signal-q.me/api/trust/check-in \
  -H "Idempotency-Key: user123-trust-20240101" \
  -H "Content-Type: application/json" \
  -d '{"current_state": "confident"}'
```

### Key Format
```
idempotency:<operationId>:<provided-key>
```

### Cached Data
```json
{
  "logId": "abc123",
  "response": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Embedding Hygiene

### Purpose
Ensures text data sent to vector embeddings is clean, secure, and appropriately sized.

### PII Scrubbing
Automatic redaction of:
- **Email addresses**: `user@domain.com` → `[EMAIL]`
- **Phone numbers**: `555-123-4567` → `[PHONE]`
- **Credit cards**: `1234-5678-9012-3456` → `[CARD]`
- **SSNs**: `123-45-6789` → `[SSN]`

### Text Processing
1. **Scrub PII**: Remove personally identifiable information
2. **Normalize whitespace**: Remove excessive spaces and newlines
3. **Truncate**: Limit to 1000 characters (configurable)
4. **Summarize**: Add `...` suffix for truncated content

### Example
```javascript
// Input
"Contact me at john@example.com or 555-123-4567"

// Output
"Contact me at [EMAIL] or [PHONE]"
```

## Monitoring & Metrics

### Consistency Metrics
- **Log Count**: Total logs per store
- **Missing Entries**: Gaps between stores
- **Backfill Rate**: Reconciliation success rate
- **Error Rate**: Failed operations percentage

### Performance Metrics
- **Response Time**: Average endpoint latency
- **Storage Latency**: Write times per store
- **Vector Search**: Embedding query performance
- **R2 Upload**: Artifact storage speed

### Health Checks
Access via `/api/system/health-check`:
```json
{
  "status": "healthy",
  "stores": {
    "d1": "connected",
    "kv": "connected", 
    "vector": "available",
    "r2": "available"
  },
  "metrics": {
    "logs_24h": 1247,
    "consistency": "98.5%"
  }
}
```

## Error Handling

### Canonical Error Schema
All error logs use standardized format:
```json
{
  "operationId": "trust_check_in",
  "message": "Human-readable error description",
  "code": "optional_error_code",
  "inputSummary": "Scrubbed input context",
  "stack": "Redacted stack trace (debug mode only)"
}
```

### Error Logging Flow
1. **Catch Error**: In endpoint handler
2. **Log Error**: Via `logChatGPTAction` with error flag
3. **Scrub Data**: Remove sensitive information
4. **Store Consistently**: Across all appropriate stores
5. **Return Gracefully**: User-friendly error response

## Observability Enhancements

### New Metrics (v2.2+)

The `/api/monitoring/metrics` endpoint now includes additional counters for operational visibility:

#### Counter Metrics
- **`logs_written_total{store="d1|kv|vector|r2"}`**: Total successful log writes per store
- **`action_success_total{operationId}`**: Successful actions by operation 
- **`action_error_total{operationId}`**: Failed actions by operation
- **`missing_store_writes_total{store}`**: Failed writes when store unavailable (fail-open behavior)
- **`idempotency_hits_total`**: Cache hits from duplicate requests
- **`reconcile_backfills_total{store}`**: Successful backfills during reconciliation

#### Usage Examples
```bash
# Check current metrics
curl -s https://signal-q.me/api/monitoring/metrics | jq '.counters'

# Monitor error rates
curl -s https://signal-q.me/api/monitoring/metrics | \
  jq '.counters.action_error_total // []'
```

### Payload Size Management

#### MAX_PAYLOAD_BYTES Environment Variable
- **Default**: `16384` (16KB)
- **Behavior**: When payload exceeds limit:
  1. **R2 Available**: Move bulk data to R2 with gzip compression and SHA256 checksum
  2. **R2 Unavailable**: Truncate payload with preservation summary
  3. **D1/KV Storage**: Always store compact summary or pointer

#### R2 Overflow Handling
- **Compression**: `content-encoding: gzip` metadata
- **Integrity**: `x-sha256` checksum for verification
- **Metadata**: Original size, timestamp, session ID stored as custom metadata

### Privacy & Security

#### Automatic Secret Redaction
Before storing in D1/KV, payloads are automatically scanned for sensitive fields:
- **Patterns**: `authorization`, `api_key`, `cookie`, `password`, `token`, `secret` (case-insensitive)
- **Behavior**: Replace values with `[REDACTED]` while preserving structure
- **Fail-Open**: Original payload used if redaction fails

#### Vector Hygiene
- Text sent to embeddings undergoes scrubbing and truncation
- No raw secrets or PII should reach the vector index
- Consistent with existing `scrubAndTruncateForEmbedding` function

### D1 Performance Insurance

#### Safe Index Creation
Indexes are created on application startup using `IF NOT EXISTS`:
```sql
CREATE INDEX IF NOT EXISTS idx_logs_ts ON metamorphic_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_op ON metamorphic_logs(operationId);  
CREATE INDEX IF NOT EXISTS idx_logs_session ON metamorphic_logs(session_id);
```

- **Non-Destructive**: Uses `IF NOT EXISTS` to avoid conflicts
- **Fail-Open**: Logs and continues on index creation errors
- **Background**: Runs via `ctx.waitUntil()` to avoid blocking requests

### OpenAPI Automation

#### Version Management
```bash
# Compare current schema with last committed version
npm run spec:diff

# Auto-increment patch version (1.2.3 → 1.2.4)
npm run spec:bump

# No-op placeholder for auto-commit workflows
npm run spec:commit
```

#### CI Integration
- **Operation Count Validation**: Fails if not exactly 30 operations
- **Schema Change Detection**: Generates diff in PR comments
- **Version Bump Reminder**: Warns if schema changed but version not bumped

### Alias Convergence Milestone

**Current State**: Alias layer active for backward compatibility  
**Future Path**: Rename handlers to canonical names, keep alias layer for external GPT compatibility  
**Timeline**: Post-hardening phase to avoid breaking changes during critical stability period

## CI/CD Guardrails

### Schema Consistency
Ensures GPT Actions schema and implementation stay synchronized:
```bash
npm run guard:schema
```

### Banned Patterns
Prevents regression to legacy endpoints and bindings:
```bash
npm run guard:patterns
```

### Combined Guard
Run all guardrails:
```bash
npm run guard
```

## Best Practices

### For Developers
1. **Always use `logChatGPTAction`** for GPT-triggered operations
2. **Include idempotency support** for user-facing endpoints
3. **Scrub PII** before logging any user input
4. **Follow R2 key format** for artifact storage
5. **Add appropriate tags** for filtering and analysis

### For Operations
1. **Monitor consistency metrics** via reconciliation reports
2. **Configure R2 lifecycle rules** for cost optimization
3. **Set up automated reconciliation** via cron triggers
4. **Review error logs regularly** for system health
5. **Test idempotency behavior** in staging environments

### For Security
1. **PII scrubbing is automatic** but verify implementation
2. **No sensitive data in R2 keys** or metadata
3. **Idempotency keys expire** after 24 hours
4. **Error messages are user-friendly** (no internal details)
5. **Stack traces are redacted** in production logs