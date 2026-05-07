# Test Resident Account Seeding

Skrypt do szybkiego dodania testowego konta mieszkańca do Firestore dla celów dev/testing.

## Setup

### 1. Pobierz klucz serwisowy Firebase

1. Otwórz [Firebase Console](https://console.firebase.google.com)
2. Przejdź do: **Project Settings** → **Service Accounts**
3. Kliknij **Generate Key**
4. Pobierz JSON i zapisz jako `firebase-key.json` w root projektu

Jeśli nie chcesz trzymać pliku JSON w projekcie, możesz też użyć Google Application Default Credentials:

```bash
gcloud auth application-default login
export FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS=true
```

### 2. Zainstaluj zależności

```bash
npm install
```

## Użycie

### Uruchom skrypt seeding

```bash
npm run seed:test-resident
```

Jeśli używasz ADC zamiast pliku JSON:

```bash
FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS=true npm run seed:test-resident
```

Skrypt zapyta o potwierdzenie:
```
⚠️  This will create/update a test user in Firestore. Continue? (y/N): y
```

### Co robi skrypt?

Skrypt tworzy lub aktualizuje testowego użytkownika z następującymi danymi:

- **Email:** `test@powiat.local`
- **Password:** `TestPassword123!`
- **Numer telefonu:** `+48510490044`
- **PESEL:** `02021234567`
- **Imię/Nazwisko:** Test User
- **Gmina:** Mława

## Logowanie do aplikacji

Po uruchomieniu skryptu możesz się zalogować na dwa sposoby:

### 1. Przez numer telefonu (SMS)
```
Numer: +48510490044
Kod SMS: 000000 (dowolny 6-cyfrowy kod w emulatorze)
```

### 2. Przez email i hasło
```
Email: test@powiat.local
Hasło: TestPassword123!
```

## Alternatywnie: Ustawienie zmiennej środowiskowej

Jeśli nie chcesz tworzyć `firebase-key.json`, możesz ustawić klucz w zmiennej środowiskowej:

```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'
npm run seed:test-resident
```

## Troubleshooting

### Błąd: "Firebase service account key not found"
- Upewnij się, że `firebase-key.json` jest w root projektu
- Lub ustaw `FIREBASE_SERVICE_ACCOUNT_KEY` w zmiennych środowiskowych

### Błąd: "EXPO_PUBLIC_FIREBASE_PROJECT_ID not set"
- Sprawdź czy plik `.env.local` lub `.env` zawiera zmienne Firebase
- Lub ustawij je ręcznie w terminalu:
  ```bash
  export EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
  ```

### "User already exists"
- Jeśli użytkownik już istnieje, skrypt go uaktualni
- Istniejące konta mieszkańca nie będą usunięte

## Wielu testowych kont

Aby utworzyć więcej testowych kont, zmodyfikuj skrypt `seed-test-resident.js` i zmień dane w obiekcie `testData`:

```javascript
const testData = {
  testEmail: 'test2@powiat.local',
  phoneNumber: '+48500000001',
  pesel: '02021234568',
  // ... reszta
};
```

## Uwagi

- ⚠️ Skrypt wymaga dostępu do Firebase Admin SDK
- 🔐 Nie commituj `firebase-key.json` do repozytorium!
- 📱 W emulatorze SMS jest mocked - możesz użyć dowolnego kodu
- ✅ Konto jest automatycznie oznaczane jako "verified_resident"
