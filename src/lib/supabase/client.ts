'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser tərəfdə (client component-lərdə) istifadə olunan Supabase client.
 * `anon` key public istifadə üçün nəzərdə tutulub — real qorunma Row Level
 * Security (RLS) siyasətləri ilə təmin olunur, buna görə bu key-i browser-ə
 * göndərmək təhlükəsizdir.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase konfiqurasiyası tapılmadı. .env.local faylında ' +
        'NEXT_PUBLIC_SUPABASE_URL və NEXT_PUBLIC_SUPABASE_ANON_KEY dəyərlərini təyin edin ' +
        '(nümunə üçün .env.local.example-a baxın).',
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
