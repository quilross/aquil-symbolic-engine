/**
 * Canonical Operation Aliases
 * Maps between canonical operationIds (schema camelCase) and implementation variants (snake_case, legacy)
 */

// Canonical = the 30 schema operationIds (camelCase)
export const OP_CANON = {
  // Core logging and retrieval
  logDataOrEvent: 'logDataOrEvent',
  retrieveLogsOrDataEntries: 'retrieveLogsOrDataEntries',
  
  // Search and insights operations
  getPersonalInsights: 'getPersonalInsights',
  generateJournalInsight: 'generateJournalInsight',
  generateRitualSuggestion: 'generateRitualSuggestion',
  
  // RAG operations
  ragMemoryConsolidation: 'ragMemoryConsolidation',
  
  // Trust and confidence building
  trustCheckIn: 'trustCheckIn',
  
  // Media wisdom extraction
  extractMediaWisdom: 'extractMediaWisdom',
  
  // Somatic healing
  somaticHealingSession: 'somaticHealingSession',
  
  // Wisdom synthesis
  synthesizeWisdom: 'synthesizeWisdom',
  getDailySynthesis: 'getDailySynthesis',
  
  // Pattern recognition
  recognizePatterns: 'recognizePatterns',
  
  // Standing tall / confidence
  standingTallPractice: 'standingTallPractice',
  
  // Values clarification
  clarifyValues: 'clarifyValues',
  
  // Creativity
  unleashCreativity: 'unleashCreativity',
  
  // Abundance
  cultivateAbundance: 'cultivateAbundance',
  
  // Transitions
  navigateTransitions: 'navigateTransitions',
  
  // Ancestry healing
  healAncestry: 'healAncestry',
  
  // Dreams
  interpretDream: 'interpretDream',
  
  // Energy optimization
  optimizeEnergy: 'optimizeEnergy',
  
  // System operations
  systemHealthCheck: 'systemHealthCheck',
  
  // Discovery and questions
  generateDiscoveryInquiry: 'generateDiscoveryInquiry',
  
  // Feedback
  submitFeedback: 'submitFeedback',
  
  // Commitments
  manageCommitment: 'manageCommitment',
  listActiveCommitments: 'listActiveCommitments',
  
  // New operations for complete schema coverage
  trackMoodAndEmotions: 'trackMoodAndEmotions',
  setPersonalGoals: 'setPersonalGoals', 
  designHabits: 'designHabits',
  queryD1Database: 'queryD1Database',
  storeInKV: 'storeInKV',
  upsertVectors: 'upsertVectors'
};

// Aliases = implementation variants (snake_case, legacy) → canonical
export const OP_ALIASES = {
  // Logging operations
  'log_data_or_event': 'logDataOrEvent',
  'retrieve_logs_or_data_entries': 'retrieveLogsOrDataEntries',
  'retrieve_recent_session_logs': 'retrieveLogsOrDataEntries', // Map to main log retrieval
  
  // R2 storage operations (map to existing operations)
  'retrieve_r2_stored_content': 'ragMemoryConsolidation',
  'get_r2_stored_content': 'ragMemoryConsolidation',

  // Search operations (consolidate into RAG memory retrieval)
  'search_logs': 'ragMemoryConsolidation',
  'rag_search': 'ragMemoryConsolidation',
  'search_r2_storage': 'ragMemoryConsolidation',
  'searchLogs': 'ragMemoryConsolidation',
  'ragSearch': 'ragMemoryConsolidation',
  'searchR2Storage': 'ragMemoryConsolidation',
  
  // RAG operations
  'rag_memory_consolidation': 'ragMemoryConsolidation',
  
  // Trust building
  'trust_check_in': 'trustCheckIn',
  
  // Media wisdom  
  'extract_media_wisdom': 'extractMediaWisdom',
  
  // Somatic healing
  'somatic_healing_session': 'somaticHealingSession',
  
  // Wisdom synthesis
  'wisdom_synthesis': 'synthesizeWisdom',
  'daily_synthesis': 'getDailySynthesis',
  'personal_insights': 'getPersonalInsights',
  
  // Pattern recognition
  'pattern_recognition': 'recognizePatterns',
  'expose_contradictions': 'recognizePatterns', // Alias to existing pattern recognition
  
  // Standing tall
  'standing_tall_practice': 'standingTallPractice',
  
  // Values
  'values_clarification': 'clarifyValues',
  
  // Creativity
  'creativity_unleash': 'unleashCreativity',
  
  // Abundance
  'abundance_cultivate': 'cultivateAbundance',
  
  // Transitions
  'transitions_navigate': 'navigateTransitions',
  
  // Ancestry
  'ancestry_heal': 'healAncestry',
  
  // Dreams
  'interpret_dream': 'interpretDream',
  
  // Energy
  'optimize_energy': 'optimizeEnergy',
  
  // System
  'system_health_check': 'systemHealthCheck',
  'system_readiness': 'systemHealthCheck',
  'systemReadiness': 'systemHealthCheck',
  
  // Discovery
  'generate_discovery_inquiry': 'generateDiscoveryInquiry',
  
  // Feedback
  'submit_feedback': 'submitFeedback',
  
  // Commitments
  'manage_commitment': 'manageCommitment',
  'list_active_commitments': 'listActiveCommitments',
  
  // Legacy aliases for cleanup
  'memoryRetrieval': 'ragMemoryConsolidation',
  'searchR2': 'ragMemoryConsolidation',
  
  // Additional implementation aliases found in code
  'generateJournalInsight': 'generateJournalInsight',
  'getConversationAnalytics': 'getPersonalInsights',
  'exportConversationData': 'retrieveLogsOrDataEntries',
  'globalErrorHandler': 'systemHealthCheck',
  'scheduledTriggerError': 'systemHealthCheck',
  'logEntry': 'logDataOrEvent',
  'retrieveLogs': 'retrieveLogsOrDataEntries',
  'writeLog': 'logDataOrEvent',
  'getLatestLogs': 'retrieveLogsOrDataEntries',
  'getInsights': 'getPersonalInsights',
  'getMetrics': 'systemHealthCheck',
  'getAnalytics': 'getPersonalInsights',
  'trackMood': 'trackMoodAndEmotions',
  'exportConversation': 'retrieveLogsOrDataEntries',
  'generateInquiry': 'generateDiscoveryInquiry',
  'extractWisdom': 'extractMediaWisdom',
  'navigateTransition': 'navigateTransitions',
  'healthCheck': 'systemHealthCheck',
  'readinessCheck': 'systemHealthCheck',
  'listR2Objects': 'retrieveLogsOrDataEntries',
  
  // Session initialization (legacy alias)
  'sessionInit': 'retrieveLogsOrDataEntries',
  
  // ARK enhanced logging operations (map to existing canonical operations)
  'arkEnhancedLog': 'logDataOrEvent',
  'arkEnhancedRetrieve': 'retrieveLogsOrDataEntries',
  'arkEnhancedMemories': 'getPersonalInsights',
  'arkEnhancedVector': 'getPersonalInsights',
  'arkEnhancedResonance': 'ragMemoryConsolidation',
  'arkSystemStatus': 'systemHealthCheck',
  'arkAdvancedFilter': 'getPersonalInsights',
  'arkAutonomousLog': 'logDataOrEvent',
  
  // Extracted logging endpoints (map to appropriate canonical operations)
  'kvWrite': 'logDataOrEvent',
  'd1Insert': 'logDataOrEvent',
  'promote': 'logDataOrEvent',
  'promoteLog': 'logDataOrEvent',
  'retrieve': 'retrieveLogsOrDataEntries',
  'retrieveLatest': 'retrieveLogsOrDataEntries',
  'retrieveLatestLogs': 'retrieveLogsOrDataEntries',
  'retrievalMeta': 'retrieveLogsOrDataEntries',
  'updateRetrievalMetadata': 'retrieveLogsOrDataEntries',
  'retrieveRecentSessionLogs': 'retrieveLogsOrDataEntries',
  
  // Other implementation variants detected by guard
  'comprehensivePersonalDevelopment': 'somaticHealingSession',
  'personalDevelopmentSession': 'somaticHealingSession',
  'getWisdomAndInsights': 'getPersonalInsights',
  'autoSuggestRitual': 'generateRitualSuggestion',
  'ritualAutoSuggest': 'generateRitualSuggestion',
  'handleRitualSuggestion': 'generateRitualSuggestion',
  'autonomousPatternDetect': 'recognizePatterns',
  'transformation_contract': 'manageCommitment',
  'getMonitoringMetrics': 'systemHealthCheck',
  'socraticQuestions': 'generateDiscoveryInquiry',
  'combBehavioralAnalysis': 'recognizePatterns',
  'getKVStoredData': 'retrieveLogsOrDataEntries',
  'getR2Object': 'retrieveLogsOrDataEntries',
  'putR2Object': 'logDataOrEvent',
  'searchResonance': 'ragMemoryConsolidation',
  'vectorFlowTest': 'systemHealthCheck',
  'vector_flow_test': 'systemHealthCheck',
  'vectorDebug': 'systemHealthCheck',
  'vector_debug': 'systemHealthCheck',
  'vectorQuery': 'ragMemoryConsolidation',
  'vector_query': 'ragMemoryConsolidation',
  'exportConversationGet': 'retrieveLogsOrDataEntries',
  
  // New operation aliases for complete schema coverage
  'track_mood_and_emotions': 'trackMoodAndEmotions',
  'set_personal_goals': 'setPersonalGoals',
  'design_habits': 'designHabits',
  'query_d1_database': 'queryD1Database',
  'store_in_kv': 'storeInKV',
  'upsert_vectors': 'upsertVectors',
  'advanced_logging_operations': 'logDataOrEvent'
};

/**
 * Convert any operation name to canonical form
 * @param {string} op - Operation name (canonical, alias, or unknown)
 * @returns {string} Canonical operation name or original if not found
 */
export function toCanonical(op) {
  // If already canonical, keep it
  if (OP_CANON[op]) {
    return op;
  }
  
  // If it's an alias, map to canonical
  if (OP_ALIASES[op]) {
    return OP_ALIASES[op];
  }
  
  // Return original if not found (preserves unknown operations)
  return op;
}

/**
 * Check if an operation name is canonical
 * @param {string} op - Operation name to check
 * @returns {boolean} True if canonical, false if alias or unknown
 */
export function isCanonical(op) {
  return !!OP_CANON[op];
}

/**
 * Get all canonical operation names
 * @returns {string[]} Array of canonical operation names
 */
export function getAllCanonical() {
  return Object.keys(OP_CANON);
}

/**
 * Get all alias operation names
 * @returns {string[]} Array of alias operation names  
 */
export function getAllAliases() {
  return Object.keys(OP_ALIASES);
}