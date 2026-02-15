import { handleHeartbeat } from '../handlers/heartbeat';
import { handleBadge } from '../handlers/badge';
import { NetlifyBlobsStorage } from '../storage/netlify-blobs';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event: any, context: any) => {
  // Extract information from Netlify event
  const { path, httpMethod, headers, body, queryStringParameters } = event;
  
  // Normalize path (remove /.netlify/functions/index if present)
  let normalizedPath = path.replace('/.netlify/functions/index', '');
  if (normalizedPath === '') normalizedPath = '/';

  // Fast path for health check
  if (normalizedPath === '/health' && httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ok', timestamp: Date.now() })
    };
  }

  try {
    // Construct Web Standard Request for handlers
    const protocol = headers['x-forwarded-proto'] || 'http';
    const host = headers['host'] || 'localhost';
    const url = new URL(path, `${protocol}://${host}`);
    
    // Add query parameters to URL
    if (queryStringParameters) {
      Object.keys(queryStringParameters).forEach(key => {
        url.searchParams.append(key, queryStringParameters[key]);
      });
    }

    const webReq = new Request(url.toString(), {
      method: httpMethod,
      headers: new Headers(headers as any),
      body: httpMethod === 'POST' ? body : null,
    });

    const response = await handleWebConnection(webReq);
    
    // Convert Web Standard Response to Netlify Object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: await response.text()
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
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

  const blob = await import('@netlify/blobs').then(m => 
    m.getStore({ name: 'pulse' })
  );
  
  const storage = new NetlifyBlobsStorage(blob);

  if ((url.pathname === '/api/heartbeat' || url.pathname.endsWith('/api/heartbeat')) && request.method === 'POST') {
    return handleHeartbeat(request, storage, CORS_HEADERS);
  }

  if ((url.pathname === '/api/badge' || url.pathname.endsWith('/api/badge')) && request.method === 'GET') {
    return handleBadge(request, storage, CORS_HEADERS);
  }

  return new Response('Not Found', {
    status: 404,
    headers: CORS_HEADERS,
  });
}
