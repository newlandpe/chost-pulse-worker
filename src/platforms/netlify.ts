import { handle } from 'hono/netlify';
import { app } from '../core/app';
import { NetlifyBlobsStorage } from '../infrastructure/storage/netlify';

app.use('*', async (c, next) => {
  try {
    const { getStore } = await import('@netlify/blobs');
    c.set('storage', new NetlifyBlobsStorage(getStore({ name: 'pulse' })));
  } catch (e) {}
  await next();
});

export const handler = handle(app);
