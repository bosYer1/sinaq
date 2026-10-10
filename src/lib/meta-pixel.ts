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

type PendingMetaEvent = {
  event: MetaCustomEvent;
  eventId: string;
};

const PIXEL_ID_PATTERN = /^\d{5,32}$/;
const pendingEvents: PendingMetaEvent[] = [];

export function normalizeMetaPixelId(value: string | undefined | null) {
  const normalized = value?.trim() ?? '';
  return PIXEL_ID_PATTERN.test(normalized) ? normalized : null;
}

export function buildMetaPixelBootstrap(pixelId: string) {
  const normalized = normalizeMetaPixelId(pixelId);
  if (!normalized) return '';

  return `(function(){if(new URLSearchParams(window.location.search).get('__analytics_smoke')==='1')return;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${normalized}');fbq('track','PageView');})();`;
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

export function clubCardClickEvent(club: ClubMeta & {
  district?: string | null;
  sourceSurface?: 'seo_landing';
  landingPath?: string;
  listPosition?: number;
}): MetaCustomEvent {
  return {
    name: 'ClubCardClick',
    params: {
      ...baseClubParams(club),
      ...(club.district ? { district: club.district } : {}),
      ...(club.sourceSurface ? { source_surface: club.sourceSurface } : {}),
      ...(club.landingPath ? { landing_path: club.landingPath } : {}),
      ...(typeof club.listPosition === 'number' && Number.isSafeInteger(club.listPosition) && club.listPosition > 0
        ? { list_position: String(club.listPosition) }
        : {}),
    },
  };
}

export function clubActionEvent(eventType: 'maps_click' | 'phone_click' | 'instagram_click' | 'club_correction_click', club: ClubMeta): MetaCustomEvent {
  const params = baseClubParams(club);
  if (eventType === 'phone_click') return { name: 'Contact', params: { channel: 'phone', ...params } };
  if (eventType === 'club_correction_click') return { name: 'Contact', params: { channel: 'correction', ...params } };
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

export function createMetaEventId(now = Date.now()) {
  const random =
    globalThis.crypto?.randomUUID?.().replaceAll('-', '') ||
    Math.random().toString(36).slice(2).padEnd(16, '0');
  return `gy_${now.toString(36)}_${random.slice(0, 32)}`;
}

function readCookie(name: '_fbp' | '_fbc') {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  const value = match?.slice(prefix.length).trim();
  return value || undefined;
}

function sendCapiEvent(item: PendingMetaEvent) {
  if (
    process.env.NEXT_PUBLIC_META_CAPI_ENABLED !== '1' ||
    typeof window === 'undefined' ||
    new URLSearchParams(window.location.search).get('__analytics_smoke') === '1' ||
    window.location.pathname.startsWith('/admin') ||
    window.location.pathname.startsWith('/api')
  ) return;

  void fetch('/api/meta/capi', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    keepalive: true,
    body: JSON.stringify({
      eventId: item.eventId,
      name: item.event.name,
      params: item.event.params,
      path: window.location.pathname,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
    }),
  }).catch(() => undefined);
}

function sendEvent(item: PendingMetaEvent) {
  window.fbq?.('trackCustom', item.event.name, item.event.params, { eventID: item.eventId });
}

export function trackMetaCustomEvent(event: MetaCustomEvent) {
  if (typeof window === 'undefined' || !normalizeMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID)) return;

  const item = { event, eventId: createMetaEventId() };
  sendCapiEvent(item);

  if (window.fbq) {
    sendEvent(item);
    return;
  }
  if (pendingEvents.length < 20) pendingEvents.push(item);
}

export function markMetaPixelReady() {
  if (typeof window === 'undefined' || !window.fbq) return;
  while (pendingEvents.length > 0) sendEvent(pendingEvents.shift()!);
}

export function trackMetaPageView() {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'PageView');
}
