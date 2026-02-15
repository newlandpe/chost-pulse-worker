import { app } from '../core/app';
import { NetlifyBlobsStorage } from '../infrastructure/storage/netlify';

// Inject storage via middleware specifically for Netlify
app.use('*', async (c, next) => {
  if (!c.get('storage')) {
    try {
      // @ts-ignore
      const { getStore } = await import('@netlify/blobs');
      const store = getStore({ name: 'pulse' });
      c.set('storage', new NetlifyBlobsStorage(store));
    } catch (e) {
      console.error('Netlify Blobs injection failed:', e);
    }
  }
  await next();
});

export const handler = async (event: any, context: any) => {
  try {
    // Construct a valid URL from Netlify event
    const host = event.headers.host || 'localhost';
    const protocol = event.headers['x-forwarded-proto'] || 'http';
    const url = new URL(event.path, `${protocol}://${host}`);
    
    if (event.queryStringParameters) {
      for (const [key, value] of Object.entries(event.queryStringParameters)) {
        if (value) url.searchParams.append(key, value as string);
      }
    }

    // Create Web Standard Request
    const request = new Request(url.toString(), {
      method: event.httpMethod,
      headers: new Headers(event.headers),
      body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : undefined,
    });

    // Fetch from Hono app
    const response = await app.fetch(request, { event, context });

    // Map Web Response back to Netlify format
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: await response.text(),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Netlify Adapter Error', message: error.message }),
    };
  }
};
