import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getDistricts } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';

interface SitemapClub {
  slug: string;
  updated_at: string | null;
  district: { slug: string } | null;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/bakida-pc-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bakida-playstation-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/rayon`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tip`, changeFrequency: 'weekly', priority: 0.65 },
    { url: `${baseUrl}/klub-sahibi`, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${baseUrl}/elaqe`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/mexfilik`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const districts = await getDistricts();
  for (const district of districts) {
    entries.push({ url: `${baseUrl}/rayon/${district.slug}`, changeFrequency: 'weekly', priority: 0.75 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      slug,
      updated_at,
      district:districts ( slug ),
      type_assignments:club_type_assignments (
        club_type:club_types ( slug )
      )
    `)
    .eq('is_active', true);

  if (error) return entries;
  const clubs = (data ?? []) as unknown as SitemapClub[];
  const combinationCounts = new Map<string, number>();

  for (const club of clubs) {
    entries.push({
      url: `${baseUrl}/klub/${club.slug}`,
      lastModified: club.updated_at ? new Date(club.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    if (!club.district?.slug) continue;
    for (const assignment of club.type_assignments ?? []) {
      const type = assignment.club_type?.slug;
      if (type !== 'pc' && type !== 'playstation') continue;
      const key = `${club.district.slug}:${type}`;
      combinationCounts.set(key, (combinationCounts.get(key) ?? 0) + 1);
    }
  }

  for (const [key, count] of combinationCounts) {
    if (count < 2) continue;
    const [districtSlug, type] = key.split(':');
    entries.push({
      url: `${baseUrl}/rayon/${districtSlug}/${type}`,
      changeFrequency: 'weekly',
      priority: 0.82,
    });
  }

  return entries;
}
