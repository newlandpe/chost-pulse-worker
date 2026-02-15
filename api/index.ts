import { handle } from 'hono/vercel';
import { app } from '../src/core/app';
import { RedisStorage } from '../src/infrastructure/storage/vercel';

export const runtime = 'edge';

app.use('*', async (c, next) => {
  if (process.env.REDIS_URL) c.set('storage', new RedisStorage(process.env.REDIS_URL));
  await next();
});

export default handle(app);
