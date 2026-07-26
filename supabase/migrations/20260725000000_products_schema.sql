-- Migration: Create products table for inventory management
-- Created at: 2026-07-25

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id, sku)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view products belonging to their business"
    ON public.products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = products.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create products for their business"
    ON public.products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = products.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update products belonging to their business"
    ON public.products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = products.business_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete products belonging to their business"
    ON public.products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = products.business_id AND b.owner_id = auth.uid()
        )
    );

-- Allow service role full access
CREATE POLICY "Service role can manage all products"
    ON public.products
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_update_product_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_updated_at();
