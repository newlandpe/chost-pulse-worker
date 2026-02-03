# Security

Security considerations for Chost Pulse Worker.

## Token Security

### Secret Tokens

Secret tokens follow the format `sk_live_<uuid>`:

- **Never expose** secret tokens in public repositories
- **Never log** secret tokens
- **Rotate** tokens if compromised
- **Use unique tokens** per server/application

### Public IDs

Public IDs are derived from secret tokens via SHA-256:

- Cannot be reversed to obtain the secret token
- Safe to display publicly in badges
- 12-character hex prefix provides adequate collision resistance

### Derivation Process

```typescript
1. Strip prefix: "sk_live_550e8400-..." → "550e8400-..."
2. SHA-256 hash: "550e8400-..." → "a1b2c3d4e5f6..."
3. Take first 12 chars: "a1b2c3d4e5f6"
4. Add prefix: "srv_pub_a1b2c3d4e5f6"
```

## Data Validation

### Input Validation

All heartbeat requests are validated:

1. **Token format**: Must match `sk_live_` + UUID pattern
2. **Required fields**: `token`, `data`, `status`, `players`, `maxPlayers`, `tps`, `version`
3. **Type checking**: All fields must be correct type
4. **Public ID format**: Badge requests validate `srv_pub_` format

### Sanitization

- JSON parsing handles malformed input safely
- Type assertions prevent type confusion attacks
- No user input is executed or evaluated

## CORS Policy

The worker uses a permissive CORS policy:

```typescript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

**Why?**
- Badges need to be embedded in various websites
- Heartbeats may come from different origins

**Considerations:**
- This allows any website to call the API
- Rate limiting should be implemented if abuse occurs
- Consider restricting origins for production deployments

## Data Privacy

### Storage

- Data stored in Cloudflare KV with 5-minute TTL
- No personally identifiable information (PII) is collected
- IP addresses are not logged or stored
- Only server status metrics are stored

### Retention

- Automatic expiration after 5 minutes
- No long-term data retention
- No historical metrics stored

## Rate Limiting

### Current Implementation

**None** - The worker does not implement rate limiting.

### Recommendations

Implement rate limiting to prevent abuse:

1. **Per-token limiting**: Limit heartbeats per secret token
2. **Per-IP limiting**: Use Cloudflare's built-in rate limiting
3. **Global limiting**: Cap total requests per minute

Example with Cloudflare Rate Limiting API:

```typescript
// Pseudo-code
const rateLimit = await checkRateLimit(secretToken);
if (rateLimit.exceeded) {
  return new Response('Too many requests', { status: 429 });
}
```

## DDoS Protection

Cloudflare provides automatic DDoS protection:

- Layer 3/4 protection
- Layer 7 (HTTP) protection
- Automatic mitigation

No additional configuration needed.

## Authentication

### Current Implementation

Secret tokens provide basic authentication:

- Possession of valid token allows heartbeat submission
- No additional authentication mechanisms

### Future Enhancements

Consider implementing:

1. **API Keys**: Separate authentication from public ID derivation
2. **JWT**: Stateless authentication with expiration
3. **OAuth**: For third-party integrations
4. **Webhooks**: Signature verification for callbacks

## Encryption

### In Transit

All communication uses HTTPS:

- TLS 1.2+ enforced by Cloudflare
- Automatic certificate management
- HTTP requests redirected to HTTPS

### At Rest

Data in Cloudflare KV:

- Encrypted at rest by Cloudflare
- No additional encryption needed
- Consider encrypting sensitive data before storage if needed

## Content Security

### XSS Prevention

Badges are SVG images:

- No JavaScript execution in SVG responses
- No user-controlled content in SVG
- Content-Type header correctly set

### Injection Prevention

- No SQL database (using KV store)
- No command execution
- No template injection (badges use library)

## Monitoring

### Recommended Practices

1. **Monitor errors**: Track 4xx/5xx responses
2. **Alert on anomalies**: Unusual traffic patterns
3. **Review logs**: Regular security audits
4. **Track token usage**: Detect compromised tokens

### Cloudflare Analytics

Use Cloudflare's built-in analytics:

- Request volume and patterns
- Error rates
- Geographic distribution
- Cache hit rates

## Best Practices

### For Developers

1. **Keep dependencies updated**: `npm audit` regularly
2. **Review code changes**: Use pull requests
3. **Test thoroughly**: Run tests before deployment
4. **Monitor production**: Set up alerts
5. **Document changes**: Security-relevant updates

### For Users

1. **Protect secret tokens**: Never commit to git
2. **Use environment variables**: Store tokens securely
3. **Rotate tokens**: If compromised or periodically
4. **Monitor usage**: Check for unexpected activity
5. **Report issues**: Security vulnerabilities responsibly

## Vulnerability Reporting

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email security concerns privately
3. Include detailed reproduction steps
4. Allow time for a fix before disclosure

## Compliance

### GDPR

The worker does not collect or process personal data:

- No user identification
- No behavioral tracking
- No PII storage

### Other Regulations

Check your local regulations regarding:

- Data retention
- Cross-border data transfer
- Security standards

## Cloudflare Security Features

The worker benefits from Cloudflare's security:

- **WAF**: Web Application Firewall
- **DDoS Protection**: Automatic mitigation
- **Bot Management**: Identify and block bots (paid feature)
- **SSL/TLS**: Automatic certificate management
- **Rate Limiting**: Configurable rate limits (paid feature)

## Future Security Enhancements

Planned improvements:

1. Token rotation mechanism
2. Rate limiting per token
3. Webhook signature verification
4. Audit logging
5. IP allowlisting option
