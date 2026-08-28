import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

type HourPoint = {
  start: string;
  end: string;
  label: string;
  views: number;
  sessions: number;
  visitors: number;
};

type RankedItem = {
  path?: string;
  source?: string;
  views: number;
  sessions: number;
  visitors: number;
};

type Rolling24Data = {
  views_24h: number;
  sessions_24h: number;
  visitors_24h: number;
  prev_views_24h: number;
  prev_sessions_24h: number;
  prev_visitors_24h: number;
  today_views: number;
  today_sessions: number;
  today_visitors: number;
  hourly: HourPoint[];
  top_pages_24h: RankedItem[];
  top_sources_24h: RankedItem[];
  generated_at: string | null;
  timezone: string;
};

const EMPTY: Rolling24Data = {
  views_24h: 0,
  sessions_24h: 0,
  visitors_24h: 0,
  prev_views_24h: 0,
  prev_sessions_24h: 0,
  prev_visitors_24h: 0,
  today_views: 0,
  today_sessions: 0,
  today_visitors: 0,
  hourly: [],
  top_pages_24h: [],
  top_sources_24h: [],
  generated_at: null,
  timezone: 'Asia/Baku',
};

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function rows(value: Json | undefined, key: 'path' | 'source'): RankedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || Array.isArray(item) || typeof item !== 'object') return [];
    const row = item as Record<string, Json | undefined>;
    const name = row[key];
    if (typeof name !== 'string') return [];
    return [{
      [key]: name,
      views: asNumber(row.views),
      sessions: asNumber(row.sessions),
      visitors: asNumber(row.visitors),
    } as RankedItem];
  });
}

function parseRolling24(value: Json | null): Rolling24Data {
  if (!value || Array.isArray(value) || typeof value !== 'object') return EMPTY;
  const raw = value as Record<string, Json | undefined>;
  const hourly: HourPoint[] = Array.isArray(raw.hourly)
    ? raw.hourly.flatMap((item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return [];
        const row = item as Record<string, Json | undefined>;
        if (typeof row.start !== 'string' || typeof row.end !== 'string' || typeof row.label !== 'string') return [];
        return [{
          start: row.start,
          end: row.end,
          label: row.label,
          views: asNumber(row.views),
          sessions: asNumber(row.sessions),
          visitors: asNumber(row.visitors),
        }];
      })
    : [];

  return {
    views_24h: asNumber(raw.views_24h),
    sessions_24h: asNumber(raw.sessions_24h),
    visitors_24h: asNumber(raw.visitors_24h),
    prev_views_24h: asNumber(raw.prev_views_24h),
    prev_sessions_24h: asNumber(raw.prev_sessions_24h),
    prev_visitors_24h: asNumber(raw.prev_visitors_24h),
    today_views: asNumber(raw.today_views),
    today_sessions: asNumber(raw.today_sessions),
    today_visitors: asNumber(raw.today_visitors),
    hourly,
    top_pages_24h: rows(raw.top_pages_24h, 'path'),
    top_sources_24h: rows(raw.top_sources_24h, 'source'),
    generated_at: typeof raw.generated_at === 'string' ? raw.generated_at : null,
    timezone: typeof raw.timezone === 'string' ? raw.timezone : 'Asia/Baku',
  };
}

function growth(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 'Yeni' : '0%';
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
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

export default async function StatisticsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_admin_analytics_24h' as 'get_admin_analytics');
  const stats = error ? EMPTY : parseRolling24(data);
  const maxHourlyViews = Math.max(1, ...stats.hourly.map((item) => item.views));

  return (
    <>
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Son 24 saat</h2>
              <span className="rounded-full bg-[#F1EEFF] px-2.5 py-1 text-[11px] font-bold text-[#6547D7]">ROLLING</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Cari andan geriyə doğru real 24 saat. Ziyarət browser session-u, visitor isə qalıcı anonim browser ID-si ilə ölçülür.</p>
          </div>
          <p className="text-xs text-gray-400">Timezone: {stats.timezone}</p>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Son 24 saat statistikası hazırda oxunmadı.</div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pageview · 24 saat</p>
            <div className="mt-2 flex items-end justify-between gap-3"><p className="text-3xl font-bold sm:text-4xl">{stats.views_24h}</p><span className="text-xs font-bold text-gray-500">{growth(stats.views_24h, stats.prev_views_24h)}</span></div>
            <p className="mt-2 text-xs text-gray-500">Əvvəlki 24 saat: {stats.prev_views_24h}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ziyarət · 24 saat</p>
            <div className="mt-2 flex items-end justify-between gap-3"><p className="text-3xl font-bold sm:text-4xl">{stats.sessions_24h}</p><span className="text-xs font-bold text-gray-500">{growth(stats.sessions_24h, stats.prev_sessions_24h)}</span></div>
            <p className="mt-2 text-xs text-gray-500">Əvvəlki 24 saat: {stats.prev_sessions_24h}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unikal visitor · 24 saat</p>
            <div className="mt-2 flex items-end justify-between gap-3"><p className="text-3xl font-bold sm:text-4xl">{stats.visitors_24h}</p><span className="text-xs font-bold text-gray-500">{growth(stats.visitors_24h, stats.prev_visitors_24h)}</span></div>
            <p className="mt-2 text-xs text-gray-500">Əvvəlki 24 saat: {stats.prev_visitors_24h}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bu gün · Bakı</p>
            <p className="mt-2 text-3xl font-bold sm:text-4xl">{stats.today_views}</p>
            <p className="mt-2 text-xs text-gray-500">{stats.today_sessions} ziyarət · {stats.today_visitors} visitor</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div><h3 className="font-bold">Saat-saat trafik</h3><p className="mt-1 text-xs text-gray-500">24 bərabər bir saatlıq interval; ilk interval düz 24 saat əvvəl başlayır.</p></div>
            <span className="text-xs text-gray-400">baxış / ziyarət / visitor</span>
          </div>
          <div className="mt-5 overflow-x-auto pb-2">
            <div className="flex h-52 min-w-[720px] items-end gap-1.5">
              {stats.hourly.map((item, index) => {
                const height = Math.max(4, Math.round((item.views / maxHourlyViews) * 150));
                return (
                  <div key={item.start} className="flex w-7 shrink-0 flex-col items-center justify-end gap-1" title={`${item.label} · ${item.views} baxış · ${item.sessions} ziyarət · ${item.visitors} visitor`}>
                    <span className="text-[10px] font-semibold text-gray-500">{item.views}</span>
                    <div className="w-full rounded-t bg-[#7C5CFC]" style={{ height }} />
                    <span className="h-4 text-[9px] text-gray-400">{index % 3 === 0 ? item.label : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="font-bold">Ən çox baxılan səhifələr · 24 saat</h3>
            <div className="mt-3 divide-y divide-gray-100">
              {stats.top_pages_24h.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ məlumat yoxdur.</p> : stats.top_pages_24h.map((item, index) => (
                <div key={item.path} className="flex items-center gap-3 py-3">
                  <span className="w-5 text-xs font-bold text-gray-400">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.path}</p><p className="mt-0.5 text-xs text-gray-500">{item.sessions} ziyarət · {item.visitors} visitor</p></div>
                  <span className="text-sm font-bold">{item.views}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="font-bold">Trafik mənbələri · 24 saat</h3>
            <div className="mt-3 divide-y divide-gray-100">
              {stats.top_sources_24h.length === 0 ? <p className="py-3 text-sm text-gray-500">Hələ mənbə məlumatı yoxdur.</p> : stats.top_sources_24h.map((item, index) => (
                <div key={item.source} className="flex items-center gap-3 py-3">
                  <span className="w-5 text-xs font-bold text-gray-400">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{sourceLabel(item.source ?? 'direct')}</p><p className="mt-0.5 truncate text-xs text-gray-500">{item.sessions} ziyarət · {item.visitors} visitor</p></div>
                  <span className="text-sm font-bold">{item.views}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {children}
    </>
  );
}
