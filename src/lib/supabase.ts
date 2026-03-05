import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

// Lazy-initialized server-side Supabase client
export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
};

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase credentials.'
    );
  }
  _client = createClient(url, key);
  return _client;
}

// Service role client for admin/cron operations
export function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey);
}
