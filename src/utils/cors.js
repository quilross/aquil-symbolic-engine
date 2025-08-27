/**
 * CORS utilities for Aquil's Cloudflare Workers
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

export function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function addCORSHeaders(response) {
  Object.keys(corsHeaders).forEach((key) => {
    response.headers.set(key, corsHeaders[key]);
  });
  return response;
}
