# Operations Dashboards

This directory contains Grafana-style dashboard configurations for monitoring the Aquil Symbolic Engine operations.

## Available Dashboards

### metrics.json
Main operations dashboard showing:
- Action success/error rates by operationId
- Store write status (logs_written_total, missing_store_writes_total)
- Reconciliation backfills and idempotency hits
- Error rate table by operation
- Circuit breaker status for stores

## Import Instructions

### Grafana
1. Open Grafana dashboard
2. Click "+" → "Import"
3. Upload `metrics.json` or paste the JSON content
4. Configure data source to point to your metrics endpoint
5. Set refresh interval to 30s for real-time monitoring

### Prometheus + Grafana
1. Configure Prometheus to scrape `/api/monitoring/metrics` endpoint
2. Import the dashboard JSON into Grafana
3. Update target expressions if needed for your Prometheus setup

### Custom Monitoring Stack
The JSON follows standard Grafana format with these metric names:
- `action_success_total{operationId}`
- `action_error_total{operationId}`
- `logs_written_total{store}`
- `missing_store_writes_total{store}`
- `reconcile_backfills_total{store}`
- `idempotency_hits_total`
- `store_circuit_open_total{store}`

Adapt the target expressions for your specific monitoring system.

## Thresholds

The dashboard includes traffic light thresholds:
- **Green**: Normal operation
- **Yellow**: Warning level (>1% error rate, backfills occurring)
- **Red**: Critical level (>5% error rate, frequent circuit breaker trips)

## Refresh Rate

Set to 30 seconds by default for near real-time monitoring without overwhelming the metrics endpoint.