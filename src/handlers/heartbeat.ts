import { derivePublicId } from '../security/crypto';
import { validateSecretToken } from '../security/validator';
import type { Storage } from '../storage';

/** Describes the heartbeat request payload. */
export interface HeartbeatRequest {
  token: string;
  data: HeartbeatRequestData;
}

/** Describes the heartbeat payload data. */
export interface HeartbeatRequestData {
  status: string;
  players: number;
  maxPlayers: number;
  tps: number;
  software?: string;
  version: string;
}

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

/** Stores heartbeat data and returns the derived public ID. */
export async function handleHeartbeat(
  request: Request,
  storage: Storage,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = parseHeartbeatRequest(await request.json());

    // Validate request body
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token and data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate token format
    if (!validateSecretToken(body.token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Derive public ID from secret token
    const publicId = await derivePublicId(body.token);

    // Prepare data for storage
    const serverData: ServerData = {
      ...body.data,
      timestamp: Date.now(),
    };

    // Store in KV with 5-minute TTL (expiration)
    await storage.put(publicId, JSON.stringify(serverData), 300);

    return new Response(
      JSON.stringify({
        success: true,
        publicId: publicId,
        message: 'Heartbeat recorded successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Heartbeat error:', error);
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: String(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

function parseHeartbeatRequest(body: unknown): HeartbeatRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  const token = record['token'];
  const data = record['data'];

  if (typeof token !== 'string' || !data || typeof data !== 'object') {
    return null;
  }

  const dataRecord = data as Record<string, unknown>;
  const status = dataRecord['status'];
  const players = dataRecord['players'];
  const maxPlayersValue = dataRecord['maxPlayers'] ?? dataRecord['max_players'];
  const tps = dataRecord['tps'];
  const software = dataRecord['software'];
  const version = dataRecord['version'];

  if (
    typeof status !== 'string' ||
    typeof players !== 'number' ||
    typeof maxPlayersValue !== 'number' ||
    typeof tps !== 'number' ||
    typeof version !== 'string'
  ) {
    return null;
  }

  if (software !== undefined && typeof software !== 'string') {
    return null;
  }

  return {
    token,
    data: {
      status,
      players,
      maxPlayers: maxPlayersValue,
      tps,
      software,
      version,
    },
  };
}
