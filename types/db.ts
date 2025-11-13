/**
 * Quantum Voice AI Platform - Database Types
 * 
 * Type definitions matching the core database schema.
 * 
 * Data Model Overview:
 * - Multi-tenant: accounts → memberships → users
 * - Campaigns: campaigns → flows → knowledge → calls → leads → handoff
 * - Each account has isolated data via RLS policies
 * - All timestamps in UTC (timestamptz)
 * 
 * @see /supabase/migrations/0001_core_schema.sql
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AccountRole = 'owner' | 'admin' | 'member' | 'agent';

export type AccountPlan = 'free' | 'pro' | 'business' | 'enterprise';

export type AccountStatus = 'active' | 'suspended' | 'cancelled';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

export type CampaignEntryType = 'qr_code' | 'web_widget' | 'direct_link' | 'api';

export type KnowledgeSourceType = 'uploaded_doc' | 'web_crawl' | 'manual_qna' | 'api_sync';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type CallStatus = 'connecting' | 'active' | 'completed' | 'failed' | 'abandoned';

export type SpeakerType = 'caller' | 'ai_agent' | 'human_agent' | 'system';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'unqualified';

export type IntegrationType = 'slack' | 'asana' | 'webhook' | 'email' | 'crm';

export type HandoffStatus = 'pending' | 'claimed' | 'in_progress' | 'resolved' | 'cancelled';

export type HandoffPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Account {
  id: string;
  name: string;
  slug: string;
  plan: AccountPlan;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface User {
  id: string;
  auth_user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface AccountMembership {
  id: string;
  account_id: string;
  user_id: string;
  role: AccountRole;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  entry_type: CampaignEntryType;
  primary_flow_id: string | null;
  qr_code_url: string | null;
  widget_code: string | null;
  public_url: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

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
 * Flow Definition Structure
 * Node-based conversation graph with node types:
 * - start: Entry point
 * - lead_gate: Email/phone capture
 * - rag_answer: Knowledge base Q&A
 * - clarify: Disambiguation
 * - dispatch: Handoff to human
 * - end: Conversation termination
 */
export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables?: Record<string, any>;
}

export interface FlowNode {
  id: string;
  type: 'start' | 'lead_gate' | 'rag_answer' | 'clarify' | 'dispatch' | 'end';
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface KnowledgeSource {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  type: KnowledgeSourceType;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  account_id: string;
  source_id: string | null;
  title: string;
  status: DocumentStatus;
  uri_or_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  metadata: {
    embedding_refs?: string[];
    chunk_count?: number;
    extracted_text?: string;
    [key: string]: any;
  };
}

export interface CallSession {
  id: string;
  account_id: string;
  campaign_id: string | null;
  flow_id: string | null;
  lead_id: string | null;
  external_session_id: string | null; // LiveKit session ID
  status: CallStatus;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  cost_cents: number;
  created_at: string;
  metadata: {
    quality_score?: number;
    latency_p95_ms?: number;
    stt_provider?: string;
    tts_provider?: string;
    llm_provider?: string;
    node_path?: string[]; // Flow nodes traversed
    [key: string]: any;
  };
}

export interface CallTranscript {
  id: string;
  call_id: string;
  segment_index: number;
  speaker: SpeakerType;
  text: string;
  offset_ms: number;
  created_at: string;
  metadata: {
    confidence?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    intent?: string;
    [key: string]: any;
  };
}

export interface Lead {
  id: string;
  account_id: string;
  campaign_id: string | null;
  call_id: string | null;
  email: string | null;
  phone: string | null;
  name: string | null;
  consent_ticket_id: string | null; // GDPR/compliance
  status: LeadStatus;
  score: number | null; // 0-100 qualification score
  intent_summary: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>; // Custom fields from conversation
}

export interface Integration {
  id: string;
  account_id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>; // Webhook URLs, API keys (encrypted), etc.
  active: boolean;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface HandoffRequest {
  id: string;
  account_id: string;
  campaign_id: string | null;
  call_id: string | null;
  lead_id: string | null;
  assigned_to_user_id: string | null;
  status: HandoffStatus;
  priority: HandoffPriority;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
  resolved_at: string | null;
}

export interface AuditLog {
  id: string;
  account_id: string | null;
  user_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

// ============================================================================
// JOINED/EXTENDED TYPES
// ============================================================================

/**
 * Campaign with its primary flow populated
 */
export interface CampaignWithFlow extends Campaign {
  primary_flow: Flow | null;
}

/**
 * User with their account memberships
 */
export interface UserWithMemberships extends User {
  memberships: (AccountMembership & { account: Account })[];
}

/**
 * Call session with transcript and lead
 */
export interface CallSessionWithDetails extends CallSession {
  transcripts: CallTranscript[];
  lead: Lead | null;
  campaign: Campaign | null;
}

/**
 * Lead with call history
 */
export interface LeadWithCalls extends Lead {
  calls: CallSession[];
}

/**
 * Handoff request with related entities
 */
export interface HandoffRequestWithDetails extends HandoffRequest {
  campaign: Campaign | null;
  lead: Lead | null;
  assigned_to: User | null;
}

// ============================================================================
// INSERT/UPDATE TYPES
// ============================================================================

export type InsertAccount = Omit<Account, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAccount = Partial<InsertAccount>;

export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUser = Partial<Omit<InsertUser, 'auth_user_id' | 'email'>>;

export type InsertCampaign = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCampaign = Partial<InsertCampaign>;

export type InsertFlow = Omit<Flow, 'id' | 'created_at' | 'updated_at'>;
export type UpdateFlow = Partial<InsertFlow>;

export type InsertKnowledgeSource = Omit<KnowledgeSource, 'id' | 'created_at' | 'updated_at'>;
export type UpdateKnowledgeSource = Partial<InsertKnowledgeSource>;

export type InsertKnowledgeDocument = Omit<KnowledgeDocument, 'id' | 'created_at' | 'updated_at'>;
export type UpdateKnowledgeDocument = Partial<InsertKnowledgeDocument>;

export type InsertCallSession = Omit<CallSession, 'id' | 'created_at'>;
export type UpdateCallSession = Partial<InsertCallSession>;

export type InsertCallTranscript = Omit<CallTranscript, 'id' | 'created_at'>;

export type InsertLead = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLead = Partial<InsertLead>;

export type InsertIntegration = Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'>;
export type UpdateIntegration = Partial<InsertIntegration>;

export type InsertHandoffRequest = Omit<HandoffRequest, 'id' | 'created_at' | 'updated_at' | 'claimed_at' | 'resolved_at'>;
export type UpdateHandoffRequest = Partial<InsertHandoffRequest>;

export type InsertAuditLog = Omit<AuditLog, 'id' | 'created_at'>;
