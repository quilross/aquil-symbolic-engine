/**
 * ChatGPT Actions Integration Guide
 * How to activate and deploy the add-on systems
 */

// 1. ACTIVATE PERFORMANCE MONITORING
// Add to your main worker (src/index.js):

import { createMonitoringMiddleware } from './utils/chatgpt-monitor.js';

const monitor = createMonitoringMiddleware(env);

// Wrap your handlers:
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const operationId = extractOperationId(url.pathname);
    
    return await monitor(request, operationId, async () => {
      // Your existing handler logic
      return await handleRequest(request, env, ctx);
    });
  }
};

// 2. ACTIVATE ERROR HANDLING
// Add to your handlers:

import { withChatGPTErrorHandling } from './utils/chatgpt-error-handler.js';

// Wrap individual operation handlers:
const handleTrustCheckIn = withChatGPTErrorHandling(async (request, env, ctx) => {
  // Your trust check-in logic
});

// 3. USE TESTING SUITE
// Run compatibility tests:
// node scripts/test-chatgpt-actions.mjs

// 4. ADD NEW OPERATIONS TO SCHEMAS
// Copy operations from config/add-on-actions.json to your schemas

// 5. DEPLOY MONITORING DASHBOARD
// Add to your worker for dashboard endpoint:

async function handleMonitoringDashboard(request, env) {
  const monitor = new ChatGPTActionsMonitor(env);
  const dashboardData = await monitor.getDashboardData();
  
  return new Response(JSON.stringify({
    performance_summary: dashboardData,
    timestamp: new Date().toISOString(),
    status: 'active'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 6. WEBHOOK NOTIFICATIONS (Advanced Add-on)
async function setupWebhookNotifications(env, webhookUrl) {
  // Notify external systems of important events
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'chatgpt_action_called',
      operation: operationId,
      user_insights: extractedInsights,
      timestamp: new Date().toISOString()
    })
  });
}

// 7. SESSION PERSISTENCE (Advanced Add-on)
class SessionManager {
  async saveSession(sessionId, conversationState) {
    await env.KV.put(`session:${sessionId}`, JSON.stringify({
      state: conversationState,
      timestamp: new Date().toISOString(),
      operations_called: this.getOperationsHistory(sessionId)
    }), { expirationTtl: 86400 * 7 }); // 7 days
  }
  
  async restoreSession(sessionId) {
    const sessionData = await env.KV.get(`session:${sessionId}`, 'json');
    return sessionData?.state || null;
  }
}

export {
  monitor,
  withChatGPTErrorHandling,
  handleMonitoringDashboard,
  setupWebhookNotifications,
  SessionManager
};
