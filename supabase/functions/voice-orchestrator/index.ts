import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceMessage {
  type: 'start_call' | 'user_audio' | 'user_text' | 'end_call';
  campaignId?: string;
  callId?: string;
  audioData?: string; // base64 encoded
  text?: string;
  context?: any;
}

interface ConversationContext {
  callId: string;
  campaignId: string;
  accountId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  metadata: any;
}

// In-memory conversation storage (will move to Redis in Phase 2)
const conversations = new Map<string, ConversationContext>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, campaignId, callId, audioData, text, context }: VoiceMessage = await req.json();

    console.log(`[Voice Orchestrator] Received ${type} request for call ${callId}`);

    switch (type) {
      case 'start_call':
        return await handleStartCall(campaignId!, context);
      
      case 'user_audio':
        return await handleUserAudio(callId!, audioData!);
      
      case 'user_text':
        return await handleUserText(callId!, text!);
      
      case 'end_call':
        return await handleEndCall(callId!);
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('[Voice Orchestrator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleStartCall(campaignId: string, context: any) {
  const callId = crypto.randomUUID();
  
  // Initialize conversation context
  conversations.set(callId, {
    callId,
    campaignId,
    accountId: context.accountId,
    history: [],
    metadata: context,
  });

  console.log(`[Voice Orchestrator] Started call ${callId} for campaign ${campaignId}`);

  return new Response(
    JSON.stringify({ callId, status: 'started' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleUserAudio(callId: string, audioData: string) {
  const context = conversations.get(callId);
  if (!context) {
    throw new Error(`Call ${callId} not found`);
  }

  console.log(`[Voice Orchestrator] Processing audio for call ${callId}`);

  // Step 1: Convert audio to text with Deepgram STT
  const transcript = await transcribeAudio(audioData);
  console.log(`[STT] Transcript: ${transcript}`);

  // Step 2: Process with AI
  const aiResponse = await processWithAI(transcript, context);
  console.log(`[AI] Response: ${aiResponse}`);

  // Step 3: Convert response to speech with Deepgram TTS
  const responseAudio = await synthesizeSpeech(aiResponse);
  console.log(`[TTS] Generated audio response`);

  // Step 4: Track usage
  await trackUsage(callId, {
    sttDuration: 1, // Approximate
    llmTokens: transcript.length + aiResponse.length,
    ttsCharacters: aiResponse.length,
  });

  return new Response(
    JSON.stringify({
      transcript,
      response: aiResponse,
      audioResponse: responseAudio,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleUserText(callId: string, text: string) {
  const context = conversations.get(callId);
  if (!context) {
    throw new Error(`Call ${callId} not found`);
  }

  console.log(`[Voice Orchestrator] Processing text for call ${callId}: ${text}`);

  // Process with AI
  const aiResponse = await processWithAI(text, context);
  console.log(`[AI] Response: ${aiResponse}`);

  // Convert to speech
  const responseAudio = await synthesizeSpeech(aiResponse);

  // Track usage
  await trackUsage(callId, {
    sttDuration: 0,
    llmTokens: text.length + aiResponse.length,
    ttsCharacters: aiResponse.length,
  });

  return new Response(
    JSON.stringify({
      response: aiResponse,
      audioResponse: responseAudio,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleEndCall(callId: string) {
  const context = conversations.get(callId);
  if (!context) {
    throw new Error(`Call ${callId} not found`);
  }

  console.log(`[Voice Orchestrator] Ending call ${callId}`);

  // Clean up conversation context
  conversations.delete(callId);

  return new Response(
    JSON.stringify({ callId, status: 'ended' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============= AI SERVICE INTEGRATIONS =============

async function transcribeAudio(audioData: string): Promise<string> {
  const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  // Decode base64 audio
  const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));

  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/wav',
    },
    body: audioBytes,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[STT Error]', error);
    throw new Error(`Deepgram STT failed: ${response.status}`);
  }

  const result = await response.json();
  const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  
  return transcript;
}

async function processWithAI(userMessage: string, context: ConversationContext): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Add user message to history
  context.history.push({ role: 'user', content: userMessage });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Call OpenAI GPT-4-mini
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...context.history.slice(-10), // Keep last 10 messages for context
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[LLM Error]', error);
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content;

  // Add AI response to history
  context.history.push({ role: 'assistant', content: aiResponse });

  return aiResponse;
}

async function synthesizeSpeech(text: string): Promise<string> {
  const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[TTS Error]', error);
    throw new Error(`Deepgram TTS failed: ${response.status}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
  
  return base64Audio;
}

function buildSystemPrompt(context: ConversationContext): string {
  return `You are a helpful AI assistant for a voice-based conversation.

Campaign ID: ${context.campaignId}

Your goal is to:
1. Answer user questions clearly and concisely
2. Keep responses short (1-2 sentences) for natural conversation
3. Collect lead information when appropriate (name, email, phone)
4. Be friendly, professional, and helpful

Keep your responses conversational and brief.`;
}

async function trackUsage(callId: string, usage: {
  sttDuration: number;
  llmTokens: number;
  ttsCharacters: number;
}) {
  const context = conversations.get(callId);
  if (!context) return;

  console.log(`[Usage] Call ${callId} - STT: ${usage.sttDuration}s, LLM: ${usage.llmTokens} tokens, TTS: ${usage.ttsCharacters} chars`);

  // Calculate costs
  const sttCost = usage.sttDuration * (0.0077 / 60); // $0.0077/min
  const llmCost = (usage.llmTokens / 1000000) * 0.15; // $0.15/1M tokens
  const ttsCost = (usage.ttsCharacters / 1000) * 0.018; // $0.018/1k chars
  const totalCost = sttCost + llmCost + ttsCost;

  console.log(`[Cost] STT: $${sttCost.toFixed(6)}, LLM: $${llmCost.toFixed(6)}, TTS: $${ttsCost.toFixed(6)}, Total: $${totalCost.toFixed(6)}`);

  // TODO: Record to database in Phase 2
}
