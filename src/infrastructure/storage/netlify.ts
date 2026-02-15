import type { BlobStore } from '@netlify/blobs';
import type { Storage } from './index';

export class NetlifyBlobsStorage implements Storage {
  constructor(private blob: BlobStore) {}

  async get(key: string): Promise<string | null> {
    const result = await this.blob.get(key);
    if (!result) {
      return null;
    }
    return result.text();
  }

  async put(key: string, value: string, ttl?: number): Promise<void> {
    await this.blob.set(key, value, ttl ? { ttl } : undefined);
  }

  async delete(key: string): Promise<void> {
    await this.blob.delete(key);
  }
}
