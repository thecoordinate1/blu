-- ============================================================
-- Add set_config RPC helper
-- Migration: 00002_add_set_config
-- ============================================================

CREATE OR REPLACE FUNCTION set_config(setting text, value text)
RETURNS text AS $$
BEGIN
  PERFORM set_config(setting, value, true);
  RETURN value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
