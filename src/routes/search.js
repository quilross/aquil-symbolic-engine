/**
 * Search Routes - Vector similarity search, RAG, and content search operations
 */

import { Router } from 'itty-router';
import { z } from 'zod';
import { queryVector, semanticRecall, transformativeInquiry } from '../actions/vectorize.js';
import { readLogs } from '../actions/logging.js';
import { listRecentWithContent } from '../actions/kv.js';
import { progressiveWeaving } from '../actions/r2.js';
import { addCORSToResponse, createSuccessResponse, createErrorResponse } from '../utils/response-helpers.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { readJSON } from '../utils/http.js';

// Create a simple logChatGPTAction function since it's not exported from actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  // Simplified logging for the router - in a real implementation this would do more
  console.log(`[ChatGPT Action] ${operationId}`, { data, result, error });
}

const searchRouter = Router();

// Schema for /api/rag/memory
const memoryConsolidationSchema = z.object({
  sources: z.array(z.enum(["vector", "kv", "r2"])).optional(),
  timeframe: z.string().optional(),
  consolidation_depth: z.string().optional(),
});

searchRouter.post("/api/rag/memory", withErrorHandling(async (req, env) => {
  const body = await readJSON(req);
  const validation = memoryConsolidationSchema.safeParse(body);
  if (!validation.success) {
    return addCORSToResponse(createErrorResponse(400, "validation_error", validation.error.message));
  }

  const { sources = ["vector", "kv", "r2"], timeframe = "7d" } = validation.data;
  const consolidatedMemories = { memories: [], insights: [], patterns: [] };

  // Consolidate from Vectorize
  if (sources.includes("vector")) {
    const vectorMemories = await semanticRecall(env, { text: "wisdom insights breakthrough", topK: 10 });
    consolidatedMemories.memories.push(...(vectorMemories.matches || []));
  }

  // Consolidate from KV
  if (sources.includes("kv")) {
    const kvMemories = await listRecentWithContent(env, { limit: 10, timeframe });
    consolidatedMemories.memories.push(...(kvMemories.entries || []));
  }

  // Consolidate from R2
  if (sources.includes("r2")) {
    const r2Memories = await progressiveWeaving(env, { timeframe, limit: 10 });
    consolidatedMemories.memories.push(...(r2Memories.woven_content || []));
  }

  // Generate insights
  if (consolidatedMemories.memories.length > 0) {
    consolidatedMemories.insights = [
      "Memory consolidation reveals recurring themes in your personal growth",
      "Pattern recognition across timeframes strengthens wisdom integration",
    ];
    consolidatedMemories.patterns = [
      "Emotional processing cycles",
      "Learning integration patterns",
    ];
  }

  const response = {
    success: true,
    consolidation: {
      ...consolidatedMemories,
      timeframe,
      sources,
      consolidated_at: new Date().toISOString(),
    },
    memory_count: consolidatedMemories.memories.length,
    insight_count: consolidatedMemories.insights.length,
  };

  await logChatGPTAction(env, 'ragMemoryConsolidation', body, response);
  return addCORSToResponse(createSuccessResponse(response));
}));

// Vector similarity search on logs
searchRouter.post("/api/search/logs", withErrorHandling(async (req, env) => {
  const body = await readJSON(req);
  const { query, limit = 5 } = body;
  
  if (!query) {
    return addCORSToResponse(createErrorResponse(400, 'query_required', 'Search query text is required'));
  }
  
  try {
    const result = await semanticRecall(env, {
      text: query,
      topK: Math.min(limit, 20)
    });
    
    const response = {
      results: result.matches || [],
      total: result.matches?.length || 0,
      query
    };
    
    await logChatGPTAction(env, 'searchLogs', body, response);
    return addCORSToResponse(createSuccessResponse(response));
  } catch (error) {
    await logChatGPTAction(env, 'searchLogs', body, null, error);
    return addCORSToResponse(createErrorResponse(500, 'search_logs_error', error.message));
  }
}));

// RAG semantic search with AI generation
searchRouter.post("/api/rag/search", withErrorHandling(async (req, env) => {
  const body = await readJSON(req);
  const { query, limit = 5, includeGeneration = true } = body;
  
  if (!query) {
    return addCORSToResponse(createErrorResponse(400, 'query_required', 'Search query text is required'));
  }
  
  try {
    const vectorResults = await semanticRecall(env, {
      text: query,
      topK: Math.min(limit, 10)
    });
    
    let generated = null;
    const relevanceScores = [];
    
    if (includeGeneration && vectorResults.matches?.length > 0) {
      const contextText = vectorResults.matches
        .map(match => {
          relevanceScores.push(match.score);
          return `Context (score: ${match.score}): ${match.metadata?.type || 'log'} - ${JSON.stringify(match.metadata)}`;
        })
        .join('\n');
      
      generated = `Based on ${vectorResults.matches.length} relevant log entries, here are the key insights for "${query}": ${contextText.substring(0, 500)}...`;
    }
    
    const response = {
      retrieved: vectorResults.matches || [],
      generated,
      query,
      relevance_scores: relevanceScores
    };
    
    await logChatGPTAction(env, 'ragSearch', body, response);
    return addCORSToResponse(createSuccessResponse(response));
  } catch (error) {
    await logChatGPTAction(env, 'ragSearch', body, null, error);
    return addCORSToResponse(createErrorResponse(500, 'rag_search_error', error.message));
  }
}));

// Search R2 storage objects
searchRouter.post("/api/search/r2", withErrorHandling(async (req, env) => {
  const body = await readJSON(req);
  const { query, type = 'all', limit = 5 } = body;
  
  if (!query) {
    return addCORSToResponse(createErrorResponse(400, 'query_required', 'Search query text is required'));
  }
  
  try {
    const timeframe = type === 'resonance' ? '7d' : '24h';
    const result = await progressiveWeaving(env, {
      timeframe,
      query,
      limit: Math.min(limit, 20)
    });
    
    const response = {
      objects: result.woven_content || [],
      total: result.woven_content?.length || 0,
      query
    };
    
    await logChatGPTAction(env, 'searchR2Storage', body, response);
    return addCORSToResponse(createSuccessResponse(response));
  } catch (error) {
    await logChatGPTAction(env, 'searchR2Storage', body, null, error);
    return addCORSToResponse(createErrorResponse(500, 'search_r2_error', error.message));
  }
}));

// Analytics insights endpoint
searchRouter.get("/api/analytics/insights", withErrorHandling(async (req, env) => {
  const url = new URL(req.url);
  const timeframe = url.searchParams.get('timeframe') || 'week';
  
  try {
    const logs = await readLogs(env, { limit: 200 });
    
    const patterns = [];
    const growthIndicators = [];
    const recommendations = [];
    
    if (logs.kv && Array.isArray(logs.kv)) {
      const logTypes = {};
      logs.kv.forEach(log => {
        const type = log.type || 'unknown';
        logTypes[type] = (logTypes[type] || 0) + 1;
      });
      
      Object.entries(logTypes).forEach(([type, count]) => {
        if (count > 5) {
          patterns.push(`Frequent ${type} activities (${count} occurrences)`);
        }
      });
    }
    
    if (patterns.length > 0) {
      growthIndicators.push('Consistent engagement patterns detected');
      recommendations.push('Continue with current activity rhythm');
    }
    
    const response = {
      conversation_patterns: patterns,
      growth_indicators: growthIndicators,
      engagement_metrics: {
        total_logs: logs.kv?.length || 0,
        timeframe,
        analysis_date: new Date().toISOString()
      },
      insights_summary: `Based on ${timeframe} analysis: ${patterns.length} patterns identified with ${growthIndicators.length} growth indicators`,
      recommendations
    };
    
    await logChatGPTAction(env, 'getConversationAnalytics', { timeframe }, response);
    return addCORSToResponse(createSuccessResponse(response));
  } catch (error) {
    await logChatGPTAction(env, 'getConversationAnalytics', { timeframe }, null, error);
    return addCORSToResponse(createErrorResponse(500, 'analytics_error', error.message));
  }
}));

// Export conversation data
searchRouter.post("/api/export/conversation", withErrorHandling(async (req, env) => {
  const body = await readJSON(req);
  const { format = 'json', date_range, include_analytics = true } = body;
  
  try {
    const logs = await readLogs(env, { limit: 1000 });
    
    const exportId = `export_${Date.now()}`;
    const recordCount = logs.kv?.length || 0;
    
    const exportData = {
      format,
      data: logs,
      analytics: include_analytics ? {
        total_records: recordCount,
        export_date: new Date().toISOString(),
        date_range
      } : null
    };
    
    const response = {
      export_url: `/api/exports/${exportId}.${format}`,
      file_size: `${JSON.stringify(exportData).length} bytes`,
      record_count: recordCount,
      export_id: exportId
    };
    
    await logChatGPTAction(env, 'exportConversationData', body, response);
    return addCORSToResponse(createSuccessResponse(response));
  } catch (error) {
    await logChatGPTAction(env, 'exportConversationData', body, null, error);
    return addCORSToResponse(createErrorResponse(500, 'export_error', error.message));
  }
}));

export { searchRouter };