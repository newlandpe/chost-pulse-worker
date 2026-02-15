import { app } from '../app';
import { CloudflareKVStorage } from '../storage/cloudflare-kv';

interface Env {
  PULSE_KV: KVNamespace;
}

app.use('/api/*', async (c, next) => {
  const env = c.env as Env;
  c.set('storage', new CloudflareKVStorage(env.PULSE_KV));
  await next();
});

export default app;
