import { derivePublicId } from '../security/crypto';
import { validateSecretToken } from '../security/validator';
import { Env } from '../index';

export interface HeartbeatRequest {
  token: string;
  data: {
    status: string;
    players: number;
    max_players: number;
    tps: number;
    software?: string;
    version: string;
  };
}

export interface ServerData {
  status: string;
  players: number;
  max_players: number;
  tps: number;
  software?: string;
  version: string;
  timestamp: number;
}

export async function handleHeartbeat(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = (await request.json()) as HeartbeatRequest;

    // Validate request body
    if (!body.token || !body.data) {
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
    await env.PULSE_KV.put(publicId, JSON.stringify(serverData), {
      expirationTtl: 300, // 5 minutes
    });

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
