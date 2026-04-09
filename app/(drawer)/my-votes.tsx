import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function MyVotesRedirectScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      router.replace('/(drawer)/(tabs)/my-votes');
    }, [router])
  );

  return null;
}
