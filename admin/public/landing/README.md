# Assety landingu — Powiat Decyduje

## Logo (już dodane)

- `logo-powiat.png` — herb Powiatu Mławskiego
- `logo-app.png` — logo aplikacji

## Screenshoty do podmiany (TODO)

Wrzuć prawdziwe zrzuty ekranu aplikacji pod tymi nazwami:

| Plik | Opis |
|------|------|
| `phone-start.png` | Hero — ekran startowy |
| `screenshot-start.png` | Slider — start |
| `screenshot-mapa.png` | Slider — mapa |
| `screenshot-projekty.png` | Slider — lista projektów |
| `screenshot-szczegoly.png` | Slider — szczegóły projektu |
| `screenshot-profil.png` | Slider — profil mieszkańca |

Jeśli plik nie istnieje, strona wyświetli estetyczny placeholder z ramką telefonu.

## Strony prawne (App Store)

Publiczne strony bez logowania:

| URL | Opis |
|-----|------|
| `/privacy` | Polityka prywatności (PL/EN) |
| `/terms` | Regulamin (PL/EN) |
| `/support` | Wsparcie (PL/EN) |
| `/account-deletion` | Usuwanie konta (PL/EN) |

**App Store Connect — użyj po wdrożeniu:**

- Privacy Policy URL: `https://powiatdecyduje.pl/privacy`
- Support URL: `https://powiatdecyduje.pl/support`
- Marketing URL: `https://powiatdecyduje.pl`

Treści prawne w `admin/src/components/legal/legal-content.ts` — **TODO:** zweryfikuj z prawnikiem przed publikacją.

## Konfiguracja

Dane kontaktowe i linki do sklepów z aplikacją: `admin/src/components/landing/landing-data.ts`
