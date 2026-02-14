# Heartbeat API

The heartbeat endpoint accepts server status updates and stores them in Cloudflare KV.

## Endpoint

```
POST /api/heartbeat
```

## Request Format

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "token": "sk_live_<uuid>",
  "data": {
    "status": "online",
    "players": 15,
    "maxPlayers": 100,
    "tps": 19.8,
    "software": "PocketMine-MP",
    "version": "5.0.0",
    "heartbeatIntervalSec": 30
  }
}
```

### Fields

#### `token` (required)
- Type: `string`
- Format: `sk_live_` followed by a UUID v4
- Example: `sk_live_550e8400-e29b-41d4-a716-446655440000`
- Description: Secret token used to derive the public ID

#### `data` (required)
Server status information object.

##### `data.status` (required)
- Type: `string`
- Example: `"online"`, `"offline"`, `"maintenance"`
- Description: Current server status

##### `data.players` (required)
- Type: `number`
- Example: `15`
- Description: Current number of players online

##### `data.maxPlayers` (required)
- Type: `number`
- Example: `100`
- Description: Maximum player capacity

##### `data.tps` (required)
- Type: `number`
- Example: `19.8`
- Description: Server ticks per second

##### `data.software` (optional)
- Type: `string`
- Example: `"PocketMine-MP 5.0.0"`, `"Nukkit 1.0.10"`
- Description: Game server software/engine name with its version

##### `data.version` (required)
- Type: `string`
- Example: `"1.21.50"`, `"1.20.1"`
- Description: Server version (e.g., game version, world version)

##### `data.heartbeatIntervalSec` (optional)
- Type: `number`
- Example: `30`, `60`
- Description: Heartbeat sending interval in seconds. Used to calculate dynamic offline detection timeout (2× interval, clamped 60-300 seconds). If not provided, defaults to 5 minutes (300 seconds).

## Response Format

### Success (200 OK)

```json
{
  "success": true,
  "publicId": "srv_pub_a1b2c3d4e5f6",
  "message": "Heartbeat recorded successfully"
}
```

### Error (400 Bad Request)

Missing fields:

```json
{
  "error": "Missing required fields: token and data"
}
```

Invalid token format:

```json
{
  "error": "Invalid token format"
}
```

Invalid request:

```json
{
  "error": "Bad Request",
  "message": "..."
}
```

## Public ID Derivation

The worker derives a public ID from the secret token:

1. Strip the `sk_live_` prefix
2. Hash the remaining UUID with SHA-256
3. Take the first 12 hex characters
4. Prepend `srv_pub_` prefix

Result: `srv_pub_a1b2c3d4e5f6`

## Storage

Data is stored in Cloudflare KV with:

- **Key**: Public ID (e.g., `srv_pub_a1b2c3d4e5f6`)
- **Value**: JSON object with server data + timestamp + heartbeatIntervalSec
- **TTL**: 5 minutes (300 seconds)

### Dynamic Offline Detection

The badge endpoint uses `heartbeatIntervalSec` to calculate when to mark a server as offline:

```
staleTimeoutMs = max(60000, min(300000, heartbeatIntervalSec × 2000))
```

- **Default**: 5 minutes (300,000 ms) if `heartbeatIntervalSec` is not provided
- **Formula**: 2× the heartbeat interval
- **Minimum**: 60 seconds (prevent rapid toggling)
- **Maximum**: 300 seconds (keep monitoring responsive)

Example: If a server sends heartbeats every 30 seconds, offline detection triggers after 60 seconds of silence.

## Example

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
      "version": "5.0.0",
      "heartbeatIntervalSec": 30
    }
  }'
```

## Rate Limiting

Currently, there are no rate limits. Consider implementing rate limiting based on your needs using Cloudflare's rate limiting features or custom logic.

## CORS

The endpoint supports CORS with:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
