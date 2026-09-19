import 'server-only';

import { createPublicClient } from '@/lib/supabase/public-server';

export async function getClubTikTokUrl(clubId: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from('clubs').select('tiktok_url').eq('id', clubId).maybeSingle().returns<{ tiktok_url: string | null }>();
  if (error || !data?.tiktok_url) return null;
  const value = data.tiktok_url.trim();
  return /^https:\/\/(?:www\.)?tiktok\.com\/@[a-z0-9._]{2,24}\/?(?:\?.*)?$/i.test(value) ? value : null;
}
