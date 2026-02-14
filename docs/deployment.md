# Deployment

Deploy ChostPulse to Cloudflare Workers, Vercel, or Netlify.

## Prerequisites

1. **Node.js 20+**: [Download](https://nodejs.org/)
2. **Account on chosen platform**: Cloudflare, Vercel, or Netlify

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/newlandpe/chost-pulse-worker.git
cd chost-pulse-worker
npm install
```

## Deploy

=== "Cloudflare Workers"

    ### 1. Create KV Namespace

    ```bash
    wrangler kv:namespace create PULSE_KV
    ```

    Note the returned ID.

    ### 2. Configure wrangler.toml

    Update `wrangler.toml` with your KV namespace ID:

    ```toml
    name = "chost-pulse-worker"
    main = "src/entry/cloudflare.ts"
    compatibility_date = "2024-01-01"

    [[kv_namespaces]]
    binding = "PULSE_KV"
    id = "your-kv-namespace-id"
    ```

    ### 3. Deploy

    ```bash
    # Development
    npm run deploy:dev

    # Production
    npm run deploy:prod
    ```

=== "Vercel"

    ### 1. Create Vercel KV Store

    - Go to [Vercel Storage Dashboard](https://vercel.com/dashboard/stores)
    - Create a new KV store
    - Copy `KV_REST_API_URL` and `KV_REST_API_TOKEN`

    ### 2. Configure Environment Variables

    Set in Vercel project settings:
    - `KV_REST_API_URL` - Your KV store REST API URL
    - `KV_REST_API_TOKEN` - Your KV store authentication token

    ### 3. Deploy

    ```bash
    npm run build:vercel
    vercel deploy --prod
    ```

=== "Netlify"

    ### 1. Initialize

    ```bash
    netlify login
    netlify init
    ```

    ### 2. Deploy

    ```bash
    netlify deploy --prod
    ```

    Netlify Blobs are configured automatically.

## Verification

Test your deployed worker:

```bash
# Health check
curl https://your-domain.com/health

# Send a heartbeat
curl -X POST https://your-domain.com/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "token": "sk_live_550e8400-e29b-41d4-a716-446655440000",
    "data": {
      "status": "online",
      "players": 10,
      "maxPlayers": 50,
      "tps": 20.0,
      "version": "1.0.0"
    }
  }'

# View a badge
curl "https://your-domain.com/api/badge?id=srv_pub_xxx&type=status"
```

## Platform Comparison

| Feature | Cloudflare | Vercel | Netlify |
|---------|-----------|--------|---------|
| Edge Locations | 300+ | 100+ | 100+ |
| Cold Start | <1ms | ~50ms | ~50ms |
| Storage | Cloudflare KV | Vercel KV | Netlify Blobs |
| Free Tier | 100k/day | 100k/month | 125k/month |

## Updating

To update:

```bash
git pull
npm install
npm run deploy  # or platform-specific command
```
