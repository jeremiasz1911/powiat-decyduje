import {
    isPointInPolygon,
    MLAWA_BOUNDARY_GEOJSON,
    polygonFromGeoJson,
} from '@/src/features/map/mlawa-boundary';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, type Region } from 'react-native-maps';

const MLAWA_CENTER = {
  latitude: 53.1126,
  longitude: 20.3843,
};

const MLAWA_BOUNDS = {
  minLat: 53.08,
  maxLat: 53.15,
  minLng: 20.33,
  maxLng: 20.45,
} as const;

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

const toTargetRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
});

export default function MapScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const mapRef = useRef<MapView>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [selectedInsideBoundary, setSelectedInsideBoundary] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });
  const [isFabOpen, setIsFabOpen] = useState(false);

  const boundaryPolygon = useMemo(() => polygonFromGeoJson(MLAWA_BOUNDARY_GEOJSON), []);

  const moveCamera = (region: Region, animated = true) => {
    mapRef.current?.animateToRegion(region, animated ? 280 : 0);
  };

  const onRegionChangeComplete = (region: Region, details?: { isGesture?: boolean }) => {
    if (details?.isGesture === false) {
      return;
    }

    const clamped = clampToMlawa(region);

    const hasChanged =
      Math.abs(clamped.latitude - region.latitude) > 0.00001 ||
      Math.abs(clamped.longitude - region.longitude) > 0.00001 ||
      Math.abs(clamped.latitudeDelta - region.latitudeDelta) > 0.00001 ||
      Math.abs(clamped.longitudeDelta - region.longitudeDelta) > 0.00001;

    if (hasChanged) {
      moveCamera(clamped);
    }

    setSelectedInsideBoundary(
      isPointInPolygon(
        { latitude: clamped.latitude, longitude: clamped.longitude },
        boundaryPolygon
      )
    );

    setSelectedCenter({
      latitude: clamped.latitude,
      longitude: clamped.longitude,
    });
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

      let position = await Location.getCurrentPositionAsync({
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
    const targetRegion = clampToMlawa(toTargetRegion(latitude, longitude));
    moveCamera(targetRegion);
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
          holes={[boundaryPolygon]}
          fillColor="rgba(15, 23, 42, 0.16)"
          strokeWidth={0}
        />

        <Polygon
          coordinates={boundaryPolygon}
          strokeColor="rgba(37, 99, 235, 0.85)"
          fillColor="rgba(37, 99, 235, 0.08)"
          strokeWidth={2}
        />

        <Marker coordinate={MLAWA_CENTER} title="Mlawa" description="Centrum Mlawy" />
        <Marker
          coordinate={selectedCenter}
          pinColor="#2563eb"
          title="Lokalizacja projektu"
          description="To miejsce zostanie przekazane do formularza zgłoszenia."
        />
      </MapView>

      <View style={styles.controls}>
        <Button onPress={handleMyLocation} size="md">
          <ButtonText>My Location</ButtonText>
        </Button>
        <Text color="$textLight700" style={styles.hint}>
          Mapa jest ograniczona do obszaru Mlawy.
        </Text>
        <Text color="$textLight700" style={styles.hint}>
          Dotknij mapy, aby ustawic znacznik projektu.
        </Text>
        <Text color={selectedInsideBoundary ? '$success700' : '$warning700'} style={styles.hint}>
          {selectedInsideBoundary
            ? 'Wybrana pozycja jest w granicy.'
            : 'Pozycja poza granica - wracam do obszaru Mlawy.'}
        </Text>
        {permissionGranted === false ? (
          <Text color="$error600" style={styles.hint}>
            Uprawnienie lokalizacji zostalo odrzucone.
          </Text>
        ) : null}
      </View>

      <View style={styles.fabContainer} pointerEvents="box-none">
        {isFabOpen ? (
          <>
            <View style={styles.fabActionStack}>
              <Button
                onPress={handleActionVote}
                size="md"
                borderRadius="$full"
                bg="$gray300">
                <ButtonText color="$textDark900">Glosuj</ButtonText>
              </Button>
            </View>

            <View style={styles.fabActionStack}>
              <Button
                onPress={handleActionReport}
                size="md"
                borderRadius="$full"
                bg="$gray300">
                <ButtonText color="$textDark900">Zglos projekt</ButtonText>
              </Button>
            </View>
          </>
        ) : null}

        <Button
          onPress={toggleFab}
          size="lg"
          borderRadius="$full"
          bg="$blue600"
          style={styles.fabMain}>
          <Ionicons name={isFabOpen ? 'close' : 'add'} size={26} color="#fff" />
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
    bottom: 20,
    gap: 8,
    alignItems: 'flex-end',
  },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
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
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  fabMain: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },
});
