-- Create usage_events table for cost and usage tracking
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  call_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  service TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  units NUMERIC NOT NULL,
  unit_cost_usd NUMERIC NOT NULL,
  total_cost_usd NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_usage_events_account_id ON public.usage_events(account_id);
CREATE INDEX idx_usage_events_campaign_id ON public.usage_events(campaign_id);
CREATE INDEX idx_usage_events_call_id ON public.usage_events(call_id);
CREATE INDEX idx_usage_events_occurred_at ON public.usage_events(occurred_at);
CREATE INDEX idx_usage_events_provider ON public.usage_events(provider);

-- Enable RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view usage events in their accounts
CREATE POLICY "Users can view usage events in their accounts"
  ON public.usage_events
  FOR SELECT
  USING (account_id IN (SELECT get_user_account_ids()));

-- Policy: System can insert usage events
CREATE POLICY "System can insert usage events"
  ON public.usage_events
  FOR INSERT
  WITH CHECK (true);