'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { buildGaBootstrap, createGaRouteTracker, normalizeGaMeasurementId, trackGaPageView } from '@/lib/google-analytics';

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const normalizedMeasurementId = normalizeGaMeasurementId(measurementId);
  const initialPathname = useRef(pathname);
  const shouldTrackRoute = useMemo(() => createGaRouteTracker(initialPathname.current), []);

  useEffect(() => {
    if (!normalizedMeasurementId || !shouldTrackRoute(pathname)) return;
    trackGaPageView(normalizedMeasurementId);
  }, [normalizedMeasurementId, pathname, shouldTrackRoute]);

  if (!normalizedMeasurementId) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${normalizedMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: buildGaBootstrap(normalizedMeasurementId) }}
      />
    </>
  );
}
