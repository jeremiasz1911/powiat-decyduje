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

## Production checklist

- [ ] Firebase Auth: Anonymous enabled
- [ ] Firestore rules wdrozone (`firestore.rules`)
- [ ] Firestore indexes wdrozone (`firestore.indexes.json`)
- [ ] Storage rules wdrozone (jesli upload obrazow aktywny)
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
