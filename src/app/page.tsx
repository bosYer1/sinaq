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

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col">
      {!isSupabaseConfigured() && (
        <div className="border-b border-warn/30 bg-warn-tint px-4 py-1.5 text-center text-xs font-medium text-warn sm:px-6">
          Supabase hələ qoşulmayıb — heç bir klub göstərilmir.
        </div>
      )}

      <section className="relative overflow-hidden border-b border-border bg-surface px-4 py-3 sm:px-6" aria-labelledby="home-title">
        <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-hidden">
          <span className="hidden h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_14px_rgba(124,92,252,0.65)] sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <h1 id="home-title" className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink sm:text-base">
              Bakıda PC və PlayStation klubları
            </h1>
            <p className="mt-0.5 hidden truncate text-xs text-muted md:block">
              Oyun yerini seç, klubu tap, xəritədə bax.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-[57px] border-b border-border bg-surface"><Skeleton className="m-3 h-9 w-full rounded-control" /></div>}>
        <FilterBar districts={activeDistricts} types={types} />
      </Suspense>

      <div className="flex min-h-[500px] flex-1">
        <ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} />
      </div>

      <section className="border-t border-border bg-surface px-4 py-5 sm:px-6" aria-labelledby="discover-heading">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">🎮</span>
            <h2 id="discover-heading" className="font-display text-sm font-bold text-ink">GameYer-də kəşf et</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">PC, PlayStation, 24 saat işləyən klublar və Bakı rayonları üzrə ayrıca siyahılara keç.</p>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Gaming klub kateqoriyaları">
            <Link href="/bakida-pc-klublari" className="rounded-control border border-primary/20 bg-pc-tint px-3 py-2 text-xs font-semibold text-primary hover:border-primary">PC Gaming</Link>
            <Link href="/bakida-playstation-klublari" className="rounded-control border border-ps/20 bg-ps-tint px-3 py-2 text-xs font-semibold text-ps hover:border-ps">PlayStation</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">24/7 klublar</Link>
            {activeDistricts.map((district) => (
              <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-ink">
                {district.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
