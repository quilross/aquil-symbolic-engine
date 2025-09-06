/**
 * ChatGPT Actions Performance Monitor
 * Real-time monitoring of operation performance and usage
 */

export class ChatGPTActionsMonitor {
  constructor(env) {
    this.env = env;
    this.metrics = new Map();
  }
  
  async trackOperation(operationId, startTime, success, metadata = {}) {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    
    // Store metrics in KV for dashboard
    const metricKey = `metrics:${operationId}:${timestamp.slice(0, 13)}`; // Hour bucket
    const existing = await this.env.KV.get(metricKey, 'json') || {
      operation: operationId,
      hour: timestamp.slice(0, 13),
      calls: 0,
      successes: 0,
      totalDuration: 0,
      errors: []
    };
    
    existing.calls++;
    existing.totalDuration += duration;
    
    if (success) {
      existing.successes++;
    } else {
      existing.errors.push({ timestamp, metadata });
    }
    
    await this.env.KV.put(metricKey, JSON.stringify(existing), { expirationTtl: 86400 * 7 });
    
    // Alert on poor performance
    const successRate = existing.successes / existing.calls;
    const avgDuration = existing.totalDuration / existing.calls;
    
    if (successRate < 0.9 || avgDuration > 5000) {
      await this.sendAlert(operationId, { successRate, avgDuration, calls: existing.calls });
    }
  }
  
  async getDashboardData() {
    const keys = await this.env.KV.list({ prefix: 'metrics:' });
    const metrics = [];
    
    for (const key of keys.keys) {
      const data = await this.env.KV.get(key.name, 'json');
      if (data) metrics.push(data);
    }
    
    return this.aggregateMetrics(metrics);
  }
  
  aggregateMetrics(metrics) {
    const summary = {};
    
    for (const metric of metrics) {
      if (!summary[metric.operation]) {
        summary[metric.operation] = {
          operation: metric.operation,
          totalCalls: 0,
          totalSuccesses: 0,
          totalDuration: 0,
          errorCount: 0,
          avgDuration: 0,
          successRate: 0
        };
      }
      
      const op = summary[metric.operation];
      op.totalCalls += metric.calls;
      op.totalSuccesses += metric.successes;
      op.totalDuration += metric.totalDuration;
      op.errorCount += metric.errors.length;
    }
    
    // Calculate averages
    for (const op of Object.values(summary)) {
      op.avgDuration = op.totalCalls > 0 ? op.totalDuration / op.totalCalls : 0;
      op.successRate = op.totalCalls > 0 ? op.totalSuccesses / op.totalCalls : 0;
    }
    
    return Object.values(summary);
  }
  
  async sendAlert(operationId, metrics) {
    // Could integrate with Slack, email, or webhook
    console.warn(`🚨 Performance Alert: ${operationId}`, metrics);
    
    // Store alert in KV for dashboard
    await this.env.KV.put(
      `alert:${operationId}:${Date.now()}`,
      JSON.stringify({ operation: operationId, metrics, timestamp: new Date().toISOString() }),
      { expirationTtl: 86400 * 30 }
    );
  }
}

// Usage in your worker:
export function createMonitoringMiddleware(env) {
  const monitor = new ChatGPTActionsMonitor(env);
  
  return async (request, operationId, handler) => {
    const startTime = Date.now();
    let success = true;
    let error = null;
    
    try {
      const response = await handler(request);
      return response;
    } catch (err) {
      success = false;
      error = err.message;
      throw err;
    } finally {
      await monitor.trackOperation(operationId, startTime, success, { error });
    }
  };
}
