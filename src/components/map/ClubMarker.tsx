'use client';

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import type { ClubWithRelations } from '@/types/database';
import { formatPriceRange, isClubOpenNow } from '@/lib/utils';

function createClubIcon(isPremium: boolean, isOpen: boolean): L.DivIcon {
  const fill = isPremium ? '#b8860b' : '#7c5cfc';
  const dot = isOpen ? '#16a34a' : '#98a2b3';

  const html = `
    <div style="position: relative; width: 28px; height: 36px;">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 2px 3px rgba(20,22,28,0.25));">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${fill}"/>
        <circle cx="14" cy="14" r="5.5" fill="white"/>
      </svg>
      <span style="
        position:absolute; top:-1px; right:-1px; width:9px; height:9px;
        border-radius:50%; background:${dot}; border:1.5px solid white;
      "></span>
    </div>
  `;

  return L.divIcon({
    className: 'bosyer-marker',
    html,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
}

export function ClubMarker({ club }: { club: ClubWithRelations }) {
  if (club.latitude == null || club.longitude == null) return null;

  const openNow = isClubOpenNow(club.opening_hours);
  const icon = createClubIcon(club.is_premium, openNow);
  const cheapest = [...club.pricing].sort((a, b) => a.price_from - b.price_from)[0];

  return (
    <Marker position={[club.latitude, club.longitude]} icon={icon}>
      <Popup>
        <div className="min-w-[180px]">
          <p className="font-display text-sm font-semibold text-ink">{club.name}</p>
          <p className="mb-1.5 text-xs text-muted">{club.district?.name}</p>
          {cheapest && (
            <p className="mb-2 font-mono text-xs text-ink">
              {formatPriceRange(cheapest.price_from, cheapest.price_to, cheapest.unit)}
            </p>
          )}
          <Link href={`/klub/${club.slug}`} className="text-xs font-medium text-primary hover:underline">
            Ətraflı bax →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
