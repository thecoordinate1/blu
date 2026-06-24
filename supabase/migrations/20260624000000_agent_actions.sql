-- Migration: Create agent_actions table for audit logging
-- Created at: 2026-06-24

CREATE TABLE IF NOT EXISTS public.agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('auto_reply', 'escalation', 'status_change', 'payment')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_actions_conversation_id ON public.agent_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_business_id ON public.agent_actions(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_executed_at ON public.agent_actions(executed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view agent actions belonging to their business"
    ON public.agent_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = agent_actions.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert agent actions"
    ON public.agent_actions FOR INSERT
    WITH CHECK (true);
