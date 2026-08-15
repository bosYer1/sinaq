import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';

interface SitemapClub { slug: string; updated_at: string | null; }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/bakida-pc-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bakida-playstation-klublari`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/rayon`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tip`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/klub-sahibi`, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${baseUrl}/elaqe`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/mexfilik`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const [districts, types] = await Promise.all([getDistricts(), getClubTypes()]);
  for (const district of districts) entries.push({ url: `${baseUrl}/rayon/${district.slug}`, changeFrequency: 'weekly', priority: 0.75 });
  for (const type of types) entries.push({ url: `${baseUrl}/tip/${type.slug}`, changeFrequency: 'weekly', priority: 0.7 });

  const supabase = await createClient();
  const { data, error } = await supabase.from('clubs').select('slug, updated_at').eq('is_active', true);
  if (error) return entries;
  const clubs = (data ?? []) as unknown as SitemapClub[];
  for (const club of clubs) entries.push({ url: `${baseUrl}/klub/${club.slug}`, lastModified: club.updated_at ? new Date(club.updated_at) : new Date(), changeFrequency: 'weekly', priority: 0.8 });
  return entries;
}
