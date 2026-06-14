-- Migration: Initialize schema for Blu_bot Multi-tenant AI SaaS Platform
-- Created at: 2026-06-12 17:53:00

-- Enable UUID extension (though usually pre-enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    whatsapp_number TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'resolved')),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_number ON public.conversations(customer_number);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON public.messages(business_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Define RLS Policies

-- Businesses policies
CREATE POLICY "Users can read their own business profile"
    ON public.businesses FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own business profile"
    ON public.businesses FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own business profile"
    ON public.businesses FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Conversations policies (Multi-tenancy isolation check via subqueries)
CREATE POLICY "Users can view conversations belonging to their business"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = conversations.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations for their business"
    ON public.conversations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = conversations.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update conversations belonging to their business"
    ON public.conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = conversations.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete conversations belonging to their business"
    ON public.conversations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = conversations.business_id AND b.owner_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages belonging to their business"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = messages.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their business"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = messages.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages belonging to their business"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = messages.business_id AND b.owner_id = auth.uid()
        )
    );

-- 5. Automations & Triggers

-- Trigger function: Update conversation last_message_at on new message insertion
CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_update_conversation_last_message_at
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message_at();

-- Trigger function: Automatically create business workspace profile for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.businesses (name, owner_id, subscription_tier)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1), 'My Business'),
        NEW.id,
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();
