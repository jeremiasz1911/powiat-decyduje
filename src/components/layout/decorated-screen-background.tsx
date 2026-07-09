import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { CherryBackground } from '@/src/components/layout/CherryBackground';
import { useAppTheme } from '@/src/theme/theme-context';

type DecoratedScreenBackgroundProps = {
  showCherry?: boolean;
};

export function DecoratedScreenBackground({ showCherry = true }: DecoratedScreenBackgroundProps) {
  const { gradients } = useAppTheme();

  return (
    <>
      <LinearGradient
        colors={gradients.screen}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {showCherry ? <CherryBackground /> : null}
    </>
  );
}
