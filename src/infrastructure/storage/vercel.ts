import { Storage } from '../../core/storage';
import Redis from 'ioredis';

export class RedisStorage implements Storage {
  private redis: Redis;
  constructor(url: string) { this.redis = new Redis(url); }
  async get(key: string) { return await this.redis.get(key); }
  async put(key: string, value: string, ttl?: number) {
    if (ttl) await this.redis.set(key, value, 'EX', ttl);
    else await this.redis.set(key, value);
  }
  async delete(key: string) { await this.redis.del(key); }
}
