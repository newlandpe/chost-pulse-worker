import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleHeartbeat } from './handlers/heartbeat';
import { handleBadge } from './handlers/badge';
import type { Storage } from './storage';

export type AppEnv = {
  Variables: {
    storage: Storage;
  };
};

const app = new Hono<AppEnv>();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

app.post('/api/heartbeat', async (c) => {
  const storage = c.get('storage');
  return handleHeartbeat(c.req.raw, storage, {});
});

app.get('/api/badge', async (c) => {
  const storage = c.get('storage');
  return handleBadge(c.req.raw, storage, {});
});

export { app };
