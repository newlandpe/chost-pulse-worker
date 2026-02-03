import { handleHeartbeat } from './handlers/heartbeat';
import { handleBadge } from './handlers/badge';

/** Defines the environment bindings for this worker. */
export interface Env {
  PULSE_KV: KVNamespace;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Handles incoming HTTP requests for the worker. */
export async function fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Route handling
  if (url.pathname === '/api/heartbeat' && request.method === 'POST') {
    return handleHeartbeat(request, env, CORS_HEADERS);
  }

  if (url.pathname === '/api/badge' && request.method === 'GET') {
    return handleBadge(request, env, CORS_HEADERS);
  }

  // Health check endpoint
  if (url.pathname === '/health' && request.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: Date.now() }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  // 404 for unknown routes
  return new Response('Not Found', {
    status: 404,
    headers: CORS_HEADERS,
  });
}
