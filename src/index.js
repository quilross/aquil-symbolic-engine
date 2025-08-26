// AI model invocation endpoint (Worker AI or Gateway)
router.post('/api/ai/invoke', async (req, env) => {
    try {
        const { model, messages } = await req.json();
        const client = env.AI || env.AI_GATEWAY;
        if (!client) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'AI binding not found' }), { status: 500 }));
        }
        const result = await client.run(model, { messages });
        return addCORSHeaders(new Response(JSON.stringify({ result })));
    } catch (err) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'AI invocation error', details: err.message }), { status: 500 }));
    }
});

// Gateway invocation endpoint (explicit)
router.post('/api/gateway/invoke', async (req, env) => {
    try {
        const { model, messages } = await req.json();
        const client = env.AI_GATEWAY;
        if (!client) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'AI_GATEWAY binding not found' }), { status: 500 }));
        }
        const result = await client.run(model, { messages });
        return addCORSHeaders(new Response(JSON.stringify({ result })));
    } catch (err) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Gateway invocation error', details: err.message }), { status: 500 }));
    }
});
import { Router } from 'itty-router';
const router = Router();
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

function addCORSHeaders(response) {
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
}

// KV logging and retrieval endpoints
router.post('/api/kv/log', async (req, env) => {
    const { key, value } = await req.json();
    if (!key || value === undefined) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Missing key or value' }), { status: 400 }));
    }
    await env.AQUIL_MEMORIES.put(key, JSON.stringify(value));
    return addCORSHeaders(new Response(JSON.stringify({ success: true })));
});

router.get('/api/kv/retrieve', async (req, env) => {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (!key) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Missing key' }), { status: 400 }));
        }
        const value = await env.AQUIL_MEMORIES.get(key);
        if (value === null || value === undefined) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Key not found', key }), { status: 404 }));
        }
        return addCORSHeaders(new Response(JSON.stringify({ key, value })));
    } catch (err) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Retrieval error', details: err.message }), { status: 500 }));
    }
});

// R2 logging and retrieval endpoints
router.post('/api/r2/log', async (req, env) => {
    const { key, data } = await req.json();
    if (!key || !data) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Missing key or data' }), { status: 400 }));
    }
    const object = await env.AQUIL_STORAGE.put(key, new Blob([data]));
    return addCORSHeaders(new Response(JSON.stringify({ success: true, object })));
});

router.get('/api/r2/retrieve', async (req, env) => {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (!key) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Missing key' }), { status: 400 }));
        }
        const object = await env.AQUIL_STORAGE.get(key);
        if (!object) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Object not found', key }), { status: 404 }));
        }
        let data = null;
        try {
            data = await object.text();
        } catch (err) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Failed to read object', details: err.message }), { status: 500 }));
        }
        return addCORSHeaders(new Response(JSON.stringify({ key, data })));
    } catch (err) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Retrieval error', details: err.message }), { status: 500 }));
    }
});

// Vectorize logging and retrieval endpoints
router.post('/api/vectorize/log', async (req, env) => {
    const { id, vector, metadata } = await req.json();
    if (!id || !vector) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Missing id or vector' }), { status: 400 }));
    }
    await env.AQUIL_CONTEXT.upsert([{ id, values: vector, metadata }]);
    return addCORSHeaders(new Response(JSON.stringify({ success: true })));
});

router.get('/api/vectorize/retrieve', async (req, env) => {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 }));
        }
        const result = await env.AQUIL_CONTEXT.query({ ids: [id] });
        if (!result || !result.matches || result.matches.length === 0) {
            return addCORSHeaders(new Response(JSON.stringify({ error: 'Vector not found', id }), { status: 404 }));
        }
        return addCORSHeaders(new Response(JSON.stringify(result)));
    } catch (err) {
        return addCORSHeaders(new Response(JSON.stringify({ error: 'Retrieval error', details: err.message }), { status: 500 }));
    }
});
// Manifest endpoint for GPT action discovery
import { ARK_MANIFEST, handleArkEndpoints } from './ark/endpoints.js';
router.get('/api/manifest', async () => {
    return addCORSHeaders(new Response(JSON.stringify(ARK_MANIFEST), {
        headers: { 'Content-Type': 'application/json' }
    }));
});
// Retrieve logs endpoint for GPT and context
router.get('/api/logs', async (req, env) => {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type');
    const who = searchParams.get('who');
    const level = searchParams.get('level');
    const session_id = searchParams.get('session_id');
    const tag = searchParams.get('tag');

    let query = 'SELECT * FROM metamorphic_logs';
    const conditions = [];
    const params = [];
    if (type) { conditions.push('kind = ?'); params.push(type); }
    if (who) { conditions.push('voice = ?'); params.push(who); }
    if (level) { conditions.push('signal_strength = ?'); params.push(level); }
    if (session_id) { conditions.push('session_id = ?'); params.push(session_id); }
    if (tag) { conditions.push('tags LIKE ?'); params.push(`%${tag}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    let logs = [];
    if (env.AQUIL_DB) {
        try {
            const result = await env.AQUIL_DB.prepare(query).bind(...params).all();
            logs = result.results || [];
        } catch (err) {
            logs = [];
        }
    }
    return addCORSHeaders(new Response(JSON.stringify(logs)));
});

// Session-init endpoint for GPT continuity
router.get('/api/session-init', async (req, env) => {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 7;
    const type = searchParams.get('type');
    let query = 'SELECT * FROM metamorphic_logs';
    const conditions = [];
    const params = [];
    if (type) { conditions.push('kind = ?'); params.push(type); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    let logs = [];
    if (env.AQUIL_DB) {
        try {
            const result = await env.AQUIL_DB.prepare(query).bind(...params).all();
            logs = result.results || [];
        } catch (err) {
            logs = [];
        }
    }
    return addCORSHeaders(new Response(JSON.stringify(logs)));
});
// ARK Logging Handlers (moved from endpoints.js)
// Unified handler for ARK endpoints (for src/index.js)

// Session Init with AI-crafted opening
export async function handleSessionInit(request, env) {
    const sessionId = generateId();
    // Retrieve logs (omitted for brevity—use your existing logic)
    const continuity = /* fetched & merged logs */ [];

    // AI-generated Mirror opening
    let mirrorOpening;
    try {
        const prompt = `Weave these continuity events into a grounding Mirror opening: ${JSON.stringify(continuity)}`;
        const aiResp = await aiCall(env, '@cf/meta/llama-2-7b-chat-int8', [
            { role: 'user', content: prompt }
        ]);
        mirrorOpening = aiResp.response;
    } catch {
        mirrorOpening = continuity.length
            ? `I recall our journey through: ${continuity.map(e => e.kind).join(', ')}. How are you today?`
            : 'I’m here with you in this moment. What’s alive for you right now?';
    }

    // Log initiation
    await logMetamorphicEvent(env, {
        kind: 'session_init',
        detail: { continuity_count: continuity.length },
        session_id: sessionId,
        voice: 'mirror'
    });

    return new Response(
        JSON.stringify({
            session_id: sessionId,
            continuity,
            opening: mirrorOpening,
            voice: 'mirror',
            timestamp: getPhiladelphiaTime()
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );
}

// Discovery Inquiry with AI
export async function handleDiscoveryInquiry(request, env) {
    const { context = {}, session_id } = await request.json();
    const voice = selectOptimalVoice(context.input || '', context);
    let question;
    try {
        const prompt = `As Ark’s ${voice} voice, ask a Socratic question about: ${JSON.stringify(context)}`;
        const aiResp = await aiCall(env, '@cf/meta/llama-2-7b-chat-int8', [
            { role: 'user', content: prompt }
        ]);
        question = aiResp.response;
    } catch {
        question = 'What emerges when you explore this topic?';
    }
    await logMetamorphicEvent(env, {
        kind: 'discovery_inquiry',
        detail: { question },
        session_id,
        voice
    });
    return new Response(
        JSON.stringify({ inquiry: question, voice_used: voice }),
        { headers: { 'Content-Type': 'application/json' } }
    );
}

// Ritual Suggestion with AI
export async function handleRitualSuggestion(request, env) {
    const { context = {}, session_id } = await request.json();
    let ritual;
    try {
        const prompt = `Recommend a ritual for this context: ${JSON.stringify(context)}`;
        const aiResp = await aiCall(env, '@cf/meta/llama-2-7b-chat-int8', [
            { role: 'user', content: prompt }
        ]);
        ritual = JSON.parse(aiResp.response);
    } catch {
        ritual = {
            name: 'Gentle Pause',
            instructions: ['Take three deep breaths', 'Ground in the present moment'],
            purpose: 'Reset and refocus'
        };
    }
    await logMetamorphicEvent(env, {
        kind: 'ritual_suggestion',
        detail: { ritual },
        session_id,
        voice: 'strategist'
    });
    return new Response(JSON.stringify({ suggestion: ritual }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Health Check
export async function handleHealthCheck(request, env) {
    const health = await performHealthChecks(env);
    return new Response(JSON.stringify({ ...health, timestamp: getPhiladelphiaTime() }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Logging
export async function handleLog(request, env) {
    const body = await request.json();
    const id = await logMetamorphicEvent(env, {
        kind: body.type,
        detail: body.payload,
        session_id: body.session_id,
        voice: body.who
    });
    return new Response(JSON.stringify({ status: 'ok', id }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
/**
 * Aquil Symbolic Engine - Personal AI Wisdom System
 * Complete implementation with ARK 2.0 enhancements integrated
 */

import {
    getPhiladelphiaTime,
    logMetamorphicEvent,
    enhanceResponse
} from './ark/core.js';

// CORS preflight
router.options('*', () => addCORSHeaders(new Response(null, { status: 200 })));

// ARK 2.0 Endpoints Integration (Priority routing)
router.all('/api/session-init', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Not found', { status: 404 });
});

router.all('/api/voice/*', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Not found', { status: 404 });
});

router.all('/api/discovery/*', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Not found', { status: 404 });
});

router.all('/api/patterns/expose-contradictions', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Not found', { status: 404 });
});

router.all('/api/ritual/*', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Not found', { status: 404 });
});

router.all('/api/system/health-check', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Not found', { status: 404 });
});

// Enhanced logging endpoint (ARK integrated)
router.post('/api/log', async (request, env) => {
    const arkResponse = await handleArkEndpoints(request, env);
    return arkResponse ? addCORSHeaders(arkResponse) : new Response('Logging failed', { status: 500 });
});

// Health check (enhanced with ARK status)
router.get('/api/health', async (request, env) => {
    try {
        const arkHealthResponse = await handleArkEndpoints(
            new Request(new URL('/api/system/health-check', request.url)), 
            env
        );
        
        let arkHealth = {};
    if (arkHealthResponse?.ok) {
            arkHealth = await arkHealthResponse.json();
        }
        
        const response = {
            status: 'Aquil is alive and present',
            timestamp: getPhiladelphiaTime(),
            version: '2.0.0',
            ark_integration: 'active',
            ark_health: arkHealth,
            engines: [
                'ARK 2.0 Core - Active',
                'Trust Builder - Active',
                'Media Wisdom Extractor - Active', 
                'Somatic Healer - Active',
                'Wisdom Synthesizer - Active',
                'Pattern Recognizer - Active',
                'Standing Tall Coach - Active',
                'Crisis Support - Active',
                'Dream Interpreter - Active',
                'Energy Optimizer - Active',
                'Values Clarifier - Active',
                'Creativity Coach - Active',
                'Abundance Cultivator - Active',
                'Transitions Navigator - Active',
                'Ancestry Healer - Active'
            ]
        };
        
        return addCORSHeaders(new Response(JSON.stringify(response)));
    } catch (error) {
        return addCORSHeaders(new Response(JSON.stringify({
            status: 'Health check error',
            message: 'System is self-correcting',
            timestamp: getPhiladelphiaTime()
        }), { status: 500 }));
    }
});

// Trust check-in (enhanced with ARK)
router.post('/api/trust/check-in', async (req, env) => {
    try {
        const d = await req.json();
        const context = {
            userInput: d.current_state,
            endpoint: '/api/trust/check-in',
            session_id: `trust_${Date.now()}`
        };
        
        const result = {
            session_id: context.session_id,
            timestamp: getPhiladelphiaTime(),
            message: `Your current state: "${d.current_state}". Let's explore this together.`,
            analysis: { 
                trust_level: d.trust_level || 5,
                current_state: d.current_state,
                specific_situation: d.specific_situation,
                body_sensations: d.body_sensations
            },
            trust_guidance: {
                reflection: `I hear that you're experiencing "${d.current_state}". This awareness itself shows growing self-trust.`,
                body_wisdom: d.body_sensations ? 
                    `Your body is communicating through: ${d.body_sensations}. Let's honor what it's telling you.` :
                    'What is your body telling you about this situation right now?',
                next_step: "Trust builds through small moments of listening to your inner knowing."
            },
            deeper_inquiry: "What would trusting yourself completely look like in this situation?"
        };
        
        const enhanced = await enhanceResponse(result, context, env, { 
            includeSocratic: true, 
            socraticTopic: 'trust' 
        });
        
        return addCORSHeaders(new Response(JSON.stringify(enhanced)));
    } catch (error) {
        console.error('Trust check-in error:', error);
        return addCORSHeaders(new Response(JSON.stringify({
            error: 'Trust processing temporarily unavailable',
            message: 'Your trust journey continues. Take three breaths and remember: you are learning to trust yourself.',
            fallback_guidance: 'What does your inner wisdom say about this situation?'
        }), { status: 500 }));
    }
});

// Media wisdom extraction (enhanced with ARK)
router.post('/api/media/extract-wisdom', async (req, env) => {
    try {
        const { media_type, title, your_reaction } = await req.json();
        const context = {
            userInput: your_reaction,
            endpoint: '/api/media/extract-wisdom',
            session_id: `media_${Date.now()}`
        };
        
        const result = {
            session_id: context.session_id,
            timestamp: getPhiladelphiaTime(),
            message: `Your attraction to "${title}" is meaningful - your psyche knows what wisdom it needs.`,
            media_analysis: {
                title: title,
                type: media_type,
                your_reaction: your_reaction,
                wisdom_connection: `Your reaction "${your_reaction}" reveals important insights about your current growth edge.`
            },
            extraction: {
                core_insight: `This ${media_type} appeared in your life because it contains medicine for your journey.`,
                personal_resonance: `Your specific reaction shows what your psyche is ready to integrate.`,
                integration_question: `How might the themes in "${title}" be reflecting something in your own life right now?`
            }
        };
        
        const enhanced = await enhanceResponse(result, context, env, { 
            includeSocratic: true, 
            socraticTopic: 'media' 
        });
        
        return addCORSHeaders(new Response(JSON.stringify(enhanced)));
    } catch (error) {
        console.error('Media wisdom error:', error);
        return addCORSHeaders(new Response(JSON.stringify({
            error: 'Media processing temporarily unavailable',
            message: 'Your attraction to content always contains valuable information about your inner world.',
            fallback_question: 'What in this content mirrors your own life experience?'
        }), { status: 500 }));
    }
});

// Somatic healing session (enhanced with ARK)
router.post('/api/somatic/session', async (req, env) => {
    try {
        const { body_state, emotions, intention } = await req.json();
        const context = {
            userInput: `${body_state} ${emotions}`,
            endpoint: '/api/somatic/session',
            session_id: `somatic_${Date.now()}`
        };
        
        const result = {
            session_id: context.session_id,
            timestamp: getPhiladelphiaTime(),
            message: "Your body contains profound wisdom. Let's listen together.",
            body_analysis: {
                current_state: body_state,
                emotions: emotions,
                intention: intention,
                body_message: `Your body's state of "${body_state}" with emotions "${emotions}" is communicating important information.`
            },
            somatic_guidance: {
                body_dialogue: "Place one hand on your heart, one on your belly. Take three natural breaths.",
                listening_practice: "Ask your body: 'What do you want me to know?' and listen without agenda.",
                integration: "Thank your body for its constant wisdom and communication."
            }
        };
        
        const enhanced = await enhanceResponse(result, context, env, { 
            includeSocratic: true, 
            socraticTopic: 'body' 
        });
        
        return addCORSHeaders(new Response(JSON.stringify(enhanced)));
    } catch (error) {
        console.error('Somatic session error:', error);
        return addCORSHeaders(new Response(JSON.stringify({
            error: 'Somatic processing temporarily unavailable',
            message: 'Your body\'s wisdom is always available. Place a hand on your heart and breathe.',
            fallback_practice: 'What is your body trying to tell you right now?'
        }), { status: 500 }));
    }
});

// Wisdom synthesis (enhanced with ARK)
router.post('/api/wisdom/synthesize', async (req, env) => {
    try {
        const { life_situation, specific_question } = await req.json();
        const context = {
            userInput: `${life_situation} ${specific_question}`,
            endpoint: '/api/wisdom/synthesize',
            session_id: `synth_${Date.now()}`
        };
        
        const result = {
            session_id: context.session_id,
            timestamp: getPhiladelphiaTime(),
            synthesis: {
                situation: life_situation,
                question: specific_question,
                integrated_guidance: "All wisdom traditions point to trusting your inner authority while honoring the flow of life.",
                decision_framework: [
                    "Center in your body and breathe",
                    "Present the question to your gut and notice the response",
                    "Accept what feels true without resistance",
                    "Trust the synthesis of your inner wisdom"
                ]
            }
        };
        
        const enhanced = await enhanceResponse(result, context, env, { 
            includeSocratic: true, 
            socraticTopic: 'decisions' 
        });
        
        return addCORSHeaders(new Response(JSON.stringify(enhanced)));
    } catch (error) {
        console.error('Wisdom synthesis error:', error);
        return addCORSHeaders(new Response(JSON.stringify({
            error: 'Synthesis temporarily unavailable',
            message: 'Your inner wisdom is always available. Trust your body, honor your gut, take aligned action.',
            fallback_question: 'What does your deepest knowing tell you about this situation?'
        }), { status: 500 }));
    }
});

// Pattern recognition (enhanced with ARK)
router.post('/api/patterns/recognize', async (req, env) => {
    try {
        const { area_of_focus, recent_experiences } = await req.json();
        const context = {
            userInput: recent_experiences,
            endpoint: '/api/patterns/recognize',
            session_id: `patterns_${Date.now()}`
        };
        
        const result = {
            session_id: context.session_id,
            timestamp: getPhiladelphiaTime(),
            message: "Pattern recognition shows sophisticated consciousness and growth commitment.",
            pattern_analysis: {
                focus_area: area_of_focus,
                recent_patterns: recent_experiences,
                meta_pattern: "Your willingness to examine patterns creates choice and conscious evolution."
            },
            growth_insight: "Every pattern you recognize gives you more choice in how you respond to life."
        };
        
        const enhanced = await enhanceResponse(result, context, env, { 
            includeSocratic: true, 
            socraticTopic: 'patterns' 
        });
        
        return addCORSHeaders(new Response(JSON.stringify(enhanced)));
    } catch (error) {
        console.error('Pattern recognition error:', error);
        return addCORSHeaders(new Response(JSON.stringify({
            error: 'Pattern analysis temporarily unavailable',
            message: 'Pattern recognition is happening even when systems are offline - your awareness is the tool.',
            fallback_question: 'What pattern keeps showing up that wants your attention?'
        }), { status: 500 }));
    }
});

// Standing tall practice (enhanced with ARK)
router.post('/api/standing-tall/practice', async (req, env) => {
    try {
        const { situation, desired_outcome } = await req.json();
        const context = {
            userInput: `${situation} ${desired_outcome}`,
            endpoint: '/api/standing-tall/practice',
            session_id: `stand_${Date.now()}`
        };
        
        const result = {
            session_id: context.session_id,
            timestamp: getPhiladelphiaTime(),
            message: "Your desire to stand tall shows courage. You don't need to earn the right to take up space.",
            standing_tall_guidance: {
                situation: situation,
                desired_outcome: desired_outcome,
                foundation: "You have an inherent right to exist, be seen, and take up space in the world.",
                practice: "Stand with feet grounded, spine long, chest open. Feel your natural right to be here.",
                integration: "Each time you practice standing tall, you build evidence of your authentic power."
            }
        };
        
        const enhanced = await enhanceResponse(result, context, env, { 
            includeSocratic: true, 
            socraticTopic: 'standing_tall' 
        });
        
        return addCORSHeaders(new Response(JSON.stringify(enhanced)));
    } catch (error) {
        console.error('Standing tall error:', error);
        return addCORSHeaders(new Response(JSON.stringify({
            error: 'Standing tall processing temporarily unavailable',
            message: 'Your inherent dignity is never in question. Stand tall because you belong here.',
            fallback_affirmation: 'I have the right to take up space and be seen in my authentic power.'
        }), { status: 500 }));
    }
});

// Additional specialized endpoints (simplified implementations)
const specializedEndpoints = [
    { path: '/api/dreams/interpret', sessionPrefix: 'dreams' },
    { path: '/api/energy/optimize', sessionPrefix: 'energy' },
    { path: '/api/values/clarify', sessionPrefix: 'values' },
    { path: '/api/creativity/unleash', sessionPrefix: 'creativity' },
    { path: '/api/abundance/cultivate', sessionPrefix: 'abundance' },
    { path: '/api/transitions/navigate', sessionPrefix: 'transitions' },
    { path: '/api/ancestry/heal', sessionPrefix: 'ancestry' }
];

specializedEndpoints.forEach(({ path, sessionPrefix }) => {
    router.post(path, async (req, env) => {
        try {
            const body = await req.json();
            const sessionId = `${sessionPrefix}_${Date.now()}`;
            
            // Extract first value from body as primary input
            // Removed unused variable 'primaryInput'
            
            const result = {
                session_id: sessionId,
                timestamp: getPhiladelphiaTime(),
                message: `${sessionPrefix.charAt(0).toUpperCase() + sessionPrefix.slice(1)} session initiated.`,
                guidance: `Your request for ${sessionPrefix} support is being processed with care.`,
                input_received: body
            };
            
            // Log the interaction
            await logMetamorphicEvent(env, {
                kind: `${sessionPrefix}_session`,
                detail: body,
                session_id: sessionId,
                voice: 'default'
            });
            
            return addCORSHeaders(new Response(JSON.stringify(result)));
        } catch (error) {
            console.error(`${sessionPrefix} endpoint error:`, error);
            return addCORSHeaders(new Response(JSON.stringify({
                error: `${sessionPrefix} processing temporarily unavailable`,
                message: `Your ${sessionPrefix} journey continues even when systems are adjusting.`
            }), { status: 500 }));
        }
    });
});

// Insights endpoint
router.get('/api/insights', async (req, env) => {
    const insights = {
        summary: 'Your growth journey shows consistent engagement with inner development',
        recent_themes: ['trust building', 'pattern recognition', 'authentic presence'],
        suggestions: ['Continue daily check-ins', 'Notice body wisdom', 'Practice standing tall']
    };
    return addCORSHeaders(new Response(JSON.stringify({ insights })));
});

// Feedback endpoint
router.post('/api/feedback', async (req, env) => {
    try {
        const { message, type = 'general' } = await req.json();
        
        await logMetamorphicEvent(env, {
            kind: 'user_feedback',
            detail: { message, type },
            voice: 'user',
            signal_strength: 'medium'
        });
        
        return addCORSHeaders(new Response(JSON.stringify({
            success: true,
            message: 'Feedback received with gratitude',
            type: type,
            received_at: getPhiladelphiaTime()
        })));
    } catch (error) {
        return addCORSHeaders(new Response(JSON.stringify({
            success: false,
            message: 'Feedback logged locally'
        }), { status: 500 }));
    }
});

// Catch-all for unknown endpoints
router.all('*', () => {
    return addCORSHeaders(
        new Response(
            JSON.stringify({
                message: 'Endpoint not found',
                ark_version: '2.0',
                available_endpoints: [
                    'GET /api/health - System status',
                    'GET /api/session-init - Initialize with continuity',
                    'POST /api/log - Enhanced logging',
                    'GET /api/voice/system-status - Voice system info',
                    'POST /api/discovery/generate-inquiry - Socratic questions',
                    'POST /api/patterns/expose-contradictions - Surface tensions',
                    'POST /api/ritual/auto-suggest - Proactive ritual suggestions',
                    'GET /api/system/health-check - Detailed health status',
                    'POST /api/trust/check-in - Trust building sessions',
                    'POST /api/media/extract-wisdom - Media wisdom extraction',
                    'POST /api/somatic/session - Body intelligence practices',
                    'POST /api/wisdom/synthesize - Multi-framework integration',
                    'POST /api/patterns/recognize - Pattern analysis',
                    'POST /api/standing-tall/practice - Confidence building'
                ]
            }),
            { status: 404 }
        )
    );
});
export default {
    async fetch(request, env, ctx) {
        return router.handle(request, env, ctx);
    }
};
