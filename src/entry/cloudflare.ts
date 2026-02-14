import { handleHeartbeat } from '../handlers/heartbeat';
import { handleBadge } from '../handlers/badge';
import { CloudflareKVStorage } from '../storage/cloudflare-kv';

export interface Env {
  PULSE_KV: KVNamespace;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function fetch(request: Request, env: Env): Promise<Response> {
  const storage = new CloudflareKVStorage(env.PULSE_KV);
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (url.pathname === '/api/heartbeat' && request.method === 'POST') {
    return handleHeartbeat(request, storage, CORS_HEADERS);
  }

  if (url.pathname === '/api/badge' && request.method === 'GET') {
    return handleBadge(request, storage, CORS_HEADERS);
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: Date.now() }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response('Not Found', {
    status: 404,
    headers: CORS_HEADERS,
  });
}

export default { fetch };
