'use client';

import { useCallback, useState } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
}

export type UserLocationStatus =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unsupported';

/**
 * Brauzerin Geolocation API-si ilə istifadəçinin təxmini yerini yalnız
 * istifadəçi açıq şəkildə istəyəndə oxuyur. Səhifə açılan kimi permission
 * prompt göstərilmir.
 */
export function useUserLocation(): {
  location: UserLocation | null;
  status: UserLocationStatus;
  requestLocation: () => Promise<UserLocation | null>;
} {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('idle');

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return Promise.resolve(null);
    }

    if (status === 'loading') return Promise.resolve(null);

    setStatus('loading');
    return new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(nextLocation);
          setStatus('granted');
          resolve(nextLocation);
        },
        (error) => {
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }, [status]);

  return { location, status, requestLocation };
}
