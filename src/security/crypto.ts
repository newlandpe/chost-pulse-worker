/**
 * Derives a public ID from a secret token using SHA-256
 */
async function getWebCrypto(): Promise<Crypto> {
  if (globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }

  try {
    const nodeCrypto = await import('node:crypto');
    if (nodeCrypto.webcrypto) {
      return nodeCrypto.webcrypto as unknown as Crypto;
    }
  } catch {
    // ignore and throw below
  }

  throw new Error('Web Crypto API is not available');
}

export async function derivePublicId(secretToken: string): Promise<string> {
  // Remove prefix
  const cleanToken = secretToken.replace('sk_live_', '');

  // Hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanToken);
  const webCrypto = await getWebCrypto();
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', data);

  // Convert to hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Return first 12 characters with prefix
  return 'srv_pub_' + hashHex.substring(0, 12);
}

/**
 * Hash a string using SHA-256
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const webCrypto = await getWebCrypto();
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
