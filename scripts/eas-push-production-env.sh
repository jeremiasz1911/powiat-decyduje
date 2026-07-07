#!/usr/bin/env bash
# Wgrywa EXPO_PUBLIC_* z .env.local do EAS (środowisko production).
# Uruchom lokalnie: npm run eas:env:production

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Brak pliku .env.local"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

push_var() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Pomijam $name (puste)"
    return
  fi
  echo "Ustawiam $name..."
  eas env:create --environment production --name "$name" --value "$value" --visibility plaintext --force --non-interactive
}

push_var EXPO_PUBLIC_FIREBASE_API_KEY "${EXPO_PUBLIC_FIREBASE_API_KEY:-}"
push_var EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN "${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-}"
push_var EXPO_PUBLIC_FIREBASE_PROJECT_ID "${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-}"
push_var EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET "${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:-}"
push_var EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}"
push_var EXPO_PUBLIC_FIREBASE_APP_ID "${EXPO_PUBLIC_FIREBASE_APP_ID:-}"
push_var EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID "${EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID:-}"
push_var EXPO_PUBLIC_FIREBASE_DATABASE_URL "${EXPO_PUBLIC_FIREBASE_DATABASE_URL:-}"
push_var EXPO_PUBLIC_GOOGLE_MAPS_API_KEY "${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-}"
push_var EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR "${EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR:-false}"
push_var EXPO_PUBLIC_BUILD_PROFILE "production"
push_var EXPO_PUBLIC_DEV_SMS_BYPASS "false"

echo "Gotowe. Sprawdź: eas env:list --environment production"
