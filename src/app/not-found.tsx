'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';

export default function NotFound() {
  useEffect(() => {
    const path = window.location.pathname;
    if (!path.startsWith('/admin') && !path.startsWith('/api')) {
      trackGaEvent('not_found', { path });
      trackPostHogEvent('not_found', { path });
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center sm:px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
        G
      </div>
      <p className="mt-5 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">Səhifə tapılmadı</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Axtardığınız səhifə mövcud deyil və ya link dəyişdirilib.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Klublara qayıt
      </Link>
    </div>
  );
}
