import type { CampaignRow, MetaAdsMetrics, MetaCampaignRow, Metric } from '@/lib/founder-analytics/types';

function format(value: number, suffix = '') {
  return `${new Intl.NumberFormat('az-AZ', { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}

function Delta({ value }: { value: Metric }) {
  if (value.changePercent == null) return <span className="text-xs font-bold text-blue-700">Yeni</span>;
  const tone = value.changePercent > 0 ? 'text-emerald-700' : value.changePercent < 0 ? 'text-red-700' : 'text-gray-500';
  return <span className={`text-xs font-bold ${tone}`}>{value.changePercent > 0 ? '↑ ' : value.changePercent < 0 ? '↓ ' : ''}{Math.abs(value.changePercent)}%</span>;
}

function MetricCard({ label, metric, suffix = '', detail }: { label: string; metric: Metric; suffix?: string; detail: string }) {
  return <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><p className="text-sm font-medium text-gray-500">{label}</p><Delta value={metric} /></div><p className="mt-3 text-3xl font-bold tracking-tight">{format(metric.current, suffix)}</p><p className="mt-2 text-xs leading-5 text-gray-500">{detail}</p></article>;
}

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function isMetaPaidCampaign(row: CampaignRow) {
  const source = normalized(row.source);
  const medium = normalized(row.medium);
  return medium === 'paid_social' && (
    source === 'fb' || source === 'ig' || source === 'msg' || source === 'an' ||
    source.includes('facebook') || source.includes('instagram') || source.includes('messenger') ||
    source.includes('audience_network') || source === 'meta'
  );
}

function onsiteForCampaign(campaign: MetaCampaignRow, posthogCampaigns: CampaignRow[]) {
  const keys = new Set([normalized(campaign.campaignId), normalized(campaign.campaignName)].filter(Boolean));
  const matches = posthogCampaigns.filter((row) => isMetaPaidCampaign(row) && keys.has(normalized(row.campaign)));
  if (matches.length === 0) return null;

  const sessions = matches.reduce((sum, row) => sum + row.sessions, 0);
  const clubViews = matches.reduce((sum, row) => sum + row.clubViews, 0);
  const ctaClicks = matches.reduce((sum, row) => sum + row.ctaClicks, 0);
  return {
    sessions,
    clubViews,
    ctaClicks,
    intentRate: sessions > 0 ? Math.round((ctaClicks / sessions) * 10_000) / 100 : 0,
  };
}

function money(value: number, currency: string | null) {
  return `${format(value)}${currency ? ` ${currency}` : ''}`;
}

export function MetaAdsAnalyticsSection({
  meta,
  posthogCampaigns,
}: {
  meta: MetaAdsMetrics;
  posthogCampaigns: CampaignRow[];
}) {
  if (meta.status.status !== 'ready') {
    return <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>Meta Ads datası göstərilmir:</strong> {meta.status.detail}</div>;
  }

  const currencySuffix = meta.currency ? ` ${meta.currency}` : '';

  return <section className="mt-8" aria-label="Meta Ads göstəriciləri">
    <div className="mb-4"><h2 className="text-xl font-bold">Meta Ads</h2><p className="mt-1 text-sm text-gray-500">Marketing API v26.0 · read-only Ads Insights · cari interval əvvəlki müqayisə intervalı ilə qarşılaşdırılır.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Spend" metric={meta.spend} suffix={currencySuffix} detail="Meta Ads xərci" />
      <MetricCard label="Impressions" metric={meta.impressions} detail="Reklam göstərilmələri" />
      <MetricCard label="Reach" metric={meta.reach} detail="Unikal reklam çatımı" />
      <MetricCard label="Clicks" metric={meta.clicks} detail="Meta Ads click sayı" />
      <MetricCard label="CTR" metric={meta.ctr} suffix="%" detail="Clicks / impressions" />
      <MetricCard label="CPC" metric={meta.cpc} suffix={currencySuffix} detail="Orta click xərci" />
      <MetricCard label="CPM" metric={meta.cpm} suffix={currencySuffix} detail="1,000 impression üçün xərc" />
    </div>

    <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white"><div className="border-b border-gray-100 p-6"><h3 className="text-lg font-bold">Meta campaign → onsite behavior</h3><p className="mt-1 text-sm text-gray-500">Meta campaign ID/adı PostHog `utm_campaign` ilə uyğun gələndə reklam xərci real onsite sessiya və klub intent-i ilə birləşdirilir. Uyğunluq yoxdursa rəqəm uydurulmur.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Campaign</th><th className="px-5 py-3">Spend</th><th className="px-5 py-3">Impr.</th><th className="px-5 py-3">Clicks</th><th className="px-5 py-3">CTR</th><th className="px-5 py-3">CPC</th><th className="px-5 py-3">CPM</th><th className="px-5 py-3">Onsite sessiya</th><th className="px-5 py-3">Klub</th><th className="px-5 py-3">CTA</th><th className="px-5 py-3">Intent</th></tr></thead><tbody className="divide-y divide-gray-100">{meta.campaigns.length === 0 ? <tr><td colSpan={11} className="px-5 py-8 text-gray-500">Seçilən interval üçün Meta campaign datası yoxdur.</td></tr> : meta.campaigns.map((campaign) => {
        const onsite = onsiteForCampaign(campaign, posthogCampaigns);
        return <tr key={campaign.campaignId}><td className="px-5 py-3"><p className="font-semibold">{campaign.campaignName}</p><p className="text-xs text-gray-400">{campaign.campaignId}</p></td><td className="px-5 py-3 font-semibold">{money(campaign.spend, meta.currency)}</td><td className="px-5 py-3">{format(campaign.impressions)}</td><td className="px-5 py-3">{format(campaign.clicks)}</td><td className="px-5 py-3">{format(campaign.ctr, '%')}</td><td className="px-5 py-3">{money(campaign.cpc, meta.currency)}</td><td className="px-5 py-3">{money(campaign.cpm, meta.currency)}</td><td className="px-5 py-3">{onsite?.sessions ?? '—'}</td><td className="px-5 py-3">{onsite?.clubViews ?? '—'}</td><td className="px-5 py-3 font-semibold">{onsite?.ctaClicks ?? '—'}</td><td className="px-5 py-3 font-semibold">{onsite ? `${onsite.intentRate}%` : '—'}</td></tr>;
      })}</tbody></table></div></section>
    <p className="mt-3 text-xs leading-5 text-gray-500">{meta.reportingNote}</p>
  </section>;
}
