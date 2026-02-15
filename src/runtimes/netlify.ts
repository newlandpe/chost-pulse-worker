import { handle } from 'hono/netlify';
import { app } from '../core/app';
import { NetlifyBlobsStorage } from '../infrastructure/storage/netlify';

app.use('*', async (c, next) => {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: 'pulse' });
    c.set('storage', new NetlifyBlobsStorage(store));
  } catch (e) {
    // Local dev or misconfigured
  }
  await next();
});

export const handler = handle(app);
