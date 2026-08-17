import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { isSupabaseConfigured } from '@/lib/config';
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

  const activeDistrictSlugs = new Set(discoveryClubs.map((club) => club.district?.slug).filter((slug): slug is string => Boolean(slug)));
  const activeDistricts = districts.filter((district) => activeDistrictSlugs.has(district.slug));
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bakıda PC və PlayStation klubları',
    numberOfItems: discoveryClubs.length,
    itemListElement: discoveryClubs.map((club, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: club.name,
      url: `https://gameyerr-gameyer.vercel.app/klub/${club.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="min-h-[calc(100dvh-64px)] bg-[#F8F9FC]">
        {!isSupabaseConfigured() ? (
          <div className="border-b border-warn/30 bg-warn-tint px-4 py-1.5 text-center text-xs font-medium text-warn sm:px-6">
            Supabase hələ qoşulmayıb — heç bir klub göstərilmir.
          </div>
        ) : null}

        <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          <section className="mb-4 flex items-end justify-between gap-3 sm:mb-5" aria-labelledby="home-title">
            <div className="min-w-0">
              <h1 id="home-title" className="font-display text-[22px] font-bold leading-tight tracking-[-0.035em] text-ink sm:text-3xl">
                Bakıda PC və PlayStation klubları
              </h1>
              <p className="mt-1 text-xs text-muted sm:mt-1.5 sm:text-sm">Sevdiyin oyunu, sənə uyğun məkanı seç.</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F0ECFF] px-3 py-1.5 text-xs font-semibold text-primary sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm">
              <span aria-hidden="true">🎮</span>
              {discoveryClubs.length} klub
            </div>
          </section>

          <Suspense fallback={<div className="mb-3 rounded-2xl border border-border bg-surface p-3 sm:mb-4 sm:p-4"><Skeleton className="h-11 w-full rounded-control" /></div>}>
            <FilterBar districts={activeDistricts} types={types} />
          </Suspense>

          <section className="overflow-hidden rounded-2xl border border-border bg-surface p-2.5 shadow-[0_10px_35px_rgba(31,35,48,0.05)] sm:p-4" aria-label="Klub siyahısı və xəritə">
            <ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} />
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-7 lg:grid-cols-4" aria-label="GameYer üstünlükləri">
            <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-live-tint text-lg">✓</span><div><h2 className="text-sm font-bold text-ink">Klub lokasiyaları</h2><p className="mt-0.5 text-xs text-muted">Xəritədə mövcud klub nöqtələri</p></div></div></div>
            <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-warn-tint text-lg">₼</span><div><h2 className="text-sm font-bold text-ink">Mövcud qiymətlər</h2><p className="mt-0.5 text-xs text-muted">Məlum olduqda qiymət göstərilir</p></div></div></div>
            <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-pc-tint text-lg">◷</span><div><h2 className="text-sm font-bold text-ink">İş saatları</h2><p className="mt-0.5 text-xs text-muted">Məlum iş saatlarını gör</p></div></div></div>
            <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-ps-tint text-lg">⌖</span><div><h2 className="text-sm font-bold text-ink">Asan axtarış</h2><p className="mt-0.5 text-xs text-muted">Rayon, tip və qiymət üzrə filtr</p></div></div></div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6 lg:mt-7" aria-labelledby="discover-heading">
            <h2 id="discover-heading" className="font-display text-base font-bold text-ink">Gaming klublarını daha konkret tap</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">PC, PlayStation, 24 saat işləyən klublar və Bakı rayonları üzrə ayrıca siyahılara keç.</p>
            <nav className="mt-3 flex flex-wrap gap-2" aria-label="Gaming klub kateqoriyaları">
              <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">PC klubları</Link>
              <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">PlayStation klubları</Link>
              <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">24 saat klublar</Link>
              {activeDistricts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-ink">{district.name}</Link>)}
            </nav>
          </section>
        </div>
      </div>
    </>
  );
}
