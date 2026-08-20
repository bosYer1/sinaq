import { Image, type ImageStyle } from 'expo-image';
import { memo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  uri: string | null;
  name: string;
  style: StyleProp<ImageStyle>;
  priority?: 'low' | 'normal' | 'high';
};

export const ClubImage = memo(function ClubImage({ uri, name, style, priority = 'normal' }: Props) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return <View style={[style, styles.placeholder]} accessibilityLabel={`${name} üçün şəkil yoxdur`}><Text style={styles.placeholderText}>GY</Text></View>;
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

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryTint },
  placeholderText: { color: colors.primary, fontSize: 24, fontWeight: '900' },
});
