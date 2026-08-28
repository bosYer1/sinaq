import { Image, type ImageStyle } from 'expo-image';
import { memo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp } from 'react-native';
import type { ColorPalette } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

type Props = {
  uri: string | null;
  name: string;
  style: StyleProp<ImageStyle>;
  priority?: 'low' | 'normal' | 'high';
};

export const ClubImage = memo(function ClubImage({ uri, name, style, priority = 'normal' }: Props) {
  const styles = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return <View style={[style, styles.placeholder]} accessibilityLabel={`${name} üçün şəkil yoxdur`}><Text style={styles.placeholderText}>Şəkil yoxdur</Text></View>;
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="cover"
      transition={180}
      cachePolicy="memory-disk"
      priority={priority}
      onError={() => setFailed(true)}
      accessibilityLabel={`${name} klub şəkli`}
    />
  );
});

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryTint },
  placeholderText: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 8 },
});
