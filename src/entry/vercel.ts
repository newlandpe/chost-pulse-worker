import { handle } from '@hono/node-server/vercel';
import { app } from '../core/app';
import { VercelKVStorage } from '../infrastructure/storage/vercel';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  }
  return redisClient;
}

app.use('/api/*', async (c, next) => {
  const client = getRedisClient();
  if (!client) return c.json({ error: 'Redis configuration missing' }, 500);
  c.set('storage', new VercelKVStorage(client));
  await next();
});

export default handle(app);
