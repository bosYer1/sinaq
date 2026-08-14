import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from '@/lib/supabase/public-config';

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}
