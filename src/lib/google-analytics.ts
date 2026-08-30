export type GtagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: GtagFunction;
  }
}

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

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
