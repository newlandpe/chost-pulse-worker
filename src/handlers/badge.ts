import { makeBadge } from 'badge-maker';
import { getColorForMetric } from '../utils/colors';
import { Env } from '../index';
import * as simpleIcons from 'simple-icons';

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
  logoBase64?: string;
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

  // Parse badge customization options early for error badges
  const options = parseBadgeOptions(url.searchParams);

  if (!publicId) {
    return await createErrorBadge('Missing ID', corsHeaders, options);
  }

  // Validate public ID format
  if (!publicId.startsWith('srv_pub_')) {
    return await createErrorBadge('Invalid ID', corsHeaders, options);
  }

  // Fetch from KV
  const dataJson = await env.PULSE_KV.get(publicId);

  if (!dataJson) {
    // Server offline or data expired
    return await createOfflineBadge(corsHeaders, options);
  }

  try {
    const data = parseServerData(dataJson);

    // Check if data is stale (older than 5 minutes)
    const age = Date.now() - data.timestamp;
    if (age > 300000) {
      // 5 minutes
      return await createOfflineBadge(corsHeaders, options);
    }

    // Generate badge based on type
    const badge = await generateBadge(type, data, options);

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
    return await createErrorBadge('Error', corsHeaders, options);
  }
}

async function generateBadge(
  type: string,
  data: ServerData,
  options: BadgeOptions
): Promise<string> {
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

  // Apply logo (prioritize logoBase64 over logo)
  if (options.logoBase64) {
    badgeParams.logoBase64 = decodeURIComponent(options.logoBase64);
  } else if (options.logo) {
    const logoBase64 = await fetchLogoBase64(options.logo, options.logoColor);
    if (logoBase64) {
      badgeParams.logoBase64 = logoBase64;
    }
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


async function createOfflineBadge(
  corsHeaders: Record<string, string>,
  options?: BadgeOptions
): Promise<Response> {
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

  // Apply logo (prioritize logoBase64 over logo)
  if (options?.logoBase64) {
    badgeParams.logoBase64 = decodeURIComponent(options.logoBase64);
  } else if (options?.logo) {
    const logoBase64 = await fetchLogoBase64(options.logo, options.logoColor);
    if (logoBase64) {
      badgeParams.logoBase64 = logoBase64;
    }
  }

  if (options?.link) {
    badgeParams.link = [decodeURIComponent(options.link)];
  }

  const badge = makeBadge(badgeParams);

  const cacheSeconds = options?.cacheSeconds ?? 60;
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
}

async function createErrorBadge(
  message: string,
  corsHeaders: Record<string, string>,
  options?: BadgeOptions
): Promise<Response> {
  const badgeParams: Record<string, unknown> = {
    label: 'error',
    message,
    color: 'critical',
  };

  if (options?.style) {
    badgeParams.style = options.style as BadgeStyle;
  }

  // Apply logo (prioritize logoBase64 over logo)
  if (options?.logoBase64) {
    badgeParams.logoBase64 = decodeURIComponent(options.logoBase64);
  } else if (options?.logo) {
    const logoBase64 = await fetchLogoBase64(options.logo, options.logoColor);
    if (logoBase64) {
      badgeParams.logoBase64 = logoBase64;
    }
  }

  if (options?.link) {
    badgeParams.link = [decodeURIComponent(options.link)];
  }

  const badge = makeBadge(badgeParams);

  const cacheSeconds = options?.cacheSeconds ?? 60;
  const cacheControl =
    cacheSeconds > 0
      ? `public, max-age=${Math.min(cacheSeconds, 86400)}`
      : 'no-cache';

  return new Response(badge, {
    status: 400,
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml',
      'Cache-Control': cacheControl,
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
  let cacheSeconds: number | undefined;
  
  if (cacheSecondsParam) {
    const parsed = parseInt(cacheSecondsParam, 10);
    if (!isNaN(parsed)) {
      cacheSeconds = Math.max(0, Math.min(parsed, 86400));
    }
  }

  return {
    style: params.get('style') ?? undefined,
    logo: params.get('logo') ?? undefined,
    logoColor: params.get('logoColor') ?? undefined,
    logoSize: params.get('logoSize') ?? undefined,
    logoBase64: params.get('logoBase64') ?? undefined,
    label: params.get('label') ?? undefined,
    labelColor: params.get('labelColor') ?? undefined,
    color: params.get('color') ?? undefined,
    cacheSeconds,
    link: params.get('link') ?? undefined,
  };
}

/** Fetch SVG logo from simple-icons CDN and convert to base64 */
async function fetchLogoBase64(slug: string, color?: string): Promise<string | undefined> {
  try {
    // Convert slug to simple-icons format (e.g., "python" -> "siPython")
    const iconKey = `si${slug.charAt(0).toUpperCase()}${slug.slice(1).toLowerCase()}` as keyof typeof simpleIcons;
    const icon = simpleIcons[iconKey];
    
    if (!icon || typeof icon !== 'object' || !('path' in icon)) {
      return undefined;
    }
    
    // Get the hex color from the icon or use custom color
    const fillColor = color || `#${icon.hex}`;
    
    // Build SVG from path
    const svgContent = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${fillColor}"><path d="${icon.path}"/></svg>`;
    
    // Convert SVG to base64 using btoa (Cloudflare Workers compatible)
    const base64 = btoa(svgContent);
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    return undefined;
  }
}
