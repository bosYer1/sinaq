export type ProviderKey = 'posthog' | 'supabase' | 'meta' | 'ga4' | 'gsc';

export type ProviderStatus = {
  key: ProviderKey;
  label: string;
  status: 'ready' | 'unavailable' | 'error';
  detail: string;
  checkedAt: string;
};

export type DateRange = {
  preset: 'today' | '24h' | '7d' | '30d' | 'custom';
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  label: string;
};

export type Metric = {
  current: number;
  previous: number;
  changePercent: number | null;
};

export type CampaignRow = {
  key: string;
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  sessions: number;
  pageviews: number;
  clubViews: number;
  clubClicks: number;
  ctaClicks: number;
  returningUsers: number;
  sessionsPerUser: number;
  clubViewRate: number;
  conversionRate: number;
};

export type AcquisitionRow = {
  channel: string;
  visitors: number;
  sessions: number;
  clubViews: number;
  ctaClicks: number;
  ctaRate: number;
};

export type ClubPerformanceRow = {
  slug: string;
  name: string;
  district: string;
  impressions: number;
  views: number;
  cardClicks: number;
  phoneClicks: number;
  instagramClicks: number;
  mapsClicks: number;
  intentRate: number;
};

export type TrendPoint = { date: string; pageviews: number; visitors: number; ctaClicks: number };

export type PostHogMetrics = {
  status: ProviderStatus;
  pageviews: Metric;
  visitors: Metric;
  sessions: Metric;
  clubViews: Metric;
  clubClicks: Metric;
  ctaClicks: Metric;
  searchQueries: Metric;
  filterChanges: Metric;
  exploreViewChanges: Metric;
  mapUsage: Metric;
  phoneClicks: Metric;
  instagramClicks: Metric;
  mapsClicks: Metric;
  returningUsers: number;
  returningRate: number;
  sessionsPerUser: number;
  usersWithThreeSessions: number;
  conversionRate: Metric;
  acquisition: AcquisitionRow[];
  campaigns: CampaignRow[];
  clubs: ClubPerformanceRow[];
  trend: TrendPoint[];
  tracking: {
    latestEventAt: string | null;
    publicEvents: number;
    testEvents: number;
    missingSessionAttribution: number;
    missingCampaignAttribution: number;
    noResultSearches: number;
    botEvents: number;
    sourceMissingSessions: number;
    attributionCompleteness: number;
  };
  funnel: { landingSessions: number; discoverySessions: number; clubViewSessions: number; ctaSessions: number };
  retention: { d1: number | null; d3: number | null; d7: number | null; cohortUsers: number };
};

export type Ga4Metrics = {
  status: ProviderStatus;
  sessions: Metric;
  activeUsers: Metric;
  totalUsers: Metric;
  newUsers: Metric;
  pageviews: Metric;
  engagementRate: Metric;
  bounceRate: Metric;
  averageSessionDuration: Metric;
  eventCount: Metric;
  keyEvents: Metric;
};

export type SupabaseMetrics = {
  status: ProviderStatus;
  activeClubs: number;
  verifiedClubs: number;
  pendingSubmissions: number;
  staleSubmissions: number;
  completeness: {
    total: number;
    missingImage: number;
    missingPhone: number;
    missingInstagram: number;
    missingCoordinates: number;
    missingType: number;
  };
};

export type CeoSignal = {
  severity: 'positive' | 'attention' | 'critical';
  title: string;
  detail: string;
  action: string;
};

export type FounderDashboard = {
  range: DateRange;
  posthog: PostHogMetrics;
  ga4: Ga4Metrics;
  supabase: SupabaseMetrics;
  providers: ProviderStatus[];
  signals: CeoSignal[];
  generatedAt: string;
};
