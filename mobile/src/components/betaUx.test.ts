import { createElement } from 'react';
import NearbyScreen from '@/app/(tabs)/nearby';
import MapScreen from '@/app/(tabs)/map';
import { FilterBar } from './FilterBar';
import { ThemeProvider } from '@/context/ThemeContext';
import { requestPosition } from '@/lib/location';
const { act, create } = jest.requireActual('react-test-renderer');
// Native renderer cold initialization on Windows is not a device-performance test.
jest.setTimeout(15_000);
jest.mock('@expo/vector-icons/Ionicons', () => jest.requireActual('react-native').View);
const mockClubMap = jest.fn((_props?: unknown) => null);
jest.mock('@/components/ClubMap', () => ({ ClubMap: (props: unknown) => mockClubMap(props) }));
jest.mock('@/lib/features', () => ({ isNativeMapConfigured: () => false }));

const mockData = {
  filteredClubs: [], clubs: [], loading: false, error: null, reload: jest.fn(),
  filters: { query: 'Bakı', type: 'pc', district: null, verifiedOnly: false },
  clearFilters: jest.fn(), setFilters: jest.fn(), districts: [], types: [],
};
jest.mock('@/context/ClubDataContext', () => ({ useClubData: () => mockData }));
jest.mock('@/lib/location', () => ({
  ...jest.requireActual('@/lib/location'), requestPosition: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void)) => jest.requireActual('react').useEffect(callback, [callback]),
}));

let tree: ReturnType<typeof create>;
beforeEach(() => jest.useFakeTimers());
afterEach(async () => { if (tree) await act(async () => tree.unmount()); jest.clearAllMocks(); jest.useRealTimers(); });

test('Nearby never asks permission on mount; denied action shows recovery text', async () => {
  jest.mocked(requestPosition).mockResolvedValue({ status: 'denied' });
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(NearbyScreen))); });
  expect(requestPosition).not.toHaveBeenCalled();
  const locate = tree.root.findAll((node: { props: { accessibilityState?: { busy: boolean }; onPress?: unknown } }) => node.props.accessibilityState?.busy === false && typeof node.props.onPress === 'function')[0];
  await act(async () => locate.props.onPress());
  expect(requestPosition).toHaveBeenCalledTimes(1);
  expect(tree.root.findAll((node: { props: { children?: unknown } }) => typeof node.props.children === 'string' && node.props.children.includes('Mövqe icazəsi verilmədi')).length).toBeGreaterThan(0);
});

test('leaving Nearby aborts an in-flight request', async () => {
  jest.mocked(requestPosition).mockImplementation(() => new Promise(() => {}));
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(NearbyScreen))); });
  const locate = tree.root.findAll((node: { props: { accessibilityState?: { busy: boolean }; onPress?: unknown } }) => node.props.accessibilityState?.busy === false && typeof node.props.onPress === 'function')[0];
  await act(async () => locate.props.onPress());
  const signal = jest.mocked(requestPosition).mock.calls[0][0];
  await act(async () => tree.unmount());
  expect(signal.aborted).toBe(true);
});

test('active filters have a visible reset outside and invoke the shared reset', async () => {
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(FilterBar))); });
  const reset = tree.root.findAll((node: { props: { onPress?: unknown } }) => node.props.onPress === mockData.clearFilters)[0];
  expect(reset).toBeTruthy();
  await act(async () => reset.props.onPress());
  expect(mockData.clearFilters).toHaveBeenCalledTimes(1);
});

test('keyless preview build shows the map beta fallback without mounting native map', async () => {
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(MapScreen))); });
  expect(tree.root.findAll((node: { props: { children?: unknown } }) => node.props.children === 'Xəritə hazırda beta mərhələsindədir.').length).toBeGreaterThan(0);
  expect(mockClubMap).not.toHaveBeenCalled();
});
