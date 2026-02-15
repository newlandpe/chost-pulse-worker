import { Storage } from '../../core/storage';

export class NetlifyBlobsStorage implements Storage {
  constructor(private store: any) {}

  async get(key: string): Promise<string | null> {
    return await this.store.get(key);
  }

  async put(key: string, value: string): Promise<void> {
    await this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }
}
