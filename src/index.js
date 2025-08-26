import { Router } from 'itty-router';
import { handleArkEndpoints } from './ark/endpoints.js';

/**
 * Helper to create JSON responses.
 * If an Error is passed, its message is wrapped in `{ error: message }`.
 */
export function send(status, data) {
  const payload = data instanceof Error ? { error: data.message } : data;
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

const router = Router();

// Mount ARK endpoints under /api
router.all('/api/*', (request, env) => handleArkEndpoints(request, env));

// Fallback for unmatched routes
router.all('*', () => send(404, { error: 'not_found' }));

export default {
  fetch(request, env, ctx) {
    return router.handle(request, env, ctx).catch((err) => send(500, err));
  }
};
