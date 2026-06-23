-- Migration: Create payments table for Lenco billing
-- Created at: 2026-06-23

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ZMW',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed')),
    provider TEXT NOT NULL DEFAULT 'lenco',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mtn', 'airtel', 'zamtel', 'card')),
    reference TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies
CREATE POLICY "Users can view payments belonging to their business"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = payments.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create payments for their business"
    ON public.payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = payments.business_id AND b.owner_id = auth.uid()
        )
    );

-- Trigger function: Update updated_at
CREATE OR REPLACE FUNCTION public.update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_update_payment_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_updated_at();
