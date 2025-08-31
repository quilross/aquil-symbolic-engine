/**
 * Autonomous trigger detection and endpoint routing system
 * Handles keyword-based triggers and scheduled autonomous actions
 */

export const AUTONOMOUS_TRIGGERS = {
  keywords: {
    // Financial/abundance triggers should be checked first to avoid wellbeing overlap
    abundance: ["money", "broke", "wealth", "scarcity", "prosperity", "charging", "rates", "financial", "income", "expensive", "afford", "budget", "salary", "payment", "worried about money", "financial stress", "money stress", "broke and stressed"],
    transitions: ["new job", "move", "change", "transition", "phase", "chapter", "ending", "beginning", "shift", "transform", "relocating", "starting", "leaving", "moving"],
    wellbeing: ["doubt", "uncertain", "insecure", "anxious", "overwhelm", "worried", "fear", "scared", "panic", "nervous", "uneasy", "stressed"],
    somatic: ["body", "tight", "shoulders", "chest", "tense", "pain", "breath", "breathing", "headache", "stomach", "muscle"],
    standing_tall: ["small", "powerless", "intimidated", "voice", "confidence", "assertive", "speak up", "invisible", "shrinking"],
    media_wisdom: ["read", "watched", "listened", "book", "movie", "podcast", "show", "documentary", "article", "video"],
    creativity: ["block", "stuck", "write", "create", "paint", "draw", "music", "art", "creative", "inspiration", "express"],
    ancestry: ["family", "mom", "dad", "parents", "generational", "pattern", "lineage", "ancestors", "inherited", "bloodline"],
    values: ["matters", "priority", "values", "decision", "choice", "principle", "belief", "prioritize", "important"],
    goals: ["goal", "commit", "promise", "achieve", "progress", "next step", "milestone", "target", "objective", "plan", "meaningful"],
    dreams: ["dreamed", "dream", "nightmare", "recurring", "symbolic", "sleep", "subconscious", "vision", "imagery", "metaphor"]
  },
  scheduled: {
    daily_wisdom: ["0 7 * * *", "0 19 * * *"], // 7 AM and 7 PM
    evening_ritual: ["0 20 * * *"], // 8 PM
    weekly_insights: ["0 8 * * 1"] // Monday 8 AM
  }
};

/**
 * Detect autonomous triggers in user messages
 * @param {string} text - User message content
 * @param {object} env - Cloudflare environment bindings
 * @returns {object|null} Trigger information or null if no trigger found
 */
export async function detectTriggers(text, env) {
  if (!text || typeof text !== 'string') return null;
  
  const lowerText = text.toLowerCase();
  const matches = [];
  
  // Find all matches with their confidence scores and phrase length weighting
  for (const [action, keywords] of Object.entries(AUTONOMOUS_TRIGGERS.keywords)) {
    const matchedKeywords = keywords.filter(keyword => lowerText.includes(keyword));
    if (matchedKeywords.length > 0) {
      // Calculate average phrase length to prioritize compound phrases
      const avgPhraseLength = matchedKeywords.reduce((sum, keyword) => sum + keyword.split(' ').length, 0) / matchedKeywords.length;
      
      matches.push({
        action, 
        keywords: matchedKeywords,
        trigger_type: 'keyword',
        confidence: matchedKeywords.length / keywords.length,
        matchCount: matchedKeywords.length,
        avgPhraseLength: avgPhraseLength,
        // Boost score for longer phrases and specific financial terms
        adjustedScore: (matchedKeywords.length / keywords.length) * avgPhraseLength
      });
    }
  }
  
  if (matches.length === 0) return null;
  
  // Sort by adjusted score (prioritizes compound phrases), then confidence, then match count
  matches.sort((a, b) => {
    if (b.adjustedScore !== a.adjustedScore) {
      return b.adjustedScore - a.adjustedScore;
    }
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.matchCount - a.matchCount;
  });
  
  return matches[0];
}

/**
 * Map autonomous actions to their corresponding endpoints
 */
export const AUTONOMOUS_ENDPOINT_MAP = {
  wellbeing: { path: "/api/trust/check-in", method: "POST" },
  somatic: { path: "/api/somatic/session", method: "POST" },
  standing_tall: { path: "/api/standing-tall/practice", method: "POST" },
  media_wisdom: { path: "/api/media/extract-wisdom", method: "POST" },
  creativity: { path: "/api/creativity/unleash", method: "POST" },
  abundance: { path: "/api/abundance/cultivate", method: "POST" },
  transitions: { path: "/api/transitions/navigate", method: "POST" },
  ancestry: { path: "/api/ancestry/heal", method: "POST" },
  values: { path: "/api/values/clarify", method: "POST" },
  goals: { path: "/api/commitments", method: "POST" },
  dreams: { path: "/api/dreams/interpret", method: "POST" }
};

/**
 * Call the appropriate autonomous endpoint
 * @param {string} action - The autonomous action to trigger
 * @param {object} originalBody - Original request body
 * @param {object} env - Cloudflare environment bindings
 * @returns {Promise<Response>} Response from the autonomous endpoint
 */
export async function callAutonomousEndpoint(action, originalBody, env) {
  if (!env) {
    throw new Error('Environment bindings are required');
  }
  
  const endpointConfig = AUTONOMOUS_ENDPOINT_MAP[action];
  if (!endpointConfig) {
    throw new Error(`Unknown autonomous action: ${action}`);
  }

  // Create autonomous request body
  const autonomousBody = {
    ...originalBody,
    trigger_keywords: AUTONOMOUS_TRIGGERS.keywords[action],
    user_state: "auto-detected",
    trigger_phrase: originalBody.payload?.content || originalBody.content || "",
    autonomous: true,
    timestamp: new Date().toISOString()
  };

  // Log the autonomous action
  await logAutonomousAction(action, autonomousBody, env);

  // For now, return a success response indicating the autonomous action was triggered
  // In a full implementation, this would make an internal request to the endpoint
  return new Response(JSON.stringify({
    success: true,
    action,
    status: "autonomous action triggered",
    endpoint: endpointConfig.path,
    trigger_type: "keyword",
    timestamp: new Date().toISOString()
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Log autonomous actions for debugging and continuity
 * @param {string} action - The autonomous action taken
 * @param {object} body - Request body that triggered the action
 * @param {object} env - Cloudflare environment bindings
 */
export async function logAutonomousAction(action, body, env) {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      type: "autonomous_action",
      action,
      trigger: body.trigger_keywords || [],
      trigger_phrase: body.trigger_phrase || "",
      user_state: body.user_state || "unknown",
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(body)
    };

    // Log to D1 database
    if (env.AQUIL_DB) {
      await env.AQUIL_DB.prepare(`
        INSERT INTO event_log (id, type, payload, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        logEntry.id,
        logEntry.type,
        JSON.stringify(logEntry),
        logEntry.timestamp
      ).run();
    }

    // Also log to KV for quick access
    if (env.AQUIL_MEMORIES) {
      await env.AQUIL_MEMORIES.put(
        `autonomous_action:${logEntry.id}`,
        JSON.stringify(logEntry),
        { expirationTtl: 86400 * 30 } // 30 days
      );
    }

    console.log(`Autonomous action logged: ${action}`, logEntry);
  } catch (error) {
    console.error('Failed to log autonomous action:', error);
  }
}

/**
 * Check if a scheduled trigger should fire
 * @param {string} cronExpression - Cron expression to check
 * @returns {boolean} Whether the trigger should fire now
 */
export function shouldTriggerScheduled(cronExpression) {
  // This is a simplified implementation
  // In production, you'd use a proper cron parser
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check for daily wisdom triggers (7 AM and 7 PM)
  if (cronExpression === "0 7 * * *" && hour === 7) return true;
  if (cronExpression === "0 19 * * *" && hour === 19) return true;
  
  // Check for evening ritual (8 PM)
  if (cronExpression === "0 20 * * *" && hour === 20) return true;
  
  // Check for weekly insights (Monday 8 AM)
  if (cronExpression === "0 8 * * 1" && hour === 8 && dayOfWeek === 1) return true;
  
  return false;
}

/**
 * Handle scheduled autonomous actions
 * @param {object} env - Cloudflare environment bindings
 * @returns {Promise<Response>} Response indicating scheduled actions taken
 */
export async function handleScheduledTriggers(env) {
  const triggeredActions = [];
  
  for (const [actionType, cronExpressions] of Object.entries(AUTONOMOUS_TRIGGERS.scheduled)) {
    for (const cronExpression of cronExpressions) {
      if (shouldTriggerScheduled(cronExpression)) {
        triggeredActions.push({
          type: actionType,
          cron: cronExpression,
          timestamp: new Date().toISOString()
        });
        
        // Log the scheduled trigger
        await logAutonomousAction(`scheduled_${actionType}`, {
          trigger_type: 'scheduled',
          cron_expression: cronExpression,
          user_state: 'scheduled'
        }, env);
      }
    }
  }
  
  return new Response(JSON.stringify({
    success: true,
    triggered_actions: triggeredActions,
    timestamp: new Date().toISOString()
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Auto-detect tags from content for enhanced logging
 * @param {string} content - Content to analyze
 * @returns {string[]} Array of detected tags
 */
export function autoDetectTags(content) {
  if (!content || typeof content !== 'string') return [];
  
  const tags = [];
  const lowerContent = content.toLowerCase();
  
  // Emotional state tags
  if (lowerContent.includes("trust") || lowerContent.includes("faith")) tags.push("trust");
  if (lowerContent.includes("creative") || lowerContent.includes("art")) tags.push("creativity");
  if (lowerContent.includes("body") || lowerContent.includes("physical")) tags.push("somatic");
  if (lowerContent.includes("family") || lowerContent.includes("parent")) tags.push("ancestry");
  if (lowerContent.includes("goal") || lowerContent.includes("achieve")) tags.push("goals");
  if (lowerContent.includes("dream") || lowerContent.includes("sleep")) tags.push("dreams");
  if (lowerContent.includes("money") || lowerContent.includes("wealth")) tags.push("abundance");
  if (lowerContent.includes("change") || lowerContent.includes("transition")) tags.push("transitions");
  if (lowerContent.includes("value") || lowerContent.includes("important")) tags.push("values");
  if (lowerContent.includes("confident") || lowerContent.includes("voice")) tags.push("standing_tall");
  
  // Emotional intensity tags
  if (lowerContent.includes("anxious") || lowerContent.includes("stress")) tags.push("high_intensity");
  if (lowerContent.includes("calm") || lowerContent.includes("peaceful")) tags.push("low_intensity");
  
  return [...new Set(tags)]; // Remove duplicates
}