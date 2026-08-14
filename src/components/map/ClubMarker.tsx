'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { ClubWithDistance } from '@/types/database';
import { isClubOpenNow, formatPriceRange } from '@/lib/utils';

interface ClubMarkerProps {
  club: ClubWithDistance;
  isActive?: boolean;
  onSelect?: (id: string) => void;
}

function createClubIcon(
  isPremium: boolean,
  isOpen: boolean,
  isActive: boolean
): L.DivIcon {
  const background = isPremium ? '#B8860B' : '#7C5CFC';
  const size = isActive ? 38 : 32;
  const border = isActive || isOpen ? '#16A34A' : '#ffffff';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${background};
        border:3px solid ${border};
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        font-size:12px;
        color:white;
        font-weight:700;
      ">PC</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function ClubMarker({
  club,
  isActive = false,
  onSelect,
}: ClubMarkerProps) {
  const openNow = isClubOpenNow(club.opening_hours);

  const cheapest = [...club.pricing].sort(
    (a, b) => a.price_from - b.price_from
  )[0];

  if (club.latitude == null || club.longitude == null) {
    return null;
  }

  const icon = createClubIcon(
    club.is_premium,
    openNow,
    isActive
  );

  return (
    <Marker
      position={[club.latitude, club.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => {
          onSelect?.(club.id);
        },
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <div className="font-semibold">{club.name}</div>

          {club.district ? (
            <div className="mt-1 text-sm">
              {club.district.name}
            </div>
          ) : null}

          <div className="mt-2 flex gap-2 text-xs">
            {club.pricing.map((pricing) => (
              <span key={pricing.id}>
                {pricing.club_type.name}
              </span>
            ))}
          </div>

          {cheapest ? (
            <div className="mt-2 font-medium">
              {formatPriceRange(
                cheapest.price_from,
                cheapest.price_to,
                cheapest.unit
              )}
            </div>
          ) : null}

          {openNow ? (
            <div className="mt-1 text-xs">Açıqdır</div>
          ) : null}
        </div>
      </Popup>
    </Marker>
  );
}
