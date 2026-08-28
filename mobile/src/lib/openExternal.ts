import { Alert, Linking } from 'react-native';
import { allowedExternalUrl } from './actions';

export async function openExternalUrl(url: string) {
  try {
    if (!allowedExternalUrl(url)) throw new Error('unsupported');
    // Direct open avoids Android canOpenURL package-visibility false negatives.
    await Linking.openURL(url);
  } catch {
    Alert.alert('Keçid açıla bilmədi', 'Bu əməliyyat cihazda hazırda dəstəklənmir.');
  }
}
