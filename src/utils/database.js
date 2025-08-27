/**
 * Database utilities for Aquil's wisdom storage and retrieval
 */

export class AquilDatabase {
  constructor(env) {
    this.db = env.AQUIL_DB;
    this.kv = env.AQUIL_MEMORIES;
  }

  // User profile management
  async getUserProfile() {
    try {
      const result = await this.db
        .prepare("SELECT * FROM user_profile WHERE id = ?")
        .bind("aquil_user")
        .first();

      return result
        ? {
            ...result,
            preferences: JSON.parse(result.preferences || "{}"),
            personality_data: JSON.parse(result.personality_data || "{}"),
          }
        : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  async updateUserProfile(updates) {
    try {
      const { preferences, personality_data, ...otherUpdates } = updates;

      await this.db
        .prepare(
          `
        UPDATE user_profile 
        SET preferences = ?, personality_data = ?, updated_at = datetime('now')
        WHERE id = ?
      `,
        )
        .bind(
          JSON.stringify(preferences || {}),
          JSON.stringify(personality_data || {}),
          "aquil_user",
        )
        .run();

      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  }

  // Trust session storage
  async saveTrustSession(sessionData) {
    try {
      const id = `trust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO trust_sessions 
        (id, trust_level, reflection, insights, exercises_completed, patterns_identified, next_steps, session_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          sessionData.trust_level,
          sessionData.reflection,
          JSON.stringify(sessionData.insights || {}),
          JSON.stringify(sessionData.exercises_completed || []),
          JSON.stringify(sessionData.patterns_identified || []),
          JSON.stringify(sessionData.next_steps || []),
          sessionData.session_type || "check-in",
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving trust session:", error);
      return null;
    }
  }

  // Media wisdom storage
  async saveMediaWisdom(wisdomData) {
    try {
      const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO media_wisdom 
        (id, media_type, title, content_summary, personal_reaction, emotional_response, 
         wisdom_extracted, trust_connections, action_items, growth_themes, resonance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          wisdomData.media_type,
          wisdomData.title,
          wisdomData.content_summary || "",
          wisdomData.personal_reaction,
          JSON.stringify(wisdomData.emotional_response || []),
          JSON.stringify(wisdomData.wisdom_extracted || {}),
          JSON.stringify(wisdomData.trust_connections || {}),
          JSON.stringify(wisdomData.action_items || []),
          JSON.stringify(wisdomData.growth_themes || []),
          wisdomData.resonance_score || 5,
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving media wisdom:", error);
      return null;
    }
  }

  // Somatic session storage
  async saveSomaticSession(sessionData) {
    try {
      const id = `somatic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO somatic_sessions 
        (id, body_state, emotions_present, intention, session_structure, 
         body_insights, trust_building_elements, outcomes, integration_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          JSON.stringify(sessionData.body_state || {}),
          JSON.stringify(sessionData.emotions_present || []),
          sessionData.intention,
          JSON.stringify(sessionData.session_structure || {}),
          JSON.stringify(sessionData.body_insights || {}),
          JSON.stringify(sessionData.trust_building_elements || {}),
          JSON.stringify(sessionData.outcomes || {}),
          sessionData.integration_notes || "",
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving somatic session:", error);
      return null;
    }
  }

  // Standing tall session storage
  async saveStandingTallSession(sessionData) {
    try {
      const id = `standing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO standing_tall_sessions 
        (id, situation_context, shrinking_patterns, confidence_level, fears_addressed, 
         practices_completed, insights_gained, embodied_shifts, next_steps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          sessionData.situation_context || "",
          JSON.stringify(sessionData.shrinking_patterns || []),
          sessionData.confidence_level || 5,
          JSON.stringify(sessionData.fears_addressed || []),
          JSON.stringify(sessionData.practices_completed || []),
          sessionData.insights_gained || "",
          JSON.stringify(sessionData.embodied_shifts || {}),
          JSON.stringify(sessionData.next_steps || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving standing tall session:", error);
      return null;
    }
  }

  // Pattern storage
  async savePattern(patternData) {
    try {
      const id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO growth_patterns 
        (id, pattern_type, pattern_description, frequency_data, triggers, 
         responses, evolution_notes, recommendations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          patternData.pattern_type,
          patternData.pattern_description,
          JSON.stringify(patternData.frequency_data || {}),
          JSON.stringify(patternData.triggers || []),
          JSON.stringify(patternData.responses || []),
          JSON.stringify(patternData.evolution_notes || {}),
          JSON.stringify(patternData.recommendations || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving pattern:", error);
      return null;
    }
  }

  // Wisdom synthesis storage
  async saveWisdomSynthesis(synthesisData) {
    try {
      const id = `synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO wisdom_synthesis 
        (id, life_situation, question_asked, synthesized_guidance, trust_applications, 
         standing_tall_connections, action_steps, synthesis_type, frameworks_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          synthesisData.life_situation || "",
          synthesisData.question_asked || "",
          JSON.stringify(synthesisData.synthesized_guidance || {}),
          JSON.stringify(synthesisData.trust_applications || {}),
          JSON.stringify(synthesisData.standing_tall_connections || {}),
          JSON.stringify(synthesisData.action_steps || []),
          synthesisData.synthesis_type || "question-based",
          JSON.stringify(synthesisData.frameworks_used || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving wisdom synthesis:", error);
      return null;
    }
  }

  // Retrieve recent data for synthesis and pattern recognition
  async getRecentTrustSessions(limit = 10) {
    try {
      const results = await this.db
        .prepare(
          `
        SELECT * FROM trust_sessions 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        )
        .bind(limit)
        .all();

      return (
        results.results?.map((row) => ({
          ...row,
          insights: JSON.parse(row.insights || "{}"),
          exercises_completed: JSON.parse(row.exercises_completed || "[]"),
          patterns_identified: JSON.parse(row.patterns_identified || "[]"),
          next_steps: JSON.parse(row.next_steps || "[]"),
        })) || []
      );
    } catch (error) {
      console.error("Error getting recent trust sessions:", error);
      return [];
    }
  }

  async getRecentMediaWisdom(limit = 10) {
    try {
      const results = await this.db
        .prepare(
          `
        SELECT * FROM media_wisdom 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        )
        .bind(limit)
        .all();

      return (
        results.results?.map((row) => ({
          ...row,
          emotional_response: JSON.parse(row.emotional_response || "[]"),
          wisdom_extracted: JSON.parse(row.wisdom_extracted || "{}"),
          trust_connections: JSON.parse(row.trust_connections || "{}"),
          action_items: JSON.parse(row.action_items || "[]"),
          growth_themes: JSON.parse(row.growth_themes || "[]"),
        })) || []
      );
    } catch (error) {
      console.error("Error getting recent media wisdom:", error);
      return [];
    }
  }

  async getRecentSomaticSessions(limit = 10) {
    try {
      const results = await this.db
        .prepare(
          `
        SELECT * FROM somatic_sessions 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        )
        .bind(limit)
        .all();

      return (
        results.results?.map((row) => ({
          ...row,
          body_state: JSON.parse(row.body_state || "{}"),
          emotions_present: JSON.parse(row.emotions_present || "[]"),
          session_structure: JSON.parse(row.session_structure || "{}"),
          body_insights: JSON.parse(row.body_insights || "{}"),
          trust_building_elements: JSON.parse(
            row.trust_building_elements || "{}",
          ),
          outcomes: JSON.parse(row.outcomes || "{}"),
        })) || []
      );
    } catch (error) {
      console.error("Error getting recent somatic sessions:", error);
      return [];
    }
  }

  async getRecentPatterns(limit = 20) {
    try {
      const results = await this.db
        .prepare(
          `
        SELECT * FROM growth_patterns 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        )
        .bind(limit)
        .all();

      return (
        results.results?.map((row) => ({
          ...row,
          frequency_data: JSON.parse(row.frequency_data || "{}"),
          triggers: JSON.parse(row.triggers || "[]"),
          responses: JSON.parse(row.responses || "[]"),
          evolution_notes: JSON.parse(row.evolution_notes || "{}"),
          recommendations: JSON.parse(row.recommendations || "[]"),
        })) || []
      );
    } catch (error) {
      console.error("Error getting recent patterns:", error);
      return [];
    }
  }

  // KV storage for temporary and session data
  async storeMemory(key, data, ttl = 86400) {
    // 24 hours default
    try {
      await this.kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
      return true;
    } catch (error) {
      console.error("Error storing memory:", error);
      return false;
    }
  }

  async getMemory(key) {
    try {
      const data = await this.kv.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting memory:", error);
      return null;
    }
  }

  async deleteMemory(key) {
    try {
      await this.kv.delete(key);
      return true;
    } catch (error) {
      console.error("Error deleting memory:", error);
      return false;
    }
  }
}
