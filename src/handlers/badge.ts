import { makeBadge, Format } from 'badge-maker';
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
  heartbeatIntervalSec?: number;
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
  links?: string;
}

type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';

/** Generates SVG badges from server data. */
class BadgeGenerator {
  constructor(private corsHeaders: Record<string, string>) {}

  /** Generates an SVG badge response based on server data and options. */
  async generate(
    dataJson: string | null,
    type: string,
    options: BadgeOptions
  ): Promise<Response> {
    try {
      const params = await this.buildParams(dataJson, type, options);
      return this.respond(params, options);
    } catch (error) {
      console.error('Badge generation error:', error);
      const params = this.buildErrorParams('Error');
      return this.respond(params, options, 400);
    }
  }

  /** Builds badge parameters based on server data availability and staleness. */
  private async buildParams(
    dataJson: string | null,
    type: string,
    options: BadgeOptions
  ): Promise<Record<string, unknown>> {
    // No data or stale data → offline badge
    if (!dataJson) {
      return this.buildOfflineParams(options);
    }

    const data = parseServerData(dataJson);
    const isStale = this.isStaleData(data);

    if (isStale) {
      return this.buildOfflineParams(options);
    }

    // Build params for requested badge type
    const params = this.getTypeParams(type, data);
    await this.applyCustomizations(params, options);
    return params;
  }

  /** Checks if server data is stale based on dynamic timeout calculation. */
  private isStaleData(data: ServerData): boolean {
    let staleMs = 300000; // Default 5 minutes
    if (data.heartbeatIntervalSec && data.heartbeatIntervalSec > 0) {
      staleMs = Math.max(60000, Math.min(300000, data.heartbeatIntervalSec * 2000));
    }
    const age = Date.now() - data.timestamp;
    return age > staleMs;
  }

  /** Returns default badge parameters for the requested badge type. */
  private getTypeParams(type: string, data: ServerData): Record<string, unknown> {
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
        return data.software
          ? {
              label: 'software',
              message: data.software,
              color: 'blueviolet',
            }
          : {
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

  /** Builds parameters for offline server badge. */
  private buildOfflineParams(options: BadgeOptions): Record<string, unknown> {
    const params: Record<string, unknown> = {
      label: 'server',
      message: 'offline',
      color: 'red',
    };
    if (options?.label) {
      params.label = decodeURIComponent(options.label);
    }
    return params;
  }

  /** Builds parameters for error badge. */
  private buildErrorParams(message: string): Record<string, unknown> {
    return {
      label: 'error',
      message,
      color: 'critical',
    };
  }

  /** Applies user-provided customizations to badge parameters. */
  private async applyCustomizations(
    params: Record<string, unknown>,
    options?: BadgeOptions
  ): Promise<void> {
    if (!options) return;

    if (options.label) {
      params.label = decodeURIComponent(options.label);
    }

    if (options.labelColor) {
      params.labelColor = options.labelColor;
    }

    if (options.color) {
      params.color = options.color;
    }

    if (options.style) {
      params.style = options.style as BadgeStyle;
    }

    // Logo handling
    if (options.logoBase64) {
      params.logoBase64 = decodeURIComponent(options.logoBase64);
    } else if (options.logo) {
      const logoBase64 = await this.fetchLogoBase64(options.logo, options.logoColor);
      if (logoBase64) {
        params.logoBase64 = logoBase64;
      }
    }

    if (options.links) {
      params.links = [decodeURIComponent(options.links)];
    }
  }

  /** Fetches SVG logo from simple-icons package and converts to base64. */
  private async fetchLogoBase64(slug: string, color?: string): Promise<string | undefined> {
    try {
      const iconKey = `si${slug.charAt(0).toUpperCase()}${slug.slice(1).toLowerCase()}` as keyof typeof simpleIcons;
      const icon = simpleIcons[iconKey];

      if (!icon || typeof icon !== 'object' || !('path' in icon)) {
        return undefined;
      }

      const fillColor = color || `#${icon.hex}`;
      const svgContent = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${fillColor}"><path d="${icon.path}"/></svg>`;
      const base64 = btoa(svgContent);
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      return undefined;
    }
  }

  /** Creates HTTP response with SVG badge and appropriate headers. */
  private respond(
    params: Record<string, unknown>,
    options?: BadgeOptions,
    status?: number
  ): Response {
    const badge = makeBadge(params as unknown as Format);
    const cacheSeconds = options?.cacheSeconds ?? 60;
    const cacheControl =
      cacheSeconds > 0
        ? `public, max-age=${Math.min(cacheSeconds, 86400)}`
        : 'no-cache';

    return new Response(badge, {
      status: status ?? 200,
      headers: {
        ...this.corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,
      },
    });
  }
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
  const options = parseBadgeOptions(url.searchParams);

  if (!publicId) {
    const generator = new BadgeGenerator(corsHeaders);
    return generator.generate(null, type, { ...options, label: 'Missing ID' });
  }

  if (!publicId.startsWith('srv_pub_')) {
    const generator = new BadgeGenerator(corsHeaders);
    return generator.generate(null, type, { ...options, label: 'Invalid ID' });
  }

  const dataJson = await env.PULSE_KV.get(publicId);
  const generator = new BadgeGenerator(corsHeaders);
  return generator.generate(dataJson, type, options);
}


/** Parses and validates server data from JSON string. */
function parseServerData(dataJson: string): ServerData {
  const parsed = JSON.parse(dataJson) as Record<string, unknown>;

  const status = parsed['status'];
  const players = parsed['players'];
  const maxPlayersValue = parsed['maxPlayers'] ?? parsed['max_players'];
  const tps = parsed['tps'];
  const software = parsed['software'];
  const version = parsed['version'];
  const timestamp = parsed['timestamp'];
  const heartbeatIntervalSec = parsed['heartbeatIntervalSec'];

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

  if (heartbeatIntervalSec !== undefined && typeof heartbeatIntervalSec !== 'number') {
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
    heartbeatIntervalSec,
  };
}

/** Parses badge customization options from URL query parameters. */
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
    links: params.get('links') ?? undefined,
  };
}
