import type { KvValue } from '@vercel/kv';
import type { Storage } from './index';

export class VercelKVStorage implements Storage {
  constructor(private kv: { get: (key: string) => Promise<KvValue>; set: (key: string, value: string, options?: { ex?: number }) => Promise<void>; del: (key: string) => Promise<number> }) {}

  async get(key: string): Promise<string | null> {
    const value = await this.kv.get(key);
    if (value === null || value === undefined) {
      return null;
    }
    return String(value);
  }

  async put(key: string, value: string, ttl?: number): Promise<void> {
    const options = ttl ? { ex: ttl } : undefined;
    await this.kv.set(key, value, options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.del(key);
  }
}
