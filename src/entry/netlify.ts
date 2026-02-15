import { handle } from 'hono/netlify';
import { app } from '../app';
import { NetlifyBlobsStorage } from '../storage/netlify-blobs';

app.use('/api/*', async (c, next) => {
  const blob = await import('@netlify/blobs').then(m => 
    m.getStore({ name: 'pulse' })
  );
  c.set('storage', new NetlifyBlobsStorage(blob));
  await next();
});

export const handler = handle(app);
