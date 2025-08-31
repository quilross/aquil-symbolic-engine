/**
 * Database utilities for Aquil's wisdom storage and retrieval
 */

export class AquilDatabase {
  constructor(env) {
    this.db = env?.AQUIL_DB;
    this.kv = env?.AQUIL_MEMORIES;
  }

  // Check if database is available
  isDatabaseAvailable() {
    return this.db && typeof this.db.prepare === 'function';
  }

  // Check if KV store is available
  isKVAvailable() {
    return this.kv && typeof this.kv.get === 'function';
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
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping trust session save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
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
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping media wisdom save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
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
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping pattern save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
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
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, returning empty trust sessions");
      return [];
    }
    
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
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, returning empty media wisdom");
      return [];
    }
    
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

  // Values session storage
  async saveValuesSession(sessionData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping values session save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
    try {
      const id = `values_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO values_sessions 
        (id, values_identified, prioritization_method, top_values, session_type, insights, exercises_completed, next_steps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          JSON.stringify(sessionData.values_identified || []),
          sessionData.prioritization_method || "combined_scoring",
          JSON.stringify(sessionData.top_values || []),
          sessionData.session_type || "values-clarification",
          JSON.stringify(sessionData.insights || {}),
          JSON.stringify(sessionData.exercises_completed || []),
          JSON.stringify(sessionData.next_steps || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving values session:", error);
      return null;
    }
  }

  // Creativity session storage
  async saveCreativitySession(sessionData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping creativity session save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
    try {
      const id = `creativity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO creativity_sessions 
        (id, block_analysis, flow_pathways, unleash_strategies, session_type, insights, creative_practices, transformation_markers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          JSON.stringify(sessionData.block_analysis || {}),
          JSON.stringify(sessionData.flow_pathways || {}),
          JSON.stringify(sessionData.unleash_strategies || {}),
          sessionData.session_type || "creativity-unleashing",
          JSON.stringify(sessionData.insights || {}),
          JSON.stringify(sessionData.creative_practices || {}),
          JSON.stringify(sessionData.transformation_markers || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving creativity session:", error);
      return null;
    }
  }

  // Abundance session storage
  async saveAbundanceSession(sessionData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping abundance session save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
    try {
      const id = `abundance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO abundance_sessions 
        (id, scarcity_analysis, abundance_mapping, cultivation_strategies, session_type, insights, abundance_practices, transformation_markers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          JSON.stringify(sessionData.scarcity_analysis || {}),
          JSON.stringify(sessionData.abundance_mapping || {}),
          JSON.stringify(sessionData.cultivation_strategies || {}),
          sessionData.session_type || "abundance-cultivation",
          JSON.stringify(sessionData.insights || {}),
          JSON.stringify(sessionData.abundance_practices || {}),
          JSON.stringify(sessionData.transformation_markers || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving abundance session:", error);
      return null;
    }
  }

  // Transition session storage
  async saveTransitionSession(sessionData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping transition session save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
    try {
      const id = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO transition_sessions 
        (id, transition_analysis, navigation_map, support_strategies, session_type, insights, transition_practices, transformation_markers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          JSON.stringify(sessionData.transition_analysis || {}),
          JSON.stringify(sessionData.navigation_map || {}),
          JSON.stringify(sessionData.support_strategies || {}),
          sessionData.session_type || "transition-navigation",
          JSON.stringify(sessionData.insights || {}),
          JSON.stringify(sessionData.transition_practices || {}),
          JSON.stringify(sessionData.transformation_markers || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving transition session:", error);
      return null;
    }
  }

  // Ancestry session storage
  async saveAncestrySession(sessionData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping ancestry session save");
      return { id: `mock_${Date.now()}`, success: false };
    }
    
    try {
      const id = `ancestry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO ancestry_sessions 
        (id, ancestral_analysis, healing_map, healing_strategies, session_type, insights, ancestral_practices, transformation_markers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          JSON.stringify(sessionData.ancestral_analysis || {}),
          JSON.stringify(sessionData.healing_map || {}),
          JSON.stringify(sessionData.healing_strategies || {}),
          sessionData.session_type || "ancestral-healing",
          JSON.stringify(sessionData.insights || {}),
          JSON.stringify(sessionData.ancestral_practices || {}),
          JSON.stringify(sessionData.transformation_markers || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error saving ancestry session:", error);
      return null;
    }
  }

  // Wisdom synthesis storage
  async storeWisdomSynthesis(synthesis) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping wisdom synthesis storage");
      return null;
    }
    
    try {
      const id = `wisdom_synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO wisdom_syntheses 
        (id, timestamp, wisdom_threads, integration_opportunities, growth_edges, celebration_moments)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          synthesis.timestamp,
          JSON.stringify(synthesis.wisdom_threads || []),
          JSON.stringify(synthesis.integration_opportunities || []),
          JSON.stringify(synthesis.growth_edges || []),
          JSON.stringify(synthesis.celebration_moments || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error storing wisdom synthesis:", error);
      return null;
    }
  }

  // Daily synthesis storage
  async storeDailySynthesis(synthesis) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping daily synthesis storage");
      return null;
    }
    
    try {
      const id = `daily_synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO daily_syntheses 
        (id, date, timestamp, insights, patterns_observed, growth_moments, integration_invitations, tomorrow_intention)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          synthesis.date,
          synthesis.timestamp,
          JSON.stringify(synthesis.insights || []),
          JSON.stringify(synthesis.patterns_observed || {}),
          JSON.stringify(synthesis.growth_moments || []),
          JSON.stringify(synthesis.integration_invitations || []),
          synthesis.tomorrow_intention || "",
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error storing daily synthesis:", error);
      return null;
    }
  }

  // Get recent logs with fallback to legacy schema
  async getRecentLogs(hours = 24) {
    if (!this.isDatabaseAvailable()) {
      return [];
    }
    
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      // Try metamorphic_logs first
      try {
        const results = await this.db
          .prepare(
            `
          SELECT id, timestamp, kind, detail, session_id, voice, signal_strength, tags
          FROM metamorphic_logs 
          WHERE timestamp > ?
          ORDER BY timestamp DESC
        `,
          )
          .bind(cutoffTime)
          .all();

        return results.results?.map(row => ({
          ...row,
          detail: this.parseJSON(row.detail)
        })) || [];
      } catch {
        // Fallback to legacy event_log
        const results = await this.db
          .prepare(
            `
          SELECT id, ts as timestamp, type as kind, payload as detail, session_id, who as voice, level as signal_strength, tags
          FROM event_log 
          WHERE ts > ?
          ORDER BY ts DESC
        `,
          )
          .bind(cutoffTime)
          .all();

        return results.results?.map(row => ({
          ...row,
          detail: this.parseJSON(row.detail)
        })) || [];
      }
    } catch (error) {
      console.error("Error getting recent logs:", error);
      return [];
    }
  }

  // Get user journey data
  async getUserJourney() {
    if (!this.isDatabaseAvailable()) {
      return { milestones: [] };
    }
    
    try {
      // Get growth milestones
      const milestones = await this.db
        .prepare(
          `
        SELECT * FROM growth_milestones 
        ORDER BY timestamp DESC 
        LIMIT 10
      `,
        )
        .all();

      return {
        milestones: milestones.results?.map(row => ({
          ...row,
          celebration: row.celebration || "Acknowledge your progress",
          description: row.description || row.milestone_type || "Growth milestone"
        })) || []
      };
    } catch (error) {
      console.error("Error getting user journey:", error);
      return { milestones: [] };
    }
  }

  // Helper method to safely parse JSON
  parseJSON(value) {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  // Commitment tracking system for behavioral change
  async createCommitment(commitmentData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping commitment creation");
      return null;
    }
    
    try {
      const id = `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.db
        .prepare(
          `
        INSERT INTO commitments 
        (id, title, description, commitment_type, status, created_at, target_date, 
         success_metrics, support_strategies, check_in_frequency, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          commitmentData.title || "Personal Growth Commitment",
          commitmentData.description || "",
          commitmentData.commitment_type || "behavioral_change",
          "emerging", // Initial status
          now,
          commitmentData.target_date || null,
          JSON.stringify(commitmentData.success_metrics || []),
          JSON.stringify(commitmentData.support_strategies || []),
          commitmentData.check_in_frequency || "weekly",
          commitmentData.session_id || null,
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error creating commitment:", error);
      return null;
    }
  }

  async updateCommitmentStatus(commitmentId, newStatus, progressNotes = "") {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping commitment update");
      return false;
    }
    
    try {
      await this.db
        .prepare(
          `
        UPDATE commitments 
        SET status = ?, progress_notes = ?, updated_at = ?
        WHERE id = ?
      `,
        )
        .bind(newStatus, progressNotes, new Date().toISOString(), commitmentId)
        .run();

      return true;
    } catch (error) {
      console.error("Error updating commitment status:", error);
      return false;
    }
  }

  async getActiveCommitments() {
    if (!this.isDatabaseAvailable()) {
      return [];
    }
    
    try {
      const results = await this.db
        .prepare(
          `
        SELECT * FROM commitments 
        WHERE status IN ('emerging', 'developing', 'integrating')
        ORDER BY created_at DESC
      `,
        )
        .all();

      return results.results?.map(row => ({
        ...row,
        success_metrics: this.parseJSON(row.success_metrics),
        support_strategies: this.parseJSON(row.support_strategies)
      })) || [];
    } catch (error) {
      console.error("Error getting active commitments:", error);
      return [];
    }
  }

  async logCommitmentProgress(commitmentId, progressData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping commitment progress log");
      return null;
    }
    
    try {
      const id = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO commitment_progress 
        (id, commitment_id, timestamp, progress_type, details, reflection, next_steps)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          commitmentId,
          new Date().toISOString(),
          progressData.progress_type || "check_in",
          JSON.stringify(progressData.details || {}),
          progressData.reflection || "",
          JSON.stringify(progressData.next_steps || []),
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error logging commitment progress:", error);
      return null;
    }
  }

  // Enhanced metamorphic logging with breakthrough detection
  async logBreakthrough(breakthroughData) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping breakthrough log");
      return null;
    }
    
    try {
      const id = `breakthrough_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db
        .prepare(
          `
        INSERT INTO breakthroughs 
        (id, timestamp, breakthrough_type, description, context, integration_plan, 
         significance_level, related_patterns, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          new Date().toISOString(),
          breakthroughData.breakthrough_type || "insight",
          breakthroughData.description || "",
          JSON.stringify(breakthroughData.context || {}),
          JSON.stringify(breakthroughData.integration_plan || []),
          breakthroughData.significance_level || "medium",
          JSON.stringify(breakthroughData.related_patterns || []),
          breakthroughData.session_id || null,
        )
        .run();

      return id;
    } catch (error) {
      console.error("Error logging breakthrough:", error);
      return null;
    }
  }

  async getRecentBreakthroughs(days = 30) {
    if (!this.isDatabaseAvailable()) {
      return [];
    }
    
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const results = await this.db
        .prepare(
          `
        SELECT * FROM breakthroughs 
        WHERE timestamp > ?
        ORDER BY timestamp DESC
      `,
        )
        .bind(cutoffDate)
        .all();

      return results.results?.map(row => ({
        ...row,
        context: this.parseJSON(row.context),
        integration_plan: this.parseJSON(row.integration_plan),
        related_patterns: this.parseJSON(row.related_patterns)
      })) || [];
    } catch (error) {
      console.error("Error getting recent breakthroughs:", error);
      return [];
    }
  }

  async testConnection() {
    if (!this.isDatabaseAvailable()) {
      throw new Error("Database binding not available");
    }
    
    try {
      // Test basic database connectivity
      const result = await this.db.prepare('SELECT 1 as test').first();
      if (result?.test !== 1) {
        throw new Error("Database test query failed");
      }
      return true;
    } catch (error) {
      throw new Error(`Database connection test failed: ${error.message}`);
    }
  }

  async storeTransformationContract(contract) {
    if (!this.isDatabaseAvailable()) {
      console.warn("Database not available, skipping contract storage");
      return null;
    }
    
    try {
      await this.db
        .prepare(
          `
        INSERT INTO transformation_contracts 
        (id, timestamp, transformation_goal, current_state, desired_state, timeline, 
         accountability_measures, milestones, support_system, tracking_methods, contract_status, progress_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          contract.id,
          contract.timestamp,
          contract.transformation_goal,
          contract.current_state,
          contract.desired_state,
          contract.timeline,
          JSON.stringify(contract.accountability_measures),
          JSON.stringify(contract.milestones),
          JSON.stringify(contract.support_system),
          JSON.stringify(contract.tracking_methods),
          contract.contract_status,
          contract.progress_percentage,
        )
        .run();

      return contract.id;
    } catch (error) {
      console.error("Error storing transformation contract:", error);
      return null;
    }
  }
}
