import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';

type TopPage = { path: string; views: number; visitors: number };
type DailyPoint = { date: string; views: number; visitors: number };
type TrafficSource = { source: string; views: number; visitors: number };
type ActionClub = { club_slug: string; actions: number };
type RecentVisit = { ip: string; path: string; source: string; created_at: string; visitor: string };
type AnalyticsData = {
  today_views: number;
  today_visitors: number;
  views_7d: number;
  visitors_7d: number;
  views_30d: number;
  visitors_30d: number;
  cta_30d: { maps_click: number; phone_click: number; instagram_click: number };
  top_action_clubs: ActionClub[];
  top_pages: TopPage[];
  top_sources: TrafficSource[];
  daily: DailyPoint[];
  recent_visits: RecentVisit[];
};

const EMPTY: AnalyticsData = {
  today_views: 0,
  today_visitors: 0,
  views_7d: 0,
  visitors_7d: 0,
  views_30d: 0,
  visitors_30d: 0,
  cta_30d: { maps_click: 0, phone_click: 0, instagram_click: 0 },
  top_action_clubs: [],
  top_pages: [],
  top_sources: [],
  daily: [],
  recent_visits: [],
};

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function objectValue(value: Json | undefined) {
  return value && !Array.isArray(value) && typeof value === 'object'
    ? value as Record<string, Json | undefined>
    : null;
}

function parseAnalytics(value: Json | null): AnalyticsData {
  if (!value || Array.isArray(value) || typeof value !== 'object') return EMPTY;

  const raw = value as Record<string, Json | undefined>;
  const cta = objectValue(raw.cta_30d);
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
  const topActionClubs = Array.isArray(raw.top_action_clubs)
    ? raw.top_action_clubs.flatMap((item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return [];
        const row = item as Record<string, Json | undefined>;
        return typeof row.club_slug === 'string'
          ? [{ club_slug: row.club_slug, actions: asNumber(row.actions) }]
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
  const recentVisits = Array.isArray(raw.recent_visits)
    ? raw.recent_visits.flatMap((item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return [];
        const row = item as Record<string, Json | undefined>;
        if (typeof row.path !== 'string' || typeof row.created_at !== 'string') return [];
        return [{
          ip: typeof row.ip === 'string' ? row.ip : 'məlum deyil',
          path: row.path,
          source: typeof row.source === 'string' ? row.source : 'direct',
          created_at: row.created_at,
          visitor: typeof row.visitor === 'string' ? row.visitor : '—',
        }];
      })
    : [];

  return {
    today_views: asNumber(raw.today_views),
    today_visitors: asNumber(raw.today_visitors),
    views_7d: asNumber(raw.views_7d),
    visitors_7d: asNumber(raw.visitors_7d),
    views_30d: asNumber(raw.views_30d),
    visitors_30d: asNumber(raw.visitors_30d),
    cta_30d: {
      maps_click: asNumber(cta?.maps_click),
      phone_click: asNumber(cta?.phone_click),
      instagram_click: asNumber(cta?.instagram_click),
    },
    top_action_clubs: topActionClubs,
    top_pages: topPages,
    top_sources: topSources,
    daily,
    recent_visits: recentVisits,
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

function formatVisitTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: 'Asia/Baku',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_admin_analytics');
  const stats = error ? EMPTY : parseAnalytics(data);
  const maxDailyViews = Math.max(1, ...stats.daily.map((item) => item.views));
  const maxSourceViews = Math.max(1, ...stats.top_sources.map((item) => item.views));
  const totalActions = stats.cta_30d.maps_click + stats.cta_30d.phone_click + stats.cta_30d.instagram_click;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giriş statistikası</h1>
          <p className="mt-1 text-sm text-gray-500">Real public trafik, CTA siqnalları və son ziyarətlərin IP məlumatı. Admin hesabının öz baxışları statistikaya daxil edilmir.</p>
        </div>
        <Link href="/admin" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">Dashboard</Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Statistika hazırda oxunmadı.</div> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Bu gün baxış</p><p className="mt-2 text-4xl font-bold">{stats.today_views}</p><p className="mt-2 text-xs text-gray-500">{stats.today_visitors} unikal ziyarətçi</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Son 7 gün</p><p className="mt-2 text-4xl font-bold">{stats.views_7d}</p><p className="mt-2 text-xs text-gray-500">{stats.visitors_7d} unikal ziyarətçi</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Son 30 gün</p><p className="mt-2 text-4xl font-bold">{stats.views_30d}</p><p className="mt-2 text-xs text-gray-500">{stats.visitors_30d} unikal ziyarətçi</p></div>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold">Son ziyarətlər</h2>
          <p className="mt-1 text-sm text-gray-500">Son 50 public baxış. IP yalnız admin panelində görünür; unikal ziyarətçi hesabı IP-yə əsaslanmır.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr><th className="px-5 py-3">Vaxt</th><th className="px-5 py-3">IP</th><th className="px-5 py-3">Visitor</th><th className="px-5 py-3">Səhifə</th><th className="px-5 py-3">Mənbə</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recent_visits.length === 0 ? <tr><td colSpan={5} className="px-5 py-6 text-gray-500">Hələ IP-li yeni ziyarət qeydi yoxdur.</td></tr> : stats.recent_visits.map((visit, index) => (
                <tr key={`${visit.created_at}-${visit.visitor}-${index}`} className="align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{formatVisitTime(visit.created_at)}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-gray-900">{visit.ip}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-gray-500">{visit.visitor}</td>
                  <td className="max-w-[360px] truncate px-5 py-3 font-medium text-gray-900" title={visit.path}>{visit.path}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-600">{sourceLabel(visit.source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">Klub hərəkətləri</h2><p className="mt-1 text-sm text-gray-500">Son 30 gündə real istifadəçinin klub səhifəsində etdiyi niyyət siqnalları.</p></div><span className="text-sm font-bold">Cəmi: {totalActions}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Google Maps</p><p className="mt-2 text-3xl font-bold">{stats.cta_30d.maps_click}</p></div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Telefon</p><p className="mt-2 text-3xl font-bold">{stats.cta_30d.phone_click}</p></div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Instagram</p><p className="mt-2 text-3xl font-bold">{stats.cta_30d.instagram_click}</p></div>
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4"><h3 className="text-sm font-bold">Ən çox hərəkət yaradan klublar</h3><div className="mt-2 divide-y divide-gray-100">{stats.top_action_clubs.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ CTA məlumatı yoxdur.</p> : stats.top_action_clubs.map((item, index) => <div key={item.club_slug} className="flex items-center gap-3 py-2.5"><span className="w-5 text-xs font-bold text-gray-400">{index + 1}</span><Link href={`/klub/${item.club_slug}`} target="_blank" className="min-w-0 flex-1 truncate text-sm font-semibold text-[#6A47F0] hover:underline">{item.club_slug}</Link><span className="text-sm font-bold">{item.actions}</span></div>)}</div></div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold">Son 14 gün</h2><p className="mt-1 text-sm text-gray-500">Günlük baxış / unikal ziyarətçi.</p>
          <div className="mt-6 space-y-3">{stats.daily.length === 0 ? <p className="text-sm text-gray-500">Hələ statistika yoxdur.</p> : stats.daily.map((item) => <div key={item.date} className="grid grid-cols-[84px_1fr_78px] items-center gap-3 text-sm"><span className="text-xs text-gray-500">{new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T12:00:00+04:00`))}</span><div className="h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${Math.max(3, Math.round((item.views / maxDailyViews) * 100))}%` }} /></div><span className="text-right text-xs font-semibold">{item.views} / {item.visitors}</span></div>)}</div>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Ən çox baxılan səhifələr</h2><p className="mt-1 text-sm text-gray-500">Son 30 gün.</p><div className="mt-5 divide-y divide-gray-100">{stats.top_pages.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ statistika yoxdur.</p> : stats.top_pages.map((item, index) => <div key={item.path} className="flex items-center gap-3 py-3"><span className="w-6 text-xs font-bold text-gray-400">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.path}</p><p className="mt-0.5 text-xs text-gray-500">{item.visitors} unikal</p></div><span className="text-sm font-bold">{item.views}</span></div>)}</div></section>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">Trafik mənbələri</h2><p className="mt-1 text-sm text-gray-500">Son 30 gündə istifadəçilərin haradan gəldiyi.</p>
        <div className="mt-5 space-y-3">{stats.top_sources.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ mənbə məlumatı yoxdur.</p> : stats.top_sources.map((item) => <div key={item.source} className="grid gap-2 sm:grid-cols-[160px_1fr_110px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{sourceLabel(item.source)}</p>{item.source !== 'direct' ? <p className="truncate text-[11px] text-gray-400">{item.source}</p> : null}</div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${Math.max(3, Math.round((item.views / maxSourceViews) * 100))}%` }} /></div><p className="text-xs text-gray-500 sm:text-right"><strong className="text-gray-900">{item.views}</strong> baxış · {item.visitors} nəfər</p></div>)}</div>
      </section>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600"><strong className="text-gray-900">Necə hesablanır?</strong> Public baxışlarda anonim browser visitor ID və serverin gördüyü public IP saxlanır. Admin hesabı ilə daxil olduğun halda public səhifələrə baxış və CTA klikləri analytics-ə yazılmır. IP yalnız səlahiyyətli admin panelində göstərilir; unikal ziyarətçi sayı IP yox, anonim visitor ID ilə hesablanır.</div>
    </div>
  );
}
