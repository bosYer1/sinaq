import { createElement } from 'react';
import NearbyScreen from '@/app/(tabs)/nearby';
import MapScreen from '@/app/(tabs)/map';
import { FilterBar } from './FilterBar';
import { ClubImage } from './ClubImage';
import { ThemeProvider } from '@/context/ThemeContext';
import { requestPosition } from '@/lib/location';
import type { Club } from '@/types/club';
const { act, create } = jest.requireActual('react-test-renderer');
// Native renderer cold initialization on Windows is not a device-performance test.
jest.setTimeout(15_000);
jest.mock('@expo/vector-icons/Ionicons', () => jest.requireActual('react-native').View);
const mockClubMap = jest.fn((_props?: unknown) => null);
jest.mock('@/components/ClubMap', () => ({ ClubMap: (props: unknown) => mockClubMap(props) }));
let mockNativeMapConfigured = false;
jest.mock('@/lib/features', () => ({ isNativeMapConfigured: () => mockNativeMapConfigured }));

let mockLatestFocusEffect: (() => void | (() => void)) | null = null;

const mockData = {
  filteredClubs: [] as Club[], clubs: [] as Club[], loading: false, error: null, reload: jest.fn(),
  filters: { query: 'Bakı', type: 'pc', district: null, verifiedOnly: false },
  clearFilters: jest.fn(), setFilters: jest.fn(), districts: [], types: [],
};
jest.mock('@/context/ClubDataContext', () => ({ useClubData: () => mockData }));
jest.mock('@/lib/location', () => ({
  ...jest.requireActual('@/lib/location'), requestPosition: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockLatestFocusEffect = callback;
    return jest.requireActual('react').useEffect(callback, [callback]);
  },
}));

let tree: ReturnType<typeof create>;
beforeEach(() => {
  jest.useFakeTimers();
  mockNativeMapConfigured = false;
  mockLatestFocusEffect = null;
  mockData.filteredClubs = [];
  mockData.clubs = [];
});
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

test('search commits a trimmed Unicode query when editing ends', async () => {
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(FilterBar))); });
  const TextInput = jest.requireActual('react-native').TextInput;
  await act(async () => tree.root.findByType(TextInput).props.onEndEditing({ nativeEvent: { text: '  Əla   Arena  ' } }));
  expect(mockData.setFilters).toHaveBeenCalledWith({ query: 'Əla Arena' });
});

test('Nearby keeps the last local result after a transient refresh failure', async () => {
  const club = {
    id: 'nearby', name: 'Yaxın klub', slug: 'yaxin-klub', description: null, address: 'Bakı',
    latitude: 40.4, longitude: 49.8, phone: null, instagram_url: 'https://instagram.com/yaxin',
    profile_image_url: null, is_active: true, is_premium: false, premium_expires_at: null,
    is_verified: false, verified_at: null, updated_at: '2026-09-02', district: null,
    type_assignments: [{ club_type: { id: 'pc', name: 'PC', slug: 'pc' } }],
    pricing: [], images: [], opening_hours: [],
  } satisfies Club;
  mockData.filteredClubs = [club];
  mockData.clubs = [club];
  jest.mocked(requestPosition)
    .mockResolvedValueOnce({ status: 'ready', position: { latitude: 40.41, longitude: 49.81 } })
    .mockResolvedValueOnce({ status: 'error' });
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(NearbyScreen))); });
  const locateButton = () => tree.root.findAll((node: { props: { accessibilityState?: { busy: boolean }; onPress?: unknown } }) => node.props.accessibilityState?.busy === false && typeof node.props.onPress === 'function')[0];
  await act(async () => locateButton().props.onPress());
  expect(tree.root.findAll((node: { props: { children?: unknown } }) => node.props.children === club.name).length).toBeGreaterThan(0);
  await act(async () => locateButton().props.onPress());
  expect(tree.root.findAll((node: { props: { children?: unknown } }) => node.props.children === club.name).length).toBeGreaterThan(0);
});

test('ClubImage rejects unsafe URLs before they reach the native image view', async () => {
  await act(async () => {
    tree = create(createElement(ThemeProvider, null, createElement(ClubImage, {
      uri: 'javascript:alert(1)', name: 'Arena', style: { width: 100, height: 100 },
    })));
  });
  const Text = jest.requireActual('react-native').Text;
  expect(tree.root.findAllByType(Text).filter((node: { props: { children?: unknown } }) => node.props.children === 'Şəkil yoxdur')).toHaveLength(1);
});

test('Map preserves the selected club when it regains focus after detail navigation', async () => {
  const club = {
    id: 'club', name: 'Arena Gaming', slug: 'arena-gaming', description: null, address: 'Bakı',
    latitude: 40.4, longitude: 49.8, phone: null, instagram_url: 'https://instagram.com/arena',
    profile_image_url: null, is_active: true, is_premium: false, premium_expires_at: null,
    is_verified: true, verified_at: null, updated_at: '2026-09-02', district: null,
    type_assignments: [{ club_type: { id: 'pc', name: 'PC', slug: 'pc' } }],
    pricing: [], images: [], opening_hours: [],
  } satisfies Club;
  mockNativeMapConfigured = true;
  mockData.filteredClubs = [club];
  mockData.clubs = [club];
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(MapScreen))); });
  const mapProps = mockClubMap.mock.calls.at(-1)?.[0] as { onSelectClub: (selected: Club) => void };
  await act(async () => mapProps.onSelectClub(club));
  expect(tree.root.findAll((node: { props: { children?: unknown } }) => node.props.children === club.name).length).toBeGreaterThan(0);
  await act(async () => { mockLatestFocusEffect?.(); });
  expect(tree.root.findAll((node: { props: { children?: unknown } }) => node.props.children === club.name).length).toBeGreaterThan(0);
});
