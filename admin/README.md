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

## Wdrożenie na Vercel (produkcja)

**Status:** projekt `powiat-decyduje` jest podpięty pod Vercel.

| Adres | Rola |
|-------|------|
| https://powiat-decyduje.vercel.app | produkcja (działa teraz) |
| https://powiatdecyduje.pl | domena docelowa — wymaga DNS |
| https://www.powiatdecyduje.pl | alias www — wymaga DNS |

### 1. Zmienne środowiskowe (wymagane!)

W [Vercel → powiat-decyduje → Settings → Environment Variables](https://vercel.com/jeremiasz1911s-projects/powiat-decyduje/settings/environment-variables) dodaj **wszystkie** zmienne z `admin/.env.example` (środowisko **Production**):

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` — w jednej linii, z `\n` zamiast enterów
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (opcjonalnie, mapa w panelu)

Skopiuj wartości z lokalnego `admin/.env.local`. **Bez tych zmiennych landing działa, ale logowanie do panelu i API nie.**

Po dodaniu zmiennych: **Deployments → Redeploy** (ostatni deployment).

### 2. Domena powiatdecyduje.pl (NetArt)

Domena jest u **NetArt** — to OK. **Nie wgrywaj plików admina na hosting NetArt** (shared hosting nie obsługuje Next.js z API). Domena ma tylko **wskazywać na Vercel**.

**Problem:** jeśli w DNS jest adres NetArt (np. `77.55.85.255`), zobaczysz pustą stronę NetArt zamiast aplikacji. Admin działa na Vercel (`76.76.21.21`).

W panelu NetArt → **DNS / Strefa DNS** dla `powiatdecyduje.pl` ustaw:

| Typ | Host / nazwa | Wartość | TTL |
|-----|--------------|---------|-----|
| `A` | `@` (pusta lub `powiatdecyduje.pl`) | `76.76.21.21` | 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

Usuń lub nadpisz stare rekordy `A` wskazujące na IP NetArt (`77.55.x.x`), jeśli kierują ruch na hosting WWW NetArt.

Nameservery zostaw NetArt (`ns1.netart.com` itd.) — **nie musisz** ich zmieniać na Vercel.

Weryfikacja: `vercel domains inspect powiatdecyduje.pl` (z katalogu `admin/`).

### 3. GitHub → automatyczny deploy

Repozytorium jest podpięte: `github.com/jeremiasz1911/powiat-decyduje`.

W [Vercel → powiat-decyduje → Settings → General](https://vercel.com/jeremiasz1911s-projects/powiat-decyduje/settings) ustaw:

- **Root Directory:** `admin`
- **Production Branch:** `stabilize-sms-auth-password-reset` (lub `main`, jeśli tam mergujesz)

Bez **Root Directory = `admin`** build z GitHub się wywali (repo to monorepo: app mobilna + admin).

### 4. Kolejne wdrożenia

```bash
cd admin
vercel --prod
```

Lub podłącz repozytorium GitHub w Vercel — każdy push na `main` zbuduje panel automatycznie (Root Directory: `admin`).

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
