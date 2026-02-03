/// <reference types="node" />

import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
}
