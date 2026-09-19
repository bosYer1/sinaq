'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';
import { cn } from '@/lib/utils';

interface TrackedTikTokLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  children: ReactNode;
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function TrackedTikTokLink({ href, clubId, clubSlug, clubName, children, onClick, className, ...props }: TrackedTikTokLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const eventProperties = {
      club_id: clubId,
      club_slug: clubSlug,
      club_name: clubName,
      cta_surface: 'contact_tiktok',
    };

    trackGaEvent('tiktok_click', eventProperties);
    trackPostHogEvent('tiktok_click', eventProperties);
  }

  return <a href={href} onClick={handleClick} {...props} className={cn(className, 'inline-flex min-h-11 items-center rounded-md px-2', FOCUS_RING)}>{children}</a>;
}
