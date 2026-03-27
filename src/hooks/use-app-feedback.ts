import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/src/store/settings-context';

type FeedbackType = 'success' | 'error' | 'info';

export function useAppFeedback() {
  const { settings } = useSettings();

  const notify = useCallback(async (title: string, message: string, type: FeedbackType = 'info') => {
    if (settings.hapticsEnabled) {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'error') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        await Haptics.selectionAsync();
      }
    }

    Alert.alert(title, message);
  }, [settings.hapticsEnabled]);

  return { notify };
}
