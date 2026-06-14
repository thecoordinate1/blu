import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/database';
import { env } from '../env';

export const createClient = () =>
  createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

export const supabase = createClient();