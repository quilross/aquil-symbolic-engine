# Service Level Objectives (SLOs) - Aquil Symbolic Engine

## Error Rate Targets

### Overall System Target
- **Objective**: <1% error rate across all operations
- **Measurement Window**: 30-day rolling window
- **Calculation**: `sum(action_error_total) / sum(action_success_total + action_error_total) * 100`

### Per-Operation Targets
Each operationId should maintain:
- **Target**: <1% error rate
- **Warning Threshold**: >0.5% (review recommended)
- **Critical Threshold**: >2% (immediate investigation)
- **Measurement Window**: 7-day rolling window

### High-Value Operations (Stricter SLOs)
These core operations have enhanced targets:
- `logDataOrEvent`: <0.1% error rate
- `sessionInit`: <0.5% error rate  
- `arkRetrieve`: <0.5% error rate
- `getMonitoringMetrics`: <0.1% error rate

## Latency Targets (Placeholder)

### Response Time Objectives
*To be filled when latency metrics are implemented*

**Planned Metrics:**
- **p50 Latency**: <500ms for all operations
- **p95 Latency**: <2000ms for all operations  
- **p99 Latency**: <5000ms for all operations

**High-Priority Operations:**
- Health checks: p95 <200ms
- Monitoring endpoints: p95 <500ms
- Basic logging: p95 <1000ms

### Implementation Notes
Latency measurement will be added in future release with:
- Request timing middleware
- Histogram metrics for percentile calculation
- Store-specific timing breakdown

## Data Consistency Targets

### Store Reconciliation
- **Target**: Zero reconciliation backfills during normal operation
- **Acceptable**: <5 backfills per hour during high load
- **Investigation Threshold**: >20 backfills per hour
- **Measurement**: `reconcile_backfills_total{store}` rate

### Missing Store Writes
- **Target**: <0.1% of total writes per store
- **Warning**: >1% missing writes for any store
- **Critical**: >5% missing writes for any store
- **Measurement**: `missing_store_writes_total{store} / logs_written_total{store}`

### Idempotency Effectiveness
- **Target**: <5% duplicate requests (idempotency hits)
- **Measurement**: `idempotency_hits_total / (action_success_total + action_error_total)`
- **Note**: Higher rates may indicate client retry logic or user behavior patterns

## Circuit Breaker Targets

### Store Availability
- **Target**: Zero circuit breaker activations per day
- **Acceptable**: <3 activations per store per week
- **Investigation**: >1 activation per store per day
- **Measurement**: `store_circuit_open_total{store}` increase rate

### Recovery Time
- **Target**: Circuit breakers reset within 5 minutes (cooldown period)
- **Monitoring**: Track time between breaker open and successful operation

## Business Impact Alignment

### Critical Operations (99.9% uptime target)
Operations that directly affect user experience:
- `logDataOrEvent` - Core functionality
- `sessionInit` - User onboarding
- `getMonitoringMetrics` - System observability

### Important Operations (99.5% uptime target)  
Supporting functionality:
- All ARK endpoints
- Specialized core operations (somatic healing, trust building, etc.)

### Best Effort Operations (99% uptime target)
Advanced features:
- Autonomous actions
- Complex analysis operations
- Experimental endpoints

## SLO Review Process

### Weekly Review
- Check error rates against targets
- Review circuit breaker activations
- Assess store consistency metrics
- Update baseline thresholds if needed

### Monthly Review
- Analyze 30-day error rate trends
- Review SLO target appropriateness
- Plan capacity and reliability improvements
- Update documentation based on operational learnings

### Quarterly Review
- Comprehensive SLO target evaluation
- Business impact assessment
- Technical debt review related to reliability
- Roadmap planning for observability improvements

## Measurement Infrastructure

### Current Metrics Available
- Action success/error counters by operationId
- Store write success/failure counters
- Reconciliation and idempotency metrics
- Circuit breaker activation counters

### Planned Enhancements
- Request latency histograms
- Store-specific performance metrics
- User journey success tracking
- Capacity utilization metrics

## Error Budget Policy

### Monthly Error Budget
Each operation has a monthly error budget based on its target:
- **Critical ops (0.1% target)**: 99.9% success = 0.1% error budget
- **Standard ops (1% target)**: 99% success = 1% error budget

### Budget Consumption Actions
- **50% consumed**: Increase monitoring and review practices
- **75% consumed**: Prioritize reliability work over new features  
- **90% consumed**: Halt non-critical deployments
- **100% consumed**: Emergency response mode

### Budget Reset
Error budgets reset monthly but trends are tracked for long-term reliability planning.