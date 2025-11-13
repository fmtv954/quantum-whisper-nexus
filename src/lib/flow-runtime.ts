/**
 * Flow Runtime Engine
 * 
 * Interprets FlowDefinition nodes step-by-step during a live call.
 * Determines agent responses based on current node type and user input.
 */

import type { FlowDefinition, FlowNode } from "../../types/flow";
import { generateAgentReply } from "./llm";
import { getRagContext } from "./rag";

export interface FlowContext {
  flowDefinition: FlowDefinition;
  currentNodeId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  leadData?: {
    name?: string;
    email?: string;
    phone?: string;
    consent_granted?: boolean;
  };
}

export interface FlowStepResult {
  agentText: string;
  nextNodeId: string | null;
  actions: string[]; // e.g., ["END_CALL", "CREATE_LEAD", "REQUEST_HANDOFF"]
  shouldEndCall: boolean;
}

/**
 * Run a single step of the flow based on current node and user input
 */
export async function runFlowStep(
  context: FlowContext,
  userText?: string
): Promise<FlowStepResult> {
  const { flowDefinition, currentNodeId, conversationHistory, leadData } = context;
  
  // Find current node
  const currentNode = flowDefinition.nodes.find(n => n.id === currentNodeId);
  if (!currentNode) {
    console.error("Current node not found:", currentNodeId);
    return {
      agentText: "I apologize, but I've encountered an issue. Let me connect you with someone who can help.",
      nextNodeId: null,
      actions: ["END_CALL"],
      shouldEndCall: true,
    };
  }

  console.log(`[Flow Runtime] Processing node: ${currentNode.type} (${currentNode.id})`);

  // Handle based on node type
  switch (currentNode.type) {
    case "start":
      return handleStartNode(currentNode, flowDefinition);
    
    case "lead_gate":
      return await handleLeadGateNode(currentNode, flowDefinition, userText, leadData);
    
    case "rag_answer":
      return await handleRagAnswerNode(currentNode, flowDefinition, userText, conversationHistory);
    
    case "end":
      return handleEndNode(currentNode);
    
    default:
      console.error("Unknown node type:", (currentNode as any).type);
      return {
        agentText: "Thank you for your time. Goodbye!",
        nextNodeId: null,
        actions: ["END_CALL"],
        shouldEndCall: true,
      };
  }
}

/**
 * Handle Start node - Play greeting and move to next node
 */
function handleStartNode(
  node: FlowNode & { type: "start" },
  flowDefinition: FlowDefinition
): FlowStepResult {
  const nextNodeId = getNextNodeId(node.id, flowDefinition);
  
  return {
    agentText: node.greeting_message,
    nextNodeId,
    actions: [],
    shouldEndCall: false,
  };
}

/**
 * Handle Lead Gate node - Collect contact info and consent
 * MVP: Simple pattern matching for consent
 */
async function handleLeadGateNode(
  node: FlowNode & { type: "lead_gate" },
  flowDefinition: FlowDefinition,
  userText: string | undefined,
  leadData?: FlowContext["leadData"]
): Promise<FlowStepResult> {
  const nextNodeId = getNextNodeId(node.id, flowDefinition);
  
  // If no consent yet, ask for it
  if (node.consent_required && !leadData?.consent_granted) {
    return {
      agentText: node.consent_prompt,
      nextNodeId: node.id, // Stay on this node until consent
      actions: [],
      shouldEndCall: false,
    };
  }

  // MVP: Simple consent detection
  // TODO: Use LLM to parse user response more robustly
  if (userText && /yes|sure|okay|ok|agree/i.test(userText)) {
    return {
      agentText: "Thank you! Let me get your information.",
      nextNodeId,
      actions: ["COLLECT_LEAD_INFO"],
      shouldEndCall: false,
    };
  }

  // If user declined, move forward anyway (graceful handling)
  return {
    agentText: "No problem, let's continue.",
    nextNodeId,
    actions: [],
    shouldEndCall: false,
  };
}

/**
 * Handle RAG Answer node - Use knowledge base + LLM to respond
 */
async function handleRagAnswerNode(
  node: FlowNode & { type: "rag_answer" },
  flowDefinition: FlowDefinition,
  userText: string | undefined,
  conversationHistory: FlowContext["conversationHistory"]
): Promise<FlowStepResult> {
  const nextNodeId = getNextNodeId(node.id, flowDefinition);

  if (!userText) {
    // Initial entry to RAG node without user input
    return {
      agentText: "I'm here to help! What would you like to know?",
      nextNodeId: node.id, // Stay on this node
      actions: [],
      shouldEndCall: false,
    };
  }

  try {
    // Get relevant context from knowledge base
    const ragContext = await getRagContext(node.knowledge_source_ids, userText);
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(node, ragContext);
    
    // Generate response using LLM
    const agentText = await generateAgentReply({
      systemPrompt,
      messages: conversationHistory,
      userMessage: userText,
      temperature: 0.7,
    });

    // Check for end conversation signals
    const shouldEnd = checkForEndSignals(userText, agentText);
    if (shouldEnd) {
      // Find end node
      const endNode = flowDefinition.nodes.find(n => n.type === "end");
      return {
        agentText: endNode ? (endNode as any).closing_message : agentText,
        nextNodeId: endNode?.id || null,
        actions: ["END_CALL"],
        shouldEndCall: true,
      };
    }

    return {
      agentText,
      nextNodeId: node.id, // Stay on RAG node for continued conversation
      actions: [],
      shouldEndCall: false,
    };
  } catch (error) {
    console.error("Error in RAG answer node:", error);
    // Fallback response
    return {
      agentText: node.system_prompt || "I'm here to help. Could you please rephrase your question?",
      nextNodeId: node.id,
      actions: [],
      shouldEndCall: false,
    };
  }
}

/**
 * Handle End node - Play closing message and end call
 */
function handleEndNode(
  node: FlowNode & { type: "end" }
): FlowStepResult {
  return {
    agentText: node.closing_message,
    nextNodeId: null,
    actions: ["END_CALL"],
    shouldEndCall: true,
  };
}

/**
 * Find the next node ID from edges
 */
function getNextNodeId(currentNodeId: string, flowDefinition: FlowDefinition): string | null {
  const edge = flowDefinition.edges.find(e => e.sourceNodeId === currentNodeId);
  return edge?.targetNodeId || null;
}

/**
 * Build system prompt for RAG node
 */
function buildSystemPrompt(node: FlowNode & { type: "rag_answer" }, ragContext: string): string {
  let prompt = node.system_prompt;
  
  if (node.tone) {
    prompt += `\n\nTone: ${node.tone}`;
  }
  
  if (ragContext) {
    prompt += `\n\nRelevant knowledge:\n${ragContext}`;
  }
  
  prompt += "\n\nProvide a helpful, accurate response based on the knowledge above. Keep it conversational and concise.";
  
  return prompt;
}

/**
 * Check if user or agent signaled end of conversation
 */
function checkForEndSignals(userText: string, agentText: string): boolean {
  const endPhrases = [
    /goodbye|bye|thank you|that's all|that's it/i,
  ];
  
  for (const pattern of endPhrases) {
    if (pattern.test(userText) || pattern.test(agentText)) {
      return true;
    }
  }
  
  return false;
}
