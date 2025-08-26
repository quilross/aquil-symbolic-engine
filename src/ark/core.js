// Philadelphia timezone helper
export function getPhiladelphiaTime(date = new Date()) {
    return date.toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export function generateId() {
    return `ark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const VOICE_SYSTEM = {
    Mirror: {
        id: 'mirror',
        purpose: "Grounding, emotional continuity",
        style: { tone: "gentle, reflective" },
        triggers: ["emotional", "vulnerable", "processing", "feeling", "scared", "overwhelmed"]
    },
    Oracle: {
        id: 'oracle',
        purpose: "Symbolic, archetypal pattern insight",
        style: { tone: "symbolic, archetypal" },
        triggers: ["patterns", "deeper meaning", "wisdom", "archetypal", "symbolic", "dreams"]
    },
    Scientist: {
        id: 'scientist',
        purpose: "Systems analysis, behavioral mechanics", 
        style: { tone: "analytical, systematic, precise" },
        triggers: ["analyze", "understand", "how does", "mechanism", "why", "data"]
    },
    Strategist: {
        id: 'strategist',
        purpose: "Tactical, practical, next-step clarity",
        style: { tone: "practical, tactical, clear" },
        triggers: ["what should I do", "next steps", "plan", "action", "strategy", "how to"]
    },
    Default: {
        id: 'default',
        purpose: "Balanced, neutral, universally applicable",
        style: { tone: "balanced, clear, approachable" },
        triggers: []
    }
};

// Enhanced logging function with complete implementation
export async function logMetamorphicEvent(env, event) {
    try {
        const phillyTime = getPhiladelphiaTime();
        const eventId = generateId();
        
        // Enhanced event structure
        const enhancedEvent = {
            id: eventId,
            timestamp: phillyTime,
            kind: event.kind || 'general',
            signal_strength: event.signal_strength || 'medium',
            detail: typeof event.detail === 'string' ? event.detail : JSON.stringify(event.detail),
            session_id: event.session_id || null,
            voice: event.voice || 'default',
            tags: Array.isArray(event.tags) ? event.tags.join(',') : (event.tags || ''),
            idx1: event.idx1 || null,
            idx2: event.idx2 || null,
            metadata: event.metadata ? JSON.stringify(event.metadata) : null
        };

        // Log to database with fallback handling
        if (env.AQUIL_DB) {
            try {
                // Try to use metamorphic_logs table first
                await env.AQUIL_DB.prepare(`
                    INSERT INTO metamorphic_logs (
                        id, timestamp, kind, signal_strength, detail, session_id, voice, tags, idx1, idx2, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    enhancedEvent.id,
                    enhancedEvent.timestamp,
                    enhancedEvent.kind,
                    enhancedEvent.signal_strength,
                    enhancedEvent.detail,
                    enhancedEvent.session_id,
                    enhancedEvent.voice,
                    enhancedEvent.tags,
                    enhancedEvent.idx1,
                    enhancedEvent.idx2,
                    enhancedEvent.metadata
                ).run();
            } catch (dbError) {
                // Fallback to existing event_log table structure
                await env.AQUIL_DB.prepare(`
                    INSERT INTO event_log (id, ts, type, who, level, session_id, tags, idx1, idx2, payload)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    eventId,
                    phillyTime,
                    enhancedEvent.kind,
                    enhancedEvent.voice,
                    enhancedEvent.signal_strength,
                    enhancedEvent.session_id,
                    enhancedEvent.tags,
                    enhancedEvent.idx1,
                    enhancedEvent.idx2,
                    enhancedEvent.detail
                ).run();
            }
        }

        return eventId;
    } catch (error) {
        console.error('ARK logging error:', error);
        return null;
    }
}

// Voice selection based on user input context
export function selectOptimalVoice(userInput, context = {}) {
    if (!userInput || typeof userInput !== 'string') {
        return 'default';
    }
    
    const input = userInput.toLowerCase();
    
    // Check for explicit voice triggers
    for (const [voiceName, voice] of Object.entries(VOICE_SYSTEM)) {
        if (voice.triggers && voice.triggers.some(trigger => input.includes(trigger.toLowerCase()))) {
            return voice.id;
        }
    }
    
    // Fallback logic based on emotional and content analysis
    if (input.includes('feel') || input.includes('emotion') || input.includes('hurt') || input.includes('scared')) {
        return 'mirror';
    }
    if (input.includes('pattern') || input.includes('meaning') || input.includes('why') || input.includes('symbol')) {
        return 'oracle';
    }
    if (input.includes('analyze') || input.includes('understand') || input.includes('how does') || input.includes('mechanism')) {
        return 'scientist';
    }
    if (input.includes('what should') || input.includes('action') || input.includes('next') || input.includes('plan')) {
        return 'strategist';
    }
    
    return 'default';
}

// Generate Socratic questions for deeper exploration
export function generateSocraticInquiry(topic, userContext = {}) {
    const inquiries = {
        trust: [
            "What would trusting yourself completely look like in this situation?",
            "When have you trusted yourself before and it worked out well?",
            "What is your body telling you about this decision?",
            "If you removed others' opinions entirely, what would you choose?"
        ],
        patterns: [
            "What keeps showing up in similar situations?",
            "How might this pattern be trying to protect or serve you?",
            "What would change if you responded differently next time?",
            "What does this pattern reveal about your current growth edge?"
        ],
        media: [
            "What in this content mirrors your own life right now?",
            "What character or theme resonated most strongly with you?",
            "How might this story be medicine for your current journey?",
            "What wisdom from this content wants integration in your life?"
        ],
        body: [
            "What is your body trying to communicate right now?",
            "Where do you feel this situation in your physical body?",
            "What would honoring your body's wisdom look like?",
            "How does your body respond when you think about this situation?"
        ],
        standing_tall: [
            "What would change if you stood fully in your power here?",
            "What are you afraid would happen if you didn't shrink?",
            "How do you want to be remembered in this situation?",
            "What would your most confident self do right now?"
        ],
        relationships: [
            "What pattern in relationships keeps showing up for you?",
            "How do you shrink or expand in this relationship?",
            "What would authentic expression look like here?",
            "What boundary does this situation call for?"
        ],
        decisions: [
            "What option creates expansion in your body vs contraction?",
            "What would you choose if you trusted your wisdom completely?",
            "What are your values telling you about this choice?",
            "What would you do if you couldn't fail?"
        ],
        creativity: [
            "What wants to be expressed through you right now?",
            "What would you create if nobody was watching?",
            "What creative block is actually protecting you from something?",
            "How does your creativity connect to your authentic self?"
        ]
    };
    
    return inquiries[topic] || inquiries.trust;
}

// Detect when intervention or additional support is needed
export function detectInterventionNeeds(userInput, context = {}) {
    if (!userInput || typeof userInput !== 'string') {
        return { needsSupport: false, interventions: {}, recommendations: [] };
    }
    
    const input = userInput.toLowerCase();
    
    // Crisis language detection
    const crisisFlags = [
        'hopeless', 'can\'t go on', 'ending it', 'hurt myself', 'kill myself',
        'no point', 'everyone would be better', 'disappear', 'can\'t take it'
    ];
    
    // Intensity flags that suggest overwhelm
    const intensityFlags = [
        'always', 'never', 'completely', 'totally', 'absolutely',
        'impossible', 'can\'t handle', 'too much', 'breaking down'
    ];
    
    // Isolation flags
    const isolationFlags = [
        'no one understands', 'all alone', 'nobody cares', 'no friends', 'isolated'
    ];
    
    const interventions = {
        crisis: crisisFlags.some(flag => input.includes(flag)),
        intensity: intensityFlags.some(flag => input.includes(flag)),
        isolation: isolationFlags.some(flag => input.includes(flag)),
        overwhelm: input.includes('overwhelm') || input.includes('too much') || input.includes('drowning'),
        stuck: input.includes('stuck') || input.includes('don\'t know what to do') || input.includes('paralyzed')
    };
    
    return {
        needsSupport: Object.values(interventions).some(Boolean),
        interventions,
        recommendations: generateInterventionRecommendations(interventions)
    };
}

function generateInterventionRecommendations(interventions) {
    const recommendations = [];
    
    if (interventions.crisis) {
        recommendations.push({
            priority: 'high',
            type: 'crisis_support',
            message: 'Your safety and wellbeing matter deeply. Please consider reaching out to a crisis helpline or trusted person.',
            resources: [
                '988 Suicide & Crisis Lifeline (call or text)',
                'Crisis Text Line: Text HOME to 741741',
                'Or go to your nearest emergency room'
            ]
        });
    }
    
    if (interventions.overwhelm) {
        recommendations.push({
            priority: 'medium',
            type: 'grounding',
            message: 'Let\'s slow down and ground in the present moment.',
            practices: [
                'Take three slow, deep breaths',
                'Name 5 things you can see right now',
                'Feel your feet on the floor',
                'Place hand on heart and breathe'
            ]
        });
    }
    
    if (interventions.isolation) {
        recommendations.push({
            priority: 'medium',
            type: 'connection',
            message: 'You don\'t have to navigate this alone.',
            practices: [
                'Reach out to one person who cares about you',
                'Consider joining an online community',
                'Remember that seeking help is a sign of strength',
                'Your experience matters and you deserve support'
            ]
        });
    }
    
    if (interventions.stuck) {
        recommendations.push({
            priority: 'low',
            type: 'gentle_action',
            message: 'When stuck, the smallest step forward can shift everything.',
            practices: [
                'Take one tiny action - even 1% movement helps',
                'Change your physical position or environment',
                'Ask: "What would feel good right now?"',
                'Trust that clarity comes through movement, not thinking'
            ]
        });
    }
    
    return recommendations;
}

// Perform comprehensive health checks on the system
export async function performHealthChecks(env) {
    const checks = {
        timestamp: getPhiladelphiaTime(),
        database: false,
        kv_storage: false,
        logging_system: false,
        voice_system: true, // Always available as it's in-memory
        ark_core: true      // Always available as it's in-memory
    };
    
    try {
        // Database connectivity check
        if (env.AQUIL_DB) {
            const result = await env.AQUIL_DB.prepare("SELECT 1 as test").first();
            checks.database = result && result.test === 1;
        }
    } catch (error) {
        console.warn('Database health check failed:', error.message);
        checks.database = false;
    }
    
    try {
        // KV storage check (if available)
        if (env.AQUIL_MEMORIES || env.AQUIL_KV) {
            const kvStore = env.AQUIL_MEMORIES || env.AQUIL_KV;
            await kvStore.put('health_check', 'ok', { expirationTtl: 60 });
            const testValue = await kvStore.get('health_check');
            checks.kv_storage = testValue === 'ok';
        }
    } catch (error) {
        console.warn('KV storage health check failed:', error.message);
        checks.kv_storage = false;
    }
    
    try {
        // Logging system check
        const testLogId = await logMetamorphicEvent(env, {
            kind: 'health_check',
            detail: 'System health verification',
            signal_strength: 'low'
        });
        checks.logging_system = !!testLogId;
    } catch (error) {
        console.warn('Logging system health check failed:', error.message);
        checks.logging_system = false;
    }
    
    // Calculate overall health score
    const totalChecks = Object.keys(checks).length - 1; // Exclude timestamp
    const passedChecks = Object.values(checks).filter(check => 
        typeof check === 'boolean' && check === true
    ).length;
    
    checks.overall_health = passedChecks / totalChecks;
    checks.status = checks.overall_health >= 0.8 ? 'healthy' : 
                    checks.overall_health >= 0.6 ? 'degraded' : 'critical';
    
    return checks;
}

// Enhanced response wrapper with ARK 2.0 features
export async function enhanceResponse(originalResponse, context, env, options = {}) {
    try {
        const voice = options.voice || selectOptimalVoice(context.userInput || '', context);
        const interventions = detectInterventionNeeds(context.userInput || '', context);
        
        const enhancement = {
            ...originalResponse,
            ark_version: "2.0",
            timestamp: getPhiladelphiaTime(),
            voice_used: voice,
            voice_system: VOICE_SYSTEM[voice] || VOICE_SYSTEM.Default,
            autonomous_features_active: true,
            session_continuity: true
        };
        
        // Add intervention support if needed
        if (interventions.needsSupport) {
            enhancement.support_recommendations = interventions.recommendations;
            enhancement.additional_care = true;
            enhancement.intervention_detected = true;
        }
        
        // Add Socratic inquiry for deeper exploration
        if (options.includeSocratic) {
            const topic = options.socraticTopic || 
                         context.endpoint?.split('/')[2] || 
                         'trust';
            enhancement.deeper_inquiry = generateSocraticInquiry(topic, context);
        }
        
        // Log the enhanced interaction
        if (env) {
            await logMetamorphicEvent(env, {
                kind: 'enhanced_response',
                detail: {
                    endpoint: context.endpoint || 'unknown',
                    voice_used: voice,
                    interventions_detected: interventions.needsSupport,
                    user_input_length: (context.userInput || '').length,
                    response_enhanced: true
                },
                signal_strength: interventions.needsSupport ? 'high' : 'medium',
                session_id: context.session_id || null,
                voice: voice
            });
        }
        
        return enhancement;
    } catch (error) {
        console.warn('ARK enhancement failed, using original response:', error);
        return originalResponse;
    }
}

// ARK Action Framework Constants for symbolic action logging
export const ARK_ARCHETYPES = ["anchor", "break", "express", "integrate"];
export const ARK_MODES = ["automatic", "conditional", "invitation", "intentional"];
export const ARK_IMPACTS = ["self", "other", "system"];
export const ARK_DEFAULT_MODE = {
    anchor: "automatic",
    break: "conditional", 
    express: "invitation",
    integrate: "intentional"
};

// Validate ARK action structure
export function validateArkAction(action) {
    const errors = [];
    
    if (!action.archetype || !ARK_ARCHETYPES.includes(action.archetype)) {
        errors.push('Invalid or missing archetype. Must be: anchor, break, express, or integrate');
    }
    
    if (!action.impact || !ARK_IMPACTS.includes(action.impact)) {
        errors.push('Invalid or missing impact. Must be: self, other, or system');
    }
    
    if (!action.payload) {
        errors.push('Missing payload - the actual action or commitment data');
    }
    
    if (action.mode && !ARK_MODES.includes(action.mode)) {
        errors.push('Invalid mode. Must be: automatic, conditional, invitation, or intentional');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        normalized: {
            ...action,
            mode: action.mode || ARK_DEFAULT_MODE[action.archetype]
        }
    };
}

// Crisis resources for intervention support
export const CRISIS_RESOURCES = {
    us: {
        suicide_prevention: "988",
        crisis_text: "Text HOME to 741741",
        emergency: "911"
    },
    general: [
        "Reach out to a trusted friend, family member, or counselor",
        "Contact your local emergency services",
        "Visit your nearest emergency room if in immediate danger",
        "Remember: You matter, your life has value, and help is available"
    ]
};

// Export default object with all functions
export default {
    getPhiladelphiaTime,
    generateId,
    VOICE_SYSTEM,
    logMetamorphicEvent,
    selectOptimalVoice,
    generateSocraticInquiry,
    detectInterventionNeeds,
    performHealthChecks,
    enhanceResponse,
    ARK_ARCHETYPES,
    ARK_MODES,
    ARK_IMPACTS,
    ARK_DEFAULT_MODE,
    validateArkAction,
    CRISIS_RESOURCES
};
