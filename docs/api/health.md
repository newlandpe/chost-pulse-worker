# Health Check API

The health check endpoint provides a simple way to verify the worker is running.

## Endpoint

```
GET /health
```

## Response Format

### Success (200 OK)

```json
{
  "status": "ok",
  "timestamp": 1738580400000
}
```

### Fields

#### `status`
- Type: `string`
- Value: `"ok"`
- Description: Health status of the worker

#### `timestamp`
- Type: `number`
- Description: Current Unix timestamp in milliseconds

## Headers

```
Content-Type: application/json
Access-Control-Allow-Origin: *
```

## Use Cases

- **Monitoring**: Check worker availability
- **Load balancers**: Health check endpoint
- **CI/CD**: Verify deployment success
- **Debugging**: Test worker responsiveness

## Example

```bash
curl https://your-domain.com/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": 1738580400000
}
```

## Status Codes

- **200 OK**: Worker is healthy and responding
- Any other status indicates a problem

## CORS

The endpoint supports CORS with:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
