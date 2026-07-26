-- Migration to support WhatsApp Cloud API
ALTER TABLE whatsapp_sessions
  ADD COLUMN provider TEXT DEFAULT 'cloud_api' CHECK (provider IN ('cloud_api', 'web_js')),
  ADD COLUMN wa_phone_number_id TEXT,
  ADD COLUMN wa_access_token TEXT,
  ADD COLUMN wa_business_account_id TEXT,
  ADD COLUMN wa_verify_token TEXT;

-- Drop the old status check constraint if it exists and create a new one
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'whatsapp_sessions'::regclass AND contype = 'c' AND conname LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE whatsapp_sessions DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

ALTER TABLE whatsapp_sessions
  ADD CONSTRAINT whatsapp_sessions_status_check
  CHECK (status IN ('connected', 'disconnected', 'qr_pending', 'configured'));
