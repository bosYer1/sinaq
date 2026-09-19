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

export type ClubDataQualityRow = {
  slug: string;
  name: string;
  completenessScore: number;
  missingFields: Array<'image' | 'phone' | 'instagram' | 'coordinates' | 'type'>;
  lastEvidenceCheckedAt: string | null;
  evidenceState: 'fresh' | 'stale' | 'missing';
};

export type ClubDataPriorityRow = ClubDataQualityRow & {
  views: number;
  ctaClicks: number;
  priorityScore: number;
};

export type TrendPoint = { date: string; pageviews: number; visitors: number; ctaClicks: number };

export type ReturnLoopMetrics = {
  updateImpressions: number;
  updateDetailClicks: number;
  updateClubClicks: number;
  updateSourceClicks: number;
  updateUsers: number;
  updateSessions: number;
  downstreamClubViewSessions: number;
  downstreamCtaSessions: number;
  returningUpdateUsers: number;
  returningUpdateRate: number;
  clubViewReachRate: number;
  ctaReachRate: number;
};

export type SupplyFunnelMetrics = {
  ownerClaimViews: number;
  newClubViews: number;
  correctionViews: number;
  ownerClaimStarts: number;
  ownerClaimAttempts: number;
  ownerClaimSent: number;
  newClubSent: number;
  correctionSent: number;
  ownerClaimErrors: number;
  ownerClaimRateLimited: number;
  startRate: number;
  submitRate: number;
};

export type RetentionMetrics = {
  d1: number | null;
  d3: number | null;
  d7: number | null;
  d1CohortUsers: number;
  d3CohortUsers: number;
  d7CohortUsers: number;
  cohortUsers: number;
};

export type PwaMetrics = {
  installAvailable: number;
  installed: number;
  standaloneOpened: number;
};

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
  funnel: { landingSessions: number; discoverySessions: number; clubViewSessions: number; ctaSessions: number; profileToLeadRate: number };
  retention: RetentionMetrics;
  pwa: PwaMetrics;
  returnLoop: ReturnLoopMetrics;
  supplyFunnel: SupplyFunnelMetrics;
  discoveryQuality: { searchSessions: number; zeroResultSearchSessions: number; zeroResultRate: number; filterSessions: number; filterAdoptionRate: number; mapSessions: number; mapAdoptionRate: number; clubImpressionSessions: number; clubClickSessions: number; clubCtr: number };
  webVitals: { lcpP75: number | null; lcpSamples: number; inpP75: number | null; inpSamples: number; clsP75: number | null; clsSamples: number };
};
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

export type GscSearchRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscMetrics = {
  status: ProviderStatus;
  clicks: Metric;
  impressions: Metric;
  ctr: Metric;
  averagePosition: Metric;
  topQueries: GscSearchRow[];
  topPages: GscSearchRow[];
};

export type MetaCampaignRow = {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
};

export type MetaAdsMetrics = {
  status: ProviderStatus;
  currency: string | null;
  spend: Metric;
  impressions: Metric;
  reach: Metric;
  clicks: Metric;
  ctr: Metric;
  cpc: Metric;
  cpm: Metric;
  campaigns: MetaCampaignRow[];
  reportingNote: string;
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
  qualityBacklog: ClubDataQualityRow[];
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
  meta: MetaAdsMetrics;
  ga4: Ga4Metrics;
  gsc: GscMetrics;
  supabase: SupabaseMetrics;
  clubDataPriorities: ClubDataPriorityRow[];
  providers: ProviderStatus[];
  signals: CeoSignal[];
  generatedAt: string;
};