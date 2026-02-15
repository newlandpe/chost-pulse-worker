import { Storage } from '../../core/storage';
import { Redis } from '@upstash/redis';

export class VercelRedisStorage implements Storage {
  private redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redis.get(key);
    return value ? String(value) : null;
  }

  async put(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, { ex: ttl });
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
