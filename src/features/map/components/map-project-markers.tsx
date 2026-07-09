import { useMemo } from 'react';

import { ProjectMapMarkerView } from '@/src/features/map/components/project-map-marker-view';
import { resolveMapProjectIcon } from '@/src/features/projects/project-category-icons';
import { resolveProjectMarkerColor } from '@/src/features/projects/project-marker-colors';
import { getProjectAuthorId, isProjectPubliclyVisible } from '@/src/features/projects/project-status';
import { getProjectCoordinates } from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { Marker } from 'react-native-maps';

type MapProjectMarkersProps = {
  projects: ProjectItem[];
  selectedProjectId?: string | null;
  viewerUserId?: string | null;
  onSelectProject: (project: ProjectItem | null) => void;
};

export function MapProjectMarkers({
  projects,
  selectedProjectId,
  viewerUserId,
  onSelectProject,
}: MapProjectMarkersProps) {
  const mappableProjects = useMemo(
    () =>
      projects
        .map((project) => ({
          project,
          coordinates: getProjectCoordinates(project),
        }))
        .filter(
          (
            entry
          ): entry is { project: ProjectItem; coordinates: { latitude: number; longitude: number } } =>
            entry.coordinates != null
        ),
    [projects]
  );

  return mappableProjects.map(({ project, coordinates }) => {
        const selected = selectedProjectId === project.id;
        const markerColor = resolveProjectMarkerColor(project.markerColor);
        const markerIcon = resolveMapProjectIcon(project);
        const isOwnPending =
          Boolean(viewerUserId) &&
          getProjectAuthorId(project) === viewerUserId &&
          !isProjectPubliclyVisible(project.status);

        return (
          <Marker
            key={`project-${project.id}`}
            coordinate={coordinates}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
            onPress={(event) => {
              event.stopPropagation?.();
              onSelectProject(selected ? null : project);
            }}>
            <ProjectMapMarkerView
              color={markerColor}
              icon={markerIcon}
              selected={selected}
              pendingReview={isOwnPending}
            />
          </Marker>
        );
  });
}

export function partitionMapProjects(projects: ProjectItem[]) {
  const withCoordinates: ProjectItem[] = [];
  const withoutCoordinates: ProjectItem[] = [];

  for (const project of projects) {
    if (getProjectCoordinates(project)) {
      withCoordinates.push(project);
    } else {
      withoutCoordinates.push(project);
    }
  }

  return { withCoordinates, withoutCoordinates };
}
