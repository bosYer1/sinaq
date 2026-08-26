import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { assertSupabaseConfig, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/public-config';

let publicClient: ReturnType<typeof createClient<Database>> | null = null;

export function createPublicClient() {
  assertSupabaseConfig();
  if (publicClient) return publicClient;

  publicClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return publicClient;
}
