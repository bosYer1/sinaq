import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';

type TopPage = { path: string; views: number; visitors: number };
type DailyPoint = { date: string; views: number; visitors: number };
type TrafficSource = { source: string; views: number; visitors: number };
type AnalyticsData = {
  today_views: number;
  today_visitors: number;
  views_7d: number;
  visitors_7d: number;
  views_30d: number;
  visitors_30d: number;
  top_pages: TopPage[];
  top_sources: TrafficSource[];
  daily: DailyPoint[];
};

const EMPTY: AnalyticsData = {
  today_views: 0,
  today_visitors: 0,
  views_7d: 0,
  visitors_7d: 0,
  views_30d: 0,
  visitors_30d: 0,
  top_pages: [],
  top_sources: [],
  daily: [],
};

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseAnalytics(value: Json | null): AnalyticsData {
  if (!value || Array.isArray(value) || typeof value !== 'object') return EMPTY;

  const raw = value as Record<string, Json | undefined>;
  const topPages = Array.isArray(raw.top_pages)
    ? raw.top_pages.flatMap((item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return [];
        const row = item as Record<string, Json | undefined>;
        return typeof row.path === 'string'
          ? [{ path: row.path, views: asNumber(row.views), visitors: asNumber(row.visitors) }]
          : [];
      })
    : [];
  const topSources = Array.isArray(raw.top_sources)
    ? raw.top_sources.flatMap((item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return [];
        const row = item as Record<string, Json | undefined>;
        return typeof row.source === 'string'
          ? [{ source: row.source, views: asNumber(row.views), visitors: asNumber(row.visitors) }]
          : [];
      })
    : [];
  const daily = Array.isArray(raw.daily)
    ? raw.daily.flatMap((item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return [];
        const row = item as Record<string, Json | undefined>;
        return typeof row.date === 'string'
          ? [{ date: row.date, views: asNumber(row.views), visitors: asNumber(row.visitors) }]
          : [];
      })
    : [];

  return {
    today_views: asNumber(raw.today_views),
    today_visitors: asNumber(raw.today_visitors),
    views_7d: asNumber(raw.views_7d),
    visitors_7d: asNumber(raw.visitors_7d),
    views_30d: asNumber(raw.views_30d),
    visitors_30d: asNumber(raw.visitors_30d),
    top_pages: topPages,
    top_sources: topSources,
    daily,
  };
}

function sourceLabel(source: string) {
  if (source === 'direct') return 'Birbaşa / məlum deyil';
  if (source.includes('google.')) return 'Google';
  if (source.includes('instagram.com')) return 'Instagram';
  if (source.includes('facebook.com') || source.includes('fb.com')) return 'Facebook';
  if (source.includes('tiktok.com')) return 'TikTok';
  if (source.includes('yandex.')) return 'Yandex';
  return source.replace(/^www\./, '');
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_admin_analytics');
  const stats = error ? EMPTY : parseAnalytics(data);
  const maxDailyViews = Math.max(1, ...stats.daily.map((item) => item.views));
  const maxSourceViews = Math.max(1, ...stats.top_sources.map((item) => item.views));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giriş statistikası</h1>
          <p className="mt-1 text-sm text-gray-500">GameYer ziyarətləri — IP ünvanı və şəxsi məlumat saxlanmır.</p>
        </div>
        <Link href="/admin" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">Dashboard</Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Statistika hazırda oxunmadı. Bir az sonra yenidən yoxla.</div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Bu gün baxış</p><p className="mt-2 text-4xl font-bold">{stats.today_views}</p><p className="mt-2 text-xs text-gray-500">{stats.today_visitors} unikal ziyarətçi</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Son 7 gün</p><p className="mt-2 text-4xl font-bold">{stats.views_7d}</p><p className="mt-2 text-xs text-gray-500">{stats.visitors_7d} unikal ziyarətçi</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Son 30 gün</p><p className="mt-2 text-4xl font-bold">{stats.views_30d}</p><p className="mt-2 text-xs text-gray-500">{stats.visitors_30d} unikal ziyarətçi</p></div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-bold">Son 14 gün</h2>
            <p className="mt-1 text-sm text-gray-500">Günlük səhifə baxışları və unikal ziyarətçilər.</p>
          </div>
          <div className="mt-6 space-y-3">
            {stats.daily.length === 0 ? <p className="text-sm text-gray-500">Hələ statistika toplanmayıb.</p> : stats.daily.map((item) => (
              <div key={item.date} className="grid grid-cols-[84px_1fr_78px] items-center gap-3 text-sm">
                <span className="text-xs text-gray-500">{new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T12:00:00+04:00`))}</span>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${Math.max(3, Math.round((item.views / maxDailyViews) * 100))}%` }} /></div>
                <span className="text-right text-xs font-semibold">{item.views} / {item.visitors}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11px] text-gray-400">Format: baxış / unikal ziyarətçi</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold">Ən çox baxılan səhifələr</h2>
          <p className="mt-1 text-sm text-gray-500">Son 30 gün üzrə.</p>
          <div className="mt-5 divide-y divide-gray-100">
            {stats.top_pages.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ statistika toplanmayıb.</p> : stats.top_pages.map((item, index) => (
              <div key={item.path} className="flex items-center gap-3 py-3">
                <span className="w-6 shrink-0 text-xs font-bold text-gray-400">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{item.path}</p><p className="mt-0.5 text-xs text-gray-500">{item.visitors} unikal ziyarətçi</p></div>
                <span className="shrink-0 text-sm font-bold">{item.views}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Trafik mənbələri</h2>
            <p className="mt-1 text-sm text-gray-500">Son 30 gündə istifadəçilərin GameYer-ə haradan gəldiyi.</p>
          </div>
          <span className="text-xs text-gray-400">Yalnız xarici saytın hostname-i saxlanır</span>
        </div>
        <div className="mt-5 space-y-3">
          {stats.top_sources.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ mənbə məlumatı toplanmayıb.</p> : stats.top_sources.map((item) => (
            <div key={item.source} className="grid gap-2 sm:grid-cols-[160px_1fr_110px] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{sourceLabel(item.source)}</p>
                {item.source !== 'direct' ? <p className="truncate text-[11px] text-gray-400">{item.source}</p> : null}
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${Math.max(3, Math.round((item.views / maxSourceViews) * 100))}%` }} /></div>
              <p className="text-xs text-gray-500 sm:text-right"><strong className="text-gray-900">{item.views}</strong> baxış · {item.visitors} nəfər</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        <strong className="text-gray-900">Necə hesablanır?</strong> Hər brauzerə anonim lokal identifikator verilir. IP, ad, telefon və dəqiq lokasiya analytics üçün saxlanmır. Xarici trafik mənbəyindən yalnız hostname saxlanır; URL yolu və query parametrləri saxlanmır. Admin səhifələrinə giriş statistikaya daxil edilmir.
      </div>
    </div>
  );
}
