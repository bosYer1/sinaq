import * as Location from 'expo-location';
import { validPosition, type Position } from './distance';

export type LocationResult =
  | { status: 'ready'; position: Position }
  | { status: 'denied' | 'blocked' | 'disabled' | 'error' | 'cancelled' };

// One foreground fix only: subscription is removed on fix, timeout, error or abort.
// No storage, analytics, background task or database calls.
export async function requestPosition(signal: AbortSignal): Promise<LocationResult> {
  try {
    if (signal.aborted) return { status: 'cancelled' };
    const permission = await Location.requestForegroundPermissionsAsync();
    if (signal.aborted) return { status: 'cancelled' };
    if (!permission.granted) return { status: permission.canAskAgain ? 'denied' : 'blocked' };
    if (!(await Location.hasServicesEnabledAsync())) return { status: 'disabled' };
    if (signal.aborted) return { status: 'cancelled' };
    return await new Promise<LocationResult>((resolve) => {
      let subscription: Location.LocationSubscription | undefined;
      let settled = false;
      const finish = (result: LocationResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        subscription?.remove();
        resolve(result);
      };
      const abort = () => finish({ status: 'cancelled' });
      const timer = setTimeout(() => finish({ status: 'error' }), 15_000);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) { abort(); return; }
      void Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced }, (location) => {
        if (!validPosition(location.coords)) { finish({ status: 'error' }); return; }
        finish({ status: 'ready', position: { latitude: location.coords.latitude, longitude: location.coords.longitude } });
      }, () => finish({ status: 'error' })).then((value) => {
        if (settled) value.remove();
        else subscription = value;
      }).catch(() => finish({ status: 'error' }));
    });
  } catch {
    return { status: signal.aborted ? 'cancelled' : 'error' };
  }
}

export const LOCATION_MESSAGES = {
  idle: 'Mövqeyinizi yalnız yaxın klubları sıralamaq üçün istifadə edin. Cihazdan serverimizə göndərilmir.',
  loading: 'Mövqe müəyyənləşdirilir…',
  denied: 'Mövqe icazəsi verilmədi. Yenidən cəhd edə və ya Kəşf et bölməsindən istifadə edə bilərsiniz.',
  blocked: 'Mövqe icazəsini cihaz ayarlarından aktivləşdirin, sonra yenidən cəhd edin.',
  disabled: 'Cihazın mövqe xidməti sönülüdür. Onu aktivləşdirib yenidən cəhd edin.',
  error: 'Mövqe alınmadı və ya vaxt limiti bitdi. Açıq sahədə yenidən cəhd edin.',
  ready: 'Təxmini düz xətt məsafəsi göstərilir, yol məsafəsi deyil. Yeniləmək üçün düyməyə toxunun.',
};
