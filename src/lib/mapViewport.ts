export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_SIZE = 256;
export const MAP_DEFAULT_CENTER = [40.4093, 49.8671] as const;
export const MAP_DEFAULT_ZOOM = 12;
export const MAP_SINGLE_CLUB_ZOOM = 14;
export const MAP_FIT_PADDING = 36;
export const MAP_MAX_FIT_ZOOM = 14;

export type MapCoordinate = readonly [latitude: number, longitude: number];

export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type MapViewport = {
  center: MapCoordinate;
  zoom: number;
};

export function getMappableCoordinates<T extends { latitude: number | null; longitude: number | null }>(items: T[]) {
  return items.flatMap((item): MapCoordinate[] => (
    item.latitude == null || item.longitude == null
      ? []
      : [[item.latitude, item.longitude]]
  ));
}

export function getCoordinateBounds(coordinates: MapCoordinate[]): MapBounds | null {
  if (coordinates.length === 0) return null;

  let south = coordinates[0][0];
  let north = coordinates[0][0];
  let west = coordinates[0][1];
  let east = coordinates[0][1];

  for (const [latitude, longitude] of coordinates.slice(1)) {
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
  }

  return { south, west, north, east };
}

function clampLatitude(latitude: number) {
  return Math.max(-85.0511287798, Math.min(85.0511287798, latitude));
}

export function projectMapCoordinate(latitude: number, longitude: number, zoom: number) {
  const sin = Math.sin((clampLatitude(latitude) * Math.PI) / 180);
  const scale = MAP_TILE_SIZE * (2 ** zoom);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export function unprojectMapPoint(x: number, y: number, zoom: number): MapCoordinate {
  const scale = MAP_TILE_SIZE * (2 ** zoom);
  const longitude = (x / scale) * 360 - 180;
  const normalizedY = 0.5 - (y / scale);
  const latitude = (90 - (360 * Math.atan(Math.exp(-normalizedY * 2 * Math.PI))) / Math.PI);
  return [latitude, longitude];
}

export function getMapViewport(
  coordinates: MapCoordinate[],
  width: number,
  height: number,
): MapViewport {
  if (coordinates.length === 0) {
    return { center: MAP_DEFAULT_CENTER, zoom: MAP_DEFAULT_ZOOM };
  }

  if (coordinates.length === 1) {
    return { center: coordinates[0], zoom: MAP_SINGLE_CLUB_ZOOM };
  }

  const bounds = getCoordinateBounds(coordinates)!;
  const northWest = projectMapCoordinate(bounds.north, bounds.west, 0);
  const southEast = projectMapCoordinate(bounds.south, bounds.east, 0);
  const boundsWidth = Math.max(Math.abs(southEast.x - northWest.x), Number.EPSILON);
  const boundsHeight = Math.max(Math.abs(southEast.y - northWest.y), Number.EPSILON);
  const availableWidth = Math.max(1, width - (MAP_FIT_PADDING * 2));
  const availableHeight = Math.max(1, height - (MAP_FIT_PADDING * 2));
  const scale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);
  const zoom = Math.max(0, Math.min(MAP_MAX_FIT_ZOOM, Math.floor(Math.log2(scale))));
  const centerX = (northWest.x + southEast.x) / 2;
  const centerY = (northWest.y + southEast.y) / 2;

  return {
    center: unprojectMapPoint(centerX, centerY, 0),
    zoom,
  };
}

export function getOsmTileUrl(zoom: number, x: number, y: number) {
  return MAP_TILE_URL
    .replace('{z}', String(zoom))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
}
