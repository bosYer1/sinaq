'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackPostHogEvent } from '@/lib/posthog';

type SubmissionKind = 'correction' | 'new_club' | 'owner_claim';

interface SubmissionAnalyticsProps {
  kind: SubmissionKind;
  returnTo: '/elaqe' | '/klub-sahibi';
  hasLinkedClub: boolean;
}

export function SubmissionAnalytics({ kind, returnTo, hasLinkedClub }: SubmissionAnalyticsProps) {
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);
  const resultCapturedRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const common = {
      submission_kind: kind,
      return_to: returnTo,
      has_linked_club: hasLinkedClub,
    };

    trackPostHogEvent('submission_form_viewed', common);

    if (!resultCapturedRef.current) {
      const result = searchParams.get('sent') === '1'
        ? 'sent'
        : searchParams.get('error') === '1'
          ? 'error'
          : searchParams.get('rate') === '1'
            ? 'rate_limited'
            : null;

      if (result) {
        resultCapturedRef.current = true;
        trackPostHogEvent('submission_result', { ...common, result });
      }
    }

    const form = markerRef.current?.closest('form');
    if (!form) return;

    const markStarted = (event: Event) => {
      if (startedRef.current) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
      if (target instanceof HTMLInputElement && target.type === 'hidden') return;
      if (target.getAttribute('name') === 'website') return;

      startedRef.current = true;
      trackPostHogEvent('submission_form_started', common);
    };

    const markSubmitAttempt = () => {
      trackPostHogEvent('submission_submit_attempt', common);
    };

    form.addEventListener('input', markStarted, { passive: true });
    form.addEventListener('change', markStarted, { passive: true });
    form.addEventListener('submit', markSubmitAttempt);

    return () => {
      form.removeEventListener('input', markStarted);
      form.removeEventListener('change', markStarted);
      form.removeEventListener('submit', markSubmitAttempt);
    };
  }, [hasLinkedClub, kind, returnTo, searchParams]);

  return <span ref={markerRef} className="hidden" aria-hidden="true" />;
}
