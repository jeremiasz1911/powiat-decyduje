import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { ProjectIconId } from '@/src/features/projects/project-icons';
import { appColors, appShadows } from '@/src/theme/app-theme';

type ProjectMapMarkerViewProps = {
  color: string;
  icon: ProjectIconId;
  selected?: boolean;
  pendingReview?: boolean;
};

export function ProjectMapMarkerView({
  color,
  icon,
  selected = false,
  pendingReview = false,
}: ProjectMapMarkerViewProps) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View
        style={[
          styles.bubble,
          { backgroundColor: color },
          selected ? styles.bubbleSelected : null,
          pendingReview ? styles.bubblePending : null,
        ]}>
        <Ionicons name={icon} size={18} color={appColors.textOnPrimary} />
      </View>
      <View style={[styles.tail, { borderTopColor: color }, pendingReview ? styles.tailPending : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 44,
    height: 52,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    ...appShadows.soft,
  },
  bubbleSelected: {
    transform: [{ scale: 1.12 }],
    borderColor: '#FFFFFF',
  },
  bubblePending: {
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.95)',
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailPending: {
    opacity: 0.72,
  },
});
