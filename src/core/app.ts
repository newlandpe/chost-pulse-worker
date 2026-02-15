import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleHeartbeat } from './handlers/heartbeat';
import { handleBadge } from './handlers/badge';
import type { Storage } from './storage';

export type AppEnv = {
  Variables: { storage: Storage };
};

const app = new Hono<AppEnv>();

app.use('*', logger());
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));

// Health Check - multiple paths for compatibility
const health = (c: any) => c.json({ status: 'ok', timestamp: Date.now() });
app.get('/health', health);
app.get('/api/health', health);

// Heartbeat API
app.post('/api/heartbeat', async (c) => {
  const storage = c.get('storage');
  return handleHeartbeat(c.req.raw, storage, {});
});

// Badge API
app.get('/api/badge', async (c) => {
  const storage = c.get('storage');
  return handleBadge(c.req.raw, storage, {});
});

// Fallback for Vercel rewrites where the path might become just '/'
app.get('/', health);

export { app };
