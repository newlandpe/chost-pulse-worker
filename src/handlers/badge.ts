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

/** Badge customization options from query parameters. */
export interface BadgeOptions {
  style?: string;
  logo?: string;
  logoColor?: string;
  logoSize?: string;
  label?: string;
  labelColor?: string;
  color?: string;
  cacheSeconds?: number;
  link?: string;
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

  // Parse badge customization options
  const options = parseBadgeOptions(url.searchParams);

  // Fetch from KV
  const dataJson = await env.PULSE_KV.get(publicId);

  if (!dataJson) {
    // Server offline or data expired
    return createOfflineBadge(corsHeaders, options);
  }

  try {
    const data = parseServerData(dataJson);

    // Check if data is stale (older than 5 minutes)
    const age = Date.now() - data.timestamp;
    if (age > 300000) {
      // 5 minutes
      return createOfflineBadge(corsHeaders, options);
    }

    // Generate badge based on type
    const badge = generateBadge(type, data, options);

    // Determine cache time
    const cacheSeconds = options.cacheSeconds ?? 60;
    const cacheControl =
      cacheSeconds > 0
        ? `public, max-age=${Math.min(cacheSeconds, 86400)}`
        : 'no-cache';

    return new Response(badge, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Badge generation error:', error);
    return createErrorBadge('Error', corsHeaders, options);
  }
}

function generateBadge(
  type: string,
  data: ServerData,
  options: BadgeOptions
): string {
  const badgeParams = getDefaultBadgeParams(type, data);

  // Apply custom label if provided
  if (options.label) {
    badgeParams.label = decodeURIComponent(options.label);
  }

  // Apply custom colors
  if (options.labelColor) {
    badgeParams.labelColor = options.labelColor;
  }

  if (options.color) {
    badgeParams.color = options.color;
  }

  // Apply badge-maker specific options
  if (options.style) {
    badgeParams.style = options.style as BadgeStyle;
  }

  if (options.logo) {
    badgeParams.logo = options.logo;
  }

  if (options.logoColor) {
    badgeParams.logoColor = options.logoColor;
  }

  if (options.logoSize) {
    badgeParams.logoSize = options.logoSize;
  }

  if (options.link) {
    badgeParams.link = [decodeURIComponent(options.link)];
  }

  return makeBadge(badgeParams);
}

function getDefaultBadgeParams(
  type: string,
  data: ServerData
): Record<string, unknown> {
  switch (type) {
    case 'status':
      return {
        label: 'server',
        message: data.status,
        color: data.status === 'online' ? 'brightgreen' : 'red',
      };

    case 'players':
      return {
        label: 'players',
        message: `${data.players}/${data.maxPlayers}`,
        color: 'blue',
      };

    case 'tps':
      return {
        label: 'tps',
        message: data.tps.toFixed(1),
        color: getColorForMetric('tps', data.tps),
      };

    case 'software':
      if (data.software) {
        return {
          label: 'software',
          message: data.software,
          color: 'blueviolet',
        };
      }
      return {
        label: 'software',
        message: 'unknown',
        color: 'lightgrey',
      };

    case 'version':
      return {
        label: 'version',
        message: data.version,
        color: 'informational',
      };

    default:
      return {
        label: 'server',
        message: data.status,
        color: 'brightgreen',
      };
  }
}

type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';


function createOfflineBadge(
  corsHeaders: Record<string, string>,
  options?: BadgeOptions
): Response {
  const badgeParams: Record<string, unknown> = {
    label: 'server',
    message: 'offline',
    color: 'red',
  };

  if (options?.label) {
    badgeParams.label = decodeURIComponent(options.label);
  }

  if (options?.labelColor) {
    badgeParams.labelColor = options.labelColor;
  }

  if (options?.color) {
    badgeParams.color = options.color;
  }

  if (options?.style) {
    badgeParams.style = options.style as BadgeStyle;
  }

  if (options?.logo) {
    badgeParams.logo = options.logo;
  }

  if (options?.logoColor) {
    badgeParams.logoColor = options.logoColor;
  }

  if (options?.logoSize) {
    badgeParams.logoSize = options.logoSize;
  }

  if (options?.link) {
    badgeParams.link = [decodeURIComponent(options.link)];
  }

  const badge = makeBadge(badgeParams);

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
  corsHeaders: Record<string, string>,
  options?: BadgeOptions
): Response {
  const badgeParams: Record<string, unknown> = {
    label: 'error',
    message,
    color: 'critical',
  };

  if (options?.style) {
    badgeParams.style = options.style as BadgeStyle;
  }

  if (options?.logo) {
    badgeParams.logo = options.logo;
  }

  if (options?.logoColor) {
    badgeParams.logoColor = options.logoColor;
  }

  if (options?.logoSize) {
    badgeParams.logoSize = options.logoSize;
  }

  if (options?.link) {
    badgeParams.link = [decodeURIComponent(options.link)];
  }

  const badge = makeBadge(badgeParams);

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

function parseBadgeOptions(params: URLSearchParams): BadgeOptions {
  const cacheSecondsParam = params.get('cacheSeconds');
  const cacheSeconds = cacheSecondsParam
    ? Math.max(0, Math.min(parseInt(cacheSecondsParam, 10), 86400))
    : undefined;

  return {
    style: params.get('style') ?? undefined,
    logo: params.get('logo') ?? undefined,
    logoColor: params.get('logoColor') ?? undefined,
    logoSize: params.get('logoSize') ?? undefined,
    label: params.get('label') ?? undefined,
    labelColor: params.get('labelColor') ?? undefined,
    color: params.get('color') ?? undefined,
    cacheSeconds: cacheSeconds ?? undefined,
    link: params.get('link') ?? undefined,
  };
}
