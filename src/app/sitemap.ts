import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

interface SitemapClub {
  slug: string;
  updated_at: string | null;
  district: { slug: string } | null;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
  pricing: Array<{ price_from: number; unit: string; club_type: { slug: string } | null }>;
  opening_hours: Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }>;
}

function newerIso(current: string | null, candidate: string | null) {
  if (!candidate) return current;
  if (!current) return candidate;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

function isOpen24HoursEveryDay(hours: SitemapClub['opening_hours']) {
  const byDay = new Map(hours.map((item) => [item.day_of_week, item]));
  return Array.from({ length: 7 }, (_, day) => day).every((day) => {
    const item = byDay.get(day);
    if (!item || item.is_closed || !item.open_time || !item.close_time) return false;
    return item.open_time.startsWith('00:00') && (item.close_time.startsWith('23:59') || item.close_time.startsWith('00:00'));
  });
}

function hasConfirmedPublicType(club: SitemapClub) {
  return (club.type_assignments ?? []).some((assignment) => {
    const slug = assignment.club_type?.slug;
    return slug === 'pc' || slug === 'playstation';
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
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
      ),
      pricing:club_pricing (
        price_from,
        unit,
        club_type:club_types ( slug )
      ),
      opening_hours:club_opening_hours (
        day_of_week,
        open_time,
        close_time,
        is_closed
      )
    `)
    .eq('is_active', true)
    .not('instagram_url', 'is', null)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  if (error) return entries;

  const clubs = ((data ?? []) as unknown as SitemapClub[]).filter(hasConfirmedPublicType);
  const activeDistricts = new Set<string>();
  const comboCounts = new Map<string, number>();
  const districtLatest = new Map<string, string | null>();
  const comboLatest = new Map<string, string | null>();
  const typeLatest = new Map<string, string | null>();
  let overallLatest: string | null = null;
  let pcCount = 0;
  let playStationCount = 0;
  let cheapPcCount = 0;
  let cheapPlayStationCount = 0;
  let open24Count = 0;
  let pricedClubCount = 0;

  for (const club of clubs) {
    overallLatest = newerIso(overallLatest, club.updated_at);
    entries.push({
      url: `${baseUrl}/klub/${club.slug}`,
      ...(club.updated_at ? { lastModified: new Date(club.updated_at) } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    const typeSlugs = new Set(
      (club.type_assignments ?? [])
        .map((assignment) => assignment.club_type?.slug)
        .filter((slug): slug is string => slug === 'pc' || slug === 'playstation')
    );
    if (typeSlugs.has('pc')) pcCount += 1;
    if (typeSlugs.has('playstation')) playStationCount += 1;

    const hourlyPricing = (club.pricing ?? []).filter((item) => item.unit === 'saat' && item.price_from > 0);
    if (hourlyPricing.length > 0) pricedClubCount += 1;
    if (hourlyPricing.some((item) => item.club_type?.slug === 'pc' && item.price_from <= 2)) cheapPcCount += 1;
    if (hourlyPricing.some((item) => item.club_type?.slug === 'playstation' && item.price_from <= 3)) cheapPlayStationCount += 1;
    if (isOpen24HoursEveryDay(club.opening_hours ?? [])) open24Count += 1;

    if (!club.district?.slug) continue;
    const districtSlug = club.district.slug;
    activeDistricts.add(districtSlug);
    districtLatest.set(districtSlug, newerIso(districtLatest.get(districtSlug) ?? null, club.updated_at));

    for (const typeSlug of typeSlugs) {
      typeLatest.set(typeSlug, newerIso(typeLatest.get(typeSlug) ?? null, club.updated_at));
      const key = `${districtSlug}/${typeSlug}`;
      comboCounts.set(key, (comboCounts.get(key) ?? 0) + 1);
      comboLatest.set(key, newerIso(comboLatest.get(key) ?? null, club.updated_at));
    }
  }

  const addLanding = (path: string, priority: number, latest: string | null) => {
    entries.push({
      url: `${baseUrl}${path}`,
      ...(latest ? { lastModified: new Date(latest) } : {}),
      changeFrequency: 'weekly',
      priority,
    });
  };

  if (clubs.length > 0) addLanding('/yaxinliqda-gaming-klublari', 0.94, overallLatest);
  if (pcCount > 0) {
    addLanding('/bakida-pc-klublari', 0.9, typeLatest.get('pc') ?? null);
    addLanding('/bakida-internet-klublari', 0.88, typeLatest.get('pc') ?? null);
  }
  if (playStationCount > 0) addLanding('/bakida-playstation-klublari', 0.9, typeLatest.get('playstation') ?? null);
  if (pricedClubCount > 0) addLanding('/bakida-gaming-klub-qiymetleri', 0.92, overallLatest);
  if (cheapPcCount > 0) addLanding('/bakida-ucuz-pc-klublari', 0.9, typeLatest.get('pc') ?? null);
  if (cheapPlayStationCount > 0) addLanding('/bakida-ucuz-playstation-klublari', 0.9, typeLatest.get('playstation') ?? null);
  if (open24Count > 0) addLanding('/bakida-24-saat-gaming-klublari', 0.88, overallLatest);

  const applyLatest = (url: string, latest: string | null) => {
    if (!latest) return;
    const entry = entries.find((item) => item.url === url);
    if (entry) entry.lastModified = new Date(latest);
  };

  applyLatest(baseUrl, overallLatest);
  applyLatest(`${baseUrl}/rayon`, overallLatest);
  applyLatest(`${baseUrl}/tip`, overallLatest);

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
