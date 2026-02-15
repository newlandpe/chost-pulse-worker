import { Storage } from '../../core/storage';

export class CloudflareKVStorage implements Storage {
  constructor(private kv: KVNamespace) {}
  async get(key: string) { return await this.kv.get(key); }
  async put(key: string, value: string, ttl?: number) {
    await this.kv.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
  }
  async delete(key: string) { await this.kv.delete(key); }
}
