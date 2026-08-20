const PRODUCTION_SUPABASE_URL = 'https://uxcedpbumulpheglhlvs.supabase.co';
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ZRyHR5Qj2LmbCZVsKTBZ4Q_eRByoSYf';

const isVercelProduction = process.env.VERCEL_ENV === 'production';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  (isVercelProduction ? PRODUCTION_SUPABASE_URL : '');

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (isVercelProduction ? PRODUCTION_SUPABASE_PUBLISHABLE_KEY : '');

export function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function assertSupabaseConfig(): void {
  if (!hasSupabaseConfig()) {
    throw new Error(
      'Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY; non-production environments never fall back to GameYer production.',
    );
  }
}
