'use client';

import { useEffect, useState } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
}

export type UserLocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

/**
 * Brauzerin Geolocation API-si ilə istifadəçinin təxmini yerini oxuyur.
 * Yalnız klub kartlarında "məsafə" göstərmək üçün istifadə olunur —
 * icazə verilmirsə/dəstəklənmirsə tətbiq sadəcə məsafəni göstərmir,
 * heç bir funksiyanı bloklamır.
 */
export function useUserLocation(): { location: UserLocation | null; status: UserLocationStatus } {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('idle');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus('granted');
      },
      () => {
        setStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return { location, status };
}
