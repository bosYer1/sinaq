import { createClient } from '@supabase/supabase-js';

export type AnalyticsWriteMode = 'server-secret' | 'public-fallback';

function serverAnalyticsSecret() {
  return process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || null;
}

export function createAnalyticsWriteClient<T>(fallbackClient: T): {
  client: T;
  mode: AnalyticsWriteMode;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = serverAnalyticsSecret();

  if (!supabaseUrl || !secret) {
    return { client: fallbackClient, mode: 'public-fallback' };
  }

  const client = createClient(supabaseUrl, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return { client: client as unknown as T, mode: 'server-secret' };
}
