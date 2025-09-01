# Observability & Logging System

This document explains the multi-store logging architecture, tagging system, R2 lifecycle policy, reconciliation process, and idempotency features.

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
- **Retention**: 30 days automatic expiration

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
  "operationId": "trust_check_in",
  "type": "action_success|action_error",
  "tags": [
    "action:trust_check_in",
    "domain:trust",
    "source:gpt",
    "env:production"
  ],
  "stores": ["d1", "kv", "r2"],
  "artifactKey": "logs/trust_check_in/2024-01-01/log123.json",
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
- `stores`: Array indicating which stores contain this log
- `artifactKey`: R2 key for associated artifacts
- `error`: Error details for failed operations

## Tagging System

### Standard Tags
Every log includes these standardized tags:

1. **Action Tag**: `action:<operationId>`
2. **Domain Tag**: `domain:<category>`
3. **Source Tag**: `source:gpt` (for ChatGPT actions)
4. **Environment Tag**: `env:<stage>`

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
1. **Cache Control**: 30 days (`max-age=2592000`)
2. **Lifecycle Rules**: Configure in Cloudflare R2 dashboard
3. **Cleanup**: Automatic via R2 lifecycle policies
4. **Access**: Direct R2 patterns (no signed URLs by default)

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