import { memo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Box, Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';

import { type ProjectItem } from '@/src/services';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

type ProjectCardProps = {
  project: ProjectItem;
  onOpenDetails: (projectId: string) => void;
};

function ProjectCardComponent({ project, onOpenDetails }: ProjectCardProps) {
  return (
    <Box style={styles.card} borderRadius="$xl" p="$3">
      {project.imageUrl ? <Image source={{ uri: project.imageUrl }} style={styles.cardImage} resizeMode="cover" /> : null}
      <VStack space="xs">
        <Heading size="sm" color={futuristicTheme.colors.textPrimary}>{project.title}</Heading>
        <Text color={futuristicTheme.colors.textMuted}>{project.description}</Text>
        <Text color={futuristicTheme.colors.textMuted}>
          {project.category} • {project.commune} • {project.village}
        </Text>
        {project.locationLabel ? (
          <Text color={futuristicTheme.colors.textMuted}>Miejsce: {project.locationLabel}</Text>
        ) : null}
        <Text color={futuristicTheme.colors.textMuted}>Koszt: {project.cost.toLocaleString('pl-PL')} PLN</Text>
        <Text color={futuristicTheme.colors.accent}>Glosy: {project.votesCount}</Text>
        <Button
          size="sm"
          variant="outline"
          action="secondary"
          borderColor={futuristicTheme.colors.border}
          onPress={() => onOpenDetails(project.id)}>
          <ButtonText color={futuristicTheme.colors.textPrimary}>Zobacz szczegoly</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}

export const ProjectCard = memo(ProjectCardComponent);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    gap: 10,
    ...futuristicShadows.soft,
  },
  cardImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
  },
});
