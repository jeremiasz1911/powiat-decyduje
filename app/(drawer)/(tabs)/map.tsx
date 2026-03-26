import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 52.2297,
        longitude: 21.0122,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }}>
      <Marker coordinate={{ latitude: 52.2297, longitude: 21.0122 }} title="Warsaw" />
    </MapView>
  );
}
