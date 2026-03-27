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
