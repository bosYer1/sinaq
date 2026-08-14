'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { ClubWithDistance } from '@/types/database';
import {
  formatPriceRange,
  isClubOpenNow,
} from '@/lib/utils';

interface ClubMarkerProps {
  club: ClubWithDistance;
  isActive?: boolean;
  onSelect?: (id: string) => void;
}

function createClubIcon(
  hasPC: boolean,
  hasPlayStation: boolean,
  isPremium: boolean,
  isOpen: boolean,
  isActive: boolean
): L.DivIcon {
  const size = isActive ? 40 : 34;
  const fill =
    hasPC && hasPlayStation
      ? 'url(#gameyer-dual)'
      : hasPlayStation
        ? '#06AED4'
        : hasPC
          ? '#7C5CFC'
          : '#6B7280';
  const outline = isPremium ? '#B8860B' : '#ffffff';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="gameyer-dual" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7C5CFC" />
          <stop offset="100%" stop-color="#06AED4" />
        </linearGradient>
      </defs>
      ${isActive ? `<circle cx="20" cy="20" r="19" fill="#ffffff" stroke="#14161c" stroke-width="1.5" />` : ''}
      <path d="M20 4C13.4 4 8 9.4 8 16c0 8.6 12 20 12 20s12-11.4 12-20C32 9.4 26.6 4 20 4Z" fill="${fill}" stroke="${outline}" stroke-width="${isPremium ? 2.5 : 2}" />
      <circle cx="20" cy="16" r="4" fill="#ffffff" />
      ${isOpen ? `<circle cx="30.5" cy="8.5" r="4.5" fill="#16A34A" stroke="#ffffff" stroke-width="2" />` : ''}
    </svg>
  `;

  return L.divIcon({
    className: 'bosyer-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function ClubMarker({ club, isActive = false, onSelect }: ClubMarkerProps) {
  if (club.latitude == null || club.longitude == null) return null;

  const hasHours = club.opening_hours.length > 0;
  const openNow = hasHours ? isClubOpenNow(club.opening_hours) : false;
  const statusLabel = !hasHours ? 'İş saatı məlum deyil' : openNow ? 'Açıqdır' : 'Bağlıdır';

  const hasPC = club.pricing.some((pricing) => pricing.club_type.slug === 'pc');
  const hasPlayStation = club.pricing.some((pricing) =>
    ['ps', 'playstation'].includes(pricing.club_type.slug)
  );
  const cheapest = [...club.pricing].sort((a, b) => a.price_from - b.price_from)[0];
  const icon = createClubIcon(hasPC, hasPlayStation, club.is_premium, openNow, isActive);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`;

  return (
    <Marker
      position={[club.latitude, club.longitude]}
      icon={icon}
      zIndexOffset={isActive ? 1000 : 0}
      eventHandlers={{ click: () => onSelect?.(club.id) }}
    >
      <Popup>
        <div className="min-w-[210px]">
          <div className="font-display text-sm font-semibold text-ink">{club.name}</div>
          <div className="mt-1 text-xs text-muted">{club.district?.name ?? 'Rayon göstərilməyib'}</div>
          {club.address ? <div className="mt-0.5 text-xs text-muted">{club.address}</div> : null}

          {club.pricing.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted">
              {club.pricing.map((pricing) => (
                <span key={pricing.id} className="rounded bg-surface-alt px-1.5 py-0.5">
                  {pricing.club_type.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-muted">Klub tipi hələ əlavə edilməyib</div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            {cheapest ? (
              <span className="text-xs font-semibold text-ink">
                {formatPriceRange(cheapest.price_from, cheapest.price_to, cheapest.unit)}
              </span>
            ) : (
              <span className="text-xs text-muted">Qiymət yoxdur</span>
            )}
            <span className={openNow ? 'text-xs font-medium text-live' : 'text-xs text-muted'}>
              {statusLabel}
            </span>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#1A73E8', color: '#ffffff' }}
            className="mt-3 flex h-9 w-full items-center justify-center rounded-control px-3 text-xs font-semibold no-underline transition hover:opacity-90"
          >
            Google Maps-də marşrut
          </a>
        </div>
      </Popup>
    </Marker>
  );
}
