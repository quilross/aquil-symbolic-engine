/**
 * Soft-boost retrieval results based on Gene Keys (GK) tags
 * @param {Array} results - Array of result objects with score and metadata
 * @param {string|null} gk - Gene Key identifier (e.g., "gk_28")
 * @param {string|null} state - GK state (e.g., "shadow", "gift")
 * @returns {Array} - Results with boosted scores where tags match
 */
export function boostByGK(results, gk, state) {
  if (!results || !Array.isArray(results) || !gk || !state) {
    return results
  }

  const boostFactor = 1.2

  return results.map(result => {
    if (result.metadata && result.metadata.tags) {
      const tags = Array.isArray(result.metadata.tags) ? result.metadata.tags : [result.metadata.tags]
      
      // Check if tags include the GK and state
      const hasGKTag = tags.some(tag => 
        typeof tag === 'string' && tag.toLowerCase() === gk.toLowerCase()
      )
      const hasStateTag = tags.some(tag => 
        typeof tag === 'string' && tag.toLowerCase() === state.toLowerCase()
      )
      
      if (hasGKTag && hasStateTag && result.score) {
        return {
          ...result,
          score: result.score * boostFactor
        }
      }
    }
    
    return result
  })
}