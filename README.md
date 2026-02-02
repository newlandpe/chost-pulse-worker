# ChostPulse - Cloudflare Worker

Serverless backend for ChostPulse monitoring system using Cloudflare Workers and KV storage.

## Features

- **Stateless Architecture**: No database required
- **Edge Computing**: Runs on Cloudflare's global network
- **KV Storage**: Distributed key-value storage
- **SVG Badge Generation**: Dynamic badge rendering
- **Cryptographic Security**: SHA-256 token validation
- **CORS Support**: Cross-origin requests enabled
- **CDN Caching**: 60-second cache for badges

## Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Create KV Namespaces

```bash
# Create production KV namespace
npx wrangler kv:namespace create PULSE_KV

# Create preview KV namespace
npx wrangler kv:namespace create PULSE_KV --preview
```

The command will output namespace IDs. Copy them for the next step.

### 4. Configure wrangler.toml

Update `wrangler.toml` with your KV namespace IDs and domain:

```toml
# Global KV binding for local and preview
[[kv_namespaces]]
binding = "PULSE_KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID_HERE"

[env.production]
name = "chost-pulse-worker"
route = "your-domain.com/*"  # Replace with your domain

[[env.production.kv_namespaces]]
binding = "PULSE_KV"
id = "YOUR_PRODUCTION_KV_NAMESPACE_ID_HERE"
```

### 5. Local Development

```bash
# Start development server
npm run dev

# Access at http://localhost:8787
```

### 6. Deploy

```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## API Endpoints

### POST /api/heartbeat

Accepts server statistics from game server plugins.

**Request:**
```json
{
  "token": "sk_live_550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "status": "online",
    "players": 124,
    "max_players": 200,
    "tps": 19.9,
    "software": "PocketMine-MP 5.30.0",
    "version": "1.21.50"
  }
}
```

**Response:**
```json
{
  "success": true,
  "publicId": "srv_pub_f8a92b3c4d5e",
  "message": "Heartbeat recorded successfully"
}
```

### GET /api/badge

Generates SVG badges for display.

**Query Parameters:**
- `id` (required): Public ID (srv_pub_xxx)
- `type` (optional): Badge type (status, players, tps, software, version)

**Examples:**
```
https://your-domain.com/api/badge\?id\=srv_pub_xxx\&type\=status
https://your-domain.com/api/badge\?id\=srv_pub_xxx\&type\=players
https://your-domain.com/api/badge\?id\=srv_pub_xxx\&type\=tps
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1706745600000
}
```

## Project Structure

```
├── src/
│   ├── index.ts              # Main entry point & routing
│   ├── handlers/
│   │   ├── heartbeat.ts      # POST /api/heartbeat handler
│   │   └── badge.ts          # GET /api/badge handler
│   ├── security/
│   │   ├── crypto.ts         # SHA-256 hashing utilities
│   │   └── validator.ts      # Token validation
│   └── utils/
│       └── colors.ts         # Badge color schemes
├── test/
│   └── worker.test.ts        # Unit tests
├── package.json
├── tsconfig.json
├── wrangler.toml             # Cloudflare Worker configuration
└── README.md
```

## Security Model

1. **Write Protection**: Only holders of `sk_live_` token can update data
2. **Read Access**: Public ID (`srv_pub_`) cannot be reverse-engineered
3. **One-way Hash**: SHA-256 prevents token discovery from public ID
4. **Auto-Expiry**: Data expires after 5 minutes (auto-offline status)

## Data Storage

### KV Schema

**Key:** `srv_pub_xxx` (public ID derived from secret token)

**Value:**
```json
{
  "status": "online",
  "players": 124,
  "max_players": 200,
  "tps": 19.9,
  "software": "PocketMine-MP 5.30.0",
  "version": "1.21.50",
  "timestamp": 1706745600000
}
```

**TTL:** 300 seconds (5 minutes)

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Production Deployment

### Custom Domain Setup

1. Add your domain to Cloudflare
2. Update `wrangler.toml` with your route:
   ```toml
   [env.production]
   route = "monitor.your-domain.com/*"
   ```
3. Deploy:
   ```bash
   npm run deploy:prod
   ```

### Environment Configuration

The worker supports multiple environments:

- **Default**: Local development and preview
- **Development**: Testing environment (`npm run deploy:dev`)
- **Production**: Live environment (`npm run deploy:prod`)

## Performance

- **Cold Start**: <1ms (V8 Isolates)
- **KV Read**: ~50ms globally
- **KV Write**: ~100ms globally
- **Badge Generation**: ~10ms
- **CDN Cache Hit**: <10ms

## Monitoring

Monitor your worker in the Cloudflare dashboard:
- Request count and error rate
- Latency percentiles (p50, p95, p99)
- KV operations and storage usage
- Geographic distribution

## Troubleshooting

### Worker Not Responding
- Check Cloudflare dashboard for errors
- Verify KV namespace bindings in `wrangler.toml`
- Check route configuration matches your domain

### Badges Show Offline
- Data expired (>5 minutes since last heartbeat)
- Plugin not sending heartbeats correctly
- Network connectivity issues

### Invalid Token Errors
- Token format incorrect (must start with `sk_live_`)
- Using public ID instead of secret token
- Token generation issue on client side

## Cost Estimate

Cloudflare Workers Free Tier includes:
- 100,000 requests/day
- Unlimited KV reads (with rate limits)
- 1,000 KV writes/day
- 1 GB KV storage

For most small-to-medium servers, the free tier is sufficient.

## Requirements

- Cloudflare Workers account (free tier works)
- KV namespace (included in free tier)
- Custom domain (optional, for production)

## Related Projects

- [ChostPulse PocketMine Plugin](../pocketmine-mp/)
- [ChostPulse Java Plugin](../java-edition/)

## License

MIT

## Support

- GitHub Issues: [github.com/your-username/chost-pulse-worker](https://github.com/your-username/chost-pulse-worker)
- Cloudflare Docs: [Workers Documentation](https://developers.cloudflare.com/workers/)
- Discord: [Your Discord Server]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
