import { handle } from '@hono/node-server/vercel';
import { app } from '../core/app';
import { RedisStorage } from '../infrastructure/storage/vercel';

app.use('/api/*', async (c, next) => {
  const url = process.env.REDIS_URL;
  if (!url) return c.json({ error: 'REDIS_URL missing' }, 500);
  c.set('storage', new RedisStorage(url));
  await next();
});

export default handle(app);
