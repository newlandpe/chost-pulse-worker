import { Storage } from '../../core/storage';

export class NetlifyBlobsStorage implements Storage {
  constructor(private store: any) {}
  async get(key: string) { return await this.store.get(key); }
  async put(key: string, value: string) { await this.store.set(key, value); }
  async delete(key: string) { await this.store.delete(key); }
}
