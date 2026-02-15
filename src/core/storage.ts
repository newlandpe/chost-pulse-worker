export interface Storage {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
