import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function MapRedirectScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      router.replace('/(drawer)/(tabs)/map');
    }, [router])
  );

  return null;
}
