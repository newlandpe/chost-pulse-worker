# ChostPulse - Cloudflare Worker

ChostPulse Worker is a serverless backend built on Cloudflare Workers for real-time game server monitoring and SVG badge generation. It leverages KV storage and SHA-256 encryption to provide a secure, distributed telemetry system with minimal latency.

## Features

- **Edge Architecture**: High-performance monitoring using Cloudflare Workers and V8 Isolates.
- **Serverless Storage**: Distributed data persistence using Cloudflare KV without traditional databases.
- **Dynamic Badges**: Real-time SVG generation for status, player counts, TPS, and versioning.
- **Cryptographic Security**: Secure public IDs derived from secret tokens via SHA-256 hashing.
- **Auto-Offline Detection**: Automatic data expiry using a 300-second TTL for accurate status tracking.
- **Global Caching**: Optimized 60-second CDN caching to ensure fast badge loading globally.
- **API Integration**: Lightweight REST endpoints with CORS support for seamless plugin connectivity.

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
route = "[your-domain.com/](https://your-domain.com/)*"  # Replace with your domain

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

* `id` (required): Public ID (srv_pub_xxx)
* `type` (optional): Badge type (status, players, tps, software, version)

**Examples:**

* `https://your-domain.com/api/badge?id=srv_pub_xxx&type=status`
* `https://your-domain.com/api/badge?id=srv_pub_xxx&type=players`

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
.
+-- src/
|   +-- index.ts              # Main entry point & routing
|   +-- handlers/
|   |   +-- heartbeat.ts      # POST /api/heartbeat handler
|   |   \-- badge.ts          # GET /api/badge handler
|   +-- security/
|   |   +-- crypto.ts         # SHA-256 hashing utilities
|   |   \-- validator.ts      # Token validation
|   \-- utils/
|       \-- colors.ts         # Badge color schemes
+-- test/
|   \-- worker.test.ts        # Unit tests
+-- package.json
+-- tsconfig.json
+-- wrangler.toml             # Cloudflare Worker configuration
\-- README.md
```

## Security Model

* **Write Protection**: Only holders of `sk_live_` token can update data.
* **Read Access**: Public ID (`srv_pub_`) cannot be reverse-engineered.
* **One-way Hash**: SHA-256 prevents token discovery from public ID.
* **Auto-Expiry**: Data expires after 5 minutes (auto-offline status).

## Data Storage

### KV Schema

- **Key**: `srv_pub_xxx` (public ID derived from secret token)
- **Value**:
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
- **TTL**: 300 seconds (5 minutes)

## Performance

- **Cold Start**: <1ms (V8 Isolates)
- **KV Read**: ~50ms globally
- **KV Write**: ~100ms globally
- **Badge Generation**: ~10ms

## Cost Estimate

Cloudflare Workers Free Tier includes 100k requests/day and 1k KV writes/day. For most small-to-medium servers, the free tier is sufficient.

## Contributing

Contributions are welcome and appreciated! Here's how you can contribute:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## License

This project is licensed under the CSSM Unlimited License v2.0 (CSSM-ULv2). See the [LICENSE](LICENSE) file for details.
