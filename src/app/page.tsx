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

type HomeSearchParams = { district?: string; type?: string; price_max?: string; q?: string; view?: string };
interface PageProps { searchParams: Promise<HomeSearchParams> }
const INDEX_AFFECTING_QUERY_KEYS: Array<keyof HomeSearchParams> = ['district', 'type', 'price_max', 'q', 'view'];

function hasActiveQuery(params: HomeSearchParams) {
  return INDEX_AFFECTING_QUERY_KEYS.some((key) => {
    const value = params[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  if (!hasActiveQuery(params)) return { alternates: { canonical: '/' } };
  return { alternates: { canonical: '/' }, robots: { index: false, follow: true } };
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
  const hasDataFilter = Boolean(filters.district || filters.type || filters.priceMax || filters.q);
  const allClubsPromise = getClubs();
  const filteredClubsPromise = hasDataFilter ? getClubs(filters) : allClubsPromise;

  const [clubs, discoveryClubs, districts, types] = await Promise.all([
    filteredClubsPromise,
    allClubsPromise,
    getDistricts(),
    getClubTypes(),
  ]);

  const activeDistrictSlugs = new Set(
    discoveryClubs
      .map((club) => club.district?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );
  const activeDistricts = districts.filter((district) => activeDistrictSlugs.has(district.slug));
  const siteUrl = getSiteUrl();
  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/#home`,
        url: siteUrl,
        name: 'Bakıda PC və PlayStation klubları',
        description: 'Bakıda gaming klublarını axtar, rayon və tip üzrə filtr et, xəritədə müqayisə et.',
        isPartOf: { '@id': `${siteUrl}/#website` },
        mainEntity: { '@id': `${siteUrl}/#club-list` },
        inLanguage: 'az-AZ',
      },
      {
        '@type': 'ItemList',
        '@id': `${siteUrl}/#club-list`,
        name: 'Bakıda PC və PlayStation klubları',
        numberOfItems: discoveryClubs.length,
        itemListElement: discoveryClubs.map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: club.name,
          url: `${siteUrl}/klub/${club.slug}`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData).replace(/</g, '\\u003c') }}
      />
      <div className="min-h-[calc(100dvh-64px)] bg-bg-elevated">
        {!isSupabaseConfigured() ? (
          <div className="border-b border-warn/30 bg-warn-tint px-4 py-1.5 text-center text-xs font-medium text-warn sm:px-6">
            Supabase hələ qoşulmayıb — heç bir klub göstərilmir.
          </div>
        ) : null}

        <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          <section className="mb-4 sm:mb-5" aria-labelledby="home-title">
            <h1
              id="home-title"
              className="font-display text-[22px] font-bold leading-tight tracking-[-0.035em] text-ink sm:text-3xl"
            >
              Gaming klubunu tap
            </h1>
            <p className="mt-1 text-xs text-muted sm:mt-1.5 sm:text-sm">
              Axtar, filtr et, xəritədə bax və sənə uyğun klubu seç.
            </p>
          </section>

          <section id="club-search" className="scroll-mt-20" aria-label="Klub axtarışı və filtrlər">
            <Suspense
              fallback={
                <div className="mb-3 rounded-2xl border border-border bg-surface p-3 sm:mb-4 sm:p-4">
                  <Skeleton className="h-11 w-full rounded-control" />
                </div>
              }
            >
              <FilterBar districts={activeDistricts} types={types} />
            </Suspense>
          </section>

          <section
            id="club-discovery"
            className="overflow-hidden rounded-2xl border border-border bg-surface p-2.5 shadow-[0_10px_35px_rgba(31,35,48,0.05)] sm:p-4"
            aria-label="Klub siyahısı və xəritə"
          >
            <ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} />
          </section>
        </div>
      </div>
    </>
  );
}
