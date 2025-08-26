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

export function generateId() {
    return `ark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const VOICE_SYSTEM = {
    Mirror: {
        id: 'mirror',
        purpose: "Grounding, emotional continuity",
        style: { tone: "gentle, reflective" }
    },
    Oracle: {
        id: 'oracle',
        purpose: "Symbolic, archetypal pattern insight",
        style: { tone: "symbolic, archetypal" }
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
            // ARK 2.0 COMPLETE CORE SYSTEM

