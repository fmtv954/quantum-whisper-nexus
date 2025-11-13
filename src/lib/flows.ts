/**
 * Flow Management Helpers
 * 
 * Handles CRUD operations for conversation flows and validation logic.
 * Flows are stored as JSONB in the flows.definition column.
 * 
 * Runtime Integration (TODO):
 * - At call start: Load default flow for campaignId
 * - Track current node during conversation
 * - Use node types to route logic (RAG, lead capture, etc.)
 * - Follow edges to determine next node
 */

import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccountId } from "./data";
import type {
  FlowDefinition,
  FlowNode,
  FlowValidationResult,
} from "../../types/flow";

export interface Flow {
  id: string;
  account_id: string;
  campaign_id: string | null;
  name: string;
  description: string | null;
  definition: FlowDefinition;
  is_default: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get the default flow for a campaign
 * Returns null if no flow exists
 */
export async function getFlowForCampaign(
  campaignId: string
): Promise<Flow | null> {
  const accountId = await getCurrentAccountId();

  const { data, error } = await supabase
    .from("flows")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("account_id", accountId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching flow:", error);
    throw error;
  }

  return data as unknown as Flow | null;
}

/**
 * Create or update the default flow for a campaign
 * Validates the flow before saving
 */
export async function createOrUpdateFlowForCampaign(
  campaignId: string,
  definition: FlowDefinition
): Promise<Flow> {
  const accountId = await getCurrentAccountId();

  // Validate the flow first
  const validation = validateFlowDefinition(definition);
  if (!validation.valid) {
    throw new Error(`Invalid flow: ${validation.errors.join(", ")}`);
  }

  // Check if a default flow already exists
  const existing = await getFlowForCampaign(campaignId);

  if (existing) {
    // Update existing flow
    const { data, error } = await supabase
      .from("flows")
      .update({
        definition: definition as any,
        updated_at: new Date().toISOString(),
        version: (existing.version || 1) + 1,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating flow:", error);
      throw error;
    }

    return data as unknown as Flow;
  } else {
    // Create new flow
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("name")
      .eq("id", campaignId)
      .single();

    const { data, error } = await supabase
      .from("flows")
      .insert([
        {
          account_id: accountId,
          campaign_id: campaignId,
          name: `${campaign?.name || "Campaign"} Flow`,
          definition: definition as any,
          is_default: true,
          version: 1,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating flow:", error);
      throw error;
    }

    return data as unknown as Flow;
  }
}

/**
 * Validate a flow definition
 * Checks for basic structural requirements and connectivity
 */
export function validateFlowDefinition(
  def: FlowDefinition
): FlowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for at least one node
  if (!def.nodes || def.nodes.length === 0) {
    errors.push("Flow must have at least one node");
    return { valid: false, errors, warnings };
  }

  // Check for exactly one start node
  const startNodes = def.nodes.filter((n) => n.type === "start");
  if (startNodes.length === 0) {
    errors.push("Flow must have exactly one Start node");
  } else if (startNodes.length > 1) {
    errors.push("Flow can only have one Start node");
  }

  // Check for at least one end node
  const endNodes = def.nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    errors.push("Flow must have at least one End node");
  }

  // Validate edges
  const nodeIds = new Set(def.nodes.map((n) => n.id));
  
  for (const edge of def.edges || []) {
    if (!nodeIds.has(edge.sourceNodeId)) {
      errors.push(`Edge ${edge.id} has invalid source node: ${edge.sourceNodeId}`);
    }
    if (!nodeIds.has(edge.targetNodeId)) {
      errors.push(`Edge ${edge.id} has invalid target node: ${edge.targetNodeId}`);
    }
  }

  // Check for basic connectivity (start node should have outgoing edges)
  if (startNodes.length === 1 && def.edges) {
    const startNodeId = startNodes[0].id;
    const hasOutgoingEdge = def.edges.some((e) => e.sourceNodeId === startNodeId);
    
    if (!hasOutgoingEdge && def.nodes.length > 1) {
      warnings.push("Start node has no outgoing connections");
    }
  }

  // Check for unreachable nodes (basic check)
  if (def.nodes.length > 1 && def.edges) {
    const reachableNodes = new Set<string>();
    
    if (startNodes.length === 1) {
      const queue = [startNodes[0].id];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        reachableNodes.add(current);
        
        const outgoing = def.edges.filter((e) => e.sourceNodeId === current);
        for (const edge of outgoing) {
          if (!reachableNodes.has(edge.targetNodeId)) {
            queue.push(edge.targetNodeId);
          }
        }
      }
      
      const unreachable = def.nodes.filter((n) => !reachableNodes.has(n.id));
      if (unreachable.length > 0) {
        warnings.push(`${unreachable.length} node(s) are unreachable from Start`);
      }
    }
  }

  // Validate node-specific requirements
  for (const node of def.nodes) {
    if (node.type === "start" && !node.greeting_message) {
      errors.push("Start node must have a greeting message");
    }
    if (node.type === "lead_gate" && !node.consent_prompt) {
      errors.push("Lead Gate node must have a consent prompt");
    }
    if (node.type === "rag_answer" && !node.system_prompt) {
      errors.push("RAG Answer node must have a system prompt");
    }
    if (node.type === "end" && !node.closing_message) {
      errors.push("End node must have a closing message");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create a default flow for a new campaign
 * Simple linear flow: Start -> RAG -> End
 */
export function createDefaultFlow(): FlowDefinition {
  return {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 200 },
        label: "Start",
        greeting_message:
          "Hello! Thanks for calling. I'm your AI assistant. How can I help you today?",
        fallback_message: "I'm here to help! Feel free to ask me anything.",
      },
      {
        id: "rag-1",
        type: "rag_answer",
        position: { x: 400, y: 200 },
        label: "Answer Questions",
        system_prompt:
          "You are a helpful AI assistant. Provide clear, accurate answers based on the knowledge base. Keep responses concise and relevant.",
        knowledge_source_ids: [],
        tone: "professional",
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 700, y: 200 },
        label: "End Call",
        closing_message:
          "Thank you for your time! We'll be in touch soon. Have a great day!",
      },
    ],
    edges: [
      {
        id: "e1-2",
        sourceNodeId: "start-1",
        targetNodeId: "rag-1",
      },
      {
        id: "e2-3",
        sourceNodeId: "rag-1",
        targetNodeId: "end-1",
      },
    ],
    version: 1,
    metadata: {
      created_at: new Date().toISOString(),
      description: "Default conversation flow",
    },
  };
}
