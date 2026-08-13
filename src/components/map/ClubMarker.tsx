'use client';

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import type { ClubWithDistance } from '@/types/database';
import { formatPriceRange, isClubOpenNow } from '@/lib/utils';
import { formatDistance } from '@/lib/geo';

/**
 * Leaflet-in default marker ikonu Next.js bundler-i ilə düzgün yüklənmir
 * (ikon path-ləri webpack tərəfindən pozulur), ona görə divIcon ilə
 * özümüzün custom, brendə uyğun marker-ini qururuq.
 */
function createClubIcon(isPremium: boolean, isOpen: boolean, isActive: boolean): L.DivIcon {
  const bg = isPremium ? '#f2a93b' : '#5b4fe9';
  const ring = isActive ? '#17c3b2' : isOpen ? '#17c3b2' : 'transparent';
  const size = isActive ? 38 : 30;

  return L.divIcon({
    className: 'bosyer-marker',
    html: `
      <div style="
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${bg}; border: ${isActive ? 3 : 2.5}px solid ${ring};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(20,22,28,0.35);
        font-size: ${isActive ? 16 : 14}px;
        transition: width 0.15s ease, height 0.15s ease;
      ">🎮</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

interface ClubMarkerProps {
  club: ClubWithDistance;
  isActive?: boolean;
  onSelect?: (id: string) => void;
}

export function ClubMarker({ club, isActive, onSelect }: ClubMarkerProps) {
  if (club.latitude == null || club.longitude == null) return null;

  const openNow = isClubOpenNow(club.opening_hours);
  const icon = createClubIcon(club.is_premium, openNow, Boolean(isActive));
  const cheapest = [...club.pricing].sort((a, b) => a.price_from - b.price_from)[0];

  return (
    <Marker
      position={[club.latitude, club.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect?.(club.id),
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <p className="font-display text-sm font-semibold text-ink">{club.name}</p>
          <p className="mb-1.5 text-xs text-muted">
            {club.district?.name}
            {club.distanceKm != null && <span> · {formatDistance(club.distanceKm)}</span>}
          </p>
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
