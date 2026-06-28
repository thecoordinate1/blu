-- Migration: Add missing columns and tables
-- Created at: 2026-06-28

-- 1. Add messages_used and messages_limit to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS messages_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_limit INTEGER NOT NULL DEFAULT 1000;

-- 2. Create whatsapp_sessions table (tracks connected WhatsApp numbers via whatsapp-web.js)
--    This replaces the old phone_numbers table reference in the dashboard.
--    The numbers page reads from this table to show connected numbers.
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    -- The WhatsApp number in international format e.g. +260976123456
    phone_number TEXT,
    -- The display name / profile name on WhatsApp
    verified_name TEXT,
    -- Connection status (qr_pending = QR shown, connected, disconnected)
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'qr_pending', 'connected')),
    -- Raw QR code string written by the whatsapp-web.js 'qr' event
    qr_code TEXT,
    -- Last time the session was confirmed alive
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id)
);


CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_business_id ON public.whatsapp_sessions(business_id);

-- Enable RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp sessions"
    ON public.whatsapp_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = whatsapp_sessions.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own whatsapp sessions"
    ON public.whatsapp_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = whatsapp_sessions.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own whatsapp sessions"
    ON public.whatsapp_sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = whatsapp_sessions.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own whatsapp sessions"
    ON public.whatsapp_sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = whatsapp_sessions.business_id AND b.owner_id = auth.uid()
        )
    );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_whatsapp_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_update_whatsapp_session_updated_at
    BEFORE UPDATE ON public.whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_whatsapp_session_updated_at();

-- Allow service role (API backend) to bypass RLS for session management
CREATE POLICY "Service role can manage all whatsapp sessions"
    ON public.whatsapp_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
