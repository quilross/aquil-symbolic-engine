/**
 * Aquil Symbolic Engine - Personal AI Wisdom System
 * Main entry point for trust building and standing tall
 */

import { Router } from 'itty-router';

const router = Router();

// Simple health check endpoint
router.get('/api/health', async () => {
  return new Response(JSON.stringify({ 
    status: 'Aquil is alive and present',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    message: 'Your personal AI wisdom system is ready to support your journey of standing tall',
    endpoints: [
      '/api/trust/check-in - Trust building sessions',
      '/api/media/extract-wisdom - Transform content into growth', 
      '/api/somatic/session - Body wisdom practices',
      '/api/wisdom/synthesize - Multi-framework guidance',
      '/api/patterns/recognize - Growth pattern analysis',
      '/api/standing-tall/practice - Confidence building',
      '/api/wisdom/daily-synthesis - Wisdom compilation'
    ]
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// Welcome page for root path
router.get('/', async () => {
  return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>Aquil Symbolic Engine</title>
    <style>
        body { 
            font-family: -apple-system, system-ui; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        .header { text-align: center; margin-bottom: 40px; }
        .emoji { font-size: 3em; margin-bottom: 20px; }
        .subtitle { color: #666; font-style: italic; font-size: 1.2em; }
        .section { margin: 30px 0; }
        .status-item { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0; 
            border-left: 4px solid #667eea;
        }
        .cta {
            background: #667eea;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-top: 30px;
        }
        code { 
            background: #f1f3f4; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🌱</div>
            <h1>Aquil Symbolic Engine</h1>
            <p class="subtitle">Your Personal AI Wisdom Builder & Trust Reinforcement System</p>
            <p><em>"Standing tall in the world, rooted in internal trust"</em></p>
        </div>
        
        <div class="section">
            <h2>System Status</h2>
            <div class="status-item">✅ <strong>Aquil Core:</strong> Live and ready to support your journey</div>
            <div class="status-item">🏠 <strong>Domain:</strong> Running on your personal domain at <code>signal-q.me</code></div>
            <div class="status-item">🤖 <strong>Integration:</strong> Ready for ChatGPT GPT Actions connection</div>
            <div class="status-item">🔒 <strong>Privacy:</strong> Complete data sovereignty - everything runs in YOUR accounts</div>
        </div>
        
        <div class="section">
            <h2>Available Wisdom Services</h2>
            <div class="status-item"><strong>🎯 Trust Check-ins:</strong> Build internal trust through guided reflection</div>
            <div class="status-item"><strong>📺 Media Wisdom:</strong> Extract growth insights from your content consumption</div>
            <div class="status-item"><strong>🧘 Somatic Sessions:</strong> Connect with your body's intelligence</div>
            <div class="status-item"><strong>🔮 Wisdom Synthesis:</strong> Integrated guidance from HD, Gene Keys, astrology</div>
            <div class="status-item"><strong>📊 Pattern Recognition:</strong> Identify growth patterns and evolution</div>
            <div class="status-item"><strong>💪 Standing Tall Practice:</strong> Confidence and empowerment coaching</div>
        </div>
        
        <div class="cta">
            <h2>Next Steps</h2>
            <p>1. Create your custom GPT in ChatGPT Plus</p>
            <p>2. Import the GPT Actions schema</p>
            <p>3. Start with: <em>"Aquil, let's do a trust check-in"</em></p>
            <p><strong>Your journey of internal trust and standing tall begins now 🚀</strong></p>
        </div>
    </div>
</body>
</html>
  `, {
    headers: { 
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

// Placeholder endpoints (will be implemented in later phases)
router.post('/api/trust/check-in', async (request) => {
  return new Response(JSON.stringify({
    message: "Trust building system ready - full implementation coming in Phase 3: CloudFlare",
    status: "placeholder"
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

router.post('/api/media/extract-wisdom', async (request) => {
  return new Response(JSON.stringify({
    message: "Media wisdom extraction ready - full implementation coming in Phase 3: CloudFlare",
    status: "placeholder"
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

// Handle CORS preflight requests
router.options('*', () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// Catch all - helpful message
router.all('*', () => new Response(JSON.stringify({
  message: 'Aquil endpoint not found',
  available_paths: [
    '/ - Welcome page',
    '/api/health - System status',
    '/api/trust/check-in - Trust building (coming in Phase 3)',
    '/api/media/extract-wisdom - Media wisdom (coming in Phase 3)'
  ]
}), { 
  status: 404,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
}));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx).catch(err => {
      console.error('Aquil system error:', err);
      return new Response(JSON.stringify({ 
        error: 'Internal wisdom system error',
        message: 'Aquil needs a moment to recenter. Please try again.',
        timestamp: new Date().toISOString()
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    });
  }
};
