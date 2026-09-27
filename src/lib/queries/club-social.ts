import 'server-only';

import { createPublicClient } from '@/lib/supabase/public-server';

type PublicClubSocialRow = {
  instagram_url: string | null;
  tiktok_url: string | null;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
};

export async function getClubTikTokUrl(clubId: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      instagram_url,
      tiktok_url,
      type_assignments:club_type_assignments (
        club_type:club_types ( slug )
      )
    `)
    .eq('id', clubId)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .maybeSingle()
    .returns<PublicClubSocialRow>();

  if (error || !data?.tiktok_url) return null;
  if (!data.instagram_url?.trim() && !data.tiktok_url.trim()) return null;

  const hasPublicType = (data.type_assignments ?? []).some((assignment) => {
    const slug = assignment.club_type?.slug;
    return slug === 'pc' || slug === 'playstation';
  });
  if (!hasPublicType) return null;

  const value = data.tiktok_url.trim();
  return /^https:\/\/(?:www\.)?tiktok\.com\/@[a-z0-9._]{2,24}\/?(?:\?.*)?$/i.test(value) ? value : null;
}
