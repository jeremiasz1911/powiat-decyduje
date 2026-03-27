import { memo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Box, Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';

import { type ProjectItem } from '@/src/services';

type ProjectCardProps = {
  project: ProjectItem;
  onOpenDetails: (projectId: string) => void;
};

function ProjectCardComponent({ project, onOpenDetails }: ProjectCardProps) {
  return (
    <Box style={styles.card} borderRadius="$xl" bg="$backgroundLight50" p="$3">
      {project.imageUrl ? <Image source={{ uri: project.imageUrl }} style={styles.cardImage} resizeMode="cover" /> : null}
      <VStack space="xs">
        <Heading size="sm">{project.title}</Heading>
        <Text color="$textLight700">{project.description}</Text>
        <Text color="$textLight600">
          {project.category} • {project.commune} • {project.village}
        </Text>
        <Text color="$textLight600">Koszt: {project.cost.toLocaleString('pl-PL')} PLN</Text>
        <Text color="$textLight800">Glosy: {project.votesCount}</Text>
        <Button size="sm" variant="outline" action="secondary" onPress={() => onOpenDetails(project.id)}>
          <ButtonText>Zobacz szczegoly</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}

export const ProjectCard = memo(ProjectCardComponent);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
  },
});
