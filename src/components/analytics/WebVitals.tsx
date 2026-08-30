'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';

export function WebVitals() {
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

  return null;
}
