import {
  isPointInPolygon,
  MLAWA_BOUNDS,
  MLAWA_BOUNDARY_RINGS,
  MLAWA_CENTER,
} from '@/src/features/map/mlawa-boundary';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { listProjects, type ProjectItem } from '@/src/services';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, type Region } from 'react-native-maps';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

const INITIAL_REGION: Region = {
  latitude: MLAWA_CENTER.latitude,
  longitude: MLAWA_CENTER.longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const MAX_REGION: Region = {
  latitude: MLAWA_CENTER.latitude,
  longitude: MLAWA_CENTER.longitude,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const MIN_DELTA = 0.005;
const MAX_DELTA = 0.09;
const POINT_PLACEMENT_ZOOM_FACTOR = 0.85;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampToMlawa = (region: Region): Region => {
  const latitudeDelta = clamp(region.latitudeDelta, MIN_DELTA, MAX_DELTA);
  const longitudeDelta = clamp(region.longitudeDelta, MIN_DELTA, MAX_DELTA);

  const halfLat = latitudeDelta / 2;
  const halfLng = longitudeDelta / 2;

  const latitude = clamp(region.latitude, MLAWA_BOUNDS.minLat + halfLat, MLAWA_BOUNDS.maxLat - halfLat);
  const longitude = clamp(region.longitude, MLAWA_BOUNDS.minLng + halfLng, MLAWA_BOUNDS.maxLng - halfLng);

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

const toTargetRegion = (latitude: number, longitude: number, delta = 0.02): Region => ({
  latitude,
  longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export default function MapScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const mapRef = useRef<MapView>(null);
  const lastPanAtRef = useRef(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [selectedInsideBoundary, setSelectedInsideBoundary] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);

  const boundaryRings = useMemo(() => MLAWA_BOUNDARY_RINGS, []);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const moveCamera = (region: Region, animated = true) => {
    mapRef.current?.animateToRegion(region, animated ? 280 : 0);
  };

  const onRegionChangeComplete = (region: Region, details?: { isGesture?: boolean }) => {
    const clamped = clampToMlawa(region);

    const hasChanged =
      Math.abs(clamped.latitude - region.latitude) > 0.00001 ||
      Math.abs(clamped.longitude - region.longitude) > 0.00001 ||
      Math.abs(clamped.latitudeDelta - region.latitudeDelta) > 0.00001 ||
      Math.abs(clamped.longitudeDelta - region.longitudeDelta) > 0.00001;

    if (hasChanged && details?.isGesture !== false) {
      moveCamera(clamped);
    }

    setCurrentRegion(clamped);
    setSelectedInsideBoundary(
      isPointInPolygon(
        { latitude: clamped.latitude, longitude: clamped.longitude },
        boundaryRings
      )
    );

  };

  const handleMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (!granted) {
        await notify('Brak uprawnienia', 'Wlacz lokalizacje, aby przejsc do swojej pozycji.', 'error');
        return;
      }

      let position: Location.LocationObject | null = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!position?.coords) {
        position = await Location.getLastKnownPositionAsync();
      }

      if (!position?.coords) {
        await notify('Lokalizacja niedostepna', 'Nie moge pobrac pozycji. Sprawdz uslugi lokalizacji i sprobuj ponownie.', 'error');
        return;
      }

      const targetRegion = clampToMlawa(toTargetRegion(position.coords.latitude, position.coords.longitude));
      moveCamera(targetRegion);
    } catch {
      await notify('Lokalizacja niedostepna', 'Nie moge pobrac pozycji. Sprawdz uslugi lokalizacji i sprobuj ponownie.', 'error');
    }
  };

  const handleMapPress = (latitude: number, longitude: number) => {
    if (Date.now() - lastPanAtRef.current < 250) {
      return;
    }

    setSelectedProjectId(null);
    const targetRegion = clampToMlawa({
      latitude,
      longitude,
      latitudeDelta: currentRegion.latitudeDelta * POINT_PLACEMENT_ZOOM_FACTOR,
      longitudeDelta: currentRegion.longitudeDelta * POINT_PLACEMENT_ZOOM_FACTOR,
    });
    setSelectedCenter({ latitude: targetRegion.latitude, longitude: targetRegion.longitude });
    moveCamera(targetRegion);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const zoomFactor = direction === 'in' ? 0.7 : 1.35;
    const nextRegion = clampToMlawa({
      latitude: currentRegion.latitude,
      longitude: currentRegion.longitude,
      latitudeDelta: currentRegion.latitudeDelta * zoomFactor,
      longitudeDelta: currentRegion.longitudeDelta * zoomFactor,
    });

    moveCamera(nextRegion);
  };

  const fetchProjectsForMap = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const result = await listProjects({ pageSize: 60 });
      setProjects(
        result.items.filter(
          (project) =>
            Number.isFinite(project.location?.latitude) && Number.isFinite(project.location?.longitude)
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie pobrac projektow na mape.';
      await notify('Blad mapy', message, 'error');
    } finally {
      setProjectsLoading(false);
    }
  }, [notify]);

  useFocusEffect(
    useCallback(() => {
      void fetchProjectsForMap();
    }, [fetchProjectsForMap])
  );

  const toggleFab = () => {
    setIsFabOpen((prev) => !prev);
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics can be unavailable on some devices/emulators.
    }
  };

  const handleActionReport = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics can be unavailable on some devices/emulators.
    }
    setIsFabOpen(false);

    if (!selectedCenter) {
      void notify('Wybierz punkt', 'Najpierw kliknij punkt na mapie, aby ustawic lokalizacje projektu.', 'info');
      return;
    }

    router.push({
      pathname: '/(drawer)/submit-project',
      params: {
        latitude: String(selectedCenter.latitude),
        longitude: String(selectedCenter.longitude),
      },
    });
  };

  const handleActionVote = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics can be unavailable on some devices/emulators.
    }
    setIsFabOpen(false);
    void notify('Glosuj', 'Przejdz do listy projektow i wybierz projekt do glosowania.', 'info');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        maxDelta={MAX_REGION.latitudeDelta}
        minDelta={MIN_DELTA}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          handleMapPress(latitude, longitude);
        }}
        onPanDrag={() => {
          lastPanAtRef.current = Date.now();
        }}
        loadingEnabled
        moveOnMarkerPress={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}>
        <Polygon
          coordinates={[
            { latitude: 90, longitude: -180 },
            { latitude: 90, longitude: 180 },
            { latitude: -90, longitude: 180 },
            { latitude: -90, longitude: -180 },
          ]}
          holes={boundaryRings}
          fillColor="rgba(15, 23, 42, 0.16)"
          strokeWidth={0}
        />

        {boundaryRings.map((ring, index) => (
          <Polygon
            key={`boundary-${index}`}
            coordinates={ring}
            strokeColor="rgba(37, 99, 235, 0.85)"
            fillColor="rgba(37, 99, 235, 0.08)"
            strokeWidth={2}
          />
        ))}

        {selectedCenter ? (
          <Marker
            coordinate={selectedCenter}
            pinColor="#2563eb"
            title="Lokalizacja projektu"
            description="To miejsce zostanie przekazane do formularza zgłoszenia."
          />
        ) : null}

        {projects.map((project) => {
          const isSelected = project.id === selectedProjectId;
          return (
            <Marker
              key={project.id}
              coordinate={{
                latitude: project.location.latitude,
                longitude: project.location.longitude,
              }}
              onPress={() => setSelectedProjectId(project.id)}
              title={project.title}
              description={project.category}>
              <View style={[styles.projectMarker, isSelected ? styles.projectMarkerActive : null]}>
                <Ionicons
                  name={isSelected ? 'sparkles' : 'radio-button-on'}
                  size={14}
                  color={isSelected ? futuristicTheme.colors.textDark : futuristicTheme.colors.textPrimary}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.controls}>
        <View style={styles.zoomControls}>
          <Button onPress={() => handleZoom('in')} size="sm" bg={futuristicTheme.colors.panel} style={styles.zoomButton}>
            <ButtonText color={futuristicTheme.colors.textPrimary}>+</ButtonText>
          </Button>
          <Button onPress={() => handleZoom('out')} size="sm" bg={futuristicTheme.colors.panel} style={styles.zoomButton}>
            <ButtonText color={futuristicTheme.colors.textPrimary}>-</ButtonText>
          </Button>
        </View>
        <Button onPress={handleMyLocation} size="md" bg={futuristicTheme.colors.accent} style={styles.locationButton}>
          <ButtonText color={futuristicTheme.colors.textDark}>My Location</ButtonText>
        </Button>
        <Text color={futuristicTheme.colors.textPrimary} style={styles.hint}>
          Mapa jest ograniczona do obszaru Mlawy.
        </Text>
        <Text color={futuristicTheme.colors.textPrimary} style={styles.hint}>
          Dotknij mapy, aby ustawic znacznik projektu.
        </Text>
        <Text color={futuristicTheme.colors.accent} style={styles.hint}>
          Projekty na mapie: {projectsLoading ? 'ladowanie...' : projects.length}
        </Text>
        <Text color={selectedInsideBoundary ? futuristicTheme.colors.success : futuristicTheme.colors.warning} style={styles.hint}>
          {selectedInsideBoundary
            ? 'Wybrana pozycja jest w granicy.'
            : 'Pozycja poza granica - wracam do obszaru Mlawy.'}
        </Text>
        {permissionGranted === false ? (
          <Text color={futuristicTheme.colors.danger} style={styles.hint}>
            Uprawnienie lokalizacji zostalo odrzucone.
          </Text>
        ) : null}
      </View>

      {selectedProject ? (
        <View style={styles.previewCard}>
          <Text color={futuristicTheme.colors.accent} style={styles.previewTag}>
            {selectedProject.category}
          </Text>
          <Text color={futuristicTheme.colors.textPrimary} style={styles.previewTitle}>
            {selectedProject.title}
          </Text>
          <Text color={futuristicTheme.colors.textMuted} numberOfLines={2}>
            {selectedProject.description}
          </Text>
          <Text color={futuristicTheme.colors.textMuted}>
            {selectedProject.village} • {selectedProject.cost.toLocaleString('pl-PL')} PLN
          </Text>
          <Button
            onPress={() => router.push(`/(drawer)/project/${selectedProject.id}`)}
            size="sm"
            bg={futuristicTheme.colors.accent}
            style={styles.previewButton}>
            <ButtonText color={futuristicTheme.colors.textDark}>Zobacz projekt</ButtonText>
          </Button>
        </View>
      ) : null}

      <View style={styles.fabContainer} pointerEvents="box-none">
        {isFabOpen ? (
          <>
            <View style={styles.fabActionStack}>
              <Button
                onPress={handleActionVote}
                size="md"
                borderRadius="$full"
                bg={futuristicTheme.colors.panel}>
                <ButtonText color={futuristicTheme.colors.textPrimary}>Glosuj</ButtonText>
              </Button>
            </View>

            <View style={styles.fabActionStack}>
              <Button
                onPress={handleActionReport}
                size="md"
                borderRadius="$full"
                bg={futuristicTheme.colors.panel}>
                <ButtonText color={futuristicTheme.colors.textPrimary}>Zglos projekt</ButtonText>
              </Button>
            </View>
          </>
        ) : null}

        <Button
          onPress={toggleFab}
          size="lg"
          borderRadius="$full"
          bg={futuristicTheme.colors.accent}
          style={styles.fabMain}>
          <Ionicons name={isFabOpen ? 'close' : 'add'} size={26} color={futuristicTheme.colors.textDark} />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    right: 16,
    left: 16,
    top: 18,
    gap: 8,
    alignItems: 'flex-start',
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...futuristicShadows.soft,
  },
  hint: {
    backgroundColor: 'rgba(3, 24, 47, 0.88)',
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationButton: {
    ...futuristicShadows.glow,
  },
  projectMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    ...futuristicShadows.soft,
  },
  projectMarkerActive: {
    backgroundColor: futuristicTheme.colors.accent,
    borderColor: futuristicTheme.colors.accent,
  },
  previewCard: {
    position: 'absolute',
    left: 16,
    right: 86,
    bottom: 24,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    ...futuristicShadows.soft,
  },
  previewTag: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewButton: {
    marginTop: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    ...futuristicShadows.glow,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 30,
    elevation: 10,
  },
  fabActionStack: {
    zIndex: 31,
    ...futuristicShadows.soft,
  },
  fabMain: {
    ...futuristicShadows.glow,
  },
});
