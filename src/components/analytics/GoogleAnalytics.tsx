'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import Script from 'next/script';
import { buildGaBootstrap, createGaRouteTracker, normalizeGaMeasurementId, trackGaEvent, trackGaPageView } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';

type LargestContentfulPaintEntry = PerformanceEntry & {
  element?: Element | null;
  size?: number;
};

function lcpAttribution(entries: PerformanceEntry[]) {
  const entry = entries.at(-1) as LargestContentfulPaintEntry | undefined;
  const element = entry?.element;
  if (!entry || !element) return {};

  const classes = Array.from(element.classList).slice(0, 3).join(' ').slice(0, 160);
  return {
    lcp_element_tag: element.tagName.toLowerCase(),
    ...(element.id ? { lcp_element_id: element.id.slice(0, 80) } : {}),
    ...(classes ? { lcp_element_classes: classes } : {}),
    ...(typeof entry.size === 'number' ? { lcp_element_size: Math.round(entry.size) } : {}),
  };
}

function inpAttribution(entries: PerformanceEntry[]) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index] as PerformanceEventTiming;
    const target = entry.target;
    if (!(target instanceof Element)) continue;

    const classes = Array.from(target.classList).slice(0, 3).join(' ').slice(0, 160);
    return {
      inp_event_type: entry.name.slice(0, 32),
      inp_element_tag: target.tagName.toLowerCase(),
      ...(target.id ? { inp_element_id: target.id.slice(0, 80) } : {}),
      ...(classes ? { inp_element_classes: classes } : {}),
    };
  }
  return {};
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const normalizedMeasurementId = normalizeGaMeasurementId(measurementId);
  const [shouldTrackRoute] = useState(() => createGaRouteTracker(pathname));

  useReportWebVitals((metric) => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;
    const properties = {
      metric_name: metric.name,
      metric_id: metric.id,
      metric_value: metric.value,
      metric_rating: metric.rating,
      path: pathname,
      ...(metric.name === 'LCP' ? lcpAttribution(metric.entries) : {}),
      ...(metric.name === 'INP' ? inpAttribution(metric.entries) : {}),
    };
    trackGaEvent('web_vital', properties);
    trackPostHogEvent('web_vital', properties);
  });

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
