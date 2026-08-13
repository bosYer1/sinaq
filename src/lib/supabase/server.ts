import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Server component-lərdə (page.tsx, layout.tsx) istifadə olunan Supabase client.
 * Next.js App Router-in `cookies()` API-si ilə işləyir.
 *
 * MVP-də auth/yazma əməliyyatı olmadığı üçün cookie yazma məntiqi minimaldır —
 * gələcəkdə auth əlavə olunanda `set`/`remove` funksiyaları tam işə düşəcək.
 */
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase konfiqurasiyası tapılmadı. .env.local faylında ' +
        'NEXT_PUBLIC_SUPABASE_URL və NEXT_PUBLIC_SUPABASE_ANON_KEY dəyərlərini təyin edin ' +
        '(nümunə üçün .env.local.example-a baxın).',
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component-dən çağırılanda cookie yazıla bilməz (Next.js məhdudiyyəti).
          // Middleware olmadığı üçün MVP-də bu, funksionallığa mane olmur (yalnız SELECT).
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Yuxarıdakı qeydlə eyni səbəb.
        }
      },
    },
  });
}
