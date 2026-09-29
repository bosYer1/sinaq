import { createElement } from 'react';
import { ClubMap, mapClubSetKey, mapReadyCompletesLoading } from './ClubMap';
import { ThemeProvider } from '@/context/ThemeContext';
import { ScreenState } from './ScreenState';
import type { MappableClub } from '@/types/club';

const { act, create } = jest.requireActual('react-test-renderer');
const mockCamera = { fitToCoordinates: jest.fn(), setCamera: jest.fn(), animateCamera: jest.fn(), animateToRegion: jest.fn() };

jest.mock('react-native-maps', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    PROVIDER_GOOGLE: 'google',
    default: React.forwardRef(function MockMap(props: object, ref: unknown) {
      React.useImperativeHandle(ref, () => mockCamera);
      return React.createElement(View, { ...props, testID: 'native-map' });
    }),
    Marker: View,
  };
});

// Synthetic unit-test fixtures only; never used by app queries.
const clubs = [
  { id: 'a', name: 'A', latitude: 40.4, longitude: 49.8 },
  { id: 'b', name: 'B', latitude: 40.5, longitude: 49.9 },
] as MappableClub[];

let tree: ReturnType<typeof create>;
const clear = jest.fn();
beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  await act(async () => {
    tree = create(createElement(ThemeProvider, null, createElement(ClubMap, {
      clubs, selectedClubId: null, onSelectClub: jest.fn(), onClearSelection: clear,
    })));
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
  jest.useRealTimers();
});
const nativeMap = () => tree.root.findByProps({ testID: 'native-map' });

test('starts in Baku and waits for positive layout AND native readiness before fitting', async () => {
  expect(nativeMap().props.initialRegion.longitude).toBe(49.8671);
  expect(nativeMap().props.provider).toBe(jest.requireActual('react-native').Platform.OS === 'android' ? 'google' : undefined);
  await act(async () => nativeMap().props.onMapReady());
  expect(mockCamera.fitToCoordinates).not.toHaveBeenCalled();
  await act(async () => nativeMap().props.onLayout({ nativeEvent: { layout: { width: 0, height: 0 } } }));
  expect(mockCamera.fitToCoordinates).not.toHaveBeenCalled();
  await act(async () => nativeMap().props.onLayout({ nativeEvent: { layout: { width: 320, height: 480 } } }));
  expect(mockCamera.fitToCoordinates).toHaveBeenCalledTimes(1);
});

test('does not clear marker selection when marker-press bubbles to map', () => {
  nativeMap().props.onPress({ nativeEvent: { action: 'marker-press' } });
  expect(clear).not.toHaveBeenCalled();
  nativeMap().props.onPress({ nativeEvent: { action: 'press' } });
  expect(clear).toHaveBeenCalledTimes(1);
});

test('times out missing map tiles and retry creates a fresh native map', async () => {
  await act(async () => jest.advanceTimersByTime(15_000));
  expect(tree.root.findByType(ScreenState).props.title).toBe('Xəritə yüklənmədi');
  await act(async () => tree.root.findByType(ScreenState).props.onAction());
  expect(nativeMap()).toBeTruthy();
  expect(clear).toHaveBeenCalledTimes(1);
});

test('loaded map cancels its timeout', async () => {
  await act(async () => nativeMap().props.onMapLoaded());
  await act(async () => jest.advanceTimersByTime(15_000));
  expect(tree.root.findAllByType(ScreenState)).toHaveLength(0);
});

test('treats iOS MapKit readiness as loaded but keeps Android tile confirmation separate', () => {
  expect(mapReadyCompletesLoading('ios')).toBe(true);
  expect(mapReadyCompletesLoading('android')).toBe(false);
});

test('map dataset identity changes when a club coordinate changes', () => {
  expect(mapClubSetKey(clubs)).toBe(mapClubSetKey([...clubs].reverse()));
  expect(mapClubSetKey(clubs)).not.toBe(mapClubSetKey([{ ...clubs[0], latitude: 40.6 }, clubs[1]]));
});
