import type { ClubWithRelations } from '@/types/database';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isClubOpenNow, isPremiumActive } from '@/lib/utils';

type MapPreviewProps = {
  clubs: ClubWithRelations[];
};

const ZOOM = 10;
const TILE_X_START = 653;
const TILE_Y_START = 385;
const TILE_COLUMNS = 2;
const TILE_ROWS = 2;

const tiles = [
  [653, 385], [654, 385],
  [653, 386], [654, 386],
] as const;

function projectToPreview(latitude: number, longitude: number) {
  const scale = 2 ** ZOOM;
  const worldX = ((longitude + 180) / 360) * scale;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const worldY = ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale;
  const left = ((worldX - TILE_X_START) / TILE_COLUMNS) * 100;
  const top = ((worldY - TILE_Y_START) / TILE_ROWS) * 100;
  return { left, top };
}

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
      style={{ top: `${top}%`, left: `${left}%` }}
      aria-hidden="true"
      data-map-preview-marker="true"
    >
      <span className="relative block h-7 w-6">
        <svg viewBox="0 0 40 40" className="h-7 w-7 overflow-visible">
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
            strokeWidth={premium ? 2.5 : 2.2}
          />
          <circle cx="20" cy="16" r="4" fill="#fff" />
          {open ? <circle cx="30.5" cy="8.5" r="4.5" fill="#16A34A" stroke="#fff" strokeWidth="2" /> : null}
        </svg>
      </span>
    </span>
  );
}

export function MapPreview({ clubs }: MapPreviewProps) {
  const positionedClubs = clubs.flatMap((club) => {
    if (club.latitude == null || club.longitude == null) return [];
    const position = projectToPreview(club.latitude, club.longitude);
    if (position.left < 0 || position.left > 100 || position.top < 0 || position.top > 100) return [];
    const typeSlugs = inferClubTypeSlugs(club);
    return [{
      club,
      ...position,
      hasPC: typeSlugs.includes('pc'),
      hasPlayStation: typeSlugs.includes('playstation'),
      open: club.opening_hours.length > 0 ? isClubOpenNow(club.opening_hours) : false,
      premium: isPremiumActive(club),
    }];
  });

  return (
    <div
      aria-label="Xəritə önizləməsi"
      data-map-preview="current-clubs"
      data-map-preview-marker-count={positionedClubs.length}
      className="gameyer-map-preview relative h-full w-full overflow-hidden rounded-[18px] border border-border bg-surface-alt"
    >
      <div className="gameyer-map-preview-tiles absolute inset-0 grid grid-cols-2 grid-rows-2" aria-hidden="true">
        {tiles.map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png)` }}
          />
        ))}
      </div>

      <div className="gameyer-map-preview-wash absolute inset-0" aria-hidden="true" />

      {positionedClubs.map(({ club, top, left, hasPC, hasPlayStation, open, premium }) => (
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
        Xəritədə {positionedClubs.length} klub
      </div>

      <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/95 text-sm font-semibold text-muted shadow-card backdrop-blur" aria-hidden="true">
        ⌖
      </div>

      <div className="gameyer-map-preview-attribution absolute bottom-1 right-2 rounded px-1.5 py-0.5 text-[9px] shadow-sm" aria-hidden="true">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
