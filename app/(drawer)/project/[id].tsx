import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ProjectDetailsRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  if (!id) {
    return <Redirect href="/(drawer)/(tabs)/projects" />;
  }

  return <Redirect href={`/(drawer)/(tabs)/project/${id}`} />;
}
