/**
 * LLM Helper - Wraps calls to AI models
 * Uses Lovable AI Gateway for cost-effective, pre-configured access
 */

import { supabase } from "@/integrations/supabase/client";

interface GenerateReplyParams {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage?: string;
  temperature?: number;
  model?: string;
}

/**
 * Generate agent reply using Lovable AI Gateway
 * Defaults to google/gemini-2.5-flash for balanced performance
 */
export async function generateAgentReply(params: GenerateReplyParams): Promise<string> {
  const {
    systemPrompt,
    messages,
    userMessage,
    temperature = 0.7,
    model = "google/gemini-2.5-flash",
  } = params;

  console.log("[LLM] Generating reply with model:", model);

  try {
    // Build messages array for the API
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    if (userMessage) {
      apiMessages.push({ role: "user", content: userMessage });
    }

    // Call Lovable AI via edge function
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: {
        messages: apiMessages,
        model,
        temperature,
      },
    });

    if (error) {
      console.error("[LLM] Error:", error);
      throw error;
    }

    if (!data?.reply) {
      throw new Error("No reply received from AI");
    }

    console.log("[LLM] Reply generated:", data.reply.substring(0, 100));
    return data.reply;
  } catch (error) {
    console.error("[LLM] Failed to generate reply:", error);
    // Return a fallback message
    return "I'm here to help. Could you please repeat that or rephrase your question?";
  }
}
