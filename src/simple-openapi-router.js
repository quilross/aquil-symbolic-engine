/**
 * Simple OpenAPI Router for serving schema and handling journal endpoints
 * Uses manual schema generation to avoid dependency issues
 */

import { Router } from 'itty-router';
import { generateOpenAPIYAML, generateOpenAPIJSON } from './openapi-schema.js';
import { writeLog } from './actions/logging.js';
import { arkLog, arkRetrieve } from './ark/ark-endpoints.js';
import { handleSessionInit, handleHealthCheck } from './ark/endpoints.js';
import { corsHeaders } from './utils/cors.js';

// Create a simple router
const openApiRouter = Router();

// Simple logging function for ChatGPT actions
async function logChatGPTAction(env, operationId, data, result, error = null) {
  try {
    const payload = {
      action: operationId,
      input: data,
      result: error ? { error: error.message } : { success: true, processed: !!result },
    };
    
    await writeLog(env, {
      type: error ? `${operationId}_error` : operationId,
      payload,
      session_id: data?.session_id || crypto.randomUUID(),
      who: 'system',
      level: error ? 'error' : 'info',
    });
  } catch (logError) {
    console.warn('Failed to log ChatGPT action:', logError);
  }
}

// Add CORS headers to response
function addCORSToResponse(response) {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      ...corsHeaders,
    },
  });
  return newResponse;
}

// OpenAPI schema endpoints
openApiRouter.get('/openapi.yaml', async (req, env) => {
  try {
    const yaml = generateOpenAPIYAML();
    return new Response(yaml, {
      headers: {
        'Content-Type': 'text/yaml',
        'Content-Disposition': 'inline; filename="openapi.yaml"',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(`# Error generating OpenAPI YAML: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/yaml', ...corsHeaders },
    });
  }
});

openApiRouter.get('/openapi.json', async (req, env) => {
  try {
    const json = generateOpenAPIJSON();
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Error generating OpenAPI JSON: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Simple documentation page
openApiRouter.get('/openapi', async (req, env) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Aquil Symbolic Engine API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    <style>
        body { margin: 0; padding: 0; }
        #swagger-ui { max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: './openapi.json',
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
            ],
            layout: "BaseLayout"
        });
    </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      ...corsHeaders,
    },
  });
});

// API endpoints that were in the original OpenAPI router
openApiRouter.post('/api/log', async (req, env) => {
  try {
    const result = await arkLog(req, env);
    const body = await req.clone().json().catch(() => ({}));
    const data = await result.clone().json().catch(() => ({}));
    
    await logChatGPTAction(env, 'logEntry', body, data);
    
    return addCORSToResponse(result);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/logs', async (req, env) => {
  try {
    const result = await arkRetrieve(req, env);
    const data = await result.clone().json().catch(() => ({}));
    
    await logChatGPTAction(env, 'retrieveLogs', { url: req.url }, data);
    
    return addCORSToResponse(result);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/session-init', async (req, env) => {
  try {
    const result = await handleSessionInit(req, env);
    const resultData = await result.clone().json().catch(() => ({}));
    
    await logChatGPTAction(env, 'sessionInit', {}, resultData);
    
    return addCORSToResponse(result);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/system/health-check', async (req, env) => {
  try {
    const result = await handleHealthCheck(req, env);
    const data = await result.clone().json().catch(() => ({}));
    
    await logChatGPTAction(env, 'healthCheck', {}, data);
    
    return addCORSToResponse(result);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Journal endpoints
openApiRouter.post('/api/journal/entries', async (req, env) => {
  try {
    const body = await req.json();
    
    // Validate the journal entry
    if (!body.id || !body.type || !body.timestamp || !body.storedIn) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing required fields: id, type, timestamp, storedIn'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    let result;
    if (body.storedIn === 'KV') {
      const { addEntry } = await import('./journalService.js');
      result = await addEntry(env, body);
    } else if (body.storedIn === 'D1') {
      // For D1, we'd use the existing D1 insert logic
      const { exec } = await import('./actions/d1.js');
      await exec(env, 'insertLog', [
        body.id, body.type, body.detail || null, body.timestamp, 'D1'
      ]);
      result = { success: true, id: body.id };
    }
    
    const response = {
      ok: result.success,
      id: result.id,
      key: result.key,
    };
    
    await logChatGPTAction(env, 'createJournalEntry', body, response);
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

openApiRouter.get('/api/journal/entries', async (req, env) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const type = url.searchParams.get('type');
    
    // Use existing retrieve logic - this would be adapted from the index.js handleRetrieve function
    const result = {
      ok: true,
      items: [], // Would be populated with actual data
    };
    
    await logChatGPTAction(env, 'getJournalEntries', { limit, type }, result);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Handle preflight requests
openApiRouter.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});

// Export the router
export default openApiRouter;