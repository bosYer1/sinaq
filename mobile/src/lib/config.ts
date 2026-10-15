export type MobileConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

function validSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) &&
      !url.username && !url.password && !url.port &&
      (url.pathname === '/' || url.pathname === '') && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function validPublishableKey(value: string) {
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(value)) return true;
  if (!value.startsWith('eyJ')) return false;
  try {
    const payload = value.split('.')[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const claims = JSON.parse(atob(normalized)) as { role?: unknown };
    return claims.role === 'anon';
  } catch {
    return false;
  }
}

type PublicEnvironment = Record<string, string | undefined>;

export function readMobileConfig(env: PublicEnvironment = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}): MobileConfig {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const supabasePublishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

  if (!validSupabaseUrl(supabaseUrl) || !validPublishableKey(supabasePublishableKey)) {
    throw new Error(
      'Mobil Supabase konfiqurasiyası yoxdur. mobile/.env.example əsasında explicit mühit seçin.',
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
