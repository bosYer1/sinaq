'use client';

import { useEffect, useRef } from 'react';
import { trackGaEvent } from '@/lib/google-analytics';
import { clubViewEvent, trackMetaCustomEvent, type ClubViewMeta } from '@/lib/meta-pixel';
import { trackPostHogEvent } from '@/lib/posthog';

export function ClubViewTracker({ club }: { club: ClubViewMeta }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const eventProperties = {
      club_id: club.clubId,
      club_slug: club.clubSlug,
      club_name: club.clubName,
      district: club.district ?? null,
      club_types: club.clubTypes.join(','),
    };

    trackMetaCustomEvent(clubViewEvent(club));
    trackGaEvent('club_view', eventProperties);
    trackPostHogEvent('club_view', eventProperties, {
      send_instantly: true,
      transport: 'sendBeacon',
    });
  }, [club]);

  return null;
}
