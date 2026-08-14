import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

interface SitemapClub {
  slug: string;
  updated_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bosyer-web.vercel.app';
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/elaqe`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/mexfilik`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clubs')
    .select('slug, updated_at')
    .eq('is_active', true);

  if (error) return entries;

  const clubs = (data ?? []) as unknown as SitemapClub[];

  for (const club of clubs) {
    entries.push({
      url: `${baseUrl}/klub/${club.slug}`,
      lastModified: club.updated_at ? new Date(club.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}
