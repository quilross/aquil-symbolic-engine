// ARK 2.0 Complete Endpoint Handler
// Handles all ARK API requests with full logging and retrieval integration

import { 
    getPhiladelphiaTime,
    generateId, 
    logMetamorphicEvent,
    selectOptimalVoice,
    generateSocraticInquiry,
    detectInterventionNeeds,
    performHealthChecks,
    VOICE_SYSTEM,
    enhanceResponse
} from './core.js';

// Enhanced Session Initialization with Log Merging
export async function handleSessionInit(request, env) {
    try {
        const sessionId = generateId();
        
        // 1. Fetch recent metamorphic logs from D1
        let d1Logs = [];
        if (env.AQUIL_DB) {
            try {
                const d1Result = await env.AQUIL_DB.prepare(`
                    SELECT id, timestamp, kind, detail, voice, session_id, signal_strength, tags
                    FROM metamorphic_logs 
                    ORDER BY timestamp DESC 
                    LIMIT 7
                `).all();
                
                if (d1Result.results) {
                    d1Logs = d1Result.results.map(log => ({
                        ...log,
                        source: 'd1',
                        detail: typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail)
                    }));
                }
            } catch (dbError) {
                // Fallback to event_log table if metamorphic_logs doesn't exist
                try {
                    const fallbackResult = await env.AQUIL_DB.prepare(`
                        SELECT id, ts as timestamp, type as kind, payload as detail, who as voice, 
                               session_id, level as signal_strength, tags
                        FROM event_log 
                        ORDER BY ts DESC 
                        LIMIT 7
                    `).all();
                    
                    if (fallbackResult.results) {
                        d1Logs = fallbackResult.results.map(log => ({
                            ...log,
                            source: 'd1_fallback'
                        }));
                    }
                } catch (fallbackError) {
                    console.warn('D1 log retrieval failed:', fallbackError);
                }
            }
        }

        // 2. Fetch recent commitment/session logs from KV
        let kvLogs = [];
        if (env.AQUIL_MEMORIES) {
            try {
                const kvKeys = await env.AQUIL_MEMORIES.list({ prefix: 'session_' });
                if (kvKeys.keys && kvKeys.keys.length > 0) {
                    const recentKeys = kvKeys.keys.slice(0, 5); // Get 5 most recent
                    const kvPromises = recentKeys.map(async (key) => {
                        try {
                            const value = await env.AQUIL_MEMORIES.get(key.name, 'json');
                            return value ? { ...value, source: 'kv', id: key.name } : null;
                        } catch (error) {
                            return null;
                        }
                    });
                    
                    const kvResults = await Promise.all(kvPromises);
                    kvLogs = kvResults.filter(log => log !== null);
                }
            } catch (kvError) {
                console.warn('KV log retrieval failed:', kvError);
            }
        }

        // 3. Merge and sort all logs by timestamp
        const allLogs = [...d1Logs, ...kvLogs];
        const sortedContinuity = allLogs
            .filter(log => log && log.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10); // Keep top 10 for continuity

        // 4. Generate Mirror voice opening that weaves continuity
        let mirrorOpening;
        if (sortedContinuity.length > 0) {
            const recentThemes = sortedContinuity
                .map(log => log.kind || log.type || 'reflection')
                .slice(0, 3)
                .join(', ');
            
            mirrorOpening = `I sense the threads of our journey continuing... Your recent explorations in ${recentThemes} show the beautiful depth of your self-discovery process. I'm here, grounded in this continuity with you. What's alive in your experience right now?`;
        } else {
            mirrorOpening = "I'm here with you in this moment, ready to witness and support your journey of discovery. This is sacred space for your growth and exploration. What wants attention in your world today?";
        }

        // 5. Log this session initiation immediately
        const sessionInitLog = await logMetamorphicEvent(env, {
            kind: 'session_init',
            detail: {
                continuity_count: sortedContinuity.length,
                d1_logs: d1Logs.length,
                kv_logs: kvLogs.length,
                last_themes: sortedContinuity.slice(0, 3).map(l => l.kind || l.type)
            },
            session_id: sessionId,
            voice: 'mirror',
            signal_strength: 'medium'
        });

        // 6. Perform health checks
        const health = await performHealthChecks(env);

        // 7. Return comprehensive session data
        return new Response(JSON.stringify({
            session_id: sessionId,
            continuity: sortedContinuity,
            mirror_opening: mirrorOpening,
            voice: 'mirror',
            health_status: health,
            timestamp: getPhiladelphiaTime(),
            ark_version: '2.0',
            autonomous_features_active: true,
            logging_active: true,
            retrieval_active: true,
            continuity_preserved: sortedContinuity.length > 0
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Session init error:', error);
        
        // Graceful fallback - still create session
        const fallbackSessionId = generateId();
        await logMetamorphicEvent(env, {
            kind: 'session_init_fallback',
            detail: { error: error.message },
            session_id: fallbackSessionId,
            voice: 'mirror'
        });
        
        return new Response(JSON.stringify({
            session_id: fallbackSessionId,
            continuity: [],
            mirror_opening: "I'm here with you now, ready to begin this journey together. Sometimes we start fresh, and that's perfect too. What's present for you in this moment?",
            voice: 'mirror',
            timestamp: getPhiladelphiaTime(),
            fallback_mode: true,
            message: "Session started in fallback mode - full continuity may be limited"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Voice System Status
export async function handleVoiceStatus(request, env) {
    try {
        // Get voice effectiveness from recent logs
        let voiceAnalytics = {};
        if (env.AQUIL_DB) {
            try {
                const result = await env.AQUIL_DB.prepare(`
                    SELECT voice, COUNT(*) as usage_count
                    FROM metamorphic_logs 
                    WHERE timestamp > datetime('now', '-30 days')
                    AND voice IS NOT NULL
                    GROUP BY voice
                    ORDER BY usage_count DESC
                `).all();
                
                if (result.results) {
                    voiceAnalytics = result.results.reduce((acc, row) => {
                        acc[row.voice] = { usage_count: row.usage_count };
                        return acc;
                    }, {});
                }
            } catch (error) {
                console.warn('Voice analytics query failed:', error);
            }
        }

        return new Response(JSON.stringify({
            voices_available: Object.keys(VOICE_SYSTEM),
            current_voice: 'mirror',
            voice_system: VOICE_SYSTEM,
            analytics: voiceAnalytics,
            voice_adaptation_active: true,
            effectiveness_tracking: true,
            timestamp: getPhiladelphiaTime()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Voice status error:', error);
        return new Response(JSON.stringify({
            error: 'Voice status retrieval failed',
            fallback_voice: 'default',
            voices_available: ['default', 'mirror']
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Discovery Inquiry Generation
export async function handleDiscoveryInquiry(request, env) {
    try {
        const body = await request.json();
        const { context, session_id, topic } = body;
        
        const selectedVoice = selectOptimalVoice(context?.situation || '', context);
        const inquiries = generateSocraticInquiry(topic || 'trust', context);
        
        // Select one inquiry that feels most relevant
        const selectedInquiry = Array.isArray(inquiries) ? 
            inquiries[Math.floor(Math.random() * inquiries.length)] : 
            inquiries;

        await logMetamorphicEvent(env, {
            kind: 'discovery_inquiry',
            detail: {
                topic: topic || 'trust',
                inquiry: selectedInquiry,
                voice_used: selectedVoice,
                context: context
            },
            session_id: session_id,
            voice: selectedVoice,
            signal_strength: 'medium'
        });

        return new Response(JSON.stringify({
            inquiry: selectedInquiry,
            voice_used: selectedVoice,
            inquiry_type: 'socratic',
            preserves_discovery: true,
            follow_up: "Take your time with this question. What emerges when you sit with it?",
            additional_inquiries: Array.isArray(inquiries) ? inquiries.slice(1, 3) : []
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Discovery inquiry error:', error);
        return new Response(JSON.stringify({
            inquiry: "What is your inner wisdom telling you about this situation?",
            voice_used: 'default',
            fallback: true,
            message: "Default inquiry provided - your inner knowing is always available"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Pattern Contradiction Exposure
export async function handleContradictionExposure(request, env) {
    try {
        const body = await request.json();
        const { context, session_id } = body;
        
        // Generate questions that expose tensions without resolving them
        const contradictions = [
            "What tensions do you notice between what you say you want and what you actually choose?",
            "How might you be both seeking and avoiding the same thing?",
            "Where do you notice yourself wanting two opposing outcomes?",
            "What part of you wants to grow and what part wants to stay safe?"
        ];
        
        const selectedContradiction = contradictions[Math.floor(Math.random() * contradictions.length)];

        await logMetamorphicEvent(env, {
            kind: 'contradiction_exposure',
            detail: {
                contradiction: selectedContradiction,
                context: context,
                resolution_withheld: true
            },
            session_id: session_id,
            voice: 'oracle',
            signal_strength: 'strong'
        });

        return new Response(JSON.stringify({
            contradiction: selectedContradiction,
            voice_recommendation: 'oracle',
            resolution_withheld: true,
            invitation: "What emerges when you hold these tensions without needing to resolve them?",
            discovery_preserved: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Contradiction exposure error:', error);
        return new Response(JSON.stringify({
            contradiction: "What opposing forces are active in your situation right now?",
            fallback: true
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Ritual Auto-Suggestion
export async function handleRitualSuggestion(request, env) {
    try {
        const body = await request.json();
        const { context, session_id } = body;
        
        // Detect what type of ritual might be needed
        const userInput = context?.situation || context?.current_state || '';
        const interventions = detectInterventionNeeds(userInput, context);
        
        let suggestedRitual = null;
        
        if (interventions.interventions.stuck) {
            suggestedRitual = {
                name: "Dissolution Breathing",
                duration: "5 minutes",
                purpose: "Release stuck patterns and create new possibilities",
                instructions: [
                    "Take 4 breaths acknowledging the stuck pattern",
                    "Take 4 breaths accepting what is without judgment", 
                    "Take 4 breaths releasing attachment to the pattern",
                    "Take 4 breaths opening to new possibilities"
                ]
            };
        } else if (interventions.interventions.overwhelm) {
            suggestedRitual = {
                name: "Now Map Reset",
                duration: "3 minutes",
                purpose: "Ground in present moment awareness",
                instructions: [
                    "Name 5 things you can see right now",
                    "Name 4 things you can physically touch",
                    "Name 3 things you can hear",
                    "Name 2 things you can smell",
                    "Name 1 thing you can taste"
                ]
            };
        } else if (userInput.includes('creative') || userInput.includes('inspiration')) {
            suggestedRitual = {
                name: "Creative Pulse Reboot",
                duration: "3 minutes",
                purpose: "Activate creative energy and flow",
                instructions: [
                    "Write, draw, or move for 3 minutes without stopping",
                    "Don't edit, judge, or plan - just express",
                    "Focus on movement and flow over content",
                    "Notice what wants to emerge"
                ]
            };
        } else {
            suggestedRitual = {
                name: "Sacred Pause",
                duration: "2 minutes", 
                purpose: "Create space for inner wisdom to emerge",
                instructions: [
                    "Close your eyes and take three deep breaths",
                    "Ask your body: 'What do you need right now?'",
                    "Listen without trying to figure anything out",
                    "Honor whatever emerges"
                ]
            };
        }

        await logMetamorphicEvent(env, {
            kind: 'ritual_suggestion',
            detail: {
                ritual: suggestedRitual,
                interventions_detected: interventions.interventions,
                proactive: true,
                context: context
            },
            session_id: session_id,
            voice: 'strategist',
            signal_strength: interventions.needsSupport ? 'high' : 'medium'
        });

        return new Response(JSON.stringify({
            suggestion: suggestedRitual,
            proactive: true,
            interventions_detected: interventions.needsSupport,
            reasoning: `Based on your situation, this ritual can help ${suggestedRitual.purpose.toLowerCase()}`,
            support_available: interventions.needsSupport,
            recommendations: interventions.recommendations
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Ritual suggestion error:', error);
        return new Response(JSON.stringify({
            suggestion: {
                name: "Gentle Reset", 
                purpose: "Ground and center",
                instructions: ["Take three slow, deep breaths", "Feel your feet on the ground", "Ask: 'What do I need right now?'"]
            },
            fallback: true
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// System Health Check
export async function handleHealthCheck(request, env) {
    try {
        const health = await performHealthChecks(env);
        
        return new Response(JSON.stringify({
            ...health,
            ark_version: '2.0',
            logging_functional: health.logging_system,
            retrieval_functional: health.database || health.kv_storage,
            voice_system_active: health.voice_system,
            autonomous_features: health.ark_core,
            philadelphia_time: getPhiladelphiaTime()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Health check error:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Health check failed',
            timestamp: getPhiladelphiaTime(),
            fallback_active: true
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Enhanced Logging Endpoint
export async function handleLog(request, env) {
    try {
        const body = await request.json();
        const { type, who, level, session_id, tags, idx1, idx2, payload } = body;
        
        const logId = await logMetamorphicEvent(env, {
            kind: type,
            detail: payload,
            voice: who,
            session_id: session_id,
            signal_strength: level || 'medium',
            tags: tags,
            idx1: idx1,
            idx2: idx2
        });
        
        return new Response(JSON.stringify({
            status: 'success',
            id: logId,
            timestamp: getPhiladelphiaTime(),
            logged_to: 'metamorphic_logs'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Logging error:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Logging failed',
            fallback: 'Event logged locally'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Main Ark Endpoint Router
export async function handleArkEndpoints(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    try {
        // Session initialization (GET or POST)
        if (path === '/api/session-init') {
            return await handleSessionInit(request, env);
        }
        
        // Voice system status
        if (path === '/api/voice/system-status' && method === 'GET') {
            return await handleVoiceStatus(request, env);
        }
        
        // Discovery inquiry generation
        if (path === '/api/discovery/generate-inquiry' && method === 'POST') {
            return await handleDiscoveryInquiry(request, env);
        }
        
        // Pattern contradiction exposure
        if (path === '/api/patterns/expose-contradictions' && method === 'POST') {
            return await handleContradictionExposure(request, env);
        }
        
        // Ritual auto-suggestion
        if (path === '/api/ritual/auto-suggest' && method === 'POST') {
            return await handleRitualSuggestion(request, env);
        }
        
        // System health check
        if (path === '/api/system/health-check' && method === 'GET') {
            return await handleHealthCheck(request, env);
        }
        
        // Enhanced logging
        if (path === '/api/log' && method === 'POST') {
            return await handleLog(request, env);
        }
        
        return null; // Not an Ark endpoint
    } catch (error) {
        console.error('Ark endpoint error:', error);
        return new Response(JSON.stringify({
            error: 'Ark system error',
            message: 'System is self-correcting. Your journey continues.',
            timestamp: getPhiladelphiaTime()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default {
    handleSessionInit,
    handleVoiceStatus,
    handleDiscoveryInquiry,
    handleContradictionExposure,
    handleRitualSuggestion,
    handleHealthCheck,
    handleLog,
    handleArkEndpoints
};
