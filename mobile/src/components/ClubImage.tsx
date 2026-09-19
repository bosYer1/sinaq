import { Image, type ImageStyle } from 'expo-image';
import { memo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp } from 'react-native';
import type { ColorPalette } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { normalizeRemoteImageUrl } from '@/lib/clubs';

type Props = {
  uri: string | null;
  name: string;
  style: StyleProp<ImageStyle>;
  priority?: 'low' | 'normal' | 'high';
};

export const ClubImage = memo(function ClubImage({ uri, name, style, priority = 'normal' }: Props) {
  const styles = useThemedStyles(createStyles);
  const normalizedUri = normalizeRemoteImageUrl(uri);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  if (!normalizedUri || failedUri === normalizedUri) {
    return <View style={[style, styles.placeholder]} accessibilityLabel={`${name} üçün şəkil yoxdur`}><Text style={styles.placeholderText}>Şəkil yoxdur</Text></View>;
  }
  return (
    <Image
      source={{ uri: normalizedUri }}
      recyclingKey={normalizedUri}
      style={style}
      contentFit="cover"
      transition={180}
      cachePolicy="memory-disk"
      priority={priority}
      onError={() => setFailedUri(normalizedUri)}
      accessibilityLabel={`${name} klub şəkli`}
    />
  );
});

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryTint },
  placeholderText: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 8 },
});
