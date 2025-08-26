/**
 * Database action executor with whitelisted queries.
 *
 * Free-form SQL is not permitted; callers must provide a known query identifier
 * that maps to a prepared statement. Parameters are validated against
 * expected types before being bound to the statement.
 */

// Map of allowed query identifiers to their prepared SQL and schemas
const QUERY_MAP = {
  getUserProfile: {
    sql: 'SELECT * FROM user_profile WHERE id = ?',
    paramTypes: ['string'],
    method: 'first'
  },
  insertLog: {
    // Use the existing event_log table to avoid D1 errors when
    // metamorphic_logs is not present in the schema.
    sql: 'INSERT INTO event_log (id, type, payload) VALUES (?, ?, ?)',
    paramTypes: ['string', 'string', 'string'],
    method: 'run'
  }
};

function validateParams(params, schema) {
  if (!Array.isArray(params)) {
    throw new Error('Parameters must be an array');
  }
  if (params.length !== schema.length) {
    throw new Error('Incorrect number of parameters');
  }
  schema.forEach((type, idx) => {
    if (typeof params[idx] !== type) {
      throw new Error(`Parameter at index ${idx} must be of type ${type}`);
    }
  });
}

/**
 * Execute a whitelisted query by identifier.
 * @param {object} db - D1 database binding
 * @param {string} id - Identifier of the query to run
 * @param {Array} params - Parameters to bind to the query
 * @returns {Promise<any>} Result of the query execution
 */
export async function executeWhitelistedQuery(db, id, params = []) {
  const def = QUERY_MAP[id];
  if (!def) {
    throw new Error(`Unknown query identifier: ${id}`);
  }

  validateParams(params, def.paramTypes);

  const stmt = db.prepare(def.sql).bind(...params);

  switch (def.method) {
    case 'first':
      return stmt.first();
    case 'run':
      return stmt.run();
    case 'all':
    default:
      return stmt.all();
  }
}

// Export the query map for testing or extension
export const ALLOWED_QUERIES = Object.keys(QUERY_MAP);
