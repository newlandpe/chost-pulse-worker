import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleHeartbeat } from './handlers/heartbeat';
import { handleBadge } from './handlers/badge';
import type { Storage } from './storage';

export type AppEnv = {
  Variables: {
    storage: Storage;
  };
};

const app = new Hono<AppEnv>();

// Global Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Health Check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// Heartbeat API
app.post('/api/heartbeat', async (c) => {
  const storage = c.get('storage');
  const response = await handleHeartbeat(c.req.raw, storage, {});
  return response;
});

// Badge API
app.get('/api/badge', async (c) => {
  const storage = c.get('storage');
  const response = await handleBadge(c.req.raw, storage, {});
  return response;
});

export { app };
