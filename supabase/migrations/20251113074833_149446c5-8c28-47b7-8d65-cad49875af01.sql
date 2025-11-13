-- Quantum Voice AI Platform - Core Database Schema
-- Multi-tenant SaaS architecture with RLS for security
-- Version: 0001
-- Date: 2025-11-13

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles within accounts
CREATE TYPE public.account_role AS ENUM ('owner', 'admin', 'member', 'agent');

-- Account subscription plans
CREATE TYPE public.account_plan AS ENUM ('free', 'pro', 'business', 'enterprise');

-- Account status
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'cancelled');

-- Campaign status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'archived');

-- Campaign entry types
CREATE TYPE public.campaign_entry_type AS ENUM ('qr_code', 'web_widget', 'direct_link', 'api');

-- Knowledge source types
CREATE TYPE public.knowledge_source_type AS ENUM ('uploaded_doc', 'web_crawl', 'manual_qna', 'api_sync');

-- Document processing status
CREATE TYPE public.document_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Call session status
CREATE TYPE public.call_status AS ENUM ('connecting', 'active', 'completed', 'failed', 'abandoned');

-- Transcript speaker types
CREATE TYPE public.speaker_type AS ENUM ('caller', 'ai_agent', 'human_agent', 'system');

-- Lead status
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'unqualified');

-- Integration types
CREATE TYPE public.integration_type AS ENUM ('slack', 'asana', 'webhook', 'email', 'crm');

-- Handoff request status
CREATE TYPE public.handoff_status AS ENUM ('pending', 'claimed', 'in_progress', 'resolved', 'cancelled');

-- Handoff priority
CREATE TYPE public.handoff_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Accounts (Multi-tenant root entities)
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan account_plan NOT NULL DEFAULT 'free',
    status account_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT accounts_slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Users (links to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Account memberships (many-to-many with roles)
CREATE TABLE public.account_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role account_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(account_id, user_id)
);

-- Campaigns (voice AI experiences)
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status campaign_status NOT NULL DEFAULT 'draft',
    entry_type campaign_entry_type NOT NULL DEFAULT 'web_widget',
    primary_flow_id UUID,
    qr_code_url TEXT,
    widget_code TEXT,
    public_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Flows (conversation logic graphs)
CREATE TABLE public.flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from campaigns to flows
ALTER TABLE public.campaigns 
    ADD CONSTRAINT campaigns_primary_flow_fkey 
    FOREIGN KEY (primary_flow_id) REFERENCES public.flows(id) ON DELETE SET NULL;

-- Knowledge sources (logical groupings)
CREATE TABLE public.knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type knowledge_source_type NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge documents (individual files/chunks for RAG)
CREATE TABLE public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status document_status NOT NULL DEFAULT 'pending',
    uri_or_path TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Call sessions (each voice call instance)
CREATE TABLE public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    flow_id UUID REFERENCES public.flows(id) ON DELETE SET NULL,
    lead_id UUID,
    external_session_id TEXT,
    status call_status NOT NULL DEFAULT 'connecting',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_ms INTEGER,
    cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Call transcripts (conversation segments)
CREATE TABLE public.call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    speaker speaker_type NOT NULL,
    text TEXT NOT NULL,
    offset_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(call_id, segment_index)
);

-- Leads (captured contact information)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    call_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
    email TEXT,
    phone TEXT,
    name TEXT,
    consent_ticket_id TEXT,
    status lead_status NOT NULL DEFAULT 'new',
    score NUMERIC(5,2),
    intent_summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add FK from call_sessions to leads
ALTER TABLE public.call_sessions 
    ADD CONSTRAINT call_sessions_lead_fkey 
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Integrations (account-level external service configs)
CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    
    UNIQUE(account_id, type, name)
);

-- Handoff requests (AI → human escalation)
CREATE TABLE public.handoff_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    call_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status handoff_status NOT NULL DEFAULT 'pending',
    priority handoff_priority NOT NULL DEFAULT 'medium',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- Audit logs (security and compliance tracking)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_account_memberships_account_id ON public.account_memberships(account_id);
CREATE INDEX idx_account_memberships_user_id ON public.account_memberships(user_id);
CREATE INDEX idx_campaigns_account_id ON public.campaigns(account_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_flows_account_id ON public.flows(account_id);
CREATE INDEX idx_flows_campaign_id ON public.flows(campaign_id);
CREATE INDEX idx_knowledge_sources_account_id ON public.knowledge_sources(account_id);
CREATE INDEX idx_knowledge_documents_account_id ON public.knowledge_documents(account_id);
CREATE INDEX idx_knowledge_documents_source_id ON public.knowledge_documents(source_id);
CREATE INDEX idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX idx_call_sessions_account_id ON public.call_sessions(account_id);
CREATE INDEX idx_call_sessions_campaign_id ON public.call_sessions(campaign_id);
CREATE INDEX idx_call_sessions_lead_id ON public.call_sessions(lead_id);
CREATE INDEX idx_call_sessions_status ON public.call_sessions(status);
CREATE INDEX idx_call_sessions_started_at ON public.call_sessions(started_at DESC);
CREATE INDEX idx_call_transcripts_call_id ON public.call_transcripts(call_id);
CREATE INDEX idx_leads_account_id ON public.leads(account_id);
CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_leads_call_id ON public.leads(call_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_integrations_account_id ON public.integrations(account_id);
CREATE INDEX idx_handoff_requests_account_id ON public.handoff_requests(account_id);
CREATE INDEX idx_handoff_requests_status ON public.handoff_requests(status);
CREATE INDEX idx_handoff_requests_assigned_to ON public.handoff_requests(assigned_to_user_id);
CREATE INDEX idx_handoff_requests_created_at ON public.handoff_requests(created_at DESC);
CREATE INDEX idx_audit_logs_account_id ON public.audit_logs(account_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoff_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's account IDs
CREATE OR REPLACE FUNCTION public.get_user_account_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id 
  FROM public.account_memberships 
  WHERE user_id = (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  );
$$;

-- Helper function: Check if user has role in account
CREATE OR REPLACE FUNCTION public.has_account_role(
  _account_id UUID,
  _required_role account_role
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships am
    JOIN public.users u ON u.id = am.user_id
    WHERE u.auth_user_id = auth.uid()
      AND am.account_id = _account_id
      AND (
        am.role = _required_role
        OR (am.role = 'owner' AND _required_role IN ('admin', 'member', 'agent'))
        OR (am.role = 'admin' AND _required_role IN ('member', 'agent'))
      )
  );
$$;

-- RLS Policies: Accounts
CREATE POLICY "Users can view their accounts"
  ON public.accounts FOR SELECT
  USING (id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Owners can update their accounts"
  ON public.accounts FOR UPDATE
  USING (public.has_account_role(id, 'owner'));

CREATE POLICY "Authenticated users can create accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies: Users
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- RLS Policies: Account Memberships
CREATE POLICY "Users can view memberships in their accounts"
  ON public.account_memberships FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Admins can manage memberships"
  ON public.account_memberships FOR ALL
  USING (public.has_account_role(account_id, 'admin'));

-- RLS Policies: Campaigns
CREATE POLICY "Users can view campaigns in their accounts"
  ON public.campaigns FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Members can manage campaigns"
  ON public.campaigns FOR ALL
  USING (public.has_account_role(account_id, 'member'));

-- RLS Policies: Flows
CREATE POLICY "Users can view flows in their accounts"
  ON public.flows FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Members can manage flows"
  ON public.flows FOR ALL
  USING (public.has_account_role(account_id, 'member'));

-- RLS Policies: Knowledge Sources
CREATE POLICY "Users can view knowledge in their accounts"
  ON public.knowledge_sources FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Members can manage knowledge sources"
  ON public.knowledge_sources FOR ALL
  USING (public.has_account_role(account_id, 'member'));

-- RLS Policies: Knowledge Documents
CREATE POLICY "Users can view documents in their accounts"
  ON public.knowledge_documents FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Members can manage documents"
  ON public.knowledge_documents FOR ALL
  USING (public.has_account_role(account_id, 'member'));

-- RLS Policies: Call Sessions
CREATE POLICY "Users can view calls in their accounts"
  ON public.call_sessions FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Members can manage calls"
  ON public.call_sessions FOR ALL
  USING (public.has_account_role(account_id, 'member'));

-- RLS Policies: Call Transcripts
CREATE POLICY "Users can view transcripts for their account calls"
  ON public.call_transcripts FOR SELECT
  USING (
    call_id IN (
      SELECT id FROM public.call_sessions 
      WHERE account_id IN (SELECT public.get_user_account_ids())
    )
  );

CREATE POLICY "Members can manage transcripts"
  ON public.call_transcripts FOR ALL
  USING (
    call_id IN (
      SELECT id FROM public.call_sessions cs
      WHERE public.has_account_role(cs.account_id, 'member')
    )
  );

-- RLS Policies: Leads
CREATE POLICY "Users can view leads in their accounts"
  ON public.leads FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Members can manage leads"
  ON public.leads FOR ALL
  USING (public.has_account_role(account_id, 'member'));

-- RLS Policies: Integrations
CREATE POLICY "Users can view integrations in their accounts"
  ON public.integrations FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Admins can manage integrations"
  ON public.integrations FOR ALL
  USING (public.has_account_role(account_id, 'admin'));

-- RLS Policies: Handoff Requests
CREATE POLICY "Users can view handoff requests in their accounts"
  ON public.handoff_requests FOR SELECT
  USING (account_id IN (SELECT public.get_user_account_ids()));

CREATE POLICY "Agents can claim and update handoff requests"
  ON public.handoff_requests FOR UPDATE
  USING (public.has_account_role(account_id, 'agent'));

CREATE POLICY "Members can create handoff requests"
  ON public.handoff_requests FOR INSERT
  WITH CHECK (public.has_account_role(account_id, 'member'));

-- RLS Policies: Audit Logs
CREATE POLICY "Admins can view audit logs for their accounts"
  ON public.audit_logs FOR SELECT
  USING (
    account_id IS NULL 
    OR account_id IN (SELECT id FROM public.accounts WHERE public.has_account_role(id, 'admin'))
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER account_memberships_updated_at BEFORE UPDATE ON public.account_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER flows_updated_at BEFORE UPDATE ON public.flows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER knowledge_sources_updated_at BEFORE UPDATE ON public.knowledge_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER knowledge_documents_updated_at BEFORE UPDATE ON public.knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER handoff_requests_updated_at BEFORE UPDATE ON public.handoff_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.accounts IS 'Multi-tenant root entities (companies/workspaces)';
COMMENT ON TABLE public.users IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.account_memberships IS 'Many-to-many: users belong to accounts with roles';
COMMENT ON TABLE public.campaigns IS 'Voice AI campaigns (QR codes, widgets, links)';
COMMENT ON TABLE public.flows IS 'Node-based conversation logic graphs';
COMMENT ON TABLE public.knowledge_sources IS 'Logical groupings of documents for RAG';
COMMENT ON TABLE public.knowledge_documents IS 'Individual files/chunks for retrieval';
COMMENT ON TABLE public.call_sessions IS 'Each voice call instance with metrics';
COMMENT ON TABLE public.call_transcripts IS 'Conversation segments per call';
COMMENT ON TABLE public.leads IS 'Captured contact information and intent';
COMMENT ON TABLE public.integrations IS 'External service configurations per account';
COMMENT ON TABLE public.handoff_requests IS 'AI to human escalation queue';
COMMENT ON TABLE public.audit_logs IS 'Security and compliance event tracking';