# Badge API

The badge endpoint generates SVG status badges based on stored heartbeat data.

## Endpoint

```
GET /api/badge
```

## Query Parameters

### `id` (required)
- Type: `string`
- Format: `srv_pub_` followed by 12 hex characters
- Example: `srv_pub_a1b2c3d4e5f6`
- Description: Public ID returned from heartbeat endpoint

### `type` (optional)
- Type: `string`
- Default: `status`
- Options: `status`, `players`, `tps`, `software`, `version`
- Description: Type of badge to generate

## Badge Types

### Status Badge

Shows server online/offline status.

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=status
```

- **Label**: `server`
- **Message**: `online` or `offline`
- **Color**: Green (online) or Red (offline)

### Players Badge

Shows current player count.

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=players
```

- **Label**: `players`
- **Message**: `15/100` (current/max)
- **Color**: Blue

### TPS Badge

Shows server ticks per second with color coding.

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=tps
```

- **Label**: `tps`
- **Message**: `19.8`
- **Color**:
  - Green: TPS ≥ 19.0
  - Yellow: TPS ≥ 15.0
  - Orange: TPS ≥ 10.0
  - Red: TPS < 10.0

### Software Badge

Shows server software name.

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=software
```

- **Label**: `software`
- **Message**: `PocketMine-MP` or `unknown`
- **Color**: Blue-violet or light grey

### Version Badge

Shows server software version.

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=version
```

- **Label**: `version`
- **Message**: `5.0.0`
- **Color**: Informational

## Response Format

### Success (200 OK)

Returns an SVG image with appropriate headers:

```
Content-Type: image/svg+xml
Cache-Control: public, max-age=60
```

### Error (400 Bad Request)

Missing ID:

```xml
<svg><!-- Error badge: "Missing ID" --></svg>
```

Invalid ID format:

```xml
<svg><!-- Error badge: "Invalid ID" --></svg>
```

### Offline (Data Not Found)

If the public ID doesn't exist or data has expired:

```xml
<svg><!-- Offline badge --></svg>
```

## Data Staleness

Badges check if data is stale (older than 5 minutes). If stale, the offline badge is returned.

## Caching

Badges include a 60-second cache header:

```
Cache-Control: public, max-age=60
```

This allows browsers and CDNs to cache badges for 1 minute, reducing worker invocations.

## Usage in Markdown

```markdown
![Server Status](https://your-worker.workers.dev/api/badge?id=srv_pub_a1b2c3d4e5f6&type=status)
![Players](https://your-worker.workers.dev/api/badge?id=srv_pub_a1b2c3d4e5f6&type=players)
![TPS](https://your-worker.workers.dev/api/badge?id=srv_pub_a1b2c3d4e5f6&type=tps)
```

## Usage in HTML

```html
<img src="https://your-worker.workers.dev/api/badge?id=srv_pub_a1b2c3d4e5f6&type=status" alt="Server Status">
```

## Example

```bash
curl "https://your-worker.workers.dev/api/badge?id=srv_pub_a1b2c3d4e5f6&type=tps"
```

Returns an SVG badge showing the TPS value with color coding.

## CORS

The endpoint supports CORS with:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
