import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceMessage {
  type: 'start_call' | 'audio_chunk' | 'user_audio' | 'user_text' | 'end_call';
  campaignId?: string;
  callId?: string;
  audioData?: string;
  text?: string;
  context?: any;
  accountId?: string;
  roomName?: string;
}

interface ConversationContext {
  callId: string;
  campaignId: string;
  accountId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  metadata: any;
  deepgramWs?: WebSocket;
  currentTranscript?: string;
}

const conversations = new Map<string, ConversationContext>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for WebSocket upgrade
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() === "websocket") {
    return handleWebSocket(req);
  }

  // Fallback to HTTP for backwards compatibility
  try {
    const { type, campaignId, callId, audioData, text, context }: VoiceMessage = await req.json();
    console.log(`[Voice Orchestrator] HTTP request: ${type}`);

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
    console.error('[Voice Orchestrator] HTTP Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==================== WebSocket Handler ====================
function handleWebSocket(req: Request): Response {
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let currentCallId: string | null = null;

  socket.onopen = () => {
    console.log('[WebSocket] Client connected');
  };

  socket.onmessage = async (event) => {
    try {
      const message: VoiceMessage = JSON.parse(event.data);
      console.log(`[WebSocket] Received: ${message.type}`);

      switch (message.type) {
        case 'start_call': {
          const callId = crypto.randomUUID();
          currentCallId = callId;
          
          // Initialize conversation context
          const context: ConversationContext = {
            callId,
            campaignId: message.campaignId!,
            accountId: message.accountId!,
            history: [],
            metadata: { roomName: message.roomName },
            currentTranscript: '',
          };
          
          // Initialize Deepgram STT WebSocket for 16kHz Opus audio from LiveKit
          await initializeDeepgramSTT(context, socket);
          
          conversations.set(callId, context);

          console.log(`[WebSocket] Started call ${callId} with LiveKit room: ${message.roomName}`);
          
          socket.send(JSON.stringify({
            type: 'call_started',
            callId,
            status: 'connected'
          }));
          break;
        }

        case 'audio_chunk': {
          // Audio chunks from LiveKit client (16kHz PCM encoded as base64)
          if (!currentCallId) {
            throw new Error('No active call');
          }

          const context = conversations.get(currentCallId);
          if (!context) {
            throw new Error(`Call ${currentCallId} not found`);
          }

          // Forward audio chunk to Deepgram STT (expecting 16kHz linear PCM)
          if (context.deepgramWs && context.deepgramWs.readyState === WebSocket.OPEN) {
            // Decode base64 audio data (16kHz PCM little-endian)
            const audioBytes = Uint8Array.from(atob(message.audioData!), c => c.charCodeAt(0));
            context.deepgramWs.send(audioBytes);
          } else {
            console.warn(`[WebSocket] Deepgram not ready for call ${currentCallId}`);
          }
          break;
        }

        case 'user_text': {
          if (!currentCallId) {
            throw new Error('No active call');
          }

          const context = conversations.get(currentCallId);
          if (!context) {
            throw new Error(`Call ${currentCallId} not found`);
          }

          // Send transcript to client
          socket.send(JSON.stringify({
            type: 'transcript',
            text: message.text,
            speaker: 'user'
          }));

          // Process with AI
          const aiResponse = await processWithAI(message.text!, context);
          
          // Send AI transcript
          socket.send(JSON.stringify({
            type: 'transcript',
            text: aiResponse,
            speaker: 'assistant'
          }));

          // Generate and send audio response
          const audioResponse = await synthesizeSpeech(aiResponse);
          socket.send(JSON.stringify({
            type: 'audio_response',
            audioData: audioResponse
          }));
          break;
        }

        case 'end_call': {
          if (currentCallId) {
            const context = conversations.get(currentCallId);
            
            // Close Deepgram WebSocket
            if (context?.deepgramWs) {
              context.deepgramWs.close();
            }
            
            conversations.delete(currentCallId);
            console.log(`[WebSocket] Ended call ${currentCallId}`);
            
            socket.send(JSON.stringify({
              type: 'call_ended',
              callId: currentCallId
            }));
            
            currentCallId = null;
          }
          break;
        }

        default:
          console.warn(`[WebSocket] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Message error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  socket.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
  };

  socket.onclose = () => {
    console.log('[WebSocket] Client disconnected');
    if (currentCallId) {
      const context = conversations.get(currentCallId);
      if (context?.deepgramWs) {
        context.deepgramWs.close();
      }
      conversations.delete(currentCallId);
    }
  };

  return response;
}

// ==================== Deepgram STT Streaming (16kHz PCM) ====================

async function initializeDeepgramSTT(context: ConversationContext, clientSocket: WebSocket) {
  const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
  if (!DEEPGRAM_API_KEY) {
    console.error('[Deepgram STT] API key not configured');
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  // Updated to 16kHz linear PCM to match browser stream
  const deepgramUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
    model: 'nova-2',
    punctuate: 'true',
    interim_results: 'true',
    encoding: 'linear16', // 16-bit PCM from browser stream
    sample_rate: '16000', // 16kHz as per spec
    channels: '1',
  });

  console.log(`[Deepgram STT] Connecting for call ${context.callId}...`);
  
  const deepgramWs = new WebSocket(deepgramUrl, {
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  deepgramWs.onopen = () => {
    console.log(`[Deepgram STT] Connected for call ${context.callId}`);
  };

  deepgramWs.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'Results') {
        const transcript = data.channel?.alternatives?.[0]?.transcript || '';
        const isFinal = data.is_final;
        
        if (transcript) {
          console.log(`[Deepgram STT] ${isFinal ? 'Final' : 'Interim'}: "${transcript}"`);
          
          // Send transcript to client
          clientSocket.send(JSON.stringify({
            type: 'transcript',
            text: transcript,
            speaker: 'user',
            isFinal,
          }));
          
          // If final, process with AI
          if (isFinal) {
            context.currentTranscript = (context.currentTranscript || '') + ' ' + transcript;
            
            // Process with AI and generate response
            const aiResponse = await processWithAI(transcript, context);
            
            // Send AI transcript
            clientSocket.send(JSON.stringify({
              type: 'transcript',
              text: aiResponse,
              speaker: 'assistant',
            }));
            
            // Generate and send audio response
            const audioResponse = await synthesizeSpeech(aiResponse);
            clientSocket.send(JSON.stringify({
              type: 'audio_response',
              audioData: audioResponse,
            }));
          }
        }
      } else if (data.type === 'Metadata') {
        console.log(`[Deepgram STT] Metadata:`, data);
      }
    } catch (error) {
      console.error('[Deepgram STT] Error processing message:', error);
    }
  };

  deepgramWs.onerror = (error) => {
    console.error(`[Deepgram STT] Error for call ${context.callId}:`, error);
  };

  deepgramWs.onclose = () => {
    console.log(`[Deepgram STT] Disconnected for call ${context.callId}`);
  };

  context.deepgramWs = deepgramWs;
  
  // Wait for connection to open
  await new Promise((resolve) => {
    if (deepgramWs.readyState === WebSocket.OPEN) {
      resolve(null);
    } else {
      deepgramWs.addEventListener('open', () => resolve(null), { once: true });
    }
  });
}

// ==================== HTTP Handlers (Legacy) ====================

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
  if (!DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not configured');

  const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true', {
    method: 'POST',
    headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'audio/wav' },
    body: audioBytes,
  });

  if (!response.ok) throw new Error(`Deepgram STT failed: ${response.status}`);
  const result = await response.json();
  return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
}

async function searchWeb(query: string): Promise<string> {
  const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
  if (!TAVILY_API_KEY) return '';

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 3,
      }),
    });

    if (!response.ok) return '';
    const result = await response.json();
    const searchResults = result.results || [];
    if (searchResults.length === 0) return '';

    return `Search Results:\n${searchResults.map((r: any) => `- ${r.title}: ${r.content}`).join('\n')}`;
  } catch {
    return '';
  }
}

async function processWithAI(userMessage: string, context: ConversationContext): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Add user message to history
  context.history.push({ role: 'user', content: userMessage });

  // Detect if search is needed (simple keyword detection)
  const searchKeywords = ['search', 'find', 'look up', 'what is', 'who is', 'when', 'where', 'how'];
  const needsSearch = searchKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );

  // Perform search if needed
  let searchContext = '';
  if (needsSearch) {
    console.log('[RAG] Performing web search for:', userMessage);
    searchContext = await searchWeb(userMessage);
  }

  // Build system prompt with RAG context
  const systemPrompt = buildSystemPrompt(context, searchContext);

  // Call Lovable AI (Gemini)
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...context.history.slice(-10), // Keep last 10 messages for context
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[LLM Error]', error);
    throw new Error(`Lovable AI failed: ${response.status}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content;

  // Add AI response to history
  context.history.push({ role: 'assistant', content: aiResponse });

  return aiResponse;
}

async function synthesizeSpeech(text: string): Promise<string> {
  const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
  if (!DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not configured');

  const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
    method: 'POST',
    headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) throw new Error(`Deepgram TTS failed: ${response.status}`);
  const audioBuffer = await response.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
}

function buildSystemPrompt(context: ConversationContext, searchContext?: string): string {
  let prompt = `You are a helpful AI assistant for a voice-based conversation.\n\nYour goal is to:\n1. Answer user questions clearly and concisely\n2. Keep responses short (1-2 sentences) for natural conversation\n3. Collect lead information when appropriate (name, email, phone)\n4. Be friendly, professional, and helpful\n\nKeep your responses conversational and brief.`;
  if (searchContext) prompt += `\n\nContext from web search:\n${searchContext}\n\nUse this information to provide accurate, up-to-date answers.`;
  return prompt;
}

async function trackUsage(callId: string, usage: { sttDuration: number; llmTokens: number; ttsCharacters: number; }) {
  const context = conversations.get(callId);
  if (!context) return;

  const sttCost = usage.sttDuration * (0.0077 / 60);
  const llmCost = (usage.llmTokens / 1000000) * 0.075;
  const ttsCost = (usage.ttsCharacters / 1000) * 0.018;
  const totalCost = sttCost + llmCost + ttsCost;

  console.log(`[Usage] Call ${callId} - STT: ${usage.sttDuration}s, LLM: ${usage.llmTokens} tokens, TTS: ${usage.ttsCharacters} chars`);
  console.log(`[Cost] STT: $${sttCost.toFixed(6)}, LLM (Gemini): $${llmCost.toFixed(6)}, TTS: $${ttsCost.toFixed(6)}, Total: $${totalCost.toFixed(6)}`);
}
