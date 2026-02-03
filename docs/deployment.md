# Deployment

Deploy Chost Pulse Worker to Cloudflare.

## Prerequisites

1. **Cloudflare Account**: [Sign up](https://dash.cloudflare.com/sign-up) for free
2. **Node.js 20+**: [Download](https://nodejs.org/)
3. **Wrangler CLI**: Installed via npm (see below)

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/newlandpe/chost-pulse-worker.git
cd chost-pulse-worker
npm install
```

## Configuration

### 1. Create KV Namespace

Create a KV namespace for storing heartbeat data:

```bash
wrangler kv:namespace create PULSE_KV
```

Note the returned ID.

### 2. Configure wrangler.toml

Update `wrangler.toml` with your KV namespace ID:

```toml
name = "chost-pulse-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "PULSE_KV"
id = "your-kv-namespace-id"
```

### 3. Configure Routes (Optional)

To use a custom domain:

```toml
routes = [
  { pattern = "pulse.example.com/*", custom_domain = true }
]
```

## Deployment

### Development

Test locally before deploying:

```bash
npm run dev
```

Access at `http://localhost:8787`

### Production

Deploy to Cloudflare:

```bash
npm run deploy
```

Or for specific environments:

```bash
# Development environment
npm run deploy:dev

# Production environment
npm run deploy:prod
```

## Verification

Test your deployed worker:

```bash
# Health check
curl https://your-worker.workers.dev/health

# Send a heartbeat
curl -X POST https://your-worker.workers.dev/api/heartbeat \
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
curl "https://your-worker.workers.dev/api/badge?id=srv_pub_xxx&type=status"
```

## Environments

Configure multiple environments in `wrangler.toml`:

```toml
[env.development]
name = "chost-pulse-worker-dev"
[[env.development.kv_namespaces]]
binding = "PULSE_KV"
id = "dev-kv-namespace-id"

[env.production]
name = "chost-pulse-worker"
[[env.production.kv_namespaces]]
binding = "PULSE_KV"
id = "prod-kv-namespace-id"
```

## CI/CD

### GitHub Actions

The repository includes a workflow for automated testing on push.

To add deployment:

1. Add Cloudflare API token to GitHub secrets:
   - `CLOUDFLARE_API_TOKEN`

2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - name: Deploy to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npm run deploy
```

## Monitoring

Monitor your worker in the [Cloudflare Dashboard](https://dash.cloudflare.com/):

- View request metrics
- Check error rates
- Monitor KV storage usage
- View real-time logs

## Troubleshooting

### Common Issues

**"KV namespace not found"**
- Verify the KV namespace ID in `wrangler.toml`
- Ensure the namespace exists: `wrangler kv:namespace list`

**"Deployment failed"**
- Check your Cloudflare API token permissions
- Verify you're logged in: `wrangler whoami`

**"Module not found"**
- Run `npm install` to install dependencies
- Check `package.json` for missing packages

## Limits

Cloudflare Workers free plan:

- 100,000 requests/day
- 10ms CPU time per request
- 1GB KV storage
- 1,000 KV writes/day
- 100,000 KV reads/day

Upgrade to [Workers Paid](https://developers.cloudflare.com/workers/platform/pricing/) for higher limits.

## Updating

To update the worker:

```bash
git pull
npm install
npm run deploy
```
