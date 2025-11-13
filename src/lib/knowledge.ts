import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeOverview {
  totalSources: number;
  totalDocuments: number;
  documentsByType: {
    uploaded_doc: number;
    web: number;
    manual_qna: number;
    other: number;
  };
}

export interface KnowledgeSourceWithCount {
  id: string;
  name: string;
  type: string;
  created_at: string;
  document_count?: number;
}

export interface KnowledgeDocumentWithSource {
  id: string;
  title: string;
  status: string;
  uri_or_path: string;
  created_at: string;
  source_id: string;
  source?: {
    id: string;
    name: string;
  };
  metadata?: any;
}

/**
 * Get knowledge base overview statistics
 * Future: This will include embedding/indexing status once RAG is implemented
 */
export async function getKnowledgeOverview(accountId: string): Promise<KnowledgeOverview> {
  // Get total sources
  const { data: sources, error: sourcesError } = await supabase
    .from("knowledge_sources")
    .select("id, type")
    .eq("account_id", accountId);

  if (sourcesError) throw sourcesError;

  // Get total documents
  const { data: documents, error: docsError } = await supabase
    .from("knowledge_documents")
    .select("id, source_id")
    .eq("account_id", accountId);

  if (docsError) throw docsError;

  // Count documents by source type
  const documentsByType = {
    uploaded_doc: 0,
    web: 0,
    manual_qna: 0,
    other: 0,
  };

  documents?.forEach((doc) => {
    const source = sources?.find((s) => s.id === doc.source_id);
    const type = (source?.type || "other") as keyof typeof documentsByType;
    if (type in documentsByType) {
      documentsByType[type]++;
    } else {
      documentsByType.other++;
    }
  });

  return {
    totalSources: sources?.length || 0,
    totalDocuments: documents?.length || 0,
    documentsByType,
  };
}

/**
 * Get all knowledge sources for an account
 */
export async function getKnowledgeSources(accountId: string): Promise<KnowledgeSourceWithCount[]> {
  const { data: sources, error: sourcesError } = await supabase
    .from("knowledge_sources")
    .select("id, name, type, created_at")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (sourcesError) throw sourcesError;

  // Get document counts for each source
  const sourcesWithCounts = await Promise.all(
    (sources || []).map(async (source) => {
      const { count } = await supabase
        .from("knowledge_documents")
        .select("id", { count: "exact", head: true })
        .eq("source_id", source.id);

      return {
        ...source,
        document_count: count || 0,
      };
    })
  );

  return sourcesWithCounts;
}

/**
 * Get knowledge documents with optional filters
 */
export async function getKnowledgeDocuments(
  accountId: string,
  options?: { sourceId?: string; status?: string }
): Promise<KnowledgeDocumentWithSource[]> {
  let query = supabase
    .from("knowledge_documents")
    .select("id, title, status, uri_or_path, created_at, source_id, metadata")
    .eq("account_id", accountId);

  if (options?.sourceId) {
    query = query.eq("source_id", options.sourceId);
  }

  if (options?.status) {
    query = query.eq("status", options.status as "pending" | "processing" | "completed" | "failed");
  }

  const { data: documents, error: docsError } = await query.order("created_at", {
    ascending: false,
  });

  if (docsError) throw docsError;

  // Fetch source names
  const sourceIds = [...new Set(documents?.map((d) => d.source_id) || [])];
  const { data: sources } = await supabase
    .from("knowledge_sources")
    .select("id, name")
    .in("id", sourceIds);

  // Map sources to documents
  return (documents || []).map((doc) => ({
    ...doc,
    source: sources?.find((s) => s.id === doc.source_id),
  }));
}

/**
 * Create a new knowledge source
 */
export async function createKnowledgeSource(
  accountId: string,
  data: { name: string; type?: string; description?: string }
) {
  const { data: source, error } = await supabase
    .from("knowledge_sources")
    .insert([
      {
        account_id: accountId,
        name: data.name,
        type: (data.type || "uploaded_doc") as "uploaded_doc" | "web_crawl" | "manual_qna" | "api_sync",
        description: data.description,
        config: {},
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return source;
}

/**
 * Create a knowledge document entry
 * Future: This will trigger background indexing for RAG once implemented
 */
export async function createKnowledgeDocument(
  accountId: string,
  sourceId: string,
  data: {
    title: string;
    uri_or_path: string;
    file_size_bytes?: number;
    mime_type?: string;
    metadata?: any;
  }
) {
  const { data: document, error } = await supabase
    .from("knowledge_documents")
    .insert([
      {
        account_id: accountId,
        source_id: sourceId,
        title: data.title,
        uri_or_path: data.uri_or_path,
        file_size_bytes: data.file_size_bytes,
        mime_type: data.mime_type,
        status: "pending" as const, // Future: Will change to "processing" when RAG pipeline is ready
        metadata: {
          ...data.metadata,
          // Future: Will include external_index_id, embedding_status, etc.
        },
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return document;
}

/**
 * Upload file to Supabase Storage
 * Storage path: knowledge/{accountId}/{sourceId}/{filename}
 */
export async function uploadKnowledgeFile(
  accountId: string,
  sourceId: string,
  file: File
): Promise<{ path: string; url: string }> {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `knowledge/${accountId}/${sourceId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}
