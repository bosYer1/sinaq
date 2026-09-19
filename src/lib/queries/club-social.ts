import 'server-only';

import { createServerAdminClient } from '@/lib/supabase/server-admin';

function normalizeTikTokProfileUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (host !== 'tiktok.com' && host !== 'www.tiktok.com') return null;
    if (!url.pathname.startsWith('/@')) return null;
    return `https://www.tiktok.com${url.pathname.replace(/\/$/, '')}`;
  } catch {
    return null;
  }
}

export async function getClubTikTokUrl(clubId: string): Promise<string | null> {
  const supabase = createServerAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('club_data_evidence')
    .select('source_url')
    .eq('club_id', clubId)
    .eq('is_current', true)
    .ilike('source_url', '%tiktok.com/@%')
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<{ source_url: string | null }>();

  if (error) {
    console.error('getClubTikTokUrl xətası:', error.message);
    return null;
  }

  return normalizeTikTokProfileUrl(data?.source_url ?? null);
}
