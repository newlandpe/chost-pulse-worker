import { handle } from 'hono/vercel';
import { app } from '../app';
import { VercelKVStorage } from '../storage/vercel-kv';
import Redis from 'ioredis';

export const runtime = 'edge';

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  }
  return redisClient;
}

app.use('*', async (c, next) => {
  if (c.req.path.includes('/api/')) {
    const client = getRedisClient();
    if (client) {
      c.set('storage', new VercelKVStorage(client));
    }
  }
  await next();
});

export default handle(app);
