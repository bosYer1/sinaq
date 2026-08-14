import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gameyer.az';
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  const supabase = createClient();
  if (!supabase) return entries;

  const { data } = await supabase
    .from('clubs')
    .select('slug, updated_at')
    .eq('is_active', true);

  for (const club of data ?? []) {
    entries.push({
      url: `${baseUrl}/klub/${club.slug}`,
      lastModified: club.updated_at ? new Date(club.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}
