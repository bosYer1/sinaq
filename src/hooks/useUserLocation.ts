'use client';

import { useCallback, useState } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
}

export type UserLocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

/**
 * Brauzerin Geolocation API-si ilə istifadəçinin təxmini yerini yalnız
 * istifadəçi açıq şəkildə istəyəndə oxuyur. Səhifə açılan kimi permission
 * prompt göstərilmir.
 */
export function useUserLocation(): {
  location: UserLocation | null;
  status: UserLocationStatus;
  requestLocation: () => void;
} {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('idle');

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    if (status === 'loading') return;

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
  }, [status]);

  return { location, status, requestLocation };
}
