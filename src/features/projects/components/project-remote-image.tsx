import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import { appColors } from '@/src/theme/app-theme';

type ProjectRemoteImageProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
  fallbackIcon?: string;
  spinnerColor?: string;
};

export function ProjectRemoteImage({
  uri,
  style,
  imageStyle,
  resizeMode = 'cover',
  fallbackIcon,
  spinnerColor = appColors.primary,
}: ProjectRemoteImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {loading && !error ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={spinnerColor} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.centered}>
          <Ionicons
            name={resolveProjectIcon(fallbackIcon)}
            size={28}
            color={appColors.textMuted}
          />
        </View>
      ) : null}

      {!error ? (
        <Image
          source={{ uri }}
          style={[styles.image, imageStyle, loading ? styles.imageHidden : null]}
          resizeMode={resizeMode}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: appColors.surfaceSoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
  },
  centered: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
