// Run migration SQL against Supabase using the REST-based SQL execution
// We use the pg_dump/introspection approach + individual ALTER statements

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zgqixjzznbrsdkmdvmrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncWl4anp6bmJyc2RrbWR2bXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMTgzMCwiZXhwIjoyMDkyOTc3ODMwfQ.irNvjJ0A290wm2dE63GqBVkAnwzaVPO-KaCmosHCyhY'
);

async function runMigration() {
  console.log('=== Running Cloud API Migration ===\n');

  // Step 1: Check existing columns
  const { data: existing } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .limit(1);

  const existingCols = existing && existing.length > 0 ? Object.keys(existing[0]) : [];
  console.log('Existing columns:', existingCols.join(', '));

  const newCols = ['provider', 'wa_phone_number_id', 'wa_access_token', 'wa_business_account_id', 'wa_verify_token'];
  const missing = newCols.filter(c => !existingCols.includes(c));

  if (missing.length === 0) {
    console.log('\n✅ All Cloud API columns already exist!');
    return;
  }

  console.log('\nMissing columns:', missing.join(', '));
  console.log('\nApplying migration via direct table operations...\n');

  // Step 2: Since we can't run raw ALTER TABLE through PostgREST,
  // we need to use the database function approach.
  // First, check if there's a way to call RPC functions.
  
  // Try using the Supabase Management API SQL endpoint
  const projectRef = 'zgqixjzznbrsdkmdvmrw';
  const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  // We don't have a management API token, so let's try the alternative:
  // Use the postgres connection string directly
  
  // Actually, the simplest approach: print the SQL for the user to run manually
  console.log('=== MIGRATION SQL (run in Supabase Dashboard > SQL Editor) ===\n');
  console.log(`ALTER TABLE public.whatsapp_sessions
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'cloud_api',
  ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_access_token TEXT,
  ADD COLUMN IF NOT EXISTS wa_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_verify_token TEXT;

-- Update status constraint
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

ALTER TABLE public.whatsapp_sessions
  ADD CONSTRAINT whatsapp_sessions_status_check
  CHECK (status IN ('connected', 'disconnected', 'qr_pending', 'configured'));`);

  console.log('\n=== Copy the above SQL into Supabase Dashboard > SQL Editor and click Run ===');
}

runMigration().catch(console.error);
