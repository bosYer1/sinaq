import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Server component-lərdə istifadə olunan Supabase client.
 *
 * Environment dəyişənləri yoxdursa null qaytarır.
 */
export function createClient(): ReturnType<
  typeof createServerClient<Database>
> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL və/və ya NEXT_PUBLIC_SUPABASE_ANON_KEY tapılmadı. ' +
        'Vercel-də: Project Settings → Environment Variables. Yerli mühitdə: .env.local.',
    );
    return null;
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component-dən çağırılanda cookie yazıla bilməz.
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Server Component-dən çağırılanda cookie yazıla bilməz.
        }
      },
    },
  });
}

/**
 * Supabase konfiqurasiyasının mövcudluğunu yoxlayır.
 * Əsas məntiq config.ts-dədir.
 */
export { isSupabaseConfigured } from '@/lib/config';
