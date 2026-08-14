import { hasSupabaseConfig } from '@/lib/supabase/public-config';

export function isSupabaseConfigured(): boolean {
  return hasSupabaseConfig();
}
