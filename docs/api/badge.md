# Badge API Endpoint

The `/api/badge` endpoint generates customizable SVG badges displaying server status and metrics. Badges are rendered in real-time based on data stored in the KV namespace.

## Stale Data Handling

Badges automatically detect when server data is stale (no recent heartbeat) and display "offline" status:

- **Dynamic Timeout**: Uses `heartbeatIntervalSec` from heartbeat payload to calculate offline detection delay
- **Formula**: `timeout = max(60s, min(300s, heartbeatIntervalSec × 2))`
- **Default**: 5 minutes if `heartbeatIntervalSec` not provided
- **Purpose**: Prevents false offline alerts while maintaining responsive monitoring

Example: A server with 30-second heartbeats will show offline after 60 seconds of silence.

## Endpoint

```
GET /api/badge
```

## Query Parameters

### Required

- **`id`** - The public server identifier (format: `srv_pub_XXXXXXXXXXXX`)
    - Example: `id=srv_pub_a1b2c3d4e5f6`

### Badge Type

- **`type`** - Badge display type (default: `status`)
    - `status` - Server online/offline status
    - `players` - Current players count: `X/max`
    - `tps` - Ticks per second with color coding
    - `software` - Game server engine/core name
    - `version` - Server version (game version, world version, etc.)

### Customization

- **`style`** - Badge visual style
    - Supported values: `flat`, `flat-square`, `plastic`, `for-the-badge`, `social`
    - Default: `flat`
    - Example: `style=flat-square`

- **`logo`** - Icon slug from [simple-icons](https://simpleicons.org)
    - Supports any icon slug available in simple-icons
    - Click icon title on simple-icons to copy the slug
    - Example: `logo=python` (renders Python logo)
    - Example: `logo=node.js`

- **`logoColor`** - Color of the logo (hex, rgb, rgba, hsl, hsla, or CSS color names)
    - Only supported for simple-icons logos
    - Example: `logoColor=white` or `logoColor=%23FF5733`

- **`logoSize`** - Logo sizing strategy
    - `auto` - Adapts logo size responsively (useful for wider logos like `amd`, `amg`)
    - Default: Standard sizing
    - Example: `logoSize=auto`

- **`label`** - Override the left-hand-side text
    - Supports URL encoding for spaces and special characters
    - Example: `label=My%20Server` (renders "My Server")
    - Default: Type-specific label (`server`, `players`, `tps`, etc.)

- **`labelColor`** - Background color of the left section
    - Hex, rgb, rgba, hsl, hsla, or CSS named colors
    - Example: `labelColor=%23555` or `labelColor=darkgray`

- **`color`** - Background color of the right section (message)
    - Hex, rgb, rgba, hsl, hsla, or CSS named colors
    - Overrides default color for the badge type
    - Example: `color=%23FF6B6B` or `color=brightgreen`

- **`cacheSeconds`** - HTTP cache lifetime in seconds
    - Range: 0 - 86400 (24 hours)
    - Default: 60 seconds
    - Set to 0 for no caching
    - Values above 86400 are capped at 86400
    - Example: `cacheSeconds=300` (5 minute cache)

- **`link`** - URL to navigate when badge is clicked
    - Supports full URLs
    - Must be URL encoded
    - Example: `link=https%3A%2F%2Fexample.com` (renders as clickable link)

- **`links`** - Alias for `link` parameter
    - Same functionality as `link`
    - Example: `links=https%3A%2F%2Fexample.com`

## Response

### Success

```
HTTP/1.1 200 OK
Content-Type: image/svg+xml
Cache-Control: public, max-age=60
```

SVG badge image.

### Errors

```
HTTP/1.1 400 Bad Request
Content-Type: image/svg+xml
```

Error badge image with error message.

## Examples

### Basic Status Badge

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=status
```

Renders: Online/Offline status badge

### Players Badge with Custom Colors

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=players&color=%23FF5733&labelColor=%23222
```

### TPS Badge with Icon and Custom Style

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=tps&style=flat-square&logo=speedtest&logoColor=white
```

### Custom Label and Link

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=status&label=Game%20Server&link=https%3A%2F%2Fplay.example.com
```

### Markdown Usage

Include in README with markdown syntax:

```markdown
[![Status](https://your-domain.com/api/badge?id=srv_pub_a1b2c3d4e5f6&type=status)](https://play.example.com)
```

With HTML for more control:

```html
<img alt="Server Status" 
     src="https://your-domain.com/api/badge?id=srv_pub_a1b2c3d4e5f6&type=status&style=flat-square&logo=gamepad&logoColor=white"
     width="180" />
```

### Advanced Badge with All Parameters

```
GET /api/badge?id=srv_pub_a1b2c3d4e5f6&type=players&style=for-the-badge&logo=player&logoColor=white&label=Players%20Online&labelColor=%23111&color=%2300FF00&cacheSeconds=120&link=https%3A%2F%2Fserver.example.com
```

## Badge Types Details

### Status Badge

- **Message**: `online` (green) or `offline` (red)
- **Use case**: Quick server availability check
- **Data dependency**: `status` field

### Players Badge

- **Message**: `X/max` format
- **Use case**: Display current player count
- **Data dependency**: `players`, `maxPlayers` fields
- **Format**: `5/20` = 5 players out of max 20

### TPS Badge

- **Message**: Ticks per second (1 decimal)
- **Color**: Dynamic based on performance
    - ≥19.0 TPS: brightgreen
    - ≥15.0 TPS: yellow
    - ≥10.0 TPS: orange
    - <10.0 TPS: red
- **Use case**: Server performance monitoring
- **Data dependency**: `tps` field

### Software Badge

- **Message**: Software name or "unknown"
- **Use case**: Display server implementation
- **Data dependency**: `software` field (optional)

### Version Badge

- **Message**: Version string
- **Use case**: Track server version
- **Data dependency**: `version` field

## Cache Behavior

- Default cache time: 60 seconds
- Configurable via `cacheSeconds` parameter
- HTTP Cache-Control header set to `public` for browser caching
- Stale data (>5 minutes old) returns offline badge

## CORS Support

Badges can be embedded in cross-origin contexts:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

## Color Format Support

All color parameters accept:

- **Hex**: `%23FF5733` (URL-encoded `#FF5733`)
- **RGB**: `rgb(255,87,51)`
- **RGBA**: `rgba(255,87,51,0.8)`
- **HSL**: `hsl(9,100%,60%)`
- **HSLA**: `hsla(9,100%,60%,0.8)`
- **CSS Names**: `red`, `brightgreen`, `orange`, `yellow`, `blue`, `lightgrey`, `blueviolet`, `informational`, `critical`

## Best Practices

1. **Cache Appropriately**
    - Short cache (60s) for active monitoring
    - Longer cache (5-10 min) for dashboard displays
    - No cache (0s) for real-time status pages

2. **Icon Selection**
    - Use relevant icons from [simple-icons](https://simpleicons.org)
    - Test icon sizing with `logoSize=auto` for complex logos

3. **URL Encoding**
    - Always URL-encode special characters and spaces
    - Use `%20` for spaces in labels
    - Use `%3A`, `%2F` for URL components in `link` parameter

4. **Responsive Design**
    - Badge width varies based on text length
    - Plan layout accounting for dynamic width
    - Use fixed containers for predictable layouts
