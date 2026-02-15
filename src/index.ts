import { app } from './core/app';
import { handle as vercelHandle } from 'hono/vercel';
import { handle as netlifyHandle } from 'hono/netlify';
import { CloudflareKVStorage } from './infrastructure/storage/cloudflare';
import { RedisStorage } from './infrastructure/storage/vercel';
import { NetlifyBlobsStorage } from './infrastructure/storage/netlify';

// Platform detection and Storage injection middleware
app.use('*', async (c, next) => {
  // 1. Cloudflare Workers logic
  if (c.env && (c.env as any).PULSE_KV) {
    c.set('storage', new CloudflareKVStorage((c.env as any).PULSE_KV));
  }
  // 2. Vercel / Redis logic
  else if (process.env.REDIS_URL) {
    c.set('storage', new RedisStorage(process.env.REDIS_URL));
  }
  // 3. Netlify logic
  else {
    try {
      const { getStore } = await import('@netlify/blobs');
      c.set('storage', new NetlifyBlobsStorage(getStore({ name: 'pulse' })));
    } catch (e) {
      // Fallback for local dev or misconfiguration
    }
  }
  await next();
});

// Cloudflare Workers - export default
export default app;

// Vercel Edge/Serverless - export default handle
export const vercelHandler = vercelHandle(app);

// Netlify Functions - export const handler
export const netlifyHandler = netlifyHandle(app);

// Handle Vercel default export if needed
const handler = vercelHandle(app);
export { handler };
