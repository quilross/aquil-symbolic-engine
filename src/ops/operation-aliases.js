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
  getMonitoringMetrics: 'getMonitoringMetrics',
  
  // Discovery and questions
  generateDiscoveryInquiry: 'generateDiscoveryInquiry',
  socraticQuestions: 'socraticQuestions',
  
  // Feedback
  submitFeedback: 'submitFeedback',
  
  // Commitments
  manageCommitment: 'manageCommitment',
  listActiveCommitments: 'listActiveCommitments',
  updateCommitmentProgress: 'updateCommitmentProgress',
  
  // Autonomy and rituals
  autoSuggestRitual: 'autoSuggestRitual',
  autonomousPatternDetect: 'autonomousPatternDetect',
  
  // Transformation contracts
  transformation_contract: 'transformation_contract', // Note: this one stays snake_case in schema
  
  // Behavioral analysis
  combBehavioralAnalysis: 'combBehavioralAnalysis'
};

// Aliases = implementation variants (snake_case, legacy) → canonical
export const OP_ALIASES = {
  // Logging operations
  'log_data_or_event': 'logDataOrEvent',
  'retrieve_logs_or_data_entries': 'retrieveLogsOrDataEntries',
  'retrieve_recent_session_logs': 'retrieveRecentSessionLogs',
  
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
  'get_monitoring_metrics': 'getMonitoringMetrics',
  
  // Discovery
  'generate_discovery_inquiry': 'generateDiscoveryInquiry',
  'socratic_questions': 'socraticQuestions',
  
  // Feedback
  'submit_feedback': 'submitFeedback',
  
  // Commitments
  'manage_commitment': 'manageCommitment',
  'list_active_commitments': 'listActiveCommitments',
  'update_commitment_progress': 'updateCommitmentProgress',
  
  // Autonomy
  'auto_suggest_ritual': 'autoSuggestRitual',
  'autonomous_pattern_detect': 'autonomousPatternDetect',
  
  // Behavioral analysis
  'comb_behavioral_analysis': 'combBehavioralAnalysis'
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