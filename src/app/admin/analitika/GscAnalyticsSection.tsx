import type { GscMetrics, Metric } from '@/lib/founder-analytics/types';

function format(value: number, suffix = '') {
  return `${new Intl.NumberFormat('az-AZ', { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}

function Delta({ metric, invert = false }: { metric: Metric; invert?: boolean }) {
  if (metric.changePercent == null) return <span className="text-xs font-bold text-blue-700">Yeni</span>;
  const effective = invert ? -metric.changePercent : metric.changePercent;
  const tone = effective > 0 ? 'text-emerald-700' : effective < 0 ? 'text-red-700' : 'text-gray-500';
  return <span className={`text-xs font-bold ${tone}`}>{metric.changePercent > 0 ? '↑ ' : metric.changePercent < 0 ? '↓ ' : ''}{Math.abs(metric.changePercent)}%</span>;
}

function MetricCard({ label, metric, suffix = '', detail, invert = false }: { label: string; metric: Metric; suffix?: string; detail: string; invert?: boolean }) {
  return <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><p className="text-sm font-medium text-gray-500">{label}</p><Delta metric={metric} invert={invert} /></div><p className="mt-3 text-3xl font-bold tracking-tight">{format(metric.current, suffix)}</p><p className="mt-2 text-xs leading-5 text-gray-500">{detail}</p></article>;
}

function SearchTable({ title, rows, kind }: { title: string; rows: GscMetrics['topQueries']; kind: 'query' | 'page' }) {
  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white"><div className="border-b border-gray-100 p-5"><h3 className="font-bold">{title}</h3></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">{kind === 'query' ? 'Sorğu' : 'Səhifə'}</th><th className="px-5 py-3">Klik</th><th className="px-5 py-3">Impression</th><th className="px-5 py-3">CTR</th><th className="px-5 py-3">Pozisiya</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-gray-500">Bu interval üçün data yoxdur.</td></tr> : rows.map((row) => <tr key={`${kind}-${row.key}`}><td className="max-w-[520px] break-all px-5 py-3 font-medium">{row.key}</td><td className="px-5 py-3">{row.clicks}</td><td className="px-5 py-3">{row.impressions}</td><td className="px-5 py-3">{row.ctr}%</td><td className="px-5 py-3">{row.position}</td></tr>)}</tbody></table></div></section>;
}

export function GscAnalyticsSection({ gsc }: { gsc: GscMetrics }) {
  if (gsc.status.status !== 'ready') {
    return <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>GSC datası göstərilmir:</strong> {gsc.status.detail}</div>;
  }

  return <section className="mt-8" aria-label="Google Search Console göstəriciləri"><div className="mb-4"><h2 className="text-xl font-bold">Google Search Console</h2><p className="mt-1 text-sm text-gray-500">Google organic search performansı · cari interval əvvəlki eyni müddətlə müqayisə olunur.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Google klikləri" metric={gsc.clicks} detail="Search Console clicks" /><MetricCard label="Impressions" metric={gsc.impressions} detail="Google nəticələrində görünmə" /><MetricCard label="CTR" metric={gsc.ctr} suffix="%" detail="Clicks / impressions" /><MetricCard label="Orta pozisiya" metric={gsc.averagePosition} detail="Aşağı rəqəm daha yaxşıdır" invert /></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><SearchTable title="Top Google sorğuları" rows={gsc.topQueries} kind="query" /><SearchTable title="Top organic landing pages" rows={gsc.topPages} kind="page" /></div>
  <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-gray-800">
    <p className="font-bold">Google klik imkanları — sorğu + konkret səhifə</p>
    <p className="mt-1 text-xs text-gray-600">
      Real GSC sorğu/səhifə cütləri: ən azı 20 göstərilmə, 5%-dək CTR və ilk 20 mövqe.
      İlk 10 mövqedə sıfır klik alanlar əvvəl göstərilir. Bu prioritet siyahısıdır,
      nə təxmin edilən trafik, nə də 100% klik zəmanətidir.
    </p>
  </div>
  <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
    <table className="min-w-[900px] w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>
        <th className="px-4 py-3">Google sorğusu</th><th className="px-4 py-3">Səhifə</th>
        <th className="px-4 py-3">Göstərilmə</th><th className="px-4 py-3">Klik</th>
        <th className="px-4 py-3">CTR</th><th className="px-4 py-3">Mövqe</th>
        <th className="px-4 py-3">Növbəti iş</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-100">
        {!gsc.ctrOpportunitiesAvailable ? (
          <tr><td colSpan={7} className="px-4 py-6 text-amber-800">Sorğu+səhifə hesabatı müvəqqəti alınmadı. Digər Google göstəriciləri qüvvədədir.</td></tr>
        ) : gsc.ctrOpportunities.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-6 text-gray-500">Bu intervalda seçilmiş şərtlərə uyğun zəif CTR siqnalı tapılmadı.</td></tr>
        ) : gsc.ctrOpportunities.map((row) => (
          <tr key={row.query + '|' + row.path}>
            <td className="max-w-[220px] break-words px-4 py-3 font-semibold">{row.query}
              {row.matchingPages > 1 ? <p className="mt-1 text-xs font-normal text-amber-700">{row.matchingPages} səhifə bu sorğuda görünür — uyğunluğu yoxla</p> : null}
            </td>
            <td className="max-w-[230px] break-all px-4 py-3"><a href={'https://gameyer.az' + row.path} target="_blank" rel="noopener noreferrer" className="text-violet-700 underline">{row.path}</a></td>
            <td className="px-4 py-3">{format(row.impressions)}</td>
            <td className="px-4 py-3">{format(row.clicks)}</td>
            <td className="px-4 py-3">{format(row.ctr, '%')}</td>
            <td className="px-4 py-3">{format(row.position)}</td>
            <td className="px-4 py-3 text-xs">{row.nextAction === 'snippet' ? 'Başlıq / snippet / axtarış niyyəti' : 'Mövqe və daxili linklər'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <p className="mt-2 text-xs leading-5 text-gray-500">
    Google məxfilik səbəbindən bəzi sorğuları gizlədə bilər; ilk 1.000 query+səhifə cütündən ən çox 15 prioritet göstərilir.
    Eyni sorğunun bir neçə səhifədə görünməsi avtomatik SEO konflikti demək deyil.
  </p>
</section>;
}
