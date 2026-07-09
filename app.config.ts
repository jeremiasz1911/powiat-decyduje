import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

const projectRoot = __dirname;

loadEnv({ path: path.join(projectRoot, '.env') });
if (existsSync(path.join(projectRoot, '.env.local'))) {
  loadEnv({ path: path.join(projectRoot, '.env.local'), override: true });
}

const appJson = require('./app.json');

const expo = appJson.expo ?? {};
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;

if (!googleMapsApiKey) {
  console.warn(
    '[app.config] Brak EXPO_PUBLIC_GOOGLE_MAPS_API_KEY — mapa na Androidzie/iOS nie zadziała. ' +
      'Dodaj klucz do .env.local i uruchom ponownie: npx expo prebuild --platform android --clean'
  );
}

const buildProfile = process.env.EXPO_PUBLIC_BUILD_PROFILE ?? expo.extra?.buildProfile;
const isDevelopmentBuild = buildProfile === 'development';

const plugins = Array.isArray(expo.plugins)
  ? expo.plugins.filter((plugin: string | [string, Record<string, unknown>]) => {
      const name = typeof plugin === 'string' ? plugin : plugin[0];
      if (name === '@react-native-firebase/app') return false;
      // Dev client tylko w profilu development — store buildy (preview/production) bez niego.
      if (name === 'expo-dev-client' && !isDevelopmentBuild) return false;
      return true;
    })
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
  ios: {
    ...expo.ios,
    config: {
      ...(expo.ios?.config ?? {}),
      googleMapsApiKey,
    },
  },
  plugins,
  extra: {
    ...(expo.extra ?? {}),
    buildProfile: process.env.EXPO_PUBLIC_BUILD_PROFILE ?? expo.extra?.buildProfile,
    googleMapsConfigured: Boolean(googleMapsApiKey),
  },
};
