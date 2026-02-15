import { handle } from 'hono/vercel';
import { app } from '../core/app';
import { VercelRedisStorage } from '../infrastructure/storage/vercel';

export const runtime = 'edge';

app.use('*', async (c, next) => {
  if (c.req.path.includes('/api/')) {
    c.set('storage', new VercelRedisStorage());
  }
  await next();
});

export default handle(app);
