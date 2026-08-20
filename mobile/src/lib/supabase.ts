import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readMobileConfig } from '@/lib/config';

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (client) return client;

  const config = readMobileConfig();
  client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}
