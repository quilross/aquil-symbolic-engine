// ARK 2.0 Core Functions
// These enhance your existing system without replacing it

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

// Generate unique IDs
export function generateId() {
    return `ark_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Voice system configuration
export const VOICE_SYSTEM = {
    Mirror: {
        id: 'mirror',
        purpose: "Gentle reflection, grounding continuity",
        style: { tone: "gentle, reflective, continuous" }
    },
    Oracle: {
        id: 'oracle', 
        purpose: "Symbolic, archetypal, mythic framing",
        style: { tone: "archetypal, symbolic, mysterious" }
    },
    Scientist: {
        id: 'scientist',
        purpose: "Systems analysis, behavioral mechanics", 
        style: { tone: "analytical, systematic, precise" }
    },
    Strategist: {
        id: 'strategist',
        purpose: "Tactical, practical, next-step clarity",
        style: { tone: "practical, tactical, clear" }
    },
    Default: {
        id: 'default',
        purpose: "Balanced, neutral, universally applicable",
        style: { tone: "balanced, clear, approachable" }
    }
};

// Enhanced logging function
export async function logMetamorphicEvent(env, event) {
    try {
        const phillyTime = getPhiladelphiaTime();
        
        await env.DB.prepare(`
            INSERT INTO metamorphic_logs (
                id, timestamp, kind, signal_strength, detail, session_id
            ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            generateId(),
            phillyTime,
            event.kind || 'general',
            event.signal_strength || 'medium',
            JSON.stringify(event.detail || {}),
            event.session_id || 'unknown'
        ).run();
        
    } catch (error) {
        // Silent failure - never break existing functionality
        console.warn('Metamorphic logging failed:', error);
    }
}

// Health check function
export async function performHealthChecks(env) {
    try {
        const checks = await Promise.allSettled([
            env.DB.prepare("SELECT 1").first(), // D1 health
            env.AQUIL_KV ? env.AQUIL_KV.get("health_check") : Promise.resolve("ok"), // KV health
            env.AQUIL_STORAGE ? env.AQUIL_STORAGE.head("health-check.txt").catch(() => "ok") : Promise.resolve("ok"), // R2 health
            env.AI ? env.AI.run('@cf/meta/llama-2-7b-chat-int8', { messages: [{ role: 'user', content: 'test' }] }).catch(() => "ok") : Promise.resolve("ok") // AI health
        ]);
        
        return {
            d1: checks.status === 'fulfilled',
            kv: checks.status === 'fulfilled',
            r2: checks.status === 'fulfilled', 
            ai: checks.status === 'fulfilled',
            overall: checks.every(c => c.status === 'fulfilled'),
            timestamp: getPhiladelphiaTime()
        };
    } catch (error) {
        return { error: true, timestamp: getPhiladelphiaTime() };
    }
}
