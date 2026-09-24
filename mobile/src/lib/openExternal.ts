import { Alert, Linking, Share } from 'react-native';
import { allowedExternalUrl, clubSharePayload } from './actions';

const showActionError = () => Alert.alert('Əməliyyat mümkün olmadı', 'Bu əməliyyat cihazda hazırda dəstəklənmir.');

export async function openExternalUrl(url: string) {
  try {
    if (!allowedExternalUrl(url)) throw new Error('unsupported');
    // Direct open avoids Android canOpenURL package-visibility false negatives.
    await Linking.openURL(url);
  } catch {
    Alert.alert('Keçid açıla bilmədi', 'Bu əməliyyat cihazda hazırda dəstəklənmir.');
  }
}

export async function shareClub(name: string, slug: string) {
  try {
    const payload = clubSharePayload(name, slug);
    if (!payload) throw new Error('unsupported');
    await Share.share(payload);
  } catch {
    showActionError();
  }
}
