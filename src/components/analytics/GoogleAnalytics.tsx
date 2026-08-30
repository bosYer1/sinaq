'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import Script from 'next/script';
import { buildGaBootstrap, createGaRouteTracker, normalizeGaMeasurementId, trackGaEvent, trackGaPageView } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const normalizedMeasurementId = normalizeGaMeasurementId(measurementId);
  const [shouldTrackRoute] = useState(() => createGaRouteTracker(pathname));

  useReportWebVitals((metric) => {
    const properties = {
      metric_name: metric.name,
      metric_id: metric.id,
      metric_value: metric.value,
      metric_rating: metric.rating,
    };
    trackPostHogEvent('web_vital', properties);
    trackGaEvent('web_vital', properties);
  });

  useEffect(() => {
    if (!normalizedMeasurementId || !shouldTrackRoute(pathname)) return;
    trackGaPageView(normalizedMeasurementId);
  }, [normalizedMeasurementId, pathname, shouldTrackRoute]);

  if (!normalizedMeasurementId) return null;

  return (
    <>
      <Script id="ga4-loader" src={`https://www.googletagmanager.com/gtag/js?id=${normalizedMeasurementId}`} strategy="afterInteractive" />
      <Script id="ga4-bootstrap" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: buildGaBootstrap(normalizedMeasurementId) }} />
    </>
  );
}
