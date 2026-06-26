import { AppScreen } from '@/src/components/layout/app-screen';
import {
  isPointInPolygon,
  MLAWA_BOUNDARY_RINGS,
  MLAWA_BOUNDS,
  MLAWA_CENTER,
} from '@/src/features/map/mlawa-boundary';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { appShadows, appTheme } from '@/src/theme/app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function MapScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const lastPanAtRef = useRef(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [markerOutsideBoundary, setMarkerOutsideBoundary] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);

  const boundaryRings = useMemo(() => MLAWA_BOUNDARY_RINGS, []);

  const dismissTapHint = useCallback(() => {
    setShowTapHint(false);
  }, []);

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

    if (details?.isGesture) {
      dismissTapHint();
    }

    setCurrentRegion(clamped);
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
      setSelectedCenter({ latitude, longitude });
      setMarkerOutsideBoundary(!inside);

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
    <AppScreen keyboardAvoiding={false} edges={['bottom']} contentContainerStyle={styles.safeArea}>
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
            dismissTapHint();
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

          {selectedCenter ? (
            <Marker
              coordinate={selectedCenter}
              pinColor={markerOutsideBoundary ? appTheme.colors.warning : appTheme.colors.primary}
              title="Lokalizacja projektu"
              description="To miejsce zostanie przekazane do formularza zgloszenia."
            />
          ) : null}
        </MapView>

        <View style={styles.toolRow}>
          <View style={styles.zoomControls}>
            <Pressable onPress={() => handleZoom('in')} style={styles.iconButton} accessibilityLabel="Przybliz">
              <Ionicons name="add" size={22} color={appTheme.colors.textPrimary} />
            </Pressable>
            <Pressable onPress={() => handleZoom('out')} style={styles.iconButton} accessibilityLabel="Oddal">
              <Ionicons name="remove" size={22} color={appTheme.colors.textPrimary} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              void handleMyLocation();
            }}
            style={[styles.iconButton, styles.locationButton]}
            accessibilityLabel="Moja lokalizacja">
            <Ionicons name="locate" size={22} color={appTheme.colors.textDark} />
          </Pressable>
        </View>

        {showTapHint ? (
          <View style={styles.hintCenter} pointerEvents="none">
            <Text color={appTheme.colors.textPrimary} style={styles.hintCenterText}>
              Dotknij mapy, aby ustawic znacznik projektu.
            </Text>
          </View>
        ) : null}

        {selectedCenter && markerOutsideBoundary ? (
          <View style={styles.warningBanner}>
            <Text color={appTheme.colors.warning} style={styles.hintWarning}>
              Wybrana lokalizacja jest poza granicami powiatu mlawskiego.
            </Text>
          </View>
        ) : null}

        {permissionGranted === false ? (
          <View style={styles.warningBanner}>
            <Text color={appTheme.colors.danger} style={styles.hintWarning}>
              Uprawnienie lokalizacji zostalo odrzucone.
            </Text>
          </View>
        ) : null}

        <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]} pointerEvents="box-none">
          {isFabOpen ? (
            <>
              <View style={styles.fabActionStack}>
                <Button onPress={handleActionVote} size="md" borderRadius="$full" bg={appTheme.colors.surface}>
                  <ButtonText color={appTheme.colors.primary}>Glosuj</ButtonText>
                </Button>
              </View>

              <View style={styles.fabActionStack}>
                <Button onPress={handleActionReport} size="md" borderRadius="$full" bg={appTheme.colors.surface}>
                  <ButtonText color={appTheme.colors.primary}>Zglos projekt</ButtonText>
                </Button>
              </View>
            </>
          ) : null}

          <Button
            onPress={toggleFab}
            size="lg"
            borderRadius="$full"
            bg={appTheme.colors.primary}
            style={styles.fabMain}>
            <Ionicons name={isFabOpen ? 'close' : 'add'} size={26} color={appTheme.colors.textDark} />
          </Button>
        </View>
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
    backgroundColor: '#fff',
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
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    ...appShadows.soft,
  },
  locationButton: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
    ...appShadows.button,
  },
  hintCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 8,
  },
  hintCenterText: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
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
  fabActionStack: {
    zIndex: 31,
    ...appShadows.soft,
  },
  fabMain: {
    ...appShadows.button,
  },
});
