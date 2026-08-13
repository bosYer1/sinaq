/**
 * Supabase konfiqurasiyasının mövcud olub-olmadığını yoxlayır.
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local-da
 * təyin olunmayıbsa (məs. lokal preview/dizayn mərhələsində), sorğu
 * funksiyaları bu bayrağa əsasən development üçün mock data-ya keçir.
 * Supabase qoşulan kimi (env dəyərləri təyin olunan kimi) tətbiq avtomatik
 * real data-ya keçəcək — bunun üçün heç bir kod dəyişikliyi lazım deyil.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
