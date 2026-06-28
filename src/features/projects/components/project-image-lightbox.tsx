import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectRemoteImage } from '@/src/features/projects/components/project-remote-image';

type ProjectImageLightboxProps = {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ProjectImageLightbox({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ProjectImageLightboxProps) {
  const listRef = useRef<FlatList<string>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const safeIndex = Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0));
    setActiveIndex(safeIndex);

    if (images.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
      });
    }
  }, [visible, initialIndex, images.length]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!images.length) {
        return;
      }

      const clamped = Math.min(Math.max(nextIndex, 0), images.length - 1);
      setActiveIndex(clamped);
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [images.length]
  );

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (Number.isFinite(nextIndex)) {
      setActiveIndex(nextIndex);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setActiveIndex(first.index);
    }
  }).current;

  if (!images.length) {
    return null;
  }

  const hasMultiple = images.length > 1;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.header}>
            {hasMultiple ? (
              <Text style={styles.counter}>
                {activeIndex + 1} / {images.length}
              </Text>
            ) : (
              <View />
            )}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Zamknij podgląd zdjęcia"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.viewer}>
            {canGoPrev ? (
              <Pressable
                onPress={() => goToIndex(activeIndex - 1)}
                style={({ pressed }) => [styles.navButton, styles.navButtonLeft, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Poprzednie zdjęcie"
                hitSlop={12}>
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
              </Pressable>
            ) : null}

            <FlatList
              ref={listRef}
              data={images}
              keyExtractor={(uri, index) => `${uri}-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumEnd}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              initialScrollIndex={Math.min(initialIndex, images.length - 1)}
              onScrollToIndexFailed={() => {
                requestAnimationFrame(() => {
                  listRef.current?.scrollToOffset({
                    offset: SCREEN_WIDTH * initialIndex,
                    animated: false,
                  });
                });
              }}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <ProjectRemoteImage uri={item} style={styles.image} resizeMode="contain" spinnerColor="#FFFFFF" />
                </View>
              )}
            />

            {canGoNext ? (
              <Pressable
                onPress={() => goToIndex(activeIndex + 1)}
                style={({ pressed }) => [styles.navButton, styles.navButtonRight, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Następne zdjęcie"
                hitSlop={12}>
                <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 16, 0.96)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  counter: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  viewer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    zIndex: 2,
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
  pressed: {
    opacity: 0.78,
  },
});
