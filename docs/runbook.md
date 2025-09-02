# Runbook - Aquil Symbolic Engine Operations

## First Look Dashboard Panels

When investigating issues, check these dashboard panels in order:

### 1. System Health Overview
- **System Health Percentage**: Should be ≥95% for normal operation
- **Feature Status**: All core components (core_system, logging_system, ai_integration) should show "operational"

### 2. Action Success Rates
- **Overall Error Rate**: Should be <1% across all operations
- **Per-Operation Errors**: Look for specific operations with elevated error rates
- **Recent Error Spikes**: Check for sudden increases in error counts

### 3. Store Status
- **Logs Written Total**: Verify all stores (d1, kv, r2, vector) are receiving writes
- **Missing Store Writes**: Should be near zero; spikes indicate store unavailability
- **Circuit Breaker Status**: Check for any stores with open circuit breakers

### 4. Data Consistency
- **Reconciliation Backfills**: Should be zero during normal operation
- **Idempotency Hits**: Track duplicate request patterns

## The 3 Essential Smoke Tests

Use these curl commands to verify basic system functionality:

### 1. System Health Check
```bash
curl -s https://signal-q.me/api/monitoring/metrics | jq '.system_status, .system_health_percentage'
```
**Expected**: `"operational"` and `100` (or close to 100)

### 2. Basic Logging Test
```bash
curl -X POST https://signal-q.me/api/log \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{"test":true},"who":"system"}' | jq '.success'
```
**Expected**: `true`

### 3. ARK Retrieval Test
```bash
curl -s "https://signal-q.me/api/ark/status" | jq '.status'
```
**Expected**: `"operational"` or `"available"`

## Alert Meanings & First Fixes

### HighActionErrorRate
**Meaning**: An operation has >1% error rate for 10+ minutes
**First Actions**:
1. Check the specific operationId in the alert
2. Review recent logs for that operation: `/api/logs?type=error&limit=50`
3. Check if it's a new deployment or configuration change
4. Look for patterns in the error messages

### MissingStoreWrites
**Meaning**: A storage store is missing writes above baseline
**First Actions**:
1. Check store binding health in Cloudflare dashboard
2. Verify store quotas and limits
3. Check if it's a temporary connectivity issue
4. Consider enabling reconciliation if data loss is suspected

### ReconciliationBackfills
**Meaning**: Data inconsistency detected between stores
**First Actions**:
1. This is informational - reconciliation is working as designed
2. If frequent, investigate root cause of store write failures
3. Monitor for patterns (e.g., specific time of day, after deployments)
4. Check if store circuit breakers are functioning

### StoreCircuitBreakerOpen
**Meaning**: A store has failed repeatedly and circuit breaker engaged
**First Actions**:
1. Check store binding status in Cloudflare dashboard
2. Verify store is not over quota/limits
3. Wait for cooldown period (5 minutes) before manual intervention
4. Circuit breaker is fail-open - operations continue without that store

### SystemHealthDegraded
**Meaning**: Multiple components showing degraded status
**First Actions**:
1. Check Cloudflare status page for service issues
2. Review recent deployments or configuration changes
3. Check individual feature statuses in metrics endpoint
4. Consider rolling back recent changes if correlation exists

## Escalation Paths

### Immediate Response (< 5 minutes)
- System health <80%
- All stores showing circuit breaker open
- Error rate >10% across all operations

### Next Business Day Response
- Single store circuit breaker open
- Error rate 1-5% on specific operations
- Reconciliation backfills occurring

### Monitoring Only
- Reconciliation backfills <10/hour
- Error rate <1% 
- Individual missing store writes <5% of baseline

## Useful Queries

### Recent Errors by Operation
```bash
curl -s "https://signal-q.me/api/logs?level=error&limit=100" | jq '[.logs[] | select(.timestamp > (now - 3600)) | .operationId] | group_by(.) | map({operation: .[0], count: length}) | sort_by(.count) | reverse'
```

### Store Health Summary
```bash
curl -s https://signal-q.me/api/monitoring/metrics | jq '.counters | to_entries | map(select(.key | contains("store"))) | from_entries'
```

### System Performance Overview
```bash
curl -s https://signal-q.me/api/monitoring/metrics | jq '{health: .system_health_percentage, status: .system_status, features: .feature_status}'
```