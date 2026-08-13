'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ClubDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Klub detalı yüklənərkən xəta:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warn-light text-3xl">⚠️</div>
      <h1 className="font-display text-xl font-semibold text-ink">Klub yüklənmədi</h1>
      <p className="text-sm text-muted">Bu klubun məlumatını yükləyərkən xəta baş verdi.</p>
      <div className="mt-2 flex gap-2">
        <Button onClick={reset} variant="secondary">
          Yenidən cəhd et
        </Button>
        <Link href="/" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}
