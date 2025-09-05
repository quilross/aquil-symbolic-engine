/**
 * Canonical Operation Aliases
 * Maps between canonical operationIds (schema camelCase) and implementation variants (snake_case, legacy)
 */

// Canonical = the 30 schema operationIds (camelCase)
export const OP_CANON = {
  // Core logging and retrieval
  logDataOrEvent: 'logDataOrEvent',
  retrieveLogsOrDataEntries: 'retrieveLogsOrDataEntries', 
  retrieveRecentSessionLogs: 'retrieveRecentSessionLogs',
  
  // R2 storage operations
  retrieveR2StoredContent: 'retrieveR2StoredContent',
  getR2StoredContent: 'getR2StoredContent',
  
  // Search operations
  searchLogs: 'searchLogs',
  ragSearch: 'ragSearch',
  searchR2Storage: 'searchR2Storage',
  
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
  getPersonalInsights: 'getPersonalInsights',
  
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
  updateCommitmentProgress: 'updateCommitmentProgress'
};

// Aliases = implementation variants (snake_case, legacy) → canonical
export const OP_ALIASES = {
  // Logging operations
  'log_data_or_event': 'logDataOrEvent',
  'retrieve_logs_or_data_entries': 'retrieveLogsOrDataEntries',
  'retrieve_recent_session_logs': 'retrieveRecentSessionLogs',
  
  // R2 storage operations
  'retrieve_r2_stored_content': 'retrieveR2StoredContent',
  'get_r2_stored_content': 'getR2StoredContent',
  
  // Search operations
  'search_logs': 'searchLogs',
  'rag_search': 'ragSearch',
  'search_r2_storage': 'searchR2Storage',
  
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
  
  // Discovery
  'generate_discovery_inquiry': 'generateDiscoveryInquiry',
  
  // Feedback
  'submit_feedback': 'submitFeedback',
  
  // Commitments
  'manage_commitment': 'manageCommitment',
  'list_active_commitments': 'listActiveCommitments',
  'update_commitment_progress': 'updateCommitmentProgress',
  
  // Legacy aliases for cleanup
  'memoryRetrieval': 'ragMemoryConsolidation',
  'searchR2': 'searchR2Storage',
  
  // Session initialization (legacy alias)
  'sessionInit': 'retrieveRecentSessionLogs',
  
  // ARK enhanced logging operations (map to existing canonical operations)
  'arkEnhancedLog': 'logDataOrEvent',
  'arkEnhancedRetrieve': 'retrieveLogsOrDataEntries',
  'arkEnhancedMemories': 'retrieveR2StoredContent',
  'arkEnhancedVector': 'ragSearch',
  'arkEnhancedResonance': 'ragMemoryConsolidation',
  'arkSystemStatus': 'systemHealthCheck',
  'arkAdvancedFilter': 'searchLogs',
  'arkAutonomousLog': 'logDataOrEvent',
  
  // Extracted logging endpoints (map to appropriate canonical operations)
  'kvWrite': 'logDataOrEvent',
  'd1Insert': 'logDataOrEvent',
  'promote': 'logDataOrEvent',
  'retrieve': 'retrieveLogsOrDataEntries',
  'retrieveLatest': 'retrieveLogsOrDataEntries',
  'retrievalMeta': 'retrieveLogsOrDataEntries',
  
  // Other implementation variants detected by guard
  'comprehensivePersonalDevelopment': 'somaticHealingSession',
  'personalDevelopmentSession': 'somaticHealingSession',
  'getWisdomAndInsights': 'getPersonalInsights',
  'autoSuggestRitual': 'somaticHealingSession',
  'autonomousPatternDetect': 'recognizePatterns',
  'transformation_contract': 'manageCommitment',
  'getMonitoringMetrics': 'systemHealthCheck',
  'socraticQuestions': 'generateDiscoveryInquiry',
  'combBehavioralAnalysis': 'recognizePatterns',
  'getKVStoredData': 'retrieveLogsOrDataEntries',
  'searchResonance': 'searchR2Storage'
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