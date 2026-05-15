import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Never import this from a client component or expose the key.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_KEY is not set');
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
