export type MobileConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

function validSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function validPublishableKey(value: string) {
  if (value.startsWith('sb_publishable_')) return true;
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

export function readMobileConfig(env: PublicEnvironment = process.env): MobileConfig {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const supabasePublishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

  if (!validSupabaseUrl(supabaseUrl) || !validPublishableKey(supabasePublishableKey)) {
    throw new Error(
      'Mobil Supabase konfiqurasiyası yoxdur. mobile/.env.example əsasında explicit mühit seçin.',
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
