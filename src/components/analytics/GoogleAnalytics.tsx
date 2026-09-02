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

type INPEntry = PerformanceEventTiming & {
  target?: Node | null;
  targetSelector?: string;
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

function selectorAttribution(selector?: string) {
  if (!selector) return {};
  const compound = selector.split(/[\s>+~]+/).filter(Boolean).at(-1) ?? '';
  const tag = compound.match(/^[a-z][a-z0-9-]*/i)?.[0]?.toLowerCase();
  const id = compound.match(/#([a-z0-9_-]+)/i)?.[1];
  const classes = Array.from(compound.matchAll(/\.([a-z0-9_-]+)/gi), (match) => match[1]).slice(0, 3).join(' ').slice(0, 160);

  return {
    ...(tag ? { inp_element_tag: tag } : {}),
    ...(id ? { inp_element_id: id.slice(0, 80) } : {}),
    ...(classes ? { inp_element_classes: classes } : {}),
  };
}

function inpAttribution(entries: PerformanceEntry[]) {
  const eventEntries = entries as INPEntry[];
  const firstEntry = eventEntries[0];
  if (!firstEntry) return {};

  const targetEntry = eventEntries.find((entry) => entry.target instanceof Element);
  const target = targetEntry?.target;
  if (target instanceof Element) {
    const classes = Array.from(target.classList).slice(0, 3).join(' ').slice(0, 160);
    return {
      inp_event_type: firstEntry.name.slice(0, 32),
      inp_element_tag: target.tagName.toLowerCase(),
      ...(target.id ? { inp_element_id: target.id.slice(0, 80) } : {}),
      ...(classes ? { inp_element_classes: classes } : {}),
    };
  }

  const selector = eventEntries.find((entry) => entry.targetSelector)?.targetSelector;
  return {
    inp_event_type: firstEntry.name.slice(0, 32),
    ...selectorAttribution(selector),
  };
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
