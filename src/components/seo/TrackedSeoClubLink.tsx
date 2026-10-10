'use client';

import type { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import { rememberClubEntryOrigin } from '@/components/clubs/BackToClubsLink';
import { trackGaEvent } from '@/lib/google-analytics';
import { clubCardClickEvent, trackMetaCustomEvent } from '@/lib/meta-pixel';
import { trackPostHogEvent } from '@/lib/posthog';

interface TrackedSeoClubLinkProps {
  href: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  districtName?: string | null;
  listPosition: number;
  children: ReactNode;
  className?: string;
}

export function TrackedSeoClubLink({
  href,
  clubId,
  clubSlug,
  clubName,
  districtName,
  listPosition,
  children,
  className,
}: TrackedSeoClubLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) return;

    rememberClubEntryOrigin(clubSlug);

    const properties = {
      club_id: clubId,
      club_slug: clubSlug,
      club_name: clubName,
      district: districtName ?? null,
      list_position: listPosition,
      source_surface: 'seo_landing',
      discovery_surface: 'seo_landing',
      landing_path: window.location.pathname,
    };

    trackMetaCustomEvent(
      clubCardClickEvent({
        clubId,
        clubSlug,
        clubName,
        district: districtName ?? null,
      }),
    );
    trackGaEvent('club_card_click', properties);
    trackPostHogEvent('club_card_click', properties, {
      send_instantly: true,
      transport: 'sendBeacon',
    });
  }

  return (
    <Link href={href} prefetch={false} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
