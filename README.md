# Powiat Decyduje

Mobilna aplikacja obywatelska (Expo + React Native + Firebase) do zglaszania projektow i glosowania.

## Quick start

1. Skopiuj env:

```bash
cp .env.example .env.local
```

2. Uzupelnij `.env.local` poprawnymi `EXPO_PUBLIC_FIREBASE_*`.

3. Zainstaluj i uruchom:

```bash
npm install
npx expo start
```

Jeśli zmieniasz `android/`, `app.json` albo Firebase native config, uruchom też:

```bash
npx expo run:android
```

## Phone Auth na Android/iOS (development build)

Phone Auth w Expo Go nie dziala natywnie. Dla SMS na telefonie wymagany jest development build z RN Firebase:

1. Dodaj konfiguracje natywna Firebase:
   - Android: `google-services.json`
   - iOS: `GoogleService-Info.plist`
2. W Firebase Console (Android app) dodaj fingerprinty certyfikatow:
   - SHA-1
   - SHA-256
3. Zbuduj i uruchom development build:

```bash
npx expo prebuild
npx expo run:android
# lub
npx expo run:ios
```

Na web aplikacja dalej korzysta z Firebase JS SDK + reCAPTCHA.

W dev na telefonie/emulatorze numer `+48500400300` jest traktowany jako testowy bypass SMS.

## Testing - Seeding testowego konta mieszkańca

Aby szybko przetestować logowanie, uruchom skrypt do seeding'u:

```bash
npm run seed:test-resident
```

Skrypt utworzy testowe konto powiązane z numerem telefonu (`+48510490044`) i PESEL (`02021234567`).

Szczegóły: [SEED_TEST_RESIDENT.md](./SEED_TEST_RESIDENT.md)

## Google Maps (Android / iOS)

Mapa w aplikacji używa `react-native-maps` z Google Maps. Klucz Firebase **nie zastępuje** klucza Maps.

1. W [Google Cloud Console](https://console.cloud.google.com/) (ten sam projekt co Firebase) utwórz klucz API.
2. Włącz **Maps SDK for Android** (oraz **Maps SDK for iOS** na iOS).
3. Ogranicz klucz do pakietu `com.jeremiasz1911.powiatdecyduje` i SHA-1 certyfikatu debug/release.
4. Dodaj do `.env.local`:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

5. Przebuduj natywny projekt (wymagane — klucz trafia do `AndroidManifest.xml`):

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

W diagnostyce aplikacji pole **Maps API key** powinno pokazywać `tak`.

## Panel administracyjny (web)

Osobna aplikacja Next.js w katalogu `admin/` — dashboard do zarządzania projektami, użytkownikami, głosami, SMS-ami i ustawieniami aplikacji. Wdrażana na Vercel, korzysta z Firebase Admin SDK i tego samego Firestore co aplikacja mobilna.

```bash
cd admin && cp .env.example .env.local
# uzupełnij ADMIN_* i FIREBASE_ADMIN_*
npm install
npm run dev
```

Z katalogu głównego: `npm run admin:dev` (port 3001).

Szczegóły wdrożenia na Vercel i lista zmiennych środowiskowych: [admin/README.md](./admin/README.md).

## Production checklist

- [ ] Firebase Auth: Anonymous enabled
- [ ] Firestore rules wdrozone (`firestore.rules`)
- [ ] Firestore indexes wdrozone (`firestore.indexes.json`)
- [ ] Panel admin wdrożony na Vercel (`admin/`, zmienne `ADMIN_*`, `FIREBASE_ADMIN_*`)
- [ ] Storage rules wdrozone (jesli upload obrazow aktywny)
- [ ] Google Maps API key ustawiony (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`) i build natywny przebudowany
- [ ] `.env.local` ustawione na produkcyjny projekt Firebase
- [ ] `android.package` i `ios.bundleIdentifier` ustawione na finalne ID
- [ ] `npm run check` przechodzi bez bledow
- [ ] test na realnym Android i iOS
- [ ] App Check strategy ustalona (dev/prod)

## Performance & architecture improvements

- Memoized `ProjectCard` (`src/features/projects/components/project-card.tsx`) to reduce list re-renders.
- Stabilized callbacks in `projects.tsx` (`useCallback`) and extracted reusable feedback states.
- Added shared feedback components for loading/empty/error UX.
- Added reusable app feedback hook with haptics notifications.
- Added typed env validation (`src/config/env.ts`) and centralized Firebase config usage.

## Build and verification commands

```bash
npm run check
npm run build:android
npm run build:ios
```
