'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertIcon } from '@/components/ui/Icon';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('GameYer səhifə xətası:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warn-tint text-warn">
        <AlertIcon width={24} height={24} />
      </div>
      <h1 className="font-display text-xl font-semibold text-ink">Nəsə səhv getdi</h1>
      <p className="text-sm text-muted">
        Klubları yükləyərkən xəta baş verdi. İnternet bağlantınızı yoxlayın və yenidən cəhd edin.
      </p>
      <Button onClick={reset} className="mt-2">
        Yenidən cəhd et
      </Button>
    </div>
  );
}
