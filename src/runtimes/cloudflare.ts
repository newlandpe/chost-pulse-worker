import { app } from '../core/app';
import { CloudflareKVStorage } from '../infrastructure/storage/cloudflare';

interface Env {
  PULSE_KV: KVNamespace;
}

app.use('*', async (c, next) => {
  const env = c.env as Env;
  if (env?.PULSE_KV) {
    c.set('storage', new CloudflareKVStorage(env.PULSE_KV));
  }
  await next();
});

export default app;
