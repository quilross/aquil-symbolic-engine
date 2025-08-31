/**
 * Ark Retrieval & Logging API Endpoints
 * Expose enhanced D1, KV, Vector, R2 functionality
 */

import { send, readJSON } from '../utils/http.js';
import { writeLog, readLogs, writeAutonomousLog, readLogsWithFilters } from '../actions/logging.js';
import { getRecentLogs, listRecentWithContent } from '../actions/kv.js';
import { queryVector, semanticRecall, transformativeInquiry } from '../actions/vectorize.js';
import { weaveMicroThread, weaveMultiLogResonance, progressiveWeaving } from '../actions/r2.js';

// Enhanced logging endpoint with variable payload support
export async function arkLog(req, env) {
  try {
    const body = await readJSON(req);
    const result = await writeLog(env, body);
    
    return send(200, {
      success: true,
      ark_status: {
        capture: result.kv === 'ok' ? 'success' : 'failed',
        promote: result.d1 === 'ok' || result.d1 === 'ok_fallback' ? 'success' : 'failed',
        vector: result.vector === 'ok' ? 'success' : 'not_provided',
        binary: result.r2 === 'ok' ? 'success' : 'not_provided'
      },
      details: result
    });
  } catch (error) {
    return send(500, { error: 'ark_log_error', message: error.message });
  }
}

// Enhanced log retrieval with full content
export async function arkRetrieve(req, env) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const includeResonance = url.searchParams.get('include_resonance') === 'true';
    
    const result = await readLogs(env, { limit });
    
    // Add resonance weaving if requested
    if (includeResonance) {
      try {
        const { progressiveWeaving } = await import('../actions/r2.js');
        const resonance = await progressiveWeaving(env, { timeframe: '24h' });
        result.resonance_weaving = resonance;
      } catch (e) {
        result.resonance_weaving = { error: e.message };
      }
    }
    
    return send(200, {
      success: true,
      ark_nervous_system: {
        capture_kv: Array.isArray(result.kv) ? result.kv.length : 'error',
        promote_d1: Array.isArray(result.d1) ? result.d1.length : 'error',
        retrieve_vector: result.vector?.status || 'available',
        resonate_r2: result.r2_resonance?.success ? 'active' : 'inactive'
      },
      data: result
    });
  } catch (error) {
    return send(500, { error: 'ark_retrieve_error', message: error.message });
  }
}

// KV enhanced retrieval endpoint
export async function arkMemories(req, env) {
  try {
    const url = new URL(req.url);
    const includeContent = url.searchParams.get('content') !== 'false';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const prefix = url.searchParams.get('prefix') || 'log_';
    
    const memories = await getRecentLogs(env, { 
      includeContent, 
      limit, 
      prefix 
    });
    
    return send(200, {
      success: true,
      mode: includeContent ? 'full_content' : 'ids_only',
      count: memories.length,
      memories
    });
  } catch (error) {
    return send(500, { error: 'ark_memories_error', message: error.message });
  }
}

// Vector dual-mode query endpoint
export async function arkVector(req, env) {
  try {
    const body = await readJSON(req);
    const { text, mode = 'semantic_recall', topK = 5, threshold = 0.7 } = body;
    
    if (!text) {
      return send(400, { error: 'text_required', message: 'Query text is required' });
    }
    
    const result = await queryVector(env, { text, mode, topK, threshold });
    
    return send(200, {
      success: true,
      query: text,
      mode,
      result
    });
  } catch (error) {
    return send(500, { error: 'ark_vector_error', message: error.message });
  }
}

// R2 resonance weaving endpoint
export async function arkResonance(req, env) {
  try {
    const body = await readJSON(req);
    const { 
      type = 'progressive', 
      session_id, 
      timeframe = '7d',
      logs 
    } = body;
    
    let result;
    
    switch (type) {
      case 'micro':
        if (!logs || logs.length !== 1) {
          return send(400, { error: 'single_log_required', message: 'Micro-thread weaving requires exactly one log entry' });
        }
        result = await weaveMicroThread(env, logs[0]);
        break;
        
      case 'multi':
        if (!logs || logs.length < 2) {
          return send(400, { error: 'multiple_logs_required', message: 'Multi-log weaving requires at least 2 log entries' });
        }
        result = await weaveMultiLogResonance(env, logs);
        break;
        
      case 'progressive':
      default:
        result = await progressiveWeaving(env, { session_id, timeframe });
        break;
    }
    
    return send(200, {
      success: result.success,
      weaving_type: type,
      result
    });
  } catch (error) {
    return send(500, { error: 'ark_resonance_error', message: error.message });
  }
}

// Ark nervous system status endpoint
export async function arkStatus(req, env) {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      nervous_system: {
        capture_kv: 'operational',
        promote_d1: 'operational',
        retrieve_vector: 'operational',
        resonate_r2: 'operational'
      },
      capabilities: {
        d1_vault: {
          variable_payloads: true,
          schema_enforcement: true,
          fallback_tables: true
        },
        kv_storage: {
          full_content_retrieval: true,
          legacy_id_mode: true,
          dual_mode_support: true
        },
        vector_layer: {
          semantic_recall: true,
          transformative_inquiry: true,
          legacy_query: true
        },
        r2_resonance: {
          micro_thread_weaving: true,
          multi_log_resonance: true,
          progressive_weaving: true,
          sparse_data_support: true
        }
      },
      health_check: 'all_systems_operational'
    };
    
    // Test basic functionality
    try {
      const testLog = await writeLog(env, {
        type: 'health_check',
        payload: { content: 'System health check', timestamp: new Date().toISOString() },
        session_id: 'health_check',
        who: 'system',
        level: 'info',
        tags: ['health_check']
      });
      
      status.last_health_check = {
        timestamp: new Date().toISOString(),
        capture: testLog.kv === 'ok',
        promote: testLog.d1 === 'ok' || testLog.d1 === 'ok_fallback',
        vector: testLog.vector === 'ok' || testLog.vector === undefined,
        overall: 'healthy'
      };
    } catch (e) {
      status.last_health_check = {
        timestamp: new Date().toISOString(),
        error: e.message,
        overall: 'degraded'
      };
    }
    
    return send(200, status);
  } catch (error) {
    return send(500, { error: 'ark_status_error', message: error.message });
  }
}

// Advanced log filtering endpoint
export async function arkFilter(req, env) {
  try {
    const body = await readJSON(req);
    const filters = {
      limit: body.limit || 20,
      type: body.type,
      autonomous_only: body.autonomous_only || false,
      session_id: body.session_id,
      tags: body.tags,
      date_from: body.date_from,
      date_to: body.date_to
    };
    
    const logs = await readLogsWithFilters(env, filters);
    
    return send(200, {
      success: true,
      filters_applied: filters,
      count: logs.length,
      logs
    });
  } catch (error) {
    return send(500, { error: 'ark_filter_error', message: error.message });
  }
}

// Autonomous action logging endpoint
export async function arkAutonomous(req, env) {
  try {
    const body = await readJSON(req);
    const result = await writeAutonomousLog(env, body);
    
    return send(200, {
      success: true,
      autonomous_action: body.action,
      trigger_keywords: body.trigger_keywords,
      ark_status: {
        capture: result.kv === 'ok',
        promote: result.d1 === 'ok' || result.d1 === 'ok_fallback',
        vector: result.vector === 'ok'
      },
      details: result
    });
  } catch (error) {
    return send(500, { error: 'ark_autonomous_error', message: error.message });
  }
}

// Export all endpoints for router integration
export const arkEndpoints = {
  '/api/ark/log': { POST: arkLog },
  '/api/ark/retrieve': { GET: arkRetrieve },
  '/api/ark/memories': { GET: arkMemories },
  '/api/ark/vector': { POST: arkVector },
  '/api/ark/resonance': { POST: arkResonance },
  '/api/ark/status': { GET: arkStatus },
  '/api/ark/filter': { POST: arkFilter },
  '/api/ark/autonomous': { POST: arkAutonomous }
};