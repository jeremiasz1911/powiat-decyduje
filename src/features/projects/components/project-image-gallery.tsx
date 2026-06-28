import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ProjectImageLightbox } from '@/src/features/projects/components/project-image-lightbox';
import { ProjectRemoteImage } from '@/src/features/projects/components/project-remote-image';
import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import { appColors, appTheme } from '@/src/theme/app-theme';

type ProjectImageGalleryProps = {
  images: string[];
  fallbackIcon?: string;
  thumbnailSize?: number;
  style?: StyleProp<ViewStyle>;
  showCountBadge?: boolean;
};

export function ProjectImageGallery({
  images,
  fallbackIcon,
  thumbnailSize = 88,
  style,
  showCountBadge = true,
}: ProjectImageGalleryProps) {
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const normalizedImages = useMemo(() => images.filter(Boolean), [images]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  if (!normalizedImages.length) {
    if (!fallbackIcon) {
      return null;
    }

    return (
      <View style={[styles.placeholder, { height: thumbnailSize * 1.6 }, style]}>
        <Ionicons name={resolveProjectIcon(fallbackIcon)} size={32} color={appColors.primary} />
      </View>
    );
  }

  const thumbStyle = {
    width: thumbnailSize,
    height: thumbnailSize,
    borderRadius: 12,
  };

  return (
    <>
      <View style={[styles.grid, style]}>
        {normalizedImages.map((uri, index) => (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => openLightbox(index)}
            style={({ pressed }) => [styles.thumbWrap, pressed ? styles.pressed : null]}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Otwórz zdjęcie ${index + 1} z ${normalizedImages.length}`}>
            <ProjectRemoteImage
              uri={uri}
              style={[styles.thumb, thumbStyle]}
              resizeMode="cover"
              fallbackIcon={fallbackIcon}
            />
            {showCountBadge && normalizedImages.length > 1 && index === 0 ? (
              <View style={styles.countBadge}>
                <Ionicons name="images-outline" size={11} color={appColors.textOnPrimary} />
                <Text style={styles.countBadgeText}>{normalizedImages.length}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <ProjectImageLightbox
        visible={lightboxVisible}
        images={normalizedImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    backgroundColor: appColors.surfaceSoft,
  },
  countBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 29, 43, 0.72)',
  },
  countBadgeText: {
    color: appColors.textOnPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: appColors.primarySoft,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  pressed: {
    opacity: 0.86,
  },
});
