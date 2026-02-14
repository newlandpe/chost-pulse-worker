import { handleHeartbeat } from '../handlers/heartbeat';
import { handleBadge } from '../handlers/badge';
import { VercelKVStorage } from '../storage/vercel-kv';
import { createClient } from '@vercel/kv';

export const runtime = 'edge';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(request: Request): Promise<Response> {
  const kv = createClient({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
  
  const storage = new VercelKVStorage(kv);
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
