import { AppScreen } from '@/src/components/layout/app-screen';
import {
  isPointInPolygon,
  MLAWA_BOUNDARY_RINGS,
  MLAWA_BOUNDS,
  MLAWA_CENTER,
} from '@/src/features/map/mlawa-boundary';
import { MapProjectCalloutCard } from '@/src/features/map/components/map-project-callout-card';
import { logMapDiagnostics } from '@/src/features/map/map-diagnostics';
import {
  MapProjectMarkers,
} from '@/src/features/map/components/map-project-markers';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { listProjectsForMap, type ProjectItem } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useRequireAuth } from '@/src/store/login-required-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@gluestack-ui/themed';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

const INITIAL_REGION: Region = {
  latitude: MLAWA_CENTER.latitude,
  longitude: MLAWA_CENTER.longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const MAX_REGION: Region = {
  latitude: MLAWA_CENTER.latitude,
  longitude: MLAWA_CENTER.longitude,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

const MIN_DELTA = 0.005;
const MAX_DELTA = 0.3;
const BOUNDS_MARGIN = 0.08;
const POINT_PLACEMENT_ZOOM_FACTOR = 0.85;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampToMlawa = (region: Region): Region => {
  const latitudeDelta = clamp(region.latitudeDelta, MIN_DELTA, MAX_DELTA);
  const longitudeDelta = clamp(region.longitudeDelta, MIN_DELTA, MAX_DELTA);

  const halfLat = latitudeDelta / 2;
  const halfLng = longitudeDelta / 2;

  const latitude = clamp(
    region.latitude,
    MLAWA_BOUNDS.minLat - BOUNDS_MARGIN + halfLat,
    MLAWA_BOUNDS.maxLat + BOUNDS_MARGIN - halfLat
  );
  const longitude = clamp(
    region.longitude,
    MLAWA_BOUNDS.minLng - BOUNDS_MARGIN + halfLng,
    MLAWA_BOUNDS.maxLng + BOUNDS_MARGIN - halfLng
  );

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

const MAP_LOAD_TIMEOUT_MS = 12000;

export default function MapScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { colors } = useAppTheme();
  const { user, canAccessPrivateFeatures } = useAuthContext();
  const { requireAuth } = useRequireAuth();
  const userId = canAccessPrivateFeatures ? user?.uid ?? null : null;
  const fabBottom = 16;
  const mapRef = useRef<MapView>(null);
  const lastPanAtRef = useRef(0);
  const isProgrammaticMoveRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [markerOutsideBoundary, setMarkerOutsideBoundary] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapProjects, setMapProjects] = useState<ProjectItem[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedMapProject, setSelectedMapProject] = useState<ProjectItem | null>(null);

  const boundaryRings = useMemo(() => MLAWA_BOUNDARY_RINGS, []);

  const loadMapProjects = useCallback(async () => {
    setProjectsError(null);

    try {
      const items = await listProjectsForMap(userId);
      setMapProjects(items);
      console.log(`[Map] Projekty na mapie: ${items.length}`);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Nie udało się pobrać projektów na mapę.';
      setProjectsError(message);
      setMapProjects([]);
    }
  }, [userId]);

  useEffect(() => {
    void loadMapProjects();
  }, [loadMapProjects]);

  useFocusEffect(
    useCallback(() => {
      void loadMapProjects();
    }, [loadMapProjects])
  );

  const dismissTapHint = useCallback(() => {
    setShowTapHint(false);
  }, []);

  useEffect(() => {
    if (__DEV__) {
      logMapDiagnostics('map-screen-mount');
    }
  }, []);

  useEffect(() => {
    if (isMapReady) {
      return;
    }

    const timer = setTimeout(() => {
      if (!isMapReady && __DEV__) {
        logMapDiagnostics('map-load-timeout');
        console.warn(
          '[Map] Timeout 12s — onMapReady nie wywołane. Sprawdź logcat: adb logcat | rg -i "Google Maps|Authorization|API_KEY"'
        );
      }
    }, MAP_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isMapReady]);

  const moveCamera = (region: Region, animated = true) => {
    isProgrammaticMoveRef.current = true;
    mapRef.current?.animateToRegion(region, animated ? 280 : 0);
  };

  const onRegionChangeComplete = (region: Region, details?: { isGesture?: boolean }) => {
    const clamped = clampToMlawa(region);

    if (isProgrammaticMoveRef.current) {
      isProgrammaticMoveRef.current = false;
      setCurrentRegion(clamped);
      if (details?.isGesture) {
        dismissTapHint();
      }
      return;
    }

    const hasChanged =
      Math.abs(clamped.latitude - region.latitude) > 0.00001 ||
      Math.abs(clamped.longitude - region.longitude) > 0.00001 ||
      Math.abs(clamped.latitudeDelta - region.latitudeDelta) > 0.00001 ||
      Math.abs(clamped.longitudeDelta - region.longitudeDelta) > 0.00001;

    if (hasChanged && details?.isGesture === true) {
      moveCamera(clamped);
    } else {
      setCurrentRegion(clamped);
    }

    if (details?.isGesture) {
      dismissTapHint();
    }
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
        await notify(
          'Lokalizacja niedostepna',
          'Nie moge pobrac pozycji. Sprawdz uslugi lokalizacji i sprobuj ponownie.',
          'error'
        );
        return;
      }

      const { latitude, longitude } = position.coords;
      const inside = isPointInPolygon({ latitude, longitude }, boundaryRings);

      if (canAccessPrivateFeatures) {
        setSelectedCenter({ latitude, longitude });
        setMarkerOutsideBoundary(!inside);
      }

      const targetRegion = clampToMlawa(toTargetRegion(latitude, longitude));
      moveCamera(targetRegion);
    } catch {
      await notify(
        'Lokalizacja niedostepna',
        'Nie moge pobrac pozycji. Sprawdz uslugi lokalizacji i sprobuj ponownie.',
        'error'
      );
    }
  };

  const handleMapPress = (latitude: number, longitude: number) => {
    dismissTapHint();
    setSelectedMapProject(null);

    if (!canAccessPrivateFeatures) {
      return;
    }

    if (Date.now() - lastPanAtRef.current < 250) {
      return;
    }

    const inside = isPointInPolygon({ latitude, longitude }, boundaryRings);
    setSelectedCenter({ latitude, longitude });
    setMarkerOutsideBoundary(!inside);

    const targetRegion = clampToMlawa({
      latitude,
      longitude,
      latitudeDelta: currentRegion.latitudeDelta * POINT_PLACEMENT_ZOOM_FACTOR,
      longitudeDelta: currentRegion.longitudeDelta * POINT_PLACEMENT_ZOOM_FACTOR,
    });
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

    if (markerOutsideBoundary) {
      void notify(
        'Poza granicami powiatu',
        'Wybrana lokalizacja znajduje sie poza granicami powiatu mlawskiego.',
        'error'
      );
      return;
    }

    requireAuth(() => {
      router.push({
        pathname: '/(drawer)/submit-project',
        params: {
          latitude: String(selectedCenter.latitude),
          longitude: String(selectedCenter.longitude),
        },
      });
    });
  };

  const handleActionVote = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics can be unavailable on some devices/emulators.
    }
    setIsFabOpen(false);
    requireAuth(() => {
      router.push('/(drawer)/(tabs)/my-votes');
    });
  };

  return (
    <AppScreen keyboardAvoiding={false} backgroundless edges={[]} contentContainerStyle={styles.safeArea}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          removeClippedSubviews={false}
          initialRegion={INITIAL_REGION}
          maxDelta={MAX_REGION.latitudeDelta}
          minDelta={MIN_DELTA}
          onMapReady={() => {
            setIsMapReady(true);
            if (__DEV__) {
              console.log('[Map] onMapReady — widok mapy gotowy');
            }
          }}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={(event) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            handleMapPress(latitude, longitude);
          }}
          onPanDrag={() => {
            lastPanAtRef.current = Date.now();
            dismissTapHint();
          }}
          loadingEnabled={false}
          moveOnMarkerPress={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}>
          {isMapReady ? (
            <>
              <Polygon
                coordinates={[
                  { latitude: 90, longitude: -180 },
                  { latitude: 90, longitude: 180 },
                  { latitude: -90, longitude: 180 },
                  { latitude: -90, longitude: -180 },
                ]}
                holes={boundaryRings}
                fillColor="rgba(17, 24, 39, 0.12)"
                strokeWidth={0}
              />

              {boundaryRings.map((ring, index) => (
                <Polygon
                  key={`boundary-${index}`}
                  coordinates={ring}
                  strokeColor="rgba(220, 20, 60, 0.65)"
                  fillColor="rgba(220, 20, 60, 0.08)"
                  strokeWidth={2}
                />
              ))}
            </>
          ) : null}

          {canAccessPrivateFeatures && selectedCenter ? (
            <Marker
              coordinate={selectedCenter}
              pinColor={markerOutsideBoundary ? colors.warning : colors.cherry}
              title="Lokalizacja projektu"
              description="To miejsce zostanie przekazane do formularza zgłoszenia."
            />
          ) : null}

          <MapProjectMarkers
            projects={mapProjects}
            selectedProjectId={selectedMapProject?.id}
            viewerUserId={userId}
            onSelectProject={setSelectedMapProject}
          />
        </MapView>

        {selectedMapProject ? (
          <View style={[styles.calloutWrap, { bottom: fabBottom + 60 }]} pointerEvents="box-none">
            <MapProjectCalloutCard
              project={selectedMapProject}
              onClose={() => setSelectedMapProject(null)}
              onOpenDetails={(projectId) => {
                setSelectedMapProject(null);
                router.push(`/(drawer)/(tabs)/project/${projectId}`);
              }}
            />
          </View>
        ) : null}

        {projectsError ? (
          <View style={styles.mapErrorBar}>
            <Pressable onPress={() => void loadMapProjects()} style={[styles.mapErrorPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text color={colors.danger} style={styles.mapStatusText}>
                Nie udało się wczytać projektów. Dotknij, aby spróbować ponownie.
              </Text>
            </Pressable>
          </View>
        ) : isMapReady && mapProjects.length === 0 ? (
          <View style={styles.mapErrorBar}>
            <View style={[styles.mapErrorPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="map-outline" size={16} color={colors.textMuted} />
              <Text color={colors.textMuted} style={styles.mapStatusText}>
                Brak opublikowanych projektów na mapie. Sprawdź ponownie później.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.toolRow}>
          <View style={styles.zoomControls}>
            <Pressable
              onPress={() => handleZoom('in')}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityLabel="Przybliż">
              <Ionicons name="add" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => handleZoom('out')}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityLabel="Oddal">
              <Ionicons name="remove" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              void handleMyLocation();
            }}
            style={({ pressed }) => [
              styles.iconButton,
              styles.locationButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityLabel="Moja lokalizacja">
            <Ionicons name="locate" size={20} color={colors.textOnPrimary} />
          </Pressable>
        </View>

        {canAccessPrivateFeatures && showTapHint ? (
          <View style={styles.hintCenter} pointerEvents="none">
            <Text
              color={colors.textPrimary}
              style={[styles.hintCenterText, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              Dotknij mapy, aby ustawic znacznik projektu.
            </Text>
          </View>
        ) : null}

        {canAccessPrivateFeatures && selectedCenter && markerOutsideBoundary ? (
          <View style={styles.warningBanner}>
            <Text
              color={colors.warning}
              style={[styles.hintWarning, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              Wybrana lokalizacja jest poza granicami powiatu mlawskiego.
            </Text>
          </View>
        ) : null}

        {permissionGranted === false ? (
          <View style={styles.warningBanner}>
            <Text
              color={colors.danger}
              style={[styles.hintWarning, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              Uprawnienie lokalizacji zostalo odrzucone.
            </Text>
          </View>
        ) : null}

        {canAccessPrivateFeatures ? (
          <View style={[styles.fabContainer, { bottom: fabBottom }]} pointerEvents="box-none">
            {isFabOpen ? (
              <>
                <Pressable
                  onPress={handleActionVote}
                  style={({ pressed }) => [
                    styles.fabAction,
                    { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}>
                  <Text style={[styles.fabActionText, { color: colors.primary }]}>Głosuj</Text>
                </Pressable>
                <Pressable
                  onPress={handleActionReport}
                  style={({ pressed }) => [
                    styles.fabAction,
                    { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}>
                  <Text style={[styles.fabActionText, { color: colors.primary }]}>Zgłoś projekt</Text>
                </Pressable>
              </>
            ) : null}

            <Pressable
              onPress={toggleFab}
              style={({ pressed }) => [
                styles.fabMain,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: colors.primary,
                },
              ]}>
              <Ionicons name={isFabOpen ? 'close' : 'add'} size={24} color={colors.textOnPrimary} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  toolRow: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 12,
    elevation: 12,
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  locationButton: {},
  hintCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 8,
  },
  hintCenterText: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
  },
  warningBanner: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    zIndex: 11,
  },
  hintWarning: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
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
  fabAction: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fabActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fabMain: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  mapErrorBar: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    zIndex: 11,
  },
  mapErrorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  calloutWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    alignItems: 'center',
  },
});
