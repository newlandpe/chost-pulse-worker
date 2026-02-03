import { makeBadge } from 'badge-maker';
import { getColorForMetric } from '../utils/colors';
import { Env } from '../index';

/** Describes server data stored in KV. */
export interface ServerData {
  status: string;
  players: number;
  maxPlayers: number;
  tps: number;
  software?: string;
  version: string;
  timestamp: number;
}

/** Builds badge responses from KV-stored data. */
export async function handleBadge(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const publicId = url.searchParams.get('id');
  const type = url.searchParams.get('type') || 'status';

  if (!publicId) {
    return createErrorBadge('Missing ID', corsHeaders);
  }

  // Validate public ID format
  if (!publicId.startsWith('srv_pub_')) {
    return createErrorBadge('Invalid ID', corsHeaders);
  }

  // Fetch from KV
  const dataJson = await env.PULSE_KV.get(publicId);

  if (!dataJson) {
    // Server offline or data expired
    return createOfflineBadge(corsHeaders);
  }

  try {
    const data = parseServerData(dataJson);

    // Check if data is stale (older than 5 minutes)
    const age = Date.now() - data.timestamp;
    if (age > 300000) {
      // 5 minutes
      return createOfflineBadge(corsHeaders);
    }

    // Generate badge based on type
    const badge = generateBadge(type, data);

    return new Response(badge, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Badge generation error:', error);
    return createErrorBadge('Error', corsHeaders);
  }
}

function generateBadge(type: string, data: ServerData): string {
  switch (type) {
    case 'status':
      return makeBadge({
        label: 'server',
        message: data.status,
        color: data.status === 'online' ? 'brightgreen' : 'red',
      });

    case 'players':
      return makeBadge({
        label: 'players',
        message: `${data.players}/${data.maxPlayers}`,
        color: 'blue',
      });

    case 'tps':
      return makeBadge({
        label: 'tps',
        message: data.tps.toFixed(1),
        color: getColorForMetric('tps', data.tps),
      });

    case 'software':
      if (data.software) {
        return makeBadge({
          label: 'software',
          message: data.software,
          color: 'blueviolet',
        });
      }
      return makeBadge({
        label: 'software',
        message: 'unknown',
        color: 'lightgrey',
      });

    case 'version':
      return makeBadge({
        label: 'version',
        message: data.version,
        color: 'informational',
      });

    default:
      return makeBadge({
        label: 'server',
        message: data.status,
        color: 'brightgreen',
      });
  }
}

function createOfflineBadge(corsHeaders: Record<string, string>): Response {
  const badge = makeBadge({
    label: 'server',
    message: 'offline',
    color: 'red',
  });

  return new Response(badge, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

function createErrorBadge(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  const badge = makeBadge({
    label: 'error',
    message,
    color: 'critical',
  });

  return new Response(badge, {
    status: 400,
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml',
    },
  });
}

function parseServerData(dataJson: string): ServerData {
  const parsed = JSON.parse(dataJson) as Record<string, unknown>;

  const status = parsed['status'];
  const players = parsed['players'];
  const maxPlayersValue = parsed['maxPlayers'] ?? parsed['max_players'];
  const tps = parsed['tps'];
  const software = parsed['software'];
  const version = parsed['version'];
  const timestamp = parsed['timestamp'];

  if (
    typeof status !== 'string' ||
    typeof players !== 'number' ||
    typeof maxPlayersValue !== 'number' ||
    typeof tps !== 'number' ||
    typeof version !== 'string' ||
    typeof timestamp !== 'number'
  ) {
    throw new Error('Invalid server data format');
  }

  if (software !== undefined && typeof software !== 'string') {
    throw new Error('Invalid server data format');
  }

  return {
    status,
    players,
    maxPlayers: maxPlayersValue,
    tps,
    software,
    version,
    timestamp,
  };
}
