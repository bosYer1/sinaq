import * as Location from 'expo-location';
import { LOCATION_MESSAGES, requestPosition } from './location';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 }, requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(), watchPositionAsync: jest.fn(),
}));
const permission = jest.mocked(Location.requestForegroundPermissionsAsync);
const services = jest.mocked(Location.hasServicesEnabledAsync);
const watch = jest.mocked(Location.watchPositionAsync);
beforeEach(() => {
  jest.clearAllMocks();
  permission.mockResolvedValue({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' } as Location.LocationPermissionResponse);
  services.mockResolvedValue(true);
});
test.each([true, false])('denied permission never starts location subscription (canAskAgain=%s)', async (canAskAgain) => {
  permission.mockResolvedValue({ granted: false, canAskAgain } as Location.LocationPermissionResponse);
  const result = await requestPosition(new AbortController().signal);
  expect(result.status).toBe(canAskAgain ? 'denied' : 'blocked');
  expect(LOCATION_MESSAGES[canAskAgain ? 'denied' : 'blocked']).toContain('icazə');
  expect(watch).not.toHaveBeenCalled();
});
test('disabled GPS is explicit, with no watcher', async () => {
  services.mockResolvedValue(false);
  expect(await requestPosition(new AbortController().signal)).toEqual({ status: 'disabled' });
  expect(watch).not.toHaveBeenCalled();
});
test('aborted permission request cannot start a watcher later', async () => {
  const controller = new AbortController();
  const result = requestPosition(controller.signal);
  controller.abort();
  expect(await result).toEqual({ status: 'cancelled' });
  expect(watch).not.toHaveBeenCalled();
});
test('first fix removes even a late subscription and retains only coordinates', async () => {
  const remove = jest.fn();
  watch.mockImplementation(async (_, callback) => {
    callback({ coords: { latitude: 40.4, longitude: 49.8, altitude: 20 } } as Location.LocationObject);
    return { remove };
  });
  expect(await requestPosition(new AbortController().signal)).toEqual({ status: 'ready', position: { latitude: 40.4, longitude: 49.8 } });
  expect(remove).toHaveBeenCalledTimes(1);
});
test('timeout removes watcher; raw native error is not exposed', async () => {
  jest.useFakeTimers();
  const remove = jest.fn();
  watch.mockResolvedValue({ remove });
  const result = requestPosition(new AbortController().signal);
  await jest.advanceTimersByTimeAsync(15_000);
  expect(await result).toEqual({ status: 'error' });
  expect(remove).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
test('native exception becomes a generic result', async () => {
  permission.mockRejectedValue(new Error('private native diagnostic'));
  expect(await requestPosition(new AbortController().signal)).toEqual({ status: 'error' });
});

test('abort removes a subscription that resolves after leaving the screen', async () => {
  const remove = jest.fn();
  let resolveSubscription!: (value: Location.LocationSubscription) => void;
  watch.mockImplementation(() => new Promise((resolve) => { resolveSubscription = resolve; }));
  const controller = new AbortController();
  const result = requestPosition(controller.signal);
  await Promise.resolve();
  await Promise.resolve();
  controller.abort();
  resolveSubscription({ remove });
  expect(await result).toEqual({ status: 'cancelled' });
  expect(remove).toHaveBeenCalledTimes(1);
});
