import type { CeoSignal, Metric, PostHogMetrics, SupabaseMetrics } from './types';

export function metric(current: number, previous: number): Metric {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safePrevious = Number.isFinite(previous) ? previous : 0;
  return {
    current: safeCurrent,
    previous: safePrevious,
    changePercent: safePrevious > 0
      ? Math.round(((safeCurrent - safePrevious) / safePrevious) * 10_000) / 100
      : safeCurrent > 0 ? null : 0,
  };
}

export function rate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

export function buildCeoSignals(posthog: PostHogMetrics, supabase: SupabaseMetrics): CeoSignal[] {
  const signals: CeoSignal[] = [];

  if (posthog.status.status !== 'ready') {
    signals.push({ severity: 'critical', title: 'Davranış datası əlçatan deyil', detail: posthog.status.detail, action: 'PostHog server konfiqurasiyasını yoxla.' });
  } else {
    const lastEventAge = posthog.tracking.latestEventAt
      ? Date.now() - new Date(posthog.tracking.latestEventAt).getTime()
      : Number.POSITIVE_INFINITY;
    if (lastEventAge > 24 * 60 * 60 * 1000) {
      signals.push({ severity: 'critical', title: 'Tracking axını dayanıb', detail: 'Son public event 24 saatdan köhnədir.', action: 'Production tracking və CSP-ni dərhal yoxla.' });
    }
    if (posthog.sessions.current > 0 && posthog.tracking.attributionCompleteness < 90) {
      signals.push({ severity: 'attention', title: 'Attribution boşluğu var', detail: `Public pageview sessiyalarının ${posthog.tracking.attributionCompleteness}%-də session attribution tamdır.`, action: 'Campaign linkləri və PostHog bootstrap ardıcıllığını yoxla.' });
    }
    if (posthog.searchQueries.current >= 5 && rate(posthog.tracking.noResultSearches, posthog.searchQueries.current) >= 20) {
      signals.push({ severity: 'attention', title: 'Axtarışda nəticəsizlik yüksəkdir', detail: 'Axtarışların ən azı beşdə biri nəticə vermir.', action: 'No-result sorğularına görə klub təklifini və sinonimləri prioritetləşdir.' });
    }
    if ((posthog.ctaClicks.changePercent ?? 0) >= 20) {
      signals.push({ severity: 'positive', title: 'Klub niyyəti artır', detail: `CTA klikləri əvvəlki dövrlə müqayisədə ${posthog.ctaClicks.changePercent}% artıb.`, action: 'Artımı gətirən kampaniya və klubları gücləndir.' });
    }
    if (posthog.visitors.current >= 20 && posthog.returningRate < 10) {
      signals.push({ severity: 'attention', title: 'Təkrar istifadə zəifdir', detail: `Cari intervalda aktiv olub daha əvvəl də public sessiyası olan istifadəçilərin payı ${posthog.returningRate}%-dir.`, action: 'Returning istifadəçi motivlərini və yenidən giriş kanallarını araşdır.' });
    }
    const paidCampaigns = posthog.campaigns.filter((campaign) => campaign.medium.toLowerCase().includes('paid'));
    const paidSessions = paidCampaigns.reduce((sum, campaign) => sum + campaign.sessions, 0);
    const largestPaid = Math.max(0, ...paidCampaigns.map((campaign) => campaign.sessions));
    if (paidSessions >= 10 && rate(largestPaid, paidSessions) > 60) {
      signals.push({ severity: 'attention', title: 'Paid trafik konsentrasiyası yüksəkdir', detail: `Ən böyük kampaniya paid sessiyaların ${rate(largestPaid, paidSessions)}%-ni gətirir.`, action: 'Kampaniya riskini böl və daha keyfiyyətli alternativləri test et.' });
    }
  }

  if (supabase.status.status === 'ready') {
    const missingCore = supabase.completeness.missingImage + supabase.completeness.missingPhone + supabase.completeness.missingCoordinates;
    if (missingCore > 0) {
      signals.push({ severity: 'attention', title: 'Klub datasında boşluqlar var', detail: `${missingCore} əsas profil sahəsi tamamlanmayıb.`, action: 'Data Quality cədvəlində çatışmayan sahələri prioritetləşdir.' });
    }
    if (supabase.staleSubmissions > 0) {
      signals.push({ severity: 'critical', title: 'Gecikmiş müraciətlər var', detail: `${supabase.staleSubmissions} müraciət 72 saatdan çoxdur gözləyir.`, action: 'Müraciət növbəsini bu gün təmizlə.' });
    }
  }

  if (signals.length === 0) {
    signals.push({ severity: 'positive', title: 'Əsas siqnallar stabildir', detail: 'Hazırkı dövrdə avtomatik kritik siqnal yaranmayıb.', action: 'Kampaniya və klub conversion trendini izləməyə davam et.' });
  }
  return signals.slice(0, 6);
}
