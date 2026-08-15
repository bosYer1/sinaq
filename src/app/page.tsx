import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { isSupabaseConfigured } from '@/lib/config';
import { getSiteUrl } from '@/lib/site-url';
import { FilterBar } from '@/components/filters/FilterBar';
import { ExploreView } from '@/components/explore/ExploreView';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ClubFilters } from '@/types/database';

export const dynamic = 'force-dynamic';

type HomeSearchParams = {
  district?: string;
  type?: string;
  price_max?: string;
  q?: string;
  view?: string;
};

interface PageProps {
  searchParams: Promise<HomeSearchParams>;
}

function hasActiveQuery(params: HomeSearchParams) {
  return Object.values(params).some((value) => typeof value === 'string' && value.trim().length > 0);
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  if (!hasActiveQuery(params)) return { alternates: { canonical: '/' } };

  return {
    alternates: { canonical: '/' },
    robots: {
      index: false,
      follow: true,
    },
  };
}

function parsePositiveNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters: ClubFilters = {
    district: resolvedSearchParams.district?.trim() || undefined,
    type: resolvedSearchParams.type?.trim() || undefined,
    priceMax: parsePositiveNumber(resolvedSearchParams.price_max),
    q: resolvedSearchParams.q?.trim() || undefined,
  };
  const view = resolvedSearchParams.view === 'map' ? 'map' : 'list';

  const [clubs, districts, types] = await Promise.all([
    getClubs(filters),
    getDistricts(),
    getClubTypes(),
  ]);

  const siteUrl = getSiteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'GameYer',
        description: 'Bakıda PC və PlayStation klublarını tapmaq üçün xəritə və klub kataloqu.',
        inLanguage: 'az-AZ',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'GameYer',
        url: siteUrl,
        logo: `${siteUrl}/apple-icon`,
        sameAs: [
          'https://www.instagram.com/gameyer.az/',
          'https://www.tiktok.com/@gameyer.az',
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <div className="flex min-h-[calc(100dvh-56px)] flex-col">
        {!isSupabaseConfigured() && (
          <div className="border-b border-warn/30 bg-warn-tint px-4 py-1.5 text-center text-xs font-medium text-warn sm:px-6">
            Supabase hələ qoşulmayıb — heç bir klub göstərilmir.
          </div>
        )}

        <section className="border-b border-border bg-surface px-4 py-2 sm:px-6" aria-labelledby="home-title">
          <div className="mx-auto flex max-w-6xl items-baseline gap-2 overflow-hidden">
            <h1 id="home-title" className="shrink-0 font-display text-sm font-bold text-ink sm:text-base">
              Bakıda PC və PlayStation klubları
            </h1>
            <p className="hidden truncate text-xs text-muted md:block">
              Gaming klublarını rayon, qiymət və xəritəyə görə tap və müqayisə et.
            </p>
          </div>
        </section>

        <Suspense
          fallback={
            <div className="h-[57px] border-b border-border bg-surface">
              <Skeleton className="m-3 h-9 w-full rounded-control" />
            </div>
          }
        >
          <FilterBar districts={districts} types={types} />
        </Suspense>

        <div className="flex min-h-[500px] flex-1">
          <ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} />
        </div>
      </div>
    </>
  );
}
