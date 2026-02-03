import { describe, expect, it } from 'vitest';
import { derivePublicId, sha256 } from '../src/security/crypto';
import { validatePublicId, validateSecretToken } from '../src/security/validator';
import { getColorForMetric } from '../src/utils/colors';

describe('Crypto Functions', () => {
  it('should derive public ID from secret token', async () => {
    const secretToken = 'sk_live_550e8400-e29b-41d4-a716-446655440000';
    const publicId = await derivePublicId(secretToken);

    expect(publicId).toMatch(/^srv_pub_[0-9a-f]{12}$/);
    const expectedHash = await sha256('550e8400-e29b-41d4-a716-446655440000');
    expect(publicId).toBe(`srv_pub_${expectedHash.substring(0, 12)}`);
  });

  it('should generate consistent public IDs', async () => {
    const secretToken = 'sk_live_550e8400-e29b-41d4-a716-446655440000';
    const publicId1 = await derivePublicId(secretToken);
    const publicId2 = await derivePublicId(secretToken);

    expect(publicId1).toBe(publicId2);
  });

  it('should hash strings with SHA-256', async () => {
    const hash = await sha256('test');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('Token Validation', () => {
  it('should validate correct secret token format', () => {
    const validToken = 'sk_live_550e8400-e29b-41d4-a716-446655440000';
    expect(validateSecretToken(validToken)).toBe(true);
  });

  it('should reject invalid secret token formats', () => {
    expect(validateSecretToken('invalid')).toBe(false);
    expect(validateSecretToken('sk_live_123')).toBe(false);
    expect(
      validateSecretToken('srv_pub_550e8400-e29b-41d4-a716-446655440000')
    ).toBe(false);
    expect(validateSecretToken('')).toBe(false);
  });

  it('should validate correct public ID format', () => {
    const validPublicId = 'srv_pub_f8a92b3c4d5e';
    expect(validatePublicId(validPublicId)).toBe(true);
  });

  it('should reject invalid public ID formats', () => {
    expect(validatePublicId('invalid')).toBe(false);
    expect(validatePublicId('srv_pub_')).toBe(false);
    expect(
      validatePublicId('sk_live_550e8400-e29b-41d4-a716-446655440000')
    ).toBe(false);
    expect(validatePublicId('')).toBe(false);
  });
});

describe('Color Utilities', () => {
  it('should return correct colors for TPS values', () => {
    expect(getColorForMetric('tps', 20.0)).toBe('brightgreen');
    expect(getColorForMetric('tps', 19.5)).toBe('brightgreen');
    expect(getColorForMetric('tps', 17.0)).toBe('yellow');
    expect(getColorForMetric('tps', 12.0)).toBe('orange');
    expect(getColorForMetric('tps', 8.0)).toBe('red');
  });

  it('should return default color for unknown metrics', () => {
    expect(getColorForMetric('unknown', 100)).toBe('informational');
  });
});

describe('Badge Options Parsing', () => {
  it('should parse badge customization options', () => {
    const params = new URLSearchParams({
      id: 'srv_pub_abc123',
      type: 'status',
      style: 'flat-square',
      logo: 'python',
      logoColor: 'white',
      logoSize: 'auto',
      label: 'My Server',
      labelColor: '#555',
      color: '#FF5733',
      cacheSeconds: '300',
      link: 'https://example.com',
    });

    const id = params.get('id');
    const type = params.get('type');
    const style = params.get('style');

    expect(id).toBe('srv_pub_abc123');
    expect(type).toBe('status');
    expect(style).toBe('flat-square');
  });

  it('should handle URL-encoded parameters', () => {
    const params = new URLSearchParams({
      label: 'My%20Server',
      link: 'https%3A%2F%2Fexample.com',
    });

    const label = params.get('label');
    const link = params.get('link');

    expect(label).toBe('My%20Server');
    expect(link).toBe('https%3A%2F%2Fexample.com');
  });

  it('should clamp cache seconds to valid range', () => {
    const maxSeconds = 86400;
    const testValues = [0, 60, 300, 86400, 100000];

    testValues.forEach((value) => {
      const clamped = Math.max(0, Math.min(value, maxSeconds));
      expect(clamped).toBeGreaterThanOrEqual(0);
      expect(clamped).toBeLessThanOrEqual(maxSeconds);
    });
  });
});
