# ChostPulse

Serverless backend for real-time game server monitoring and SVG badge generation. Supports Cloudflare Workers, Vercel, and Netlify.

## Features

- **Heartbeat ingestion** with format validation
- **Public ID derivation** via SHA-256 hashing
- **Badge rendering** for status, players, TPS, software, and version
- **Distributed storage** with automatic expiration (5 minutes TTL)
- **CORS support** for cross-origin requests
- **Multi-platform**: Cloudflare Workers, Vercel, Netlify

## Quick Start

Choose your platform:

=== "Cloudflare Workers"

    ```bash
    npm install
    npx wrangler login
    npx wrangler kv:namespace create PULSE_KV
    npx wrangler kv:namespace create PULSE_KV --preview
    # Configure wrangler.toml with KV IDs
    npm run deploy:prod
    ```

=== "Vercel"

    ```bash
    npm install
    # Create KV store in Vercel Dashboard
    # Set KV_REST_API_URL and KV_REST_API_TOKEN env vars
    npm run build:vercel
    vercel deploy --prod
    ```

=== "Netlify"

    ```bash
    npm install
    npm install -g netlify-cli
    netlify init
    netlify deploy --prod
    ```

### Send a Heartbeat

```bash
curl -X POST https://your-domain.com/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "token": "sk_live_550e8400-e29b-41d4-a716-446655440000",
    "data": {
      "status": "online",
      "players": 15,
      "maxPlayers": 100,
      "tps": 19.8,
      "software": "PocketMine-MP",
      "version": "5.0.0"
    }
  }'
```

Response:

```json
{
  "success": true,
  "publicId": "srv_pub_a1b2c3d4e5f6",
  "message": "Heartbeat recorded successfully"
}
```

### Use the Badge

```markdown
![Server Status](https://your-domain.com/api/badge?id=srv_pub_a1b2c3d4e5f6&type=status)
```

## Available Endpoints

- **POST** `/api/heartbeat` - Record server heartbeat
- **GET** `/api/badge` - Generate status badge
- **GET** `/health` - Health check endpoint

## Badge Types

- `status` - Online/offline status
- `players` - Current player count
- `tps` - Server TPS with color coding
- `software` - Server software name
- `version` - Server version

## Architecture

The worker uses:

- **Storage**: Cloudflare KV / Vercel KV / Netlify Blobs
- **Web Crypto API** for SHA-256 hashing
- **badge-maker** library for SVG badge generation
- **TypeScript** for type safety

## Requirements

- Node.js 20+
- Account on chosen platform (Cloudflare, Vercel, or Netlify)
