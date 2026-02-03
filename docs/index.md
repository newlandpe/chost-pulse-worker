# Chost Pulse Worker

Cloudflare Worker for ChostPulse monitoring system that records server heartbeats and renders status badges.

## Features

- **Heartbeat ingestion** with format validation
- **Public ID derivation** via SHA-256 hashing
- **Badge rendering** for status, players, TPS, software, and version
- **KV storage** with automatic expiration (5 minutes TTL)
- **CORS support** for cross-origin requests

## Quick Start

### 1. Deploy the Worker

Deploy to Cloudflare using Wrangler:

```bash
npm install
wrangler deploy
```

### 2. Send a Heartbeat

Send server status to the worker:

```bash
curl -X POST https://your-worker.workers.dev/api/heartbeat \
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

### 3. Use the Badge

Display the badge using the returned public ID:

```markdown
![Server Status](https://your-worker.workers.dev/api/badge?id=srv_pub_a1b2c3d4e5f6&type=status)
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

- **Cloudflare KV** for storing heartbeat data
- **Web Crypto API** for SHA-256 hashing
- **badge-maker** library for SVG badge generation
- **TypeScript** for type safety

## Requirements

- Node.js 20+
- Cloudflare account
- Wrangler CLI
