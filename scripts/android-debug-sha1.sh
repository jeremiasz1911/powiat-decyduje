#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="$ROOT/android/app/debug.keystore"

if [[ ! -f "$KEYSTORE" ]]; then
  echo "Brak pliku: android/app/debug.keystore"
  echo "Uruchom najpierw: npx expo prebuild --platform android"
  exit 1
fi

echo "=== SHA dla debug builda (npx expo run:android) ==="
echo "Keystore: android/app/debug.keystore"
echo "Package:  com.jeremiasz1911.powiatdecyduje"
echo ""
keytool -list -v \
  -keystore "$KEYSTORE" \
  -alias androiddebugkey \
  -storepass android \
  -keypass android \
  | rg "SHA1:|SHA256:"

echo ""
echo "Włącz Maps SDK for Android (projekt powiat-decyduje):"
echo "https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com?project=powiat-decyduje"
echo ""
echo "Lista włączonych API:"
echo "https://console.cloud.google.com/apis/dashboard?project=powiat-decyduje"
