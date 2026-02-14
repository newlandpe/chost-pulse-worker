import type { KVNamespace } from '@cloudflare/workers-types';
import type { Storage } from './index';

export class CloudflareKVStorage implements Storage {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<string | null> {
    return this.kv.get(key);
  }

  async put(key: string, value: string, ttl?: number): Promise<void> {
    const options = ttl ? { expirationTtl: ttl } : undefined;
    await this.kv.put(key, value, options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
