const PREFIX_SECRET = 'sk_live_';
const MIN_LENGTH = 40;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Validates that a secret token matches the expected format. */
export function validateSecretToken(token: string): boolean {
  // Check null or empty
  if (!token || token.length === 0) {
    return false;
  }

  // Check prefix
  if (!token.startsWith(PREFIX_SECRET)) {
    return false;
  }

  // Check minimum length
  if (token.length < MIN_LENGTH) {
    return false;
  }

  // Check format (should be sk_live_ + UUID)
  const uuid = token.substring(PREFIX_SECRET.length);
  return UUID_PATTERN.test(uuid);
}

/** Validates that a public ID matches the expected format. */
export function validatePublicId(publicId: string): boolean {
  if (!publicId || publicId.length === 0) {
    return false;
  }

  if (!publicId.startsWith('srv_pub_')) {
    return false;
  }

  // Should be srv_pub_ + 12 hex characters
  const hash = publicId.substring(8);
  return /^[0-9a-f]{12}$/i.test(hash);
}
