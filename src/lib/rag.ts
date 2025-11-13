/**
 * RAG (Retrieval Augmented Generation) Helper
 * Fetches relevant context from knowledge sources
 * 
 * Phase 1: Stub implementation with basic text search
 * TODO: Integrate with Gemini File Search or vector store
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get relevant context from knowledge sources
 * Phase 1: Simple text search over knowledge documents
 * Future: Use Gemini File Search or vector embeddings
 */
export async function getRagContext(
  knowledgeSourceIds: string[],
  userQuery: string
): Promise<string> {
  console.log("[RAG] Fetching context for query:", userQuery.substring(0, 50));
  console.log("[RAG] Knowledge source IDs:", knowledgeSourceIds);

  // If no knowledge sources specified, return empty
  if (!knowledgeSourceIds || knowledgeSourceIds.length === 0) {
    console.log("[RAG] No knowledge sources configured");
    return "";
  }

  try {
    // Phase 1: Fetch documents from specified knowledge sources
    const { data: documents, error } = await supabase
      .from("knowledge_documents")
      .select("title, metadata")
      .in("source_id", knowledgeSourceIds)
      .eq("status", "completed")
      .limit(5);

    if (error) {
      console.error("[RAG] Error fetching documents:", error);
      return "";
    }

    if (!documents || documents.length === 0) {
      console.log("[RAG] No documents found");
      return "";
    }

    // Phase 1: Simple concatenation of document titles and metadata
    // TODO: Implement proper similarity search using embeddings
    const context = documents
      .map(doc => {
        const metadata = doc.metadata as Record<string, any> | null;
        const content = metadata?.content || doc.title;
        return `Document: ${doc.title}\nContent: ${content}`;
      })
      .join("\n\n");

    console.log("[RAG] Context retrieved:", context.substring(0, 200));
    return context;
  } catch (error) {
    console.error("[RAG] Unexpected error:", error);
    return "";
  }
}

/**
 * TODO: Future implementation
 * - Store document embeddings
 * - Use Gemini File Search API
 * - Implement semantic similarity search
 * - Cache frequently accessed documents
 * - Support multiple document types (PDF, DOC, etc.)
 */
