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

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Helper to get CORS headers from Hono context
const getCorsHeaders = (c: any) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

app.post('/api/heartbeat', async (c) => {
  const storage = c.get('storage');
  if (!storage) return c.json({ error: 'Storage not initialized' }, 500);
  return handleHeartbeat(c.req.raw, storage, getCorsHeaders(c));
});

app.get('/api/badge', async (c) => {
  const storage = c.get('storage');
  if (!storage) return c.json({ error: 'Storage not initialized' }, 500);
  return handleBadge(c.req.raw, storage, getCorsHeaders(c));
});

export { app };
