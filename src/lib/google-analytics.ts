export type GtagFunction = (...args: unknown[]) => void;

export type GaEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: GtagFunction;
  }
}

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;
const GA_EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;

export function normalizeGaMeasurementId(value: string | undefined | null) {
  const normalized = value?.trim().toUpperCase() ?? '';
  return GA_MEASUREMENT_ID_PATTERN.test(normalized) ? normalized : null;
}

export function buildGaBootstrap(measurementId: string) {
  const normalized = normalizeGaMeasurementId(measurementId);
  if (!normalized) return '';

  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${normalized}',{anonymize_ip:true});`;
}

export function createGaRouteTracker(initialPathname: string | null = null) {
  let lastTrackedPath = initialPathname;

  return (pathname: string | null) => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return false;
    if (lastTrackedPath === pathname) return false;
    lastTrackedPath = pathname;
    return true;
  };
}

export function trackGaPageView(measurementId: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const normalized = normalizeGaMeasurementId(measurementId);
  if (!normalized) return;

  window.gtag('event', 'page_view', {
    send_to: normalized,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  });
}

export function trackGaEvent(eventName: string, params: GaEventParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const measurementId = normalizeGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  if (!measurementId || !GA_EVENT_NAME_PATTERN.test(eventName)) return;

  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
  );

  window.gtag('event', eventName, {
    ...safeParams,
    send_to: measurementId,
  });
}
