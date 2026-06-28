# Panel administracyjny Powiat Decyduje

Osobna aplikacja Next.js do zarządzania danymi aplikacji mobilnej. Wdrażana na Vercel, korzysta z Firebase Admin SDK i tego samego projektu Firestore.

## Funkcje

- Logowanie administratora (weryfikacja po stronie serwera)
- Dashboard ze statystykami
- Zarządzanie projektami (lista, filtry, edycja, zmiana statusu, usuwanie)
- Mapa projektów z lokalizacją
- Lista użytkowników / kont mieszkańców
- Logi SMS i statystyki wysyłki
- Lista głosów / aktywności
- Ustawienia aplikacji (`app_settings/main` w Firestore)

## Wymagania

- Node.js 20+
- Konto serwisowe Firebase (Admin SDK)
- Ten sam projekt Firebase co aplikacja mobilna

## Konfiguracja lokalna

```bash
cd admin
cp .env.example .env.local
# Uzupełnij zmienne w .env.local
npm install
npm run dev
```

Panel uruchomi się pod adresem [http://localhost:3001](http://localhost:3001).

Z katalogu głównego repozytorium:

```bash
npm run admin:dev
```

### Zmienne środowiskowe

| Zmienna | Opis |
|---------|------|
| `ADMIN_USERNAME` | Login administratora (np. `admin_powiat`) |
| `ADMIN_PASSWORD` | Hasło — **tylko po stronie serwera**, nigdy w kodzie frontendu |
| `ADMIN_SESSION_SECRET` | Losowy długi ciąg do podpisywania sesji JWT |
| `FIREBASE_ADMIN_PROJECT_ID` | ID projektu Firebase |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | E-mail konta serwisowego |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Klucz prywatny konta serwisowego (z `\n` jako znaki nowej linii) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Klucz Google Maps (widok mapy w panelu) |

Hasło i klucze Firebase **nie trafiają do przeglądarki** — logowanie i dostęp do danych odbywają się przez API routes chronione middleware.

## Wdrożenie na Vercel

1. Utwórz nowy projekt Vercel i wskaż katalog **`admin`** jako root (lub ustaw Root Directory na `admin` w ustawieniach projektu).
2. Dodaj wszystkie zmienne z `admin/.env.example` w **Settings → Environment Variables**.
3. Dla `FIREBASE_ADMIN_PRIVATE_KEY` wklej klucz w jednej linii z `\n` zamiast rzeczywistych podziałów wiersza.
4. Wdróż — Vercel zbuduje aplikację komendą `npm run build`.

Plik `vercel.json` w tym katalogu jest już skonfigurowany pod Next.js.

## Kolekcje Firestore

| Kolekcja | Opis |
|----------|------|
| `projects` | Projekty obywatelskie |
| `users` | Konta mieszkańców |
| `app_settings/main` | Ustawienia aplikacji (edycja w panelu) |
| `sms_logs` | Logi wysyłki SMS (zapisywane przez Cloud Functions) |

### Struktura `sms_logs`

```json
{
  "phoneNumber": "+48***123",
  "phoneMasked": "+48***123",
  "type": "registration | password_reset",
  "status": "sent | error",
  "errorMessage": "opcjonalny komunikat błędu",
  "sentAt": "Timestamp",
  "createdAt": "Timestamp"
}
```

Logi są tworzone w `functions/src/index.ts` przy każdej próbie wysłania SMS.

## Bezpieczeństwo

- Firebase Admin SDK działa wyłącznie w API routes (serwer Node.js).
- Middleware sprawdza sesję administratora dla wszystkich tras panelu i `/api/*` (poza logowaniem).
- Reguły Firestore blokują zapis `app_settings` i `sms_logs` z klienta mobilnego; panel zapisuje przez Admin SDK.

## Skrypty

```bash
npm run dev        # dev server (port 3001)
npm run build      # produkcyjny build
npm run start      # serwer produkcyjny
npm run typecheck  # sprawdzenie TypeScript
```
