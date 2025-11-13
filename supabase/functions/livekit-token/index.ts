import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, callSessionId } = await req.json();

    if (!campaignId || !callSessionId) {
      throw new Error('campaignId and callSessionId are required');
    }

    // Get environment variables
    const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL');
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LiveKit credentials not configured');
    }

    // Create room name
    const roomName = `call-${callSessionId}`;
    const participantName = `user-${Date.now()}`;

    console.log(`Generating LiveKit token for room: ${roomName}`);

    // Generate JWT token manually
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
      iss: LIVEKIT_API_KEY,
      sub: participantName,
      iat: now,
      exp: now + 7200, // 2 hours
      nbf: now,
    };

    const header = { alg: "HS256", typ: "JWT" };
    
    const encoder = new TextEncoder();
    const base64url = (input: Uint8Array) => 
      btoa(String.fromCharCode(...input))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const encodedHeader = base64url(encoder.encode(JSON.stringify(header)));
    const encodedPayload = base64url(encoder.encode(JSON.stringify(payload)));
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const keyData = encoder.encode(LIVEKIT_API_SECRET);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureInput));
    const encodedSignature = base64url(new Uint8Array(signature));
    
    const token = `${signatureInput}.${encodedSignature}`;

    console.log('LiveKit token generated successfully');

    return new Response(
      JSON.stringify({
        token,
        url: LIVEKIT_URL,
        roomName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
