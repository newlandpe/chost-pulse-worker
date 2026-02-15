import { app } from '../core/app';
import { CloudflareKVStorage } from '../infrastructure/storage/cloudflare';

app.use('*', async (c, next) => {
  if (c.env && (c.env as any).PULSE_KV) c.set('storage', new CloudflareKVStorage((c.env as any).PULSE_KV));
  await next();
});

export default app;
