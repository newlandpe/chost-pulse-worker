/**
 * Derives a public ID from a secret token using SHA-256
 */
export async function derivePublicId(secretToken: string): Promise<string> {
  // Remove prefix
  const cleanToken = secretToken.replace('sk_live_', '');

  // Hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

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
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
