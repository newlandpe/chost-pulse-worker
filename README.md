# ChostPulse

ChostPulse is a serverless backend for real-time game server monitoring and SVG badge generation. Supports Cloudflare Workers, Vercel, and Netlify with distributed storage and SHA-256 encryption.

## Features

- **Multi-Platform Runtime:** Engineered to run seamlessly on **Cloudflare Workers**, **Vercel**, and **Netlify** using platform-specific entry points.
- **Abstracted Storage Layer:** Features a unified interface that intelligently switches between **Cloudflare KV**, **Vercel KV**, and **Netlify Blobs** depending on the deployment target.
- **Dynamic SVG Generation:** Features an on-the-fly rendering engine that generates customizable SVG badges for status, player counts, TPS, and versioning.
- **One-Way Cryptographic Security:** Protects sensitive tokens by using SHA-256 hashing to derive public IDs, preventing secret discovery even if public IDs are exposed.
- **Automated State Expiry:** Utilizes logical TTL (300 seconds) to ensure that stale data is automatically purged, reflecting the true real-time status of monitored servers.
- **Edge Cache Optimization:** Integrated 60-second CDN caching for SVG badges to minimize storage read operations and maximize global delivery speed.
- **Full CORS & PSR-style Compatibility:** Lightweight REST API designed for seamless integration with Minecraft plugins (PocketMine-MP, Java) and web frontends.

## Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn package manager
- Account on your chosen platform (Cloudflare, Vercel, or Netlify)

## Quick Start

Choose your deployment platform:

### Option A: Cloudflare Workers (Recommended)

**1. Install Dependencies**

```bash
npm install
```

**2. Install and Login to Wrangler**

```bash
npm install -g wrangler
npx wrangler login
```

**3. Create KV Namespaces**

```bash
# Create production KV namespace
npx wrangler kv:namespace create PULSE_KV

# Create preview KV namespace for testing
npx wrangler kv:namespace create PULSE_KV --preview
```

Copy the namespace IDs from the output.

**4. Configure wrangler.toml**

Update `wrangler.toml` with your KV namespace IDs:

```toml
# Global KV binding for local and preview
[[kv_namespaces]]
binding = "PULSE_KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID_HERE"

[env.production]
name = "chost-pulse-worker"
route = "https://your-domain.com/*"  # Replace with your domain

[[env.production.kv_namespaces]]
binding = "PULSE_KV"
id = "YOUR_PRODUCTION_KV_NAMESPACE_ID_HERE"
```

**5. Local Development**

```bash
npm run dev:cf
# Access at http://localhost:8787
```

**6. Deploy**

```bash
npx wrangler deploy
```

**One-Click Deploy:**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/newlandpe/chost-pulse-worker)

---

### Option B: Vercel

**1. Install Dependencies**

```bash
npm install
```

**2. Configure Environment**

- Link your project: `npx vercel link`
- Pull variables: `npx vercel env pull .env.local`
- Ensure `REDIS_URL` is set in `.env.local`.

**3. Local Development**

```bash
npm run dev:vercel
```

**4. Deploy**

```bash
npx vercel deploy --prod
```

Or connect your GitHub repository to Vercel for automatic deployments:

1. Push your code to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables during import
4. Deploy

**One-Click Deploy:**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/newlandpe/chost-pulse-worker)

---

### Option C: Netlify

**1. Install Dependencies**

```bash
npm install
npm install -g netlify-cli
```

**2. Initialize Netlify**

```bash
netlify login
netlify init
```

Follow the prompts to connect your repository and configure the site.

**3. Local Development**

```bash
npm run dev:netlify
```

**4. Deploy**

```bash
netlify deploy --prod
```

Netlify Blobs are configured automatically - no additional setup required.

**Or use Netlify UI:**

1. Push your code to GitHub
2. Go to [Netlify Dashboard](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Deploy

**One-Click Deploy:**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/newlandpe/chost-pulse-worker)

---

## Platform Comparison

| Feature | Cloudflare Workers | Vercel | Netlify |
|---------|-------------------|--------|---------|
| **Edge Locations** | 300+ | 100+ | 100+ |
| **Cold Start** | <1ms | ~50ms | ~50ms |
| **Runtime** | Workerd (V8) | Node.js / Edge | Node.js |
| **Storage** | Cloudflare KV | Redis (ioredis) | Netlify Blobs |
| **Free Tier Requests** | 100k/day | 100k/month | 125k/month |
| **Best For** | Global Low Latency | Next.js Ecosystem | Fast JAMstack |

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
        "maxPlayers": 200,
        "tps": 19.9,
        "software": "PocketMine-MP 5.0.0",
        "version": "1.21.50",
        "heartbeatIntervalSec": 30
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

Generates SVG badges for display with customizable appearance and real-time server status.

**Query Parameters:**

* `id` (required): Public ID (srv_pub_xxx)
* `type` (optional): Badge type - `status`, `players`, `tps`, `software`, `version` (default: status)
* `style` (optional): Badge style - `flat`, `flat-square`, `plastic`, `for-the-badge`, `social`
* `logo` (optional): Icon slug from [simple-icons](https://simpleicons.org)
* `logoColor` (optional): Color override for logo (hex/css color)
* `label` (optional): Override left-side text
* `labelColor` (optional): Background color of left section
* `color` (optional): Background color of right section (message)
* `cacheSeconds` (optional): HTTP cache lifetime in seconds (0-86400, default: 60)
* `links` (optional): URL to navigate when badge is clicked

**Dynamic Stale Timeout:**

Server badges automatically detect stale data based on `heartbeatIntervalSec` from heartbeat:

```
timeout = max(60s, min(300s, heartbeatIntervalSec × 2))
```

Default: 5 minutes if heartbeatIntervalSec not provided.

**Examples:**

* Basic status: `https://your-domain.com/api/badge?id=srv_pub_xxx&type=status`
* Players count: `https://your-domain.com/api/badge?id=srv_pub_xxx&type=players`
* With logo: `https://your-domain.com/api/badge?id=srv_pub_xxx&type=status&logo=minecraft`
* Custom colors: `https://your-domain.com/api/badge?id=srv_pub_xxx&color=brightgreen&labelColor=555`

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
+-- api/
|   \-- index.ts               # Vercel entry point (bridge)
+-- src/
|   +-- core/                  # Universal business logic
|   |   +-- handlers/
|   |   |   +-- heartbeat.ts   # POST /api/heartbeat handler
|   |   |   \-- badge.ts       # GET /api/badge handler
|   |   +-- security/
|   |   |   +-- crypto.ts      # SHA-256 hashing utilities
|   |   |   \-- validator.ts   # Token validation
|   |   +-- utils/
|   |   |   \-- colors.ts      # Badge color schemes
|   |   +-- storage.ts         # Storage interface
|   |   \-- app.ts             # Core Hono application
|   +-- infrastructure/        # Platform-specific implementations
|   |   +-- storage/
|   |   |   +-- cloudflare.ts  # Cloudflare KV adapter
|   |   |   +-- vercel.ts      # Redis adapter (ioredis)
|   |   |   \-- netlify.ts     # Netlify Blobs adapter
|   \-- platforms/             # Runtime adapters
|       +-- cloudflare.ts      # Cloudflare entry point
|       \-- netlify.ts         # Netlify entry point
+-- test/
|   \-- worker.test.ts         # Unit tests
+-- package.json
+-- tsconfig.json
+-- wrangler.toml              # Cloudflare Worker configuration
+-- vercel.json                # Vercel configuration
+-- netlify.toml               # Netlify configuration
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
