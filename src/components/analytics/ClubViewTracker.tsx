'use client';

import { useEffect, useRef } from 'react';
import { clubViewEvent, trackMetaCustomEvent, type ClubViewMeta } from '@/lib/meta-pixel';

export function ClubViewTracker({ club }: { club: ClubViewMeta }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackMetaCustomEvent(clubViewEvent(club));
  }, [club]);

  return null;
}
