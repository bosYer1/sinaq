import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { isSupabaseConfigured } from '@/lib/config';
import { FilterBar } from '@/components/filters/FilterBar';
import { SearchFilter } from '@/components/filters/SearchFilter';
import { ExploreView } from '@/components/explore/ExploreView';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ClubFilters } from '@/types/database';

export const dynamic = 'force-dynamic';
type HomeSearchParams = { district?: string; type?: string; price_max?: string; q?: string; view?: string };
interface PageProps { searchParams: Promise<HomeSearchParams>; }
const INDEX_AFFECTING_QUERY_KEYS: Array<keyof HomeSearchParams> = ['district','type','price_max','q','view'];
function hasActiveQuery(params: HomeSearchParams) { return INDEX_AFFECTING_QUERY_KEYS.some((key) => { const value = params[key]; return typeof value === 'string' && value.trim().length > 0; }); }
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> { const params = await searchParams; if (!hasActiveQuery(params)) return { alternates: { canonical: '/' } }; return { alternates: { canonical: '/' }, robots: { index: false, follow: true } }; }
function parsePositiveNumber(value?: string) { if (!value) return undefined; const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; }

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters: ClubFilters = { district: resolvedSearchParams.district?.trim() || undefined, type: resolvedSearchParams.type?.trim() || undefined, priceMax: parsePositiveNumber(resolvedSearchParams.price_max), q: resolvedSearchParams.q?.trim() || undefined };
  const view = resolvedSearchParams.view === 'map' ? 'map' : 'list';
  const hasDataFilter = Boolean(filters.district || filters.type || filters.priceMax || filters.q);
  const allClubsPromise = getClubs();
  const filteredClubsPromise = hasDataFilter ? getClubs(filters) : allClubsPromise;
  const [clubs, discoveryClubs, districts, types] = await Promise.all([filteredClubsPromise, allClubsPromise, getDistricts(), getClubTypes()]);
  const activeDistrictSlugs = new Set(discoveryClubs.map((club) => club.district?.slug).filter((slug): slug is string => Boolean(slug)));
  const activeDistricts = districts.filter((district) => activeDistrictSlugs.has(district.slug));
  const searchQuery = resolvedSearchParams.q?.trim() ?? '';

  return <div className="flex min-h-[calc(100dvh-64px)] flex-col">
    {!isSupabaseConfigured() && <div className="border-b border-warn/30 bg-warn-tint px-4 py-2 text-center text-xs font-medium text-warn sm:px-6">Supabase hələ qoşulmayıb — heç bir klub göstərilmir.</div>}

    <section className="relative overflow-hidden border-b border-white/5 px-4 pb-7 pt-8 sm:px-6 sm:pb-10 sm:pt-12" aria-labelledby="home-title">
      <div className="gameyer-soft-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute left-[12%] top-[-8rem] h-72 w-72 rounded-full bg-primary/20 blur-[90px]" />
      <div className="pointer-events-none absolute right-[8%] top-2 h-64 w-64 rounded-full bg-ps/10 blur-[100px]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_10px_rgba(57,217,138,.7)]"/> Bakı gaming discovery
        </div>

        <div className="mt-5 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-3xl">
            <h1 id="home-title" className="font-display text-[2.45rem] font-bold leading-[.98] tracking-[-.06em] text-white sm:text-6xl lg:text-7xl">
              Oyuna yer tap.
              <span className="mt-1 block bg-gradient-to-r from-[#D8C8FF] via-primary to-ps bg-clip-text text-transparent">Vaxt itirmə.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">Bakıda PC və PlayStation klublarını qiymət, rayon, iş saatı və xəritəyə görə müqayisə et. GameYer sənə seçim verir, qərarı sən verirsən.</p>
          </div>

          <div className="hidden rounded-3xl border border-white/8 bg-white/[.04] p-5 backdrop-blur lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-faint">GameYer-də</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><p className="font-display text-2xl font-bold text-white">{discoveryClubs.length}</p><p className="mt-1 text-[11px] text-muted">aktiv klub</p></div>
              <div><p className="font-display text-2xl font-bold text-primary">PC + PS</p><p className="mt-1 text-[11px] text-muted">bir platformada</p></div>
            </div>
          </div>
        </div>

        <div className="mt-7 max-w-3xl">
          <Suspense fallback={<Skeleton className="h-14 w-full rounded-2xl sm:h-16" />}><SearchFilter key={searchQuery}/></Suspense>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/?type=pc" className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-4 py-2.5 font-semibold text-[#CDBBFF] transition hover:border-primary/50 hover:bg-primary/15">🖥 PC Gaming</Link>
          <Link href="/?type=playstation" className="shrink-0 rounded-full border border-ps/20 bg-ps/10 px-4 py-2.5 font-semibold text-[#91EAF8] transition hover:border-ps/45">🎮 PlayStation</Link>
          <Link href="/bakida-24-saat-gaming-klublari" className="shrink-0 rounded-full border border-white/10 bg-white/[.045] px-4 py-2.5 font-semibold text-muted transition hover:border-white/20 hover:text-white">⚡ 24/7 klublar</Link>
        </div>
      </div>
    </section>

    <Suspense fallback={<div className="h-[66px] border-b border-white/5 bg-bg"><Skeleton className="m-3 h-10 w-[calc(100%-1.5rem)] rounded-control" /></div>}><FilterBar districts={activeDistricts} types={types} /></Suspense>
    <div className="flex min-h-[560px] flex-1"><ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} /></div>

    <section className="border-t border-white/5 bg-[#10131A]/72 px-4 py-8 sm:px-6" aria-labelledby="discover-heading"><div className="mx-auto max-w-6xl"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Kəşf et</p><h2 id="discover-heading" className="mt-1 font-display text-xl font-bold tracking-tight text-white">Oyuna uyğun yeri daha tez tap</h2></div><span className="hidden text-xs text-faint sm:block">{discoveryClubs.length} aktiv klub</span></div><nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Gaming klub kateqoriyaları"><Link href="/bakida-pc-klublari" className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-semibold text-[#CDBBFF]">PC Gaming</Link><Link href="/bakida-playstation-klublari" className="shrink-0 rounded-xl border border-ps/20 bg-ps/10 px-4 py-3 text-xs font-semibold text-[#91EAF8]">PlayStation</Link><Link href="/bakida-24-saat-gaming-klublari" className="shrink-0 rounded-xl border border-white/10 bg-surface px-4 py-3 text-xs font-semibold text-white">24/7 klublar</Link>{activeDistricts.slice(0,8).map((district)=><Link key={district.slug} href={`/rayon/${district.slug}`} className="shrink-0 rounded-xl border border-white/8 bg-surface px-4 py-3 text-xs font-medium text-muted transition hover:border-primary/25 hover:text-white">{district.name}</Link>)}</nav></div></section>
  </div>;
}
