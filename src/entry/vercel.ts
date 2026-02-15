import { handleHeartbeat } from '../handlers/heartbeat';
import { handleBadge } from '../handlers/badge';
import { VercelKVStorage } from '../storage/vercel-kv';
import Redis from 'ioredis';

export const runtime = 'edge';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  }
  return redisClient;
}

export const handler = async (req: any, res: any) => {
  if (typeof Request !== 'undefined' && req instanceof Request && !res) {
    return handleWebConnection(req);
  }

  try {
    const host = req.headers['host'] || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const url = new URL(req.url!, `${protocol}://${host}`);

    if (url.pathname === '/health' && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
      return;
    }

    // Read body once for Node.js
    let body: any = null;
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const webReq = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers as any),
      body: body,
      // @ts-ignore
      duplex: 'half'
    });

    const response = await handleWebConnection(webReq);

    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    res.end(await response.text());
  } catch (error: any) {
    if (res && res.end) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
    }
  }
};

async function handleWebConnection(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (url.pathname === '/health' || url.pathname.endsWith('/health')) {
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: Date.now() }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  const client = getRedisClient();

  if (url.pathname.includes('/api/')) {
    if (!client) {
      return new Response(JSON.stringify({ error: 'Redis configuration missing' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const storage = new VercelKVStorage(client);

    if ((url.pathname === '/api/heartbeat' || url.pathname.endsWith('/api/heartbeat')) && request.method === 'POST') {
      return handleHeartbeat(request, storage, CORS_HEADERS);
    }

    if ((url.pathname === '/api/badge' || url.pathname.endsWith('/api/badge')) && request.method === 'GET') {
      return handleBadge(request, storage, CORS_HEADERS);
    }
  }

  return new Response('Not Found', {
    status: 404,
    headers: CORS_HEADERS,
  });
}

export default handler;
