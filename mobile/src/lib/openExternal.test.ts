import { Alert, Linking, Share } from 'react-native';
import { openExternalUrl, shareClub } from './openExternal';

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

test('unsupported external handler shows a generic alert', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('native diagnostic'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await openExternalUrl('tel:+994501234567');
  expect(alert).toHaveBeenCalledWith('Keçid açıla bilmədi', 'Bu əməliyyat cihazda hazırda dəstəklənmir.');
});
test('unsafe URLs never reach native Linking', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await openExternalUrl('https://gameyer.az/admin');
  expect(open).not.toHaveBeenCalled();
});
test('valid links open without Android package-visibility preflight', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
  await openExternalUrl('https://www.instagram.com/gameyer.az/');
  expect(open).toHaveBeenCalledTimes(1);
  expect(canOpen).not.toHaveBeenCalled();
});

test('shares only a fixed public club URL and hides native failures', async () => {
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
  await shareClub('Arena Gaming', 'arena-gaming');
  expect(share).toHaveBeenCalledWith(expect.objectContaining({
    message: expect.stringContaining('https://gameyer.az/klub/arena-gaming'),
  }));

  share.mockRejectedValueOnce(new Error('private native diagnostic'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await shareClub('Arena Gaming', 'arena-gaming');
  expect(alert).toHaveBeenCalledWith('Əməliyyat mümkün olmadı', 'Bu əməliyyat cihazda hazırda dəstəklənmir.');
});
