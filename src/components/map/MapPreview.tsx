'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ClubWithRelations } from '@/types/database';
import { inferClubTypeSlugs } from '@/lib/clubType';
import {
  MAP_TILE_SIZE,
  getMapViewport,
  getMappableCoordinates,
  getOsmTileUrl,
  projectMapCoordinate,
} from '@/lib/mapViewport';
import { isClubOpenNow, isPremiumActive } from '@/lib/utils';

type MapPreviewProps = {
  clubs: ClubWithRelations[];
};

type PreviewSize = {
  width: number;
  height: number;
};

const INITIAL_PREVIEW_SIZE: PreviewSize = { width: 390, height: 340 };

function PreviewMarker({
  id,
  top,
  left,
  hasPC,
  hasPlayStation,
  open,
  premium,
}: {
  id: string;
  top: number;
  left: number;
  hasPC: boolean;
  hasPlayStation: boolean;
  open: boolean;
  premium: boolean;
}) {
  const gradientId = `preview-dual-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const fill = hasPC && hasPlayStation
    ? `url(#${gradientId})`
    : hasPlayStation
      ? '#06AED4'
      : hasPC
        ? '#7C5CFC'
        : '#6B7280';

  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]"
      style={{ top, left }}
      aria-hidden="true"
      data-map-preview-marker="true"
    >
      <svg viewBox="0 0 40 40" className="h-[34px] w-[34px] overflow-visible">
        {hasPC && hasPlayStation ? (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7C5CFC" />
              <stop offset="100%" stopColor="#06AED4" />
            </linearGradient>
          </defs>
        ) : null}
        <path
          d="M20 4C13.4 4 8 9.4 8 16c0 8.6 12 20 12 20s12-11.4 12-20C32 9.4 26.6 4 20 4Z"
          fill={fill}
          stroke={premium ? '#B8860B' : '#fff'}
          strokeWidth={premium ? 2.5 : 2}
        />
        <circle cx="20" cy="16" r="4" fill="#fff" />
        {open ? <circle cx="30.5" cy="8.5" r="4.5" fill="#16A34A" stroke="#fff" strokeWidth="2" /> : null}
      </svg>
    </span>
  );
}

export function MapPreview({ clubs }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<PreviewSize>(INITIAL_PREVIEW_SIZE);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setSize((current) => (
        Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5
          ? current
          : { width: rect.width, height: rect.height }
      ));
    };

    syncSize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncSize) : null;
    observer?.observe(container);
    return () => observer?.disconnect();
  }, []);

  const layout = useMemo(() => {
    const coordinates = getMappableCoordinates(clubs);
    const viewport = getMapViewport(coordinates, size.width, size.height);
    const centerPoint = projectMapCoordinate(viewport.center[0], viewport.center[1], viewport.zoom);
    const originX = centerPoint.x - (size.width / 2);
    const originY = centerPoint.y - (size.height / 2);
    const firstTileX = Math.floor(originX / MAP_TILE_SIZE);
    const lastTileX = Math.floor((originX + size.width) / MAP_TILE_SIZE);
    const firstTileY = Math.floor(originY / MAP_TILE_SIZE);
    const lastTileY = Math.floor((originY + size.height) / MAP_TILE_SIZE);
    const tiles: Array<{ x: number; y: number; left: number; top: number }> = [];

    for (let y = firstTileY; y <= lastTileY; y += 1) {
      for (let x = firstTileX; x <= lastTileX; x += 1) {
        tiles.push({
          x,
          y,
          left: (x * MAP_TILE_SIZE) - originX,
          top: (y * MAP_TILE_SIZE) - originY,
        });
      }
    }

    const markers = clubs.flatMap((club) => {
      if (club.latitude == null || club.longitude == null) return [];
      const point = projectMapCoordinate(club.latitude, club.longitude, viewport.zoom);
      const typeSlugs = inferClubTypeSlugs(club);
      return [{
        club,
        left: point.x - originX,
        top: point.y - originY,
        hasPC: typeSlugs.includes('pc'),
        hasPlayStation: typeSlugs.includes('playstation'),
        open: club.opening_hours.length > 0 ? isClubOpenNow(club.opening_hours) : false,
        premium: isPremiumActive(club),
      }];
    });

    return { viewport, tiles, markers, coordinateCount: coordinates.length };
  }, [clubs, size.height, size.width]);

  return (
    <div
      ref={containerRef}
      aria-label="Xəritə önizləməsi"
      data-map-preview="current-clubs"
      data-map-preview-marker-count={layout.coordinateCount}
      data-map-preview-zoom={layout.viewport.zoom}
      className="gameyer-map-preview relative h-full w-full overflow-hidden rounded-[18px] border border-border bg-surface-alt"
    >
      <div className="gameyer-map-preview-tiles absolute inset-0" aria-hidden="true">
        {layout.tiles.map(({ x, y, left, top }) => (
          <img
            key={`${layout.viewport.zoom}-${x}-${y}`}
            src={getOsmTileUrl(layout.viewport.zoom, x, y)}
            alt=""
            width={MAP_TILE_SIZE}
            height={MAP_TILE_SIZE}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="absolute max-w-none"
            style={{ width: MAP_TILE_SIZE, height: MAP_TILE_SIZE, left, top }}
          />
        ))}
      </div>

      <div className="gameyer-map-preview-wash absolute inset-0" aria-hidden="true" />

      {layout.markers.map(({ club, top, left, hasPC, hasPlayStation, open, premium }) => (
        <PreviewMarker
          key={club.id}
          id={club.id}
          top={top}
          left={left}
          hasPC={hasPC}
          hasPlayStation={hasPlayStation}
          open={open}
          premium={premium}
        />
      ))}

      <div className="absolute left-3 top-3 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-ink shadow-card backdrop-blur">
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-live" aria-hidden="true" />
        Xəritədə {clubs.length} klub
      </div>

      <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/95 text-sm font-semibold text-ink shadow-card backdrop-blur" aria-hidden="true">
        ⌖
      </div>

      <div className="gameyer-map-preview-attribution absolute bottom-0 right-0 bg-white/80 px-1 text-[9px] leading-4 text-[#333]" aria-hidden="true">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
