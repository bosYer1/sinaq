'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';
import { cn } from '@/lib/utils';

interface TrackedWhatsAppBookingLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  children: ReactNode;
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function TrackedWhatsAppBookingLink({
  href,
  clubId,
  clubSlug,
  clubName,
  children,
  onClick,
  className,
  ...props
}: TrackedWhatsAppBookingLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const properties = {
      club_id: clubId,
      club_slug: clubSlug,
      club_name: clubName,
      cta_surface: 'contact_whatsapp_booking',
      booking_channel: 'whatsapp',
      booking_status: 'intent_only',
    };

    trackGaEvent('whatsapp_booking_click', properties);
    trackPostHogEvent('whatsapp_booking_click', properties);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      {...props}
      className={cn(className, FOCUS_RING)}
    >
      {children}
    </a>
  );
}
