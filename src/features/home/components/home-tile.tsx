import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TILE_GAP = 14;

export type HomeTileConfig = {
  id: string;
  title: string;
  description?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  route: Href;
  floatDelay?: number;
};

type HomeTileProps = HomeTileConfig & {
  size: number;
};

export function HomeTile({ title, description, icon, route, size, floatDelay = 0 }: HomeTileProps) {
  const router = useRouter();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withDelay(
      floatDelay,
      withRepeat(
        withTiming(1, { duration: 4200 + floatDelay, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [float, floatDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [2, -2]) }],
  }));

  return (
    <AnimatedPressable
      onPress={() => router.push(route)}
      style={({ pressed }) => [
        styles.tile,
        { width: size, height: size },
        animatedStyle,
        pressed ? styles.tilePressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={40} color={appColors.primary} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

type HomeTileGridProps = {
  tiles: HomeTileConfig[];
};

export function HomeTileGrid({ tiles }: HomeTileGridProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const tileSize = gridWidth > 0 ? Math.floor((gridWidth - TILE_GAP) / 2) : 0;

  return (
    <View
      style={styles.grid}
      onLayout={(event) => {
        const nextWidth = Math.floor(event.nativeEvent.layout.width);
        if (nextWidth !== gridWidth) {
          setGridWidth(nextWidth);
        }
      }}>
      {tileSize > 0
        ? tiles.map((tile, index) => (
            <HomeTile key={tile.id} {...tile} size={tileSize} floatDelay={index * 180} />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    paddingVertical: appTheme.spacing.sm,
  },
  tile: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    overflow: 'hidden',
    ...appShadows.card,
  },
  tilePressed: {
    opacity: 0.9,
    backgroundColor: appColors.surfaceSoft,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.md,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  title: {
    width: '100%',
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
});
