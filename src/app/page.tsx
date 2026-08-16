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

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col">
      {!isSupabaseConfigured() && <div className="border-b border-warn/30 bg-warn-tint px-4 py-2 text-center text-xs font-medium text-warn sm:px-6">Supabase hələ qoşulmayıb — heç bir klub göstərilmir.</div>}

      <section className="relative overflow-hidden border-b border-white/5 px-4 pb-6 pt-7 sm:px-6 sm:pb-8 sm:pt-10" aria-labelledby="home-title">
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_12px_rgba(54,209,124,.75)]" /> Bakı gaming discovery
          </div>
          <div className="mt-4 max-w-3xl">
            <h1 id="home-title" className="font-display text-3xl font-bold tracking-[-.05em] text-white sm:text-5xl">Oyuna yer axtarma.<br/><span className="bg-gradient-to-r from-primary via-[#b89cff] to-ps bg-clip-text text-transparent">GameYer-də tap.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">Bakıda PC və PlayStation klublarını rayon, qiymət, iş saatı və xəritəyə görə kəşf et.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Link href="/?type=pc" className="rounded-full border border-primary/25 bg-primary/10 px-3.5 py-2 font-semibold text-[#c9bbff] transition hover:border-primary/60 hover:bg-primary/15">🖥 PC Gaming</Link>
            <Link href="/?type=playstation" className="rounded-full border border-ps/25 bg-ps/10 px-3.5 py-2 font-semibold text-[#8feaff] transition hover:border-ps/60 hover:bg-ps/15">🎮 PlayStation</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 font-semibold text-muted transition hover:border-white/20 hover:text-white">⚡ 24/7 klublar</Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-[82px] border-b border-white/5 bg-bg-elevated"><Skeleton className="m-4 h-12 w-[calc(100%-2rem)] rounded-control" /></div>}><FilterBar districts={activeDistricts} types={types} /></Suspense>
      <div className="flex min-h-[540px] flex-1"><ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} /></div>

      <section className="border-t border-white/5 bg-[#090c18] px-4 py-7 sm:px-6" aria-labelledby="discover-heading">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Kəşf et</p><h2 id="discover-heading" className="mt-1 font-display text-xl font-bold tracking-tight text-white">GameYer-də daha tez tap</h2></div><span className="hidden text-xs text-faint sm:block">{discoveryClubs.length} aktiv klub</span></div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Gaming klub kateqoriyaları">
            <Link href="/bakida-pc-klublari" className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-semibold text-[#cbbfff] hover:border-primary/50">PC Gaming</Link>
            <Link href="/bakida-playstation-klublari" className="shrink-0 rounded-xl border border-ps/20 bg-ps/10 px-4 py-3 text-xs font-semibold text-[#8ee9ff] hover:border-ps/50">PlayStation</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="shrink-0 rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs font-semibold text-white hover:border-white/20">24/7 klublar</Link>
            {activeDistricts.slice(0, 8).map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="shrink-0 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs font-medium text-muted hover:border-primary/30 hover:text-white">{district.name}</Link>)}
          </nav>
        </div>
      </section>
    </div>
  );
}
