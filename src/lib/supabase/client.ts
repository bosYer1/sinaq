'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser tərəfdə istifadə olunan Supabase client.
 *
 * Environment dəyişənləri yoxdursa null qaytarır.
 */
export function createClient(): ReturnType<
  typeof createBrowserClient<Database>
> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY tapılmadı (browser client).',
    );
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
