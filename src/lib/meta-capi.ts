export const META_CAPI_EVENT_NAMES = [
  'ClubView',
  'ClubCardClick',
  'Contact',
  'InstagramClick',
  'DirectionsClick',
  'SubmissionSuccess',
] as const;

export type MetaCapiEventName = (typeof META_CAPI_EVENT_NAMES)[number];

export type MetaCapiInput = {
  eventId: string;
  name: MetaCapiEventName;
  params: Record<string, string>;
  path: string;
  fbp?: string;
  fbc?: string;
};

const EVENT_ID_RE = /^gy_[A-Za-z0-9_-]{12,120}$/;
const PIXEL_ID_RE = /^\d{5,32}$/;
const API_VERSION_RE = /^v\d{1,3}\.\d{1,2}$/;
const COOKIE_RE = /^fb\.[A-Za-z0-9._-]{3,240}$/;
const PARAM_KEYS = new Set([
  'club_id',
  'club_slug',
  'club_name',
  'district',
  'club_types',
  'channel',
  'surface',
]);
const EVENT_NAMES = new Set<string>(META_CAPI_EVENT_NAMES);

export function normalizeMetaCapiPixelId(value: string | undefined | null) {
  const normalized = value?.trim() ?? '';
  return PIXEL_ID_RE.test(normalized) ? normalized : null;
}

export function normalizeMetaGraphApiVersion(value: string | undefined | null) {
  const normalized = value?.trim() ?? '';
  return API_VERSION_RE.test(normalized) ? normalized : null;
}

function cleanOptionalCookie(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return COOKIE_RE.test(normalized) ? normalized : undefined;
}

function cleanParams(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > 8) return null;

  const params: Record<string, string> = {};
  for (const [key, raw] of entries) {
    if (!PARAM_KEYS.has(key) || typeof raw !== 'string') return null;
    const normalized = raw.trim();
    if (!normalized || normalized.length > 160) return null;
    params[key] = normalized;
  }
  return params;
}

export function sanitizeMetaCapiInput(value: unknown): MetaCapiInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.eventId !== 'string' || !EVENT_ID_RE.test(raw.eventId)) return null;
  if (typeof raw.name !== 'string' || !EVENT_NAMES.has(raw.name)) return null;
  if (
    typeof raw.path !== 'string' ||
    !raw.path.startsWith('/') ||
    raw.path.startsWith('//') ||
    raw.path.startsWith('/admin') ||
    raw.path.startsWith('/api') ||
    raw.path.length > 300
  ) return null;

  const params = cleanParams(raw.params);
  if (!params) return null;

  return {
    eventId: raw.eventId,
    name: raw.name as MetaCapiEventName,
    params,
    path: raw.path,
    ...(cleanOptionalCookie(raw.fbp) ? { fbp: cleanOptionalCookie(raw.fbp) } : {}),
    ...(cleanOptionalCookie(raw.fbc) ? { fbc: cleanOptionalCookie(raw.fbc) } : {}),
  };
}

export function buildMetaCapiServerEvent(
  input: MetaCapiInput,
  siteOrigin: string,
  clientUserAgent: string,
  eventTime = Math.floor(Date.now() / 1000),
) {
  const origin = new URL(siteOrigin);
  const eventSourceUrl = new URL(input.path, origin).toString();
  const userData: Record<string, string> = {
    client_user_agent: clientUserAgent.slice(0, 512),
  };
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  return {
    event_name: input.name,
    event_time: eventTime,
    event_id: input.eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: input.params,
  };
}
