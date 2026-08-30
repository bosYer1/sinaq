'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPostHogEvent } from '@/lib/posthog';

export function SubmissionSuccessTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/elaqe' && pathname !== '/klub-sahibi') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') !== '1') return;

    const surface = pathname === '/klub-sahibi' ? 'club_owner' : 'contact';
    const clubSlug = params.get('slug');
    const clubName = params.get('club');
    const key = `gameyer_submission_success:${surface}:${clubSlug ?? ''}:${clubName ?? ''}`;

    try {
      if (window.sessionStorage.getItem(key) === '1') return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Session storage is optional; event capture can still proceed.
    }

    trackPostHogEvent('submission_success', {
      surface,
      club_slug: clubSlug,
      club_name: clubName,
    });
  }, [pathname]);

  return null;
}
