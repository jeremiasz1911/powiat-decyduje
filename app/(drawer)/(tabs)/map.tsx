import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polygon, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  isPointInPolygon,
  MLAWA_BOUNDARY_GEOJSON,
  polygonFromGeoJson,
} from '@/src/features/map/mlawa-boundary';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';

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
  const fabProgress = useSharedValue(0);

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
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);

    if (!granted) {
      await notify('Brak uprawnienia', 'Wlacz lokalizacje, aby przejsc do swojej pozycji.', 'error');
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const targetRegion = clampToMlawa({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });

    moveCamera(targetRegion);
  };

  const toggleFab = () => {
    const next = !isFabOpen;
    setIsFabOpen(next);
    void Haptics.selectionAsync();
    fabProgress.value = withTiming(next ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleActionReport = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFabOpen(false);
    fabProgress.value = withTiming(0, { duration: 180 });

    router.push({
      pathname: '/(drawer)/submit-project',
      params: {
        latitude: String(selectedCenter.latitude),
        longitude: String(selectedCenter.longitude),
      },
    });
  };

  const handleActionVote = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFabOpen(false);
    fabProgress.value = withTiming(0, { duration: 180 });
    void notify('Glosuj', 'Przejdz do listy projektow i wybierz projekt do glosowania.', 'info');
  };

  const fabMainStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabProgress.value * 45}deg` }],
  }));

  const firstActionStyle = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [
      { translateY: -fabProgress.value * 66 },
      { scale: 0.92 + fabProgress.value * 0.08 },
    ],
  }));

  const secondActionStyle = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [
      { translateY: -fabProgress.value * 122 },
      { scale: 0.92 + fabProgress.value * 0.08 },
    ],
  }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        maxDelta={MAX_REGION.latitudeDelta}
        minDelta={MIN_DELTA}
        onRegionChangeComplete={onRegionChangeComplete}
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
      </MapView>

      <View style={styles.controls}>
        <Button onPress={handleMyLocation} size="md">
          <ButtonText>My Location</ButtonText>
        </Button>
        <Text color="$textLight700" style={styles.hint}>
          Mapa jest ograniczona do obszaru Mlawy.
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
        <Animated.View style={[styles.fabAction, secondActionStyle]}>
          <Button
            onPress={handleActionVote}
            size="md"
            borderRadius="$full"
            bg="$backgroundLight0"
            action="secondary"
            isDisabled={!isFabOpen}>
            <ButtonText>Głosuj</ButtonText>
          </Button>
        </Animated.View>

        <Animated.View style={[styles.fabAction, firstActionStyle]}>
          <Button
            onPress={handleActionReport}
            size="md"
            borderRadius="$full"
            bg="$backgroundLight0"
            action="secondary"
            isDisabled={!isFabOpen}>
            <ButtonText>Zgłoś projekt</ButtonText>
          </Button>
        </Animated.View>

        <Animated.View style={fabMainStyle}>
          <Button
            onPress={toggleFab}
            size="lg"
            borderRadius="$full"
            bg="$blue600"
            style={styles.fabMain}>
            <Ionicons name="add" size={26} color="#fff" />
          </Button>
        </Animated.View>
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
  },
  fabAction: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fabMain: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },
});
