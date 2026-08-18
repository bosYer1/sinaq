import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';

type TopPage = { path: string; views: number; visitors: number };
type DailyPoint = { date: string; views: number; visitors: number };
type TrafficSource = { source: string; views: number; visitors: number };
type ActionClub = { club_slug: string; actions: number };
type Breakdown = { name: string; views: number; visitors: number };
type TopIp = { ip: string; views: number; visitors: number; last_seen: string };
type RecentVisit = { ip: string; path: string; source: string; created_at: string; visitor: string; device: string; browser: string };
type AnalyticsData = {
  today_views: number;
  today_visitors: number;
  views_7d: number;
  visitors_7d: number;
  prev_views_7d: number;
  prev_visitors_7d: number;
  views_30d: number;
  visitors_30d: number;
  prev_views_30d: number;
  prev_visitors_30d: number;
  active_5m: number;
  active_15m: number;
  active_60m: number;
  new_visitors_30d: number;
  returning_visitors_30d: number;
  cta_30d: { maps_click: number; phone_click: number; instagram_click: number };
  top_action_clubs: ActionClub[];
  top_pages: TopPage[];
  top_sources: TrafficSource[];
  devices: Breakdown[];
  browsers: Breakdown[];
  top_ips: TopIp[];
  daily: DailyPoint[];
  recent_visits: RecentVisit[];
};

const EMPTY: AnalyticsData = {
  today_views: 0,
  today_visitors: 0,
  views_7d: 0,
  visitors_7d: 0,
  prev_views_7d: 0,
  prev_visitors_7d: 0,
  views_30d: 0,
  visitors_30d: 0,
  prev_views_30d: 0,
  prev_visitors_30d: 0,
  active_5m: 0,
  active_15m: 0,
  active_60m: 0,
  new_visitors_30d: 0,
  returning_visitors_30d: 0,
  cta_30d: { maps_click: 0, phone_click: 0, instagram_click: 0 },
  top_action_clubs: [],
  top_pages: [],
  top_sources: [],
  devices: [],
  browsers: [],
  top_ips: [],
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

function rows<T>(value: Json | undefined, parser: (row: Record<string, Json | undefined>) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || Array.isArray(item) || typeof item !== 'object') return [];
    const parsed = parser(item as Record<string, Json | undefined>);
    return parsed ? [parsed] : [];
  });
}

function parseAnalytics(value: Json | null): AnalyticsData {
  if (!value || Array.isArray(value) || typeof value !== 'object') return EMPTY;
  const raw = value as Record<string, Json | undefined>;
  const cta = objectValue(raw.cta_30d);

  return {
    today_views: asNumber(raw.today_views),
    today_visitors: asNumber(raw.today_visitors),
    views_7d: asNumber(raw.views_7d),
    visitors_7d: asNumber(raw.visitors_7d),
    prev_views_7d: asNumber(raw.prev_views_7d),
    prev_visitors_7d: asNumber(raw.prev_visitors_7d),
    views_30d: asNumber(raw.views_30d),
    visitors_30d: asNumber(raw.visitors_30d),
    prev_views_30d: asNumber(raw.prev_views_30d),
    prev_visitors_30d: asNumber(raw.prev_visitors_30d),
    active_5m: asNumber(raw.active_5m),
    active_15m: asNumber(raw.active_15m),
    active_60m: asNumber(raw.active_60m),
    new_visitors_30d: asNumber(raw.new_visitors_30d),
    returning_visitors_30d: asNumber(raw.returning_visitors_30d),
    cta_30d: {
      maps_click: asNumber(cta?.maps_click),
      phone_click: asNumber(cta?.phone_click),
      instagram_click: asNumber(cta?.instagram_click),
    },
    top_action_clubs: rows(raw.top_action_clubs, (row) => typeof row.club_slug === 'string' ? { club_slug: row.club_slug, actions: asNumber(row.actions) } : null),
    top_pages: rows(raw.top_pages, (row) => typeof row.path === 'string' ? { path: row.path, views: asNumber(row.views), visitors: asNumber(row.visitors) } : null),
    top_sources: rows(raw.top_sources, (row) => typeof row.source === 'string' ? { source: row.source, views: asNumber(row.views), visitors: asNumber(row.visitors) } : null),
    devices: rows(raw.devices, (row) => typeof row.name === 'string' ? { name: row.name, views: asNumber(row.views), visitors: asNumber(row.visitors) } : null),
    browsers: rows(raw.browsers, (row) => typeof row.name === 'string' ? { name: row.name, views: asNumber(row.views), visitors: asNumber(row.visitors) } : null),
    top_ips: rows(raw.top_ips, (row) => typeof row.ip === 'string' && typeof row.last_seen === 'string' ? { ip: row.ip, views: asNumber(row.views), visitors: asNumber(row.visitors), last_seen: row.last_seen } : null),
    daily: rows(raw.daily, (row) => typeof row.date === 'string' ? { date: row.date, views: asNumber(row.views), visitors: asNumber(row.visitors) } : null),
    recent_visits: rows(raw.recent_visits, (row) => typeof row.path === 'string' && typeof row.created_at === 'string' ? {
      ip: typeof row.ip === 'string' ? row.ip : 'məlum deyil',
      path: row.path,
      source: typeof row.source === 'string' ? row.source : 'direct',
      created_at: row.created_at,
      visitor: typeof row.visitor === 'string' ? row.visitor : '—',
      device: typeof row.device === 'string' ? row.device : 'Məlum deyil',
      browser: typeof row.browser === 'string' ? row.browser : 'Məlum deyil',
    } : null),
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
  return new Intl.DateTimeFormat('az-AZ', { timeZone: 'Asia/Baku', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function growth(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 'Yeni' : '0%';
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
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
          <p className="mt-1 text-sm text-gray-500">Real public trafik, cihaz/brauzer bölgüsü, IP görünüşü və CTA siqnalları. Admin hesabının öz aktivliyi sayılmır.</p>
        </div>
        <Link href="/admin" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">Dashboard</Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Statistika hazırda oxunmadı.</div> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Bu gün baxış</p><p className="mt-2 text-4xl font-bold">{stats.today_views}</p><p className="mt-2 text-xs text-gray-500">{stats.today_visitors} unikal ziyarətçi</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Son 7 gün</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-4xl font-bold">{stats.views_7d}</p><span className="text-xs font-bold text-gray-500">{growth(stats.views_7d, stats.prev_views_7d)}</span></div><p className="mt-2 text-xs text-gray-500">{stats.visitors_7d} unikal · əvvəlki 7 gün: {stats.prev_views_7d}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Son 30 gün</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-4xl font-bold">{stats.views_30d}</p><span className="text-xs font-bold text-gray-500">{growth(stats.views_30d, stats.prev_views_30d)}</span></div><p className="mt-2 text-xs text-gray-500">{stats.visitors_30d} unikal · əvvəlki 30 gün: {stats.prev_views_30d}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Təkrar gələnlər</p><p className="mt-2 text-4xl font-bold">{stats.returning_visitors_30d}</p><p className="mt-2 text-xs text-gray-500">Yeni: {stats.new_visitors_30d} · son 30 gün</p></div>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">Canlı aktivlik</h2><p className="mt-1 text-sm text-gray-500">Son public baxışlara əsaslanan təxmini aktiv visitor sayı.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">5 dəqiqə</p><p className="mt-2 text-3xl font-bold">{stats.active_5m}</p></div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">15 dəqiqə</p><p className="mt-2 text-3xl font-bold">{stats.active_15m}</p></div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">60 dəqiqə</p><p className="mt-2 text-3xl font-bold">{stats.active_60m}</p></div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {[['Cihazlar', stats.devices], ['Brauzerlər', stats.browsers]].map(([title, items]) => (
          <section key={title as string} className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold">{title as string}</h2><p className="mt-1 text-sm text-gray-500">Son 30 gün.</p>
            <div className="mt-4 divide-y divide-gray-100">{(items as Breakdown[]).length === 0 ? <p className="py-3 text-sm text-gray-500">Yeni deploy-dan sonra məlumat yığılacaq.</p> : (items as Breakdown[]).map((item) => <div key={item.name} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-gray-500">{item.visitors} unikal</p></div><span className="text-sm font-bold">{item.views} baxış</span></div>)}</div>
          </section>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5"><h2 className="text-lg font-bold">Son ziyarətlər</h2><p className="mt-1 text-sm text-gray-500">Son 50 public baxış. IP yalnız admin panelində görünür; unikal visitor hesabı IP-yə əsaslanmır.</p></div>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-100 text-left text-sm"><thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Vaxt</th><th className="px-5 py-3">IP</th><th className="px-5 py-3">Visitor</th><th className="px-5 py-3">Cihaz</th><th className="px-5 py-3">Səhifə</th><th className="px-5 py-3">Mənbə</th></tr></thead><tbody className="divide-y divide-gray-100">{stats.recent_visits.length === 0 ? <tr><td colSpan={6} className="px-5 py-6 text-gray-500">Hələ yeni ziyarət qeydi yoxdur.</td></tr> : stats.recent_visits.map((visit, index) => <tr key={`${visit.created_at}-${visit.visitor}-${index}`} className="align-top"><td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{formatVisitTime(visit.created_at)}</td><td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold">{visit.ip}</td><td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-gray-500">{visit.visitor}</td><td className="whitespace-nowrap px-5 py-3 text-xs">{visit.device} · {visit.browser}</td><td className="max-w-[360px] truncate px-5 py-3 font-medium" title={visit.path}>{visit.path}</td><td className="whitespace-nowrap px-5 py-3 text-xs text-gray-600">{sourceLabel(visit.source)}</td></tr>)}</tbody></table></div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Ən aktiv IP-lər</h2><p className="mt-1 text-sm text-gray-500">Son 30 gün; VPN/NAT səbəbilə IP istifadəçi sayı demək deyil.</p><div className="mt-4 divide-y divide-gray-100">{stats.top_ips.length === 0 ? <p className="py-3 text-sm text-gray-500">Yeni deploy-dan sonra IP məlumatı yığılacaq.</p> : stats.top_ips.map((item) => <div key={item.ip} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate font-mono text-xs font-semibold">{item.ip}</p><p className="mt-1 text-xs text-gray-500">Son: {formatVisitTime(item.last_seen)}</p></div><p className="shrink-0 text-xs text-gray-500"><strong className="text-gray-900">{item.views}</strong> baxış · {item.visitors} visitor</p></div>)}</div></section>
        <section className="rounded-xl border border-gray-200 bg-white p-6"><div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold">Klub hərəkətləri</h2><p className="mt-1 text-sm text-gray-500">Son 30 gündə real niyyət siqnalları.</p></div><span className="text-sm font-bold">Cəmi: {totalActions}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Maps</p><p className="mt-2 text-3xl font-bold">{stats.cta_30d.maps_click}</p></div><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Telefon</p><p className="mt-2 text-3xl font-bold">{stats.cta_30d.phone_click}</p></div><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Instagram</p><p className="mt-2 text-3xl font-bold">{stats.cta_30d.instagram_click}</p></div></div><div className="mt-5 divide-y divide-gray-100">{stats.top_action_clubs.map((item, index) => <div key={item.club_slug} className="flex items-center gap-3 py-2.5"><span className="w-5 text-xs font-bold text-gray-400">{index + 1}</span><Link href={`/klub/${item.club_slug}`} target="_blank" className="min-w-0 flex-1 truncate text-sm font-semibold text-[#6A47F0] hover:underline">{item.club_slug}</Link><span className="text-sm font-bold">{item.actions}</span></div>)}</div></section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Son 14 gün</h2><p className="mt-1 text-sm text-gray-500">Günlük baxış / unikal ziyarətçi.</p><div className="mt-6 space-y-3">{stats.daily.length === 0 ? <p className="text-sm text-gray-500">Hələ statistika yoxdur.</p> : stats.daily.map((item) => <div key={item.date} className="grid grid-cols-[84px_1fr_78px] items-center gap-3 text-sm"><span className="text-xs text-gray-500">{new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T12:00:00+04:00`))}</span><div className="h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${Math.max(3, Math.round((item.views / maxDailyViews) * 100))}%` }} /></div><span className="text-right text-xs font-semibold">{item.views} / {item.visitors}</span></div>)}</div></section>
        <section className="rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Ən çox baxılan səhifələr</h2><p className="mt-1 text-sm text-gray-500">Son 30 gün.</p><div className="mt-5 divide-y divide-gray-100">{stats.top_pages.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ statistika yoxdur.</p> : stats.top_pages.map((item, index) => <div key={item.path} className="flex items-center gap-3 py-3"><span className="w-6 text-xs font-bold text-gray-400">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.path}</p><p className="mt-0.5 text-xs text-gray-500">{item.visitors} unikal</p></div><span className="text-sm font-bold">{item.views}</span></div>)}</div></section>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Trafik mənbələri</h2><p className="mt-1 text-sm text-gray-500">Son 30 gündə istifadəçilərin haradan gəldiyi.</p><div className="mt-5 space-y-3">{stats.top_sources.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ mənbə məlumatı yoxdur.</p> : stats.top_sources.map((item) => <div key={item.source} className="grid gap-2 sm:grid-cols-[160px_1fr_110px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{sourceLabel(item.source)}</p>{item.source !== 'direct' ? <p className="truncate text-[11px] text-gray-400">{item.source}</p> : null}</div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${Math.max(3, Math.round((item.views / maxSourceViews) * 100))}%` }} /></div><p className="text-xs text-gray-500 sm:text-right"><strong className="text-gray-900">{item.views}</strong> baxış · {item.visitors} nəfər</p></div>)}</div></section>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600"><strong className="text-gray-900">Necə hesablanır?</strong> Public baxışlarda anonim browser visitor ID, serverin gördüyü public IP və ümumi cihaz/brauzer texniki məlumatı saxlanır. Admin hesabı ilə daxil olduğun halda public səhifə baxışları və CTA klikləri analytics-ə yazılmır. IP yalnız səlahiyyətli admin panelində göstərilir; unikal ziyarətçi sayı IP yox, anonim visitor ID ilə hesablanır.</div>
    </div>
  );
}
