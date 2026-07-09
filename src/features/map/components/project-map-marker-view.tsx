import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { ProjectIconId } from '@/src/features/projects/project-icons';

const BUBBLE_SIZE = 44;
const ICON_SIZE = 20;
/** Padding around bubble so borders/shadows are not clipped by MapView.Marker snapshot. */
export const MARKER_OUTER_PADDING = 32;

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
  const bubbleSize = selected ? BUBBLE_SIZE  : BUBBLE_SIZE;
  const iconSize = selected ? ICON_SIZE  : ICON_SIZE;
  const outerSize = bubbleSize + MARKER_OUTER_PADDING;

  return (
    <View
      collapsable={false}
      style={[
        styles.markerOuter,
        {
          width: outerSize,
          height: outerSize,
          opacity: pendingReview ? 0.72 : 1,
        },
      ]}>
      <View
        style={[
          styles.bubble,
          {
            width: bubbleSize-10,
            height: bubbleSize-10,
            borderRadius: bubbleSize / 2,
            backgroundColor: color,
            borderWidth: selected ? 4 : 2,
          },
          pendingReview ? styles.bubblePending : null,
        ]}>
        <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerOuter: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderColor: '#FFFFFF',
  },
  bubblePending: {
    borderStyle: 'dashed',
  },
});
