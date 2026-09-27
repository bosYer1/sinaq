import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from '@/lib/supabase/public-config';

let serverDataClient: ReturnType<typeof createClient<Database>> | null = null;

export function createServerDataClient() {
  if (serverDataClient) return serverDataClient;

  const key = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !key) {
    throw new Error('Server data client is unavailable: Supabase configuration is missing.');
  }

  serverDataClient = createClient<Database>(SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return serverDataClient;
}
