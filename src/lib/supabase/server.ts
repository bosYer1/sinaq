import { createServerClient } from '@supabase/ssr';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';
import type { Database } from '@/types/database';
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from '@/lib/supabase/public-config';

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    encode?: (value: string) => string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    partitioned?: boolean;
    path?: string;
    priority?: 'low' | 'medium' | 'high';
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
  };
};

/**
 * Next 15 keçid uyğunluğu: server actions və mövcud query qatının hamısını bir anda
 * sındırmamaq üçün cookies() müvəqqəti sync compatibility tipi ilə oxunur.
 * Next 16 keçidindən əvvəl bu helper tam async edilə bilər.
 */
export function createClient() {
  const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies;

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components may not write cookies; middleware refreshes auth.
          }
        },
      },
    }
  );
}
