'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertIcon } from '@/components/ui/Icon';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('GameYer səhifə xətası:', error);

    const payload = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
    };

    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warn-tint text-warn">
        <AlertIcon width={24} height={24} />
      </div>
      <h1 className="font-display text-xl font-semibold text-ink">Nəsə səhv getdi</h1>
      <p className="text-sm text-muted">
        Səhifə yüklənərkən xəta baş verdi. Yenidən cəhd edin.
      </p>
      <Button onClick={reset} className="mt-2">
        Yenidən cəhd et
      </Button>
    </div>
  );
}
