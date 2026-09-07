import { rate } from './calculations.ts';
import type { AcquisitionRow, CampaignRow, ClubPerformanceRow, SupabaseMetrics } from './types';

export function numberValue(value: unknown) {
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}

export function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function normalizeCampaign(row: Record<string, unknown>): CampaignRow {
  const source = stringValue(row.source, 'direct');
  const medium = stringValue(row.medium, '—');
  const campaign = stringValue(row.campaign, '(kampaniyasız)');
  const clubViews = numberValue(row.club_views);
  const ctaClicks = numberValue(row.cta_clicks);
  const visitors = numberValue(row.visitors);
  const sessions = numberValue(row.sessions);
  return { key: `${source}|${medium}|${campaign}`, source, medium, campaign, visitors, sessions, pageviews: numberValue(row.pageviews), clubViews, clubClicks: numberValue(row.club_clicks), ctaClicks, returningUsers: numberValue(row.returning_users), sessionsPerUser: visitors > 0 ? Math.round((sessions / visitors) * 100) / 100 : 0, clubViewRate: rate(clubViews, sessions), conversionRate: rate(ctaClicks, sessions) };
}

export function normalizeClubPerformance(row: Record<string, unknown>): ClubPerformanceRow {
  const views = numberValue(row.views);
  const phoneClicks = numberValue(row.phone_clicks);
  const instagramClicks = numberValue(row.instagram_clicks);
  const mapsClicks = numberValue(row.maps_clicks);
  return { slug: stringValue(row.slug, '(slug yoxdur)'), name: stringValue(row.name, 'Naməlum klub'), district: stringValue(row.district, 'Məlum deyil'), impressions: numberValue(row.impressions), views, cardClicks: numberValue(row.card_clicks), phoneClicks, instagramClicks, mapsClicks, intentRate: rate(phoneClicks + instagramClicks + mapsClicks, views) };
}

export function acquisitionChannel(sourceInput: string, mediumInput: string): string {
  const source = sourceInput.toLowerCase();
  const medium = mediumInput.toLowerCase();
  if (medium.includes('paid') || medium === 'cpc' || medium === 'ppc') return 'Paid';
  if (source.includes('instagram') || source === 'ig') return 'Instagram';
  if (source.includes('facebook') || source === 'fb') return 'Facebook';
  if (source.includes('google')) return medium.includes('organic') ? 'Organic' : 'Google';
  if (source.includes('tiktok') || source === 'tt') return 'TikTok';
  if (source === 'direct') return 'Direct';
  if (source === 'unknown' || !source) return 'Unknown';
  if (medium.includes('organic')) return 'Organic';
  return 'Referral';
}

export function aggregateAcquisition(campaigns: CampaignRow[]): AcquisitionRow[] {
  const grouped = new Map<string, Omit<AcquisitionRow, 'ctaRate'>>();
  for (const row of campaigns) {
    const channel = acquisitionChannel(row.source, row.medium);
    const current = grouped.get(channel) ?? { channel, visitors: 0, sessions: 0, clubViews: 0, ctaClicks: 0 };
    current.visitors += row.visitors;
    current.sessions += row.sessions;
    current.clubViews += row.clubViews;
    current.ctaClicks += row.ctaClicks;
    grouped.set(channel, current);
  }
  return [...grouped.values()].map((row) => ({ ...row, ctaRate: rate(row.ctaClicks, row.sessions) })).sort((a, b) => b.sessions - a.sessions);
}

type QualityClub = { id: string; phone: string | null; instagram_url: string | null; profile_image_url: string | null; latitude: number | null; longitude: number | null };

export function calculateCompleteness(clubs: QualityClub[], imageIds: Set<string>, typeIds: Set<string>): SupabaseMetrics['completeness'] {
  return { total: clubs.length, missingImage: clubs.filter((club) => !club.profile_image_url && !imageIds.has(club.id)).length, missingPhone: clubs.filter((club) => !club.phone?.trim()).length, missingInstagram: clubs.filter((club) => !club.instagram_url?.trim()).length, missingCoordinates: clubs.filter((club) => club.latitude == null || club.longitude == null).length, missingType: clubs.filter((club) => !typeIds.has(club.id)).length };
}
