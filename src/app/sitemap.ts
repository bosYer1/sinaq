import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

interface SitemapClub {
  slug: string;
  updated_at: string | null;
  district: { slug: string } | null;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
}

function newerIso(current: string | null, candidate: string | null) {
  if (!candidate) return current;
  if (!current) return candidate;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/bakida-pc-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bakida-playstation-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bakida-gaming-klub-qiymetleri`, changeFrequency: 'weekly', priority: 0.92 },
    { url: `${baseUrl}/bakida-ucuz-pc-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bakida-ucuz-playstation-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bakida-24-saat-gaming-klublari`, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${baseUrl}/rayon`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tip`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/haqqimizda`, changeFrequency: 'monthly', priority: 0.62 },
    { url: `${baseUrl}/melumat-metodologiyasi`, changeFrequency: 'monthly', priority: 0.58 },
    { url: `${baseUrl}/klub-sahibi`, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${baseUrl}/elaqe`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/mexfilik`, changeFrequency: 'yearly', priority: 0.2 },
  ];

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
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  if (error) return entries;

  const clubs = (data ?? []) as unknown as SitemapClub[];
  const activeDistricts = new Set<string>();
  const comboCounts = new Map<string, number>();
  const districtLatest = new Map<string, string | null>();
  const comboLatest = new Map<string, string | null>();
  const typeLatest = new Map<string, string | null>();
  let overallLatest: string | null = null;

  for (const club of clubs) {
    overallLatest = newerIso(overallLatest, club.updated_at);
    entries.push({
      url: `${baseUrl}/klub/${club.slug}`,
      ...(club.updated_at ? { lastModified: new Date(club.updated_at) } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    if (!club.district?.slug) continue;
    const districtSlug = club.district.slug;
    activeDistricts.add(districtSlug);
    districtLatest.set(districtSlug, newerIso(districtLatest.get(districtSlug) ?? null, club.updated_at));

    for (const assignment of club.type_assignments ?? []) {
      const typeSlug = assignment.club_type?.slug;
      if (typeSlug !== 'pc' && typeSlug !== 'playstation') continue;
      typeLatest.set(typeSlug, newerIso(typeLatest.get(typeSlug) ?? null, club.updated_at));
      const key = `${districtSlug}/${typeSlug}`;
      comboCounts.set(key, (comboCounts.get(key) ?? 0) + 1);
      comboLatest.set(key, newerIso(comboLatest.get(key) ?? null, club.updated_at));
    }
  }

  const applyLatest = (url: string, latest: string | null) => {
    if (!latest) return;
    const entry = entries.find((item) => item.url === url);
    if (entry) entry.lastModified = new Date(latest);
  };

  applyLatest(baseUrl, overallLatest);
  applyLatest(`${baseUrl}/rayon`, overallLatest);
  applyLatest(`${baseUrl}/tip`, overallLatest);
  applyLatest(`${baseUrl}/bakida-gaming-klub-qiymetleri`, overallLatest);
  applyLatest(`${baseUrl}/bakida-24-saat-gaming-klublari`, overallLatest);
  applyLatest(`${baseUrl}/bakida-pc-klublari`, typeLatest.get('pc') ?? null);
  applyLatest(`${baseUrl}/bakida-playstation-klublari`, typeLatest.get('playstation') ?? null);
  applyLatest(`${baseUrl}/bakida-ucuz-pc-klublari`, typeLatest.get('pc') ?? null);
  applyLatest(`${baseUrl}/bakida-ucuz-playstation-klublari`, typeLatest.get('playstation') ?? null);

  for (const districtSlug of activeDistricts) {
    const latest = districtLatest.get(districtSlug) ?? null;
    entries.push({
      url: `${baseUrl}/rayon/${districtSlug}`,
      ...(latest ? { lastModified: new Date(latest) } : {}),
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  for (const [key, count] of comboCounts) {
    if (count < 2) continue;
    const latest = comboLatest.get(key) ?? null;
    entries.push({
      url: `${baseUrl}/rayon/${key}`,
      ...(latest ? { lastModified: new Date(latest) } : {}),
      changeFrequency: 'weekly',
      priority: 0.78,
    });
  }

  return entries;
}
