'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { buildMetaPixelBootstrap, createMetaRouteTracker, markMetaPixelReady, normalizeMetaPixelId, trackMetaPageView } from '@/lib/meta-pixel';

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const normalizedPixelId = normalizeMetaPixelId(pixelId);
  const [ready, setReady] = useState(false);
  const shouldTrackRoute = useMemo(() => createMetaRouteTracker(), []);

  useEffect(() => {
    if (!ready || !shouldTrackRoute(pathname)) return;
    trackMetaPageView();
  }, [pathname, ready, shouldTrackRoute]);

  if (!normalizedPixelId) return null;

  return (
    <Script
      id="meta-pixel-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: buildMetaPixelBootstrap(normalizedPixelId) }}
      onReady={() => {
        markMetaPixelReady();
        setReady(true);
      }}
    />
  );
}
