'use client';

import { useEffect } from 'react';
import { trackPostHogEvent } from '@/lib/posthog';

interface SubmissionSuccessTrackerProps {
  surface: 'contact' | 'club_owner';
  clubSlug?: string | null;
  clubName?: string | null;
}

export function SubmissionSuccessTracker({ surface, clubSlug, clubName }: SubmissionSuccessTrackerProps) {
  useEffect(() => {
    const key = `gameyer_submission_success:${surface}:${clubSlug ?? ''}:${clubName ?? ''}`;
    try {
      if (window.sessionStorage.getItem(key) === '1') return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Session storage is optional; event capture can still proceed.
    }

    trackPostHogEvent('submission_success', {
      surface,
      club_slug: clubSlug ?? null,
      club_name: clubName ?? null,
    });
  }, [surface, clubSlug, clubName]);

  return null;
}
