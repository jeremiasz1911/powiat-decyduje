import 'dotenv/config';

const appJson = require('./app.json');

const expo = appJson.expo ?? {};
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const plugins = Array.isArray(expo.plugins)
  ? expo.plugins.filter((plugin: string | [string, Record<string, unknown>]) => plugin !== '@react-native-firebase/app')
  : [];

export default {
  ...expo,
  android: {
    ...expo.android,
    config: {
      ...(expo.android?.config ?? {}),
      googleMaps: googleMapsApiKey ? { apiKey: googleMapsApiKey } : undefined,
    },
  },
  plugins,
  extra: {
    ...(expo.extra ?? {}),
    buildProfile: process.env.EXPO_PUBLIC_BUILD_PROFILE ?? expo.extra?.buildProfile,
  },
};
