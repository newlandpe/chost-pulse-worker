import { handleHeartbeat } from './handlers/heartbeat';
import { handleBadge } from './handlers/badge';

export interface Env {
  PULSE_KV: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Route handling
    if (url.pathname === '/api/heartbeat' && request.method === 'POST') {
      return handleHeartbeat(request, env, corsHeaders);
    }

    if (url.pathname === '/api/badge' && request.method === 'GET') {
      return handleBadge(request, env, corsHeaders);
    }

    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: Date.now() }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 404 for unknown routes
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders,
    });
  },
};
