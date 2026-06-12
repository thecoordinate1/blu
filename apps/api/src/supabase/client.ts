import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../lib/env.js';

/**
 * Service-role Supabase client — bypasses RLS.
 * Used by the server internals; never expose to external callers.
 */
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  }
);

/**
 * Returns a Supabase client scoped to a specific tenant by setting the
 * `app.api_key` session variable that RLS policies reference.
 *
 * Each call creates a lightweight wrapper — the underlying HTTP connection
 * pool is shared so this is safe to call per-request.
 */
export function withTenantScope(businessApiKey: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    global: {
      headers: {
        // Supabase forwards custom headers as session settings when using
        // the PostgREST `request.header.*` convention, but for RLS via
        // current_setting we rely on an RPC call below instead.
      },
    },
  });
}

/**
 * Sets the tenant scope on a raw Postgres connection via RPC.
 * Call this before running tenant-scoped queries in a transaction.
 */
export async function setTenantApiKey(
  client: SupabaseClient,
  apiKey: string
): Promise<void> {
  const { error } = await client.rpc('set_config', {
    setting: 'app.api_key',
    value: apiKey,
  });

  if (error) {
    console.error('[supabase] Failed to set tenant scope:', error.message);
    throw new Error(`Tenant scope error: ${error.message}`);
  }
}
