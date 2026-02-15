import { handleHeartbeat } from '../handlers/heartbeat';
import { handleBadge } from '../handlers/badge';
import { NetlifyBlobsStorage } from '../storage/netlify-blobs';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: any, res: any) {
  // Handle Web API (Netlify Edge/Standard)
  if (typeof Request !== 'undefined' && req instanceof Request) {
    return handleWebConnection(req);
  }

  // Handle Node.js req/res (Netlify Functions)
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

    const webReq = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers as any),
      body: req.method === 'POST' ? req : null,
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
      res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
    }
  }
}

async function handleWebConnection(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
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

  const blob = await import('@netlify/blobs').then(m => 
    m.getStore({ name: 'pulse' })
  );
  
  const storage = new NetlifyBlobsStorage(blob);

  if (url.pathname === '/api/heartbeat' && request.method === 'POST') {
    return handleHeartbeat(request, storage, CORS_HEADERS);
  }

  if (url.pathname === '/api/badge' && request.method === 'GET') {
    return handleBadge(request, storage, CORS_HEADERS);
  }

  return new Response('Not Found', {
    status: 404,
    headers: CORS_HEADERS,
  });
}
