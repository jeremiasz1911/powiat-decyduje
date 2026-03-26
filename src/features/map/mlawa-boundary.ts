type GeoJsonPolygonFeature = {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

export const MLAWA_BOUNDARY_GEOJSON: GeoJsonPolygonFeature = {
  type: 'Feature',
  properties: {
    id: 'mlawa-boundary',
    name: 'Mlawa',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [20.33, 53.15],
        [20.45, 53.15],
        [20.45, 53.08],
        [20.33, 53.08],
        [20.33, 53.15],
      ],
    ],
  },
};

export type LatLngPoint = {
  latitude: number;
  longitude: number;
};

export const polygonFromGeoJson = (feature: GeoJsonPolygonFeature): LatLngPoint[] =>
  feature.geometry.coordinates[0].map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));

// Ray-casting algorithm for GeoJSON polygon rings.
export const isPointInPolygon = (point: LatLngPoint, polygon: LatLngPoint[]): boolean => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};
