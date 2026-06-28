-- whatsapp_sessions: tracks connection status and metadata per business
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  status       TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'qr_pending', 'connected', 'banned')),
  qr_code      TEXT,                  -- raw QR code string to render on frontend
  phone_number TEXT,                  -- linked phone number once connected
  last_seen    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- whatsapp_webhooks: tenant-registered webhook URLs for incoming events
CREATE TABLE IF NOT EXISTS public.whatsapp_webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  secret       TEXT,                  -- optional HMAC signing secret
  events       TEXT[] DEFAULT '{message,status}',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, url)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wa_sessions_business ON public.whatsapp_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_wa_webhooks_business ON public.whatsapp_webhooks(business_id);

-- RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_webhooks ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_wa_sessions" ON public.whatsapp_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_wa_webhooks" ON public.whatsapp_webhooks FOR ALL USING (true) WITH CHECK (true);

-- Owner policies
CREATE POLICY "owner_wa_sessions" ON public.whatsapp_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = whatsapp_sessions.business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner_wa_webhooks" ON public.whatsapp_webhooks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = whatsapp_webhooks.business_id AND b.owner_id = auth.uid()));
