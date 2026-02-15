import { handle } from '@hono/node-server/vercel';
import { app } from '../src/core/app';
import { RedisStorage } from '../src/infrastructure/storage/vercel';

// This middleware MUST run before the routes in app.ts
app.use('/api/*', async (c, next) => {
  const url = process.env.REDIS_URL;
  if (url) {
    c.set('storage', new RedisStorage(url));
  }
  await next();
});

export default handle(app);
