import { handle } from 'hono/netlify';
import { app } from '../core/app';
import { NetlifyBlobsStorage } from '../infrastructure/storage/netlify';

app.use('/api/*', async (c, next) => {
  const store = await import('@netlify/blobs').then(m => m.getStore({ name: 'pulse' }));
  c.set('storage', new NetlifyBlobsStorage(store));
  await next();
});

export const handler = handle(app);
