import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TILE_WIDTH = 76;
const TILE_GAP = 16;

export type HomeTileConfig = {
  id: string;
  title: string;
  description?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  route: Href;
  floatDelay?: number;
};

type HomeTileProps = HomeTileConfig & {
  floatDelay?: number;
};

export function HomeTile({ title, description, icon, route, floatDelay = 0 }: HomeTileProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
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
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.7 : 1 }, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
    </AnimatedPressable>
  );
}

type HomeTileGridProps = {
  tiles: HomeTileConfig[];
};

export function HomeTileGrid({ tiles }: HomeTileGridProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {tiles.map((tile, index) => (
        <HomeTile key={tile.id} {...tile} floatDelay={index * 180} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: TILE_GAP,
    paddingVertical: 4,
  },
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    width: '100%',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
});
