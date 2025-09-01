# Canonical Operation Aliases System

This system provides seamless normalization between schema operation names (camelCase) and implementation names (snake_case) while preserving all existing behavior.

## Key Features

### ✅ Zero Behavior Change
- All existing handlers continue using their current names
- `logChatGPTAction` normalizes centrally
- No breaking changes to any endpoints

### ✅ Canonical Normalization
- R2 policy decisions use canonical names
- Domain classification uses canonical names  
- Tags include both `action:<canonical>` and `alias:<original>` when different

### ✅ Enhanced `/api/logs` Response
```json
{
  "operationId": "trustCheckIn",
  "originalOperationId": "trust_check_in",
  "tags": ["action:trustCheckIn", "alias:trust_check_in", ...]
}
```

### ✅ KV Retention Control
- `KV_TTL_SECONDS=0` (default): Persistent storage for solo developers
- `KV_TTL_SECONDS=604800`: 7-day retention for teams
- `IDEMPOTENCY_TTL_SECONDS=86400`: 24-hour idempotency cache

### ✅ CI Guardrails
- `npm run guard:aliases`: Validates all operations are known
- `npm run guard:schema`: Checks schema consistency using alias system
- `npm run guard:patterns`: Prevents deprecated patterns

## Usage

### Environment Variables
```bash
# Solo developer (default)
KV_TTL_SECONDS=0              # Persistent KV storage
IDEMPOTENCY_TTL_SECONDS=86400 # 24h idempotency

# Team/scale
KV_TTL_SECONDS=604800         # 7-day KV retention  
IDEMPOTENCY_TTL_SECONDS=86400 # 24h idempotency
```

### Testing Canonicalization
```bash
# Test smoke endpoints
curl -s -X POST https://signal-q.me/api/trust/check-in -H 'content-type: application/json' -d '{"note":"test"}'
curl -s 'https://signal-q.me/api/logs?limit=5' | jq '.items | map({op:.operationId, alias:.originalOperationId})'
```

### CI Integration
```bash
npm run guard  # Runs all guards including new alias checker
```

## Files Added/Modified

### New Files
- `src/ops/operation-aliases.js` - Central mapping system
- `scripts/check-op-aliases.mjs` - CI alias validation

### Modified Files  
- `src/index.js` - Updated `logChatGPTAction` and `/api/logs` 
- `src/actions/logging.js` - Added KV TTL support
- `scripts/check-schema-consistency.mjs` - Uses alias system
- `scripts/reconcile-logs.mjs` - Respects KV TTL and canonical names
- `docs/observability.md` - Documents new features
- `package.json` - Added `guard:aliases` script

## Implementation Notes

### Mapping Strategy
- **30 canonical operations** from schema (camelCase)
- **29 alias operations** from implementation (snake_case)
- `toCanonical(op)` function handles all normalization
- Unknown operations pass through unchanged

### Zero-Regression Design
- Handlers keep existing operation names
- Central normalization in `logChatGPTAction`
- Backward-compatible R2 policy function
- Enhanced but non-breaking `/api/logs` response

This implementation provides clean analytics and stable forensics while preserving all existing functionality.