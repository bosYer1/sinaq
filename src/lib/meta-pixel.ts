export type MetaPixelFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
  }
}

export type ClubMeta = {
  clubId: string;
  clubSlug: string;
  clubName: string;
};

export type ClubViewMeta = ClubMeta & {
  district?: string | null;
  clubTypes: string[];
};

export type MetaCustomEvent =
  | { name: 'ClubView'; params: Record<string, string> }
  | { name: 'ClubCardClick'; params: Record<string, string> }
  | { name: 'Contact'; params: Record<string, string> }
  | { name: 'InstagramClick'; params: Record<string, string> }
  | { name: 'DirectionsClick'; params: Record<string, string> }
  | { name: 'SubmissionSuccess'; params: Record<string, string> };

const PIXEL_ID_PATTERN = /^\d{5,32}$/;
const pendingEvents: MetaCustomEvent[] = [];

export function normalizeMetaPixelId(value: string | undefined | null) {
  const normalized = value?.trim() ?? '';
  return PIXEL_ID_PATTERN.test(normalized) ? normalized : null;
}

export function buildMetaPixelBootstrap(pixelId: string) {
  const normalized = normalizeMetaPixelId(pixelId);
  if (!normalized) return '';

  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${normalized}');fbq('track','PageView');`;
}

export function createMetaRouteTracker(initialPathname: string | null = null) {
  let lastTrackedPath = initialPathname;

  return (pathname: string | null) => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return false;
    if (lastTrackedPath === pathname) return false;
    lastTrackedPath = pathname;
    return true;
  };
}

function baseClubParams(club: ClubMeta) {
  return {
    club_id: club.clubId,
    club_slug: club.clubSlug,
    club_name: club.clubName,
  };
}

export function clubViewEvent(club: ClubViewMeta): MetaCustomEvent {
  return {
    name: 'ClubView',
    params: {
      ...baseClubParams(club),
      ...(club.district ? { district: club.district } : {}),
      club_types: club.clubTypes.join(','),
    },
  };
}

export function clubCardClickEvent(club: ClubMeta): MetaCustomEvent {
  return { name: 'ClubCardClick', params: baseClubParams(club) };
}

export function clubActionEvent(eventType: 'maps_click' | 'phone_click' | 'instagram_click', club: ClubMeta): MetaCustomEvent {
  const params = baseClubParams(club);
  if (eventType === 'phone_click') return { name: 'Contact', params: { channel: 'phone', ...params } };
  if (eventType === 'instagram_click') return { name: 'InstagramClick', params };
  return { name: 'DirectionsClick', params };
}

export function submissionSuccessEvent(surface: 'contact' | 'club_owner', clubSlug?: string | null, clubName?: string | null): MetaCustomEvent {
  return {
    name: 'SubmissionSuccess',
    params: {
      surface,
      ...(clubSlug ? { club_slug: clubSlug } : {}),
      ...(clubName ? { club_name: clubName } : {}),
    },
  };
}

function sendEvent(event: MetaCustomEvent) {
  window.fbq?.('trackCustom', event.name, event.params);
}

export function trackMetaCustomEvent(event: MetaCustomEvent) {
  if (typeof window === 'undefined' || !normalizeMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID)) return;
  if (window.fbq) {
    sendEvent(event);
    return;
  }
  if (pendingEvents.length < 20) pendingEvents.push(event);
}

export function markMetaPixelReady() {
  if (typeof window === 'undefined' || !window.fbq) return;
  while (pendingEvents.length > 0) sendEvent(pendingEvents.shift()!);
}

export function trackMetaPageView() {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'PageView');
}
