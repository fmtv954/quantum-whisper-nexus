/**
 * Flow Engine Data Model
 * 
 * This defines the canonical format for conversation flows that will be:
 * - Stored as JSONB in the flows.definition column
 * - Used by the runtime call engine to orchestrate conversations
 * - Edited via the Flow Designer UI
 * 
 * Future extensions: Add new node types without breaking existing flows
 */

export type FlowNodeType = "start" | "lead_gate" | "rag_answer" | "end";

/**
 * Base properties for all flow nodes
 */
export interface BaseFlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  label: string;
}

/**
 * Start Node - Entry point for the conversation
 * Plays a greeting message when the call begins
 */
export interface StartNode extends BaseFlowNode {
  type: "start";
  greeting_message: string;
  fallback_message?: string; // Used if user doesn't respond
}

/**
 * Lead Gate Node - Captures contact information and consent
 * Runtime: Prompts for specified fields and creates/updates lead records
 */
export interface LeadGateNode extends BaseFlowNode {
  type: "lead_gate";
  collect_name: boolean;
  collect_email: boolean;
  collect_phone: boolean;
  consent_required: boolean;
  consent_prompt: string; // How to ask for permission
}

/**
 * RAG Answer Node - Provides knowledge-based responses
 * Runtime: Queries knowledge sources and uses LLM to generate answers
 */
export interface RAGAnswerNode extends BaseFlowNode {
  type: "rag_answer";
  system_prompt: string; // Instructions for the AI agent
  knowledge_source_ids: string[]; // IDs from knowledge_sources table
  max_answer_length?: number;
  tone?: string; // e.g., "professional", "friendly", "technical"
}

/**
 * End Node - Terminates the conversation
 * Plays a closing message and marks the call as complete
 */
export interface EndNode extends BaseFlowNode {
  type: "end";
  closing_message: string;
}

/**
 * Union type for all node types
 */
export type FlowNode = StartNode | LeadGateNode | RAGAnswerNode | EndNode;

/**
 * Flow Edge - Connection between nodes
 * Defines the conversation path
 */
export interface FlowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string | null; // Future: Conditional branching logic
  label?: string; // Display label for the edge
}

/**
 * Complete Flow Definition
 * This is the structure stored in flows.definition (JSONB)
 */
export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
  version: number; // Schema version for migrations
  metadata?: {
    created_at?: string;
    updated_at?: string;
    author?: string;
    description?: string;
  };
}

/**
 * Flow validation result
 */
export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Default templates for new nodes
 */
export const DEFAULT_NODE_VALUES = {
  start: {
    greeting_message: "Hello! Thanks for calling. I'm your AI assistant. How can I help you today?",
    fallback_message: "I'm here to help! Feel free to ask me anything.",
  },
  lead_gate: {
    collect_name: true,
    collect_email: true,
    collect_phone: false,
    consent_required: true,
    consent_prompt: "To better assist you, may I collect your contact information?",
  },
  rag_answer: {
    system_prompt: "You are a helpful AI assistant. Provide clear, accurate answers based on the knowledge base. Keep responses concise and relevant.",
    knowledge_source_ids: [],
    tone: "professional",
  },
  end: {
    closing_message: "Thank you for your time! We'll be in touch soon. Have a great day!",
  },
} as const;
